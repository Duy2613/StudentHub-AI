import { createHash, randomUUID } from "node:crypto";
import { AIGatewayService } from "../../ai-gateway/AIGatewayService.js";
import { AI_CAPABILITY } from "../../ai-gateway/types.js";
import { getPostgresPool } from "../database/PostgresPool.js";
import { MediaArtifactService } from "../media/MediaArtifactService.js";
import { PrivacyPipelineService } from "../trust/PrivacyPipelineService.js";
import { authenticatedUserId, ExpertQualificationError } from "./ExpertQualificationService.js";
import { deriveQuestionDifficulty } from "./ExpertV5Domain.js";
import {
  buildQuestionGenerationPrompts,
  deduplicateQuestionCandidates,
  makeCanonicalGenerationPackage,
  QUESTION_GENERATION_LIMITS,
  QUESTION_GENERATION_TEMPLATE_VERSION,
  validateQuestionCandidate,
} from "./ExpertQuestionPipeline.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_MULTIMODAL_BYTES = 8 * 1024 * 1024;

function generationError(code, message, statusCode = 400) {
  return new ExpertQualificationError(code, message, statusCode);
}

function digest(value) {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function parseJson(value, fallback) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") { try { return JSON.parse(value); } catch { return fallback; } }
  return fallback;
}

function boundedText(value, max = 1_000) {
  return typeof value === "string" ? value.normalize("NFC").trim().replace(/\u0000/g, "").slice(0, max) : "";
}

function normalizeUuid(value, field) {
  const candidate = String(value || "").trim();
  if (!UUID.test(candidate)) throw generationError("EXPERT_V5_GENERATION_INPUT_INVALID", `${field} must be a durable identifier.`, 400);
  return candidate.toLowerCase();
}

async function withTransaction(operation) {
  const client = await getPostgresPool().connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (caught) {
    await client.query("ROLLBACK").catch(() => {});
    throw caught;
  } finally { client.release(); }
}

function storageError(caught) {
  if (caught instanceof ExpertQualificationError) return caught;
  if (["42P01", "42703", "3F000"].includes(caught?.code)) {
    return generationError("EXPERT_V5_MIGRATION_REQUIRED", "The grounded Question Bank migration is not initialized.", 503);
  }
  return generationError("EXPERT_V5_GENERATION_STORAGE_UNAVAILABLE", "Question generation storage is temporarily unavailable.", 503);
}

function safeUrl(value) {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    if (!/^https?:$/.test(url.protocol)) return null;
    url.username = "";
    url.password = "";
    url.search = "";
    url.hash = "";
    return url.toString();
  } catch { return null; }
}

function safeProvenance(value) {
  const source = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const safe = {};
  for (const key of ["title", "publisher", "source", "sourceType", "retrievalOutcome", "retrievedAt", "publishedAt", "relation", "summary", "excerpt", "quote", "description"]) {
    const candidate = source[key];
    if (typeof candidate === "string") safe[key] = PrivacyPipelineService.redactText(candidate).slice(0, 600);
    else if (["retrievedAt", "publishedAt"].includes(key) && candidate instanceof Date) safe[key] = candidate.toISOString();
  }
  const urls = [source.url, source.finalUrl, source.canonicalUrl].map(safeUrl).filter(Boolean);
  if (urls.length) safe.urls = [...new Set(urls)].slice(0, 5);
  if (Array.isArray(source.sources)) {
    safe.sources = source.sources.slice(0, 8).map((item) => {
      const entry = item && typeof item === "object" ? item : {};
      return {
        title: PrivacyPipelineService.redactText(boundedText(entry.title, 240)),
        url: safeUrl(entry.url || entry.finalUrl),
        publisher: PrivacyPipelineService.redactText(boundedText(entry.publisher || entry.domain, 160)),
        excerpt: PrivacyPipelineService.redactText(boundedText(entry.excerpt || entry.snippet || entry.quote, 400)),
      };
    }).filter((item) => item.url || item.title || item.excerpt);
  }
  return safe;
}

function validateRunOptions({ batchSize, maxCalls, retryLimit, timeoutMs, idempotencyKey }) {
  const batch = Math.max(1, Math.min(QUESTION_GENERATION_LIMITS.MAX_BATCH_SIZE, Math.trunc(Number(batchSize) || 1)));
  const calls = Math.max(1, Math.min(QUESTION_GENERATION_LIMITS.MAX_CALLS, Math.trunc(Number(maxCalls) || batch)));
  const retries = Math.max(0, Math.min(QUESTION_GENERATION_LIMITS.MAX_RETRIES, Math.trunc(Number(retryLimit) || 0)));
  const timeout = Math.max(1_000, Math.min(QUESTION_GENERATION_LIMITS.MAX_TIMEOUT_MS, Math.trunc(Number(timeoutMs) || 30_000)));
  const key = boundedText(idempotencyKey, 160);
  if (!/^[A-Za-z0-9._:-]{1,160}$/.test(key)) throw generationError("EXPERT_V5_GENERATION_IDEMPOTENCY_REQUIRED", "A valid Idempotency-Key is required for generation.", 400);
  return { batch, calls, retries: Math.min(retries, Math.max(0, calls - 1)), timeout, key };
}

async function loadScenarioPackage({ scenarioId, actorId }) {
  const loaded = await withTransaction(async (client) => {
    const scenarioResult = await client.query(
      `SELECT scenario_id, title, domain_code, modality, status, input_fingerprint,
              input_language, expected_skills, difficulty_potential, limitations, created_by,
              private.expert_v5_scenario_is_current(scenario_id) AS is_current
         FROM private.expert_v5_scenarios WHERE scenario_id = $1 FOR UPDATE`, [scenarioId],
    );
    const scenario = scenarioResult.rows[0];
    if (!scenario) throw generationError("EXPERT_V5_SCENARIO_NOT_FOUND", "The scenario was not found.", 404);
    if (scenario.created_by && String(scenario.created_by).toLowerCase() !== actorId) {
      throw generationError("EXPERT_V5_SCENARIO_SCOPE_DENIED", "The scenario can only be generated by its authorized editor.", 403);
    }
    if (scenario.status !== "READY") throw generationError("EXPERT_V5_SCENARIO_NOT_READY", "The scenario must be current and ready before generation.", 409);
    if (scenario.is_current !== true) {
      await client.query(`UPDATE private.expert_v5_scenarios SET status = 'STALE', updated_at = now() WHERE scenario_id = $1`, [scenarioId]);
      await client.query(`UPDATE private.expert_v5_questions SET status = 'REVALIDATION_REQUIRED', updated_at = now() WHERE scenario_id = $1 AND status = 'ACTIVE'`, [scenarioId]);
      return { stale: "The Trust case or source snapshot is no longer within the current, verified validity window." };
    }

    const inputsResult = await client.query(
      `SELECT si.input_index, si.input_type, si.trust_case_id, si.case_revision,
              si.source_snapshot_id, si.media_artifact_id, si.media_sha256,
              si.input_fingerprint, si.canonical_url, si.retrieved_at, si.published_at,
              tc.owner_id, latest.revision AS current_case_revision,
              s.content_hash AS snapshot_hash, s.retrieval_status AS snapshot_status,
              s.canonical_url AS snapshot_url, s.title AS snapshot_title,
              s.publisher AS snapshot_publisher, s.source_type AS snapshot_source_type,
              s.published_at AS snapshot_published_at, s.retrieved_at AS snapshot_retrieved_at,
              registry.enabled AS registry_enabled,
              latest_source.content_hash AS latest_source_hash
         FROM private.expert_v5_scenario_inputs si
         JOIN public.trust_cases tc ON tc.id = si.trust_case_id
         LEFT JOIN LATERAL (
           SELECT revision FROM public.trust_case_revisions WHERE case_id = tc.id ORDER BY revision DESC LIMIT 1
         ) latest ON true
         LEFT JOIN private.expert_v5_source_snapshots s ON s.id = si.source_snapshot_id
         LEFT JOIN private.expert_v5_source_registry registry ON registry.id = s.source_id
         LEFT JOIN LATERAL (
           SELECT content_hash FROM private.expert_v5_source_snapshots current
             WHERE current.source_id = s.source_id
            ORDER BY current.retrieved_at DESC LIMIT 1
         ) latest_source ON true
        WHERE si.scenario_id = $1 ORDER BY si.input_index`, [scenarioId],
    );
    const inputRows = inputsResult.rows;
    if (!inputRows.length) throw generationError("EXPERT_V5_SCENARIO_INPUTS_REQUIRED", "The scenario has no canonical source inputs.", 409);
    if (inputRows.some((row) => String(row.owner_id).toLowerCase() !== actorId)) {
      throw generationError("EXPERT_V5_SCENARIO_SCOPE_DENIED", "A scenario input belongs to a different Trust case owner.", 403);
    }
    const stale = inputRows.some((row) => Number(row.case_revision) !== Number(row.current_case_revision)
      || (row.source_snapshot_id && (row.snapshot_status !== "SUCCESS" || row.registry_enabled !== true || row.snapshot_hash !== row.latest_source_hash)));
    if (stale) {
      await client.query(`UPDATE private.expert_v5_scenarios SET status = 'STALE', updated_at = now() WHERE scenario_id = $1`, [scenarioId]);
      await client.query(`UPDATE private.expert_v5_questions SET status = 'REVALIDATION_REQUIRED', updated_at = now() WHERE scenario_id = $1 AND status = 'ACTIVE'`, [scenarioId]);
      return { stale: "A Trust case revision or registered source snapshot changed; re-ingest and review a new scenario version." };
    }
    const digestParts = inputRows.map((row) => ({
      type: row.input_type,
      trustCaseId: row.trust_case_id,
      caseRevision: Number(row.case_revision),
      inputFingerprint: row.input_fingerprint,
      snapshotId: row.source_snapshot_id || null,
      snapshotHash: row.snapshot_hash || null,
    }));
    const currentFingerprint = digest({ modality: scenario.modality, domainCode: scenario.domain_code, digestParts });
    if (currentFingerprint !== scenario.input_fingerprint) {
      await client.query(`UPDATE private.expert_v5_scenarios SET status = 'STALE', updated_at = now() WHERE scenario_id = $1`, [scenarioId]);
      await client.query(`UPDATE private.expert_v5_questions SET status = 'REVALIDATION_REQUIRED', updated_at = now() WHERE scenario_id = $1 AND status = 'ACTIVE'`, [scenarioId]);
      return { stale: "The canonical source package no longer matches its stored digest." };
    }

    const [claimsResult, evidenceResult] = await Promise.all([
      client.query(
        `SELECT sc.claim_id AS id, c.statement, c.status,
                array_agg(DISTINCT cs.evidence_id::text) FILTER (WHERE cs.evidence_id IS NOT NULL) AS evidence_ids,
                array_agg(DISTINCT si.trust_case_id::text) AS source_ids
           FROM private.expert_v5_scenario_claims sc
           JOIN private.expert_v5_scenario_inputs si ON si.scenario_id = sc.scenario_id AND si.input_index = sc.input_index
           JOIN public.claims c ON c.id = sc.claim_id
           JOIN public.claim_sources cs ON cs.claim_id = c.id
           JOIN public.evidence ev ON ev.id = cs.evidence_id AND ev.case_id = si.trust_case_id
          WHERE sc.scenario_id = $1 GROUP BY sc.claim_id, c.statement, c.status ORDER BY sc.claim_id`, [scenarioId],
      ),
      client.query(
        `SELECT se.evidence_id AS id, e.case_id::text AS source_id,
                e.source_type, e.source_identifier, e.observed_at, e.confidence, e.provenance
           FROM private.expert_v5_scenario_evidence se JOIN public.evidence e ON e.id = se.evidence_id
          WHERE se.scenario_id = $1 ORDER BY se.evidence_id`, [scenarioId],
      ),
    ]);
    if (!claimsResult.rows.length || !evidenceResult.rows.length) throw generationError("EXPERT_V5_CANONICAL_EVIDENCE_REQUIRED", "Every generated question must map to canonical claims and evidence.", 422);
    const inputs = inputRows.map((row) => ({
      trustCaseId: row.trust_case_id,
      inputType: row.input_type,
      sourceSnapshotId: row.source_snapshot_id,
      canonicalUrl: safeUrl(row.snapshot_url || row.canonical_url),
      title: PrivacyPipelineService.redactText(boundedText(row.snapshot_title, 240)),
      publisher: PrivacyPipelineService.redactText(boundedText(row.snapshot_publisher, 180)),
      sourceType: row.snapshot_source_type,
      publishedAt: row.snapshot_published_at || row.published_at,
      retrievedAt: row.snapshot_retrieved_at || row.retrieved_at,
      inputFingerprint: row.input_fingerprint,
      mediaArtifactId: row.media_artifact_id,
      mediaSha256: row.media_sha256,
      ownerId: String(row.owner_id).toLowerCase(),
    }));
    const claims = claimsResult.rows.map((row) => ({
      ...row,
      statement: PrivacyPipelineService.redactText(boundedText(row.statement, 1_000)),
      status: "CANONICAL_CLAIM",
      evidenceIds: Array.isArray(row.evidence_ids) ? row.evidence_ids : [],
      sourceIds: Array.isArray(row.source_ids) ? row.source_ids : [],
    }));
    const evidence = evidenceResult.rows.map((row) => ({
      ...row,
      sourceIdentifier: safeUrl(row.source_identifier) || PrivacyPipelineService.redactText(boundedText(row.source_identifier, 240)),
      provenance: safeProvenance(parseJson(row.provenance, {})),
    }));
    const safeScenario = {
      scenarioId: scenario.scenario_id,
      title: PrivacyPipelineService.redactText(boundedText(scenario.title, 240)),
      domainCode: scenario.domain_code,
      modality: scenario.modality,
      inputFingerprint: scenario.input_fingerprint,
      limitations: parseJson(scenario.limitations, []),
    };
    return { data: {
      scenario: safeScenario,
      inputs,
      claims,
      evidence,
      package: makeCanonicalGenerationPackage({ scenario: safeScenario, inputs, claims, evidence }),
    } };
  });
  if (loaded?.stale) throw generationError("EXPERT_V5_SCENARIO_STALE", loaded.stale, 409);
  return loaded?.data;
}

async function loadImageParts(inputs, actorId) {
  let totalBytes = 0;
  const parts = [];
  for (const input of inputs.filter((item) => item.mediaArtifactId)) {
    if (input.ownerId !== actorId) throw generationError("EXPERT_V5_SCENARIO_MEDIA_SCOPE_DENIED", "A media artifact may only be sent to Gemini by its authorized Trust case owner.", 403);
    const hydrated = await MediaArtifactService.hydrateArtifact(input.mediaArtifactId, {
      requesterUserId: actorId,
      expectedSha256: input.mediaSha256,
    });
    if (!hydrated.ok) throw generationError("EXPERT_V5_SCENARIO_MEDIA_UNAVAILABLE", "An image artifact failed authorization or integrity validation.", hydrated.error?.statusCode || 422);
    const bytes = MediaArtifactService.getArtifactBytes(input.mediaArtifactId);
    if (!bytes?.length) throw generationError("EXPERT_V5_SCENARIO_MEDIA_UNAVAILABLE", "The authorized image could not be loaded for generation.", 503);
    totalBytes += bytes.length;
    if (totalBytes > MAX_MULTIMODAL_BYTES) throw generationError("EXPERT_V5_SCENARIO_MEDIA_LIMIT", "The combined multimodal input exceeds the generation size limit.", 413);
    parts.push({ mime_type: hydrated.artifact.mimeType, data: bytes.toString("base64") });
  }
  return parts;
}

function candidateAnswerForStorage(candidate) {
  return candidate.answerKey;
}

function mapEvidenceRefs(candidate, evidence, claims) {
  const byId = new Map(evidence.map((item) => [String(item.id), item]));
  const claimTextByEvidence = new Map();
  const claimIdsByEvidence = new Map();
  const candidateClaimIds = new Set(candidate.claimIds.map(String));
  for (const claim of claims) {
    // Claim excerpts are canonical source text, redacted before storage/serving.
    if (!candidateClaimIds.has(String(claim.id))) continue;
    for (const evidenceId of claim.evidenceIds || []) {
      if (!byId.has(String(evidenceId))) continue;
      if (!claimTextByEvidence.has(String(evidenceId))) claimTextByEvidence.set(String(evidenceId), claim.statement);
      const linkedClaims = claimIdsByEvidence.get(String(evidenceId)) || [];
      linkedClaims.push(String(claim.id));
      claimIdsByEvidence.set(String(evidenceId), linkedClaims);
    }
  }
  return candidate.evidenceIds.map((evidenceId) => {
    const item = byId.get(String(evidenceId));
    return {
      evidenceId: String(evidenceId),
      claimIds: [...new Set(claimIdsByEvidence.get(String(evidenceId)) || [])],
      excerpt: boundedText(claimTextByEvidence.get(String(evidenceId)) || item?.provenance?.excerpt || item?.provenance?.summary || item?.sourceIdentifier || "Canonical Trust evidence", 400),
      sourceUrl: item?.provenance?.urls?.[0] || null,
    };
  });
}

async function markRunFinished({ runId, state, callsMade, providerAttemptCount, latencyMs, outputDigest, generatedCount, validatedCount, rejectedCount, provider, model, errorCode = null, rejectionSummary = {} }) {
  await getPostgresPool().query(
    `UPDATE private.expert_v5_question_generation_runs
        SET state = $2, calls_made = $3, provider_attempt_count = $4, latency_ms = $5,
            output_digest = $6, generated_count = $7, validated_count = $8, rejected_count = $9,
            provider = $10, model = $11, error_code = $12, rejection_summary = $13::jsonb, completed_at = now()
      WHERE generation_run_id = $1`,
    [runId, state, callsMade, providerAttemptCount, latencyMs, outputDigest, generatedCount, validatedCount, rejectedCount, provider, model, errorCode, JSON.stringify(rejectionSummary)],
  );
}

export class ExpertQuestionGenerationService {
  static async generate({ principal, scenarioId, batchSize = 1, maxCalls = batchSize, retryLimit = 0, timeoutMs = 30_000, idempotencyKey, signal, gateway = AIGatewayService }) {
    const actorId = authenticatedUserId(principal);
    const scenario = normalizeUuid(scenarioId, "scenarioId");
    const limits = validateRunOptions({ batchSize, maxCalls, retryLimit, timeoutMs, idempotencyKey });
    let activeRunId = null;
    try {
      const loaded = await loadScenarioPackage({ scenarioId: scenario, actorId });
      const runId = randomUUID();
      const reservation = await withTransaction(async (client) => {
        const inserted = await client.query(
          `INSERT INTO private.expert_v5_question_generation_runs
            (generation_run_id, scenario_id, actor_id, idempotency_key, state, batch_size, max_calls,
             retry_limit, timeout_ms, prompt_template_version, input_digest, started_at)
           VALUES ($1,$2,$3,$4,'RUNNING',$5,$6,$7,$8,$9,$10,now())
           ON CONFLICT (idempotency_key) DO NOTHING RETURNING generation_run_id`,
          [runId, scenario, actorId, limits.key, limits.batch, limits.calls, limits.retries,
            limits.timeout, QUESTION_GENERATION_TEMPLATE_VERSION, loaded.package.digest],
        );
        const selected = await client.query(
          `SELECT generation_run_id, actor_id, scenario_id, state, input_digest, batch_size,
                  max_calls, retry_limit, generated_count, validated_count, rejected_count,
                  provider_attempt_count
             FROM private.expert_v5_question_generation_runs WHERE idempotency_key = $1 FOR UPDATE`, [limits.key],
        );
        const row = selected.rows[0];
        if (!row || String(row.actor_id).toLowerCase() !== actorId || String(row.scenario_id).toLowerCase() !== scenario
          || row.input_digest !== loaded.package.digest || Number(row.batch_size) !== limits.batch
          || Number(row.max_calls) !== limits.calls || Number(row.retry_limit) !== limits.retries) {
          throw generationError("EXPERT_V5_GENERATION_IDEMPOTENCY_CONFLICT", "This generation key is bound to another source package or budget.", 409);
        }
        return inserted.rows[0] ? { runId: row.generation_run_id } : { existing: row };
      });
      if (reservation.existing) {
        const row = reservation.existing;
        return {
          generationRunId: row.generation_run_id,
          state: row.state,
          generated: Number(row.generated_count),
          validated: Number(row.validated_count),
          rejected: Number(row.rejected_count),
          providerAttempts: Number(row.provider_attempt_count),
          idempotent: true,
        };
      }
      activeRunId = reservation.runId;
      const prompt = buildQuestionGenerationPrompts({ scenario: loaded.scenario, packageData: loaded.package.packageData, batchSize: limits.batch });
      const imageParts = await loadImageParts(loaded.inputs, actorId);
      const modalityUsesImage = ["IMAGE", "TEXT_IMAGE", "IMAGE_URL", "TEXT_URL_IMAGE"].includes(loaded.scenario.modality);
      if (modalityUsesImage && !imageParts.length) {
        throw generationError("EXPERT_V5_SCENARIO_IMAGE_REQUIRED", "Image scenarios require authorized stored image evidence for generation.", 422);
      }
      const startedAt = Date.now();
      let result = null;
      let attempts = [];
      const maximumProviderAttempts = limits.calls;
      for (let callIndex = 0; callIndex <= limits.retries; callIndex += 1) {
        result = await gateway.generateStructured({
          capability: imageParts.length ? AI_CAPABILITY.MULTIMODAL : AI_CAPABILITY.QUESTION_GENERATION,
          systemPrompt: prompt.systemPrompt,
          userPrompt: prompt.userPrompt,
          responseSchema: prompt.responseSchema,
          inputParts: imageParts,
          validate: (value) => value && typeof value === "object" && Array.isArray(value.questions)
            && value.questions.length > 0 && value.questions.length <= limits.batch,
          options: {
            signal,
            timeoutMs: limits.timeout,
            perModelTimeoutMs: limits.timeout,
            totalBudgetMs: limits.timeout,
            maxOutputTokens: 8_192,
            maxModelAttempts: Math.max(1, Math.floor(maximumProviderAttempts / (limits.retries + 1))),
          },
        });
        attempts = [...attempts, ...(Array.isArray(result?.attempts) ? result.attempts : [])];
        if (result?.ok) break;
        if (callIndex >= limits.retries || attempts.length >= maximumProviderAttempts) break;
      }
      if (attempts.length > maximumProviderAttempts) attempts = attempts.slice(0, maximumProviderAttempts);
      const latencyMs = Math.max(0, Date.now() - startedAt);
      if (!result?.ok || !Array.isArray(result.json?.questions)) {
        const errorCode = boundedText(result?.errorType || result?.providerStatus || "GENERATION_UNAVAILABLE", 100).toUpperCase().replace(/[^A-Z0-9_:-]/g, "_");
        await markRunFinished({
          runId, state: "FAILED", callsMade: attempts.length, providerAttemptCount: attempts.length,
          latencyMs, outputDigest: null, generatedCount: 0, validatedCount: 0, rejectedCount: 0,
          provider: "gemini", model: result?.executedModel || null, errorCode,
        });
        throw generationError("EXPERT_V5_GEMINI_GENERATION_FAILED", "The structured Gemini generation did not complete within its call and time budget.", 503);
      }
      const rawCandidates = result.json.questions.slice(0, limits.batch);
      const validationResults = rawCandidates.map((candidate) => validateQuestionCandidate(candidate, {
        scenario: loaded.scenario,
        packageData: loaded.package.packageData,
      }));
      const validCandidates = validationResults.filter((entry) => entry.valid);
      const existingResult = await getPostgresPool().query(
        `SELECT normalized_prompt_hash, source_claim_fingerprint, question_type
           FROM private.expert_v5_questions
          WHERE status <> 'RETIRED' AND (
            normalized_prompt_hash = ANY($1::text[]) OR source_claim_fingerprint = ANY($2::text[])
          )`,
        [validCandidates.map((entry) => entry.normalizedPromptHash), validCandidates.map((entry) => entry.sourceClaimFingerprint)],
      );
      const deduped = deduplicateQuestionCandidates(validCandidates.map((entry) => ({
        ...entry,
        question: entry.question,
        sourceClaimFingerprint: entry.sourceClaimFingerprint,
      })), {
        existing: existingResult.rows.map((row) => ({
          normalizedPromptHash: row.normalized_prompt_hash,
          sourceClaimFingerprint: row.source_claim_fingerprint,
          questionType: row.question_type,
        })),
      });
      const outputDigest = digest(result.json);
      const generationProvenanceBase = {
        provider: "gemini",
        model: boundedText(result.executedModel || result.model, 120) || null,
        promptTemplateVersion: QUESTION_GENERATION_TEMPLATE_VERSION,
        scenarioId: scenario,
        sourceIds: loaded.package.packageData.sources.map((source) => source.id),
        snapshotIds: loaded.package.packageData.sources.map((source) => source.sourceSnapshotId).filter(Boolean),
        inputPackageDigest: loaded.package.digest,
        outputDigest,
        generatedAt: new Date().toISOString(),
        providerAttempts: attempts.length,
        latencyMs,
        estimatedCost: null,
        costStatus: "NOT_AVAILABLE",
      };
      const persistenceResult = await withTransaction(async (client) => {
        const stored = [];
        const concurrentRejected = [];
        for (const candidateResult of deduped.accepted) {
          const candidate = candidateResult.question;
          const lockKeys = [
            `question-prompt:${candidateResult.normalizedPromptHash}`,
            `question-source-claim:${candidateResult.sourceClaimFingerprint}:${candidate.questionType}`,
          ].sort();
          for (const lockKey of lockKeys) {
            await client.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [lockKey]);
          }
          const duplicateCheck = await client.query(
            `SELECT 1 FROM private.expert_v5_questions
              WHERE status <> 'RETIRED' AND (
                normalized_prompt_hash = $1 OR
                (source_claim_fingerprint = $2 AND question_type = $3)
              ) LIMIT 1`, [candidateResult.normalizedPromptHash, candidateResult.sourceClaimFingerprint, candidate.questionType],
          );
          if (duplicateCheck.rows.length) {
            concurrentRejected.push({ reasons: ["DUPLICATE_CONCURRENT_INSERT"] });
            continue;
          }
          const difficultyFeatures = {
            sourceCount: candidate.sourceIds.length,
            evidenceCount: candidate.evidenceIds.length,
            ambiguity: candidate.uncertaintyMode === "CLEAR" ? 0 : 1,
            temporalReasoning: candidate.temporalReasoning,
            reasoningComplexity: candidate.reasoningComplexity,
            modelDifficultySuggestion: candidate.difficulty,
          };
          const difficulty = deriveQuestionDifficulty(difficultyFeatures);
          const questionId = randomUUID();
          const evidenceRefs = mapEvidenceRefs(candidate, loaded.package.packageData.evidence.map((item) => ({
            ...item,
            provenance: item.provenance,
          })).map((item) => ({ ...item, id: String(item.id) })).reduce((list, item) => {
            if (!list.some((entry) => entry.id === item.id)) list.push(item);
            return list;
          }), loaded.claims);
          const normalizedCandidate = validationResults.find((item) => item.question.prompt === candidate.prompt);
          if (!normalizedCandidate?.valid) continue;
          const generationProvenance = {
            ...generationProvenanceBase,
            validationStatus: "REVIEW_REQUIRED",
            duplicateStatus: "UNIQUE_EXACT_AND_SOURCE_CLAIM",
            semanticDedup: deduped.semanticDedup,
          };
          const saved = await client.query(
            `INSERT INTO private.expert_v5_questions
              (question_id, question_version, source_snapshot_id, scenario_id, modality, domain_code,
               question_type, difficulty, prompt, choices, answer_key, explanation, evidence_refs,
               difficulty_features, source_content_hash, status, created_by, claim_refs, rubric,
               skills, limitations, generation_provenance, validation_status, normalized_prompt_hash,
               source_claim_fingerprint, generation_run_id)
              VALUES ($1,1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10::jsonb,$11,$12::jsonb,$13::jsonb,$14,'DRAFT',$15,$16::jsonb,$17::jsonb,$18::jsonb,$19::jsonb,$20::jsonb,'REVIEW_REQUIRED',$21,$22,$23)
             RETURNING question_id, question_version, question_type, difficulty, status, created_at`,
            [questionId, loaded.inputs.find((input) => input.sourceSnapshotId)?.sourceSnapshotId || null,
              scenario, loaded.scenario.modality, loaded.scenario.domainCode, candidate.questionType, difficulty,
              candidate.prompt, JSON.stringify(candidate.choices), JSON.stringify(candidateAnswerForStorage(candidate)),
              candidate.explanation, JSON.stringify(evidenceRefs), JSON.stringify(difficultyFeatures), loaded.scenario.inputFingerprint,
              actorId, JSON.stringify(candidate.claimIds.map((claimId) => ({ claimId }))), JSON.stringify({
                ...candidate.rubric,
                uncertaintyMode: candidate.uncertaintyMode,
                correctAnswerEvidenceIds: candidate.correctAnswerEvidenceIds,
              }),
              JSON.stringify(candidate.skills), JSON.stringify(candidate.limitations), JSON.stringify(generationProvenance),
              candidateResult.normalizedPromptHash, candidateResult.sourceClaimFingerprint, runId],
          );
          await client.query(
            `INSERT INTO private.expert_v5_question_events(question_id, question_version, actor_id, event_type, payload, idempotency_key)
             VALUES ($1,1,$2,'DRAFT_CREATED',$3::jsonb,$4) ON CONFLICT (idempotency_key) DO NOTHING`,
            [questionId, actorId, JSON.stringify({ scenarioId: scenario, generationRunId: runId, validationStatus: "REVIEW_REQUIRED", structuralValidation: "PASS", inputDigest: loaded.package.digest, outputDigest }), `question-draft:${questionId}:1`],
          );
          stored.push({
            questionId: saved.rows[0].question_id,
            questionVersion: Number(saved.rows[0].question_version),
            questionType: saved.rows[0].question_type,
            difficulty: saved.rows[0].difficulty,
            status: saved.rows[0].status,
            validationStatus: "REVIEW_REQUIRED",
          });
        }
        return { questions: stored, rejected: concurrentRejected };
      });
      const insertedQuestions = persistenceResult.questions;
      const rejected = validationResults.filter((entry) => !entry.valid).map((entry) => ({ reasons: entry.reasons }));
      rejected.push(...deduped.rejected.map((entry) => ({ reasons: [entry.reason] })));
      rejected.push(...persistenceResult.rejected);
      const rejectionSummary = { DUPLICATE: 0, GROUNDING: 0, AMBIGUITY: 0, QUALITY: 0 };
      for (const entry of rejected) {
        const reasons = Array.isArray(entry.reasons) ? entry.reasons : [];
        if (reasons.some((reason) => String(reason).startsWith("DUPLICATE_"))) rejectionSummary.DUPLICATE += 1;
        else if (reasons.some((reason) => /EVIDENCE|CLAIM_REFERENCE|SOURCE_REFERENCE|GROUNDING/.test(String(reason)))) rejectionSummary.GROUNDING += 1;
        else if (reasons.some((reason) => /AMBIGUITY|UNCERTAINTY/.test(String(reason)))) rejectionSummary.AMBIGUITY += 1;
        else rejectionSummary.QUALITY += 1;
      }
      const finalState = rejected.length && insertedQuestions.length ? "PARTIAL" : rejected.length ? "PARTIAL" : "COMPLETED";
      await markRunFinished({
        runId, state: finalState, callsMade: attempts.length, providerAttemptCount: attempts.length,
          latencyMs, outputDigest, generatedCount: rawCandidates.length,
          validatedCount: insertedQuestions.length, rejectedCount: rejected.length,
          provider: boundedText(result.provider || "gemini", 80).toLowerCase(),
          model: generationProvenanceBase.model,
          rejectionSummary,
      });
      return {
        generationRunId: runId,
        state: finalState,
        scenarioId: scenario,
        generated: rawCandidates.length,
        validated: insertedQuestions.length,
        rejected: rejected.length,
        active: 0,
        semanticDedup: deduped.semanticDedup,
        provider: "gemini",
        model: generationProvenanceBase.model,
        providerAttempts: attempts.length,
        latencyMs,
        questions: insertedQuestions,
        rejections: rejected,
        idempotent: false,
      };
    } catch (caught) {
      if (activeRunId) {
        const errorCode = /^[A-Z0-9_:-]{1,100}$/.test(String(caught?.code || "")) ? caught.code : "GENERATION_FAILED";
        await getPostgresPool().query(
          `UPDATE private.expert_v5_question_generation_runs
              SET state = 'FAILED', error_code = $2, completed_at = COALESCE(completed_at, now())
            WHERE generation_run_id = $1 AND state IN ('RESERVED','RUNNING')`, [activeRunId, errorCode],
        ).catch(() => {});
      }
      throw storageError(caught);
    }
  }

  static async listRuns({ scenarioId = null, limit = 100 } = {}) {
    const boundedLimit = Math.max(1, Math.min(200, Number(limit) || 100));
    const id = scenarioId ? normalizeUuid(scenarioId, "scenarioId") : null;
    try {
      const result = await getPostgresPool().query(
        `SELECT generation_run_id, scenario_id, state, batch_size, max_calls, calls_made,
                retry_limit, prompt_template_version, provider, model, input_digest, output_digest,
                generated_count, validated_count, rejected_count, provider_attempt_count, latency_ms,
                error_code, started_at, completed_at, created_at
           FROM private.expert_v5_question_generation_runs
          WHERE ($1::uuid IS NULL OR scenario_id = $1)
          ORDER BY created_at DESC LIMIT $2`, [id, boundedLimit],
      );
      return result.rows.map((row) => ({
        generationRunId: row.generation_run_id,
        scenarioId: row.scenario_id,
        state: row.state,
        batchSize: Number(row.batch_size),
        maxCalls: Number(row.max_calls),
        callsMade: Number(row.calls_made),
        retryLimit: Number(row.retry_limit),
        promptTemplateVersion: row.prompt_template_version,
        provider: row.provider,
        model: row.model,
        inputDigest: row.input_digest,
        outputDigest: row.output_digest,
        generated: Number(row.generated_count),
        validated: Number(row.validated_count),
        rejected: Number(row.rejected_count),
        providerAttempts: Number(row.provider_attempt_count),
        latencyMs: row.latency_ms === null ? null : Number(row.latency_ms),
        errorCode: row.error_code,
        startedAt: row.started_at ? new Date(row.started_at).toISOString() : null,
        completedAt: row.completed_at ? new Date(row.completed_at).toISOString() : null,
        createdAt: new Date(row.created_at).toISOString(),
      }));
    } catch (caught) { throw storageError(caught); }
  }

  static async listMetrics() {
    try {
      const [scenarios, runs, difficulties, activeModalities] = await Promise.all([
        getPostgresPool().query(
          `SELECT modality, status, count(*)::int AS count
             FROM private.expert_v5_scenarios GROUP BY modality, status ORDER BY modality, status`,
        ),
        getPostgresPool().query(
          `SELECT coalesce(sum(generated_count), 0)::int AS generated,
                  coalesce(sum(validated_count), 0)::int AS validated,
                  coalesce(sum(rejected_count), 0)::int AS rejected,
                  coalesce(sum((rejection_summary ->> 'DUPLICATE')::int), 0)::int AS duplicate_rejected,
                  coalesce(sum((rejection_summary ->> 'GROUNDING')::int), 0)::int AS grounding_rejected,
                  coalesce(sum((rejection_summary ->> 'AMBIGUITY')::int), 0)::int AS ambiguity_rejected,
                  count(*)::int AS runs
             FROM private.expert_v5_question_generation_runs`,
        ),
        getPostgresPool().query(
          `WITH current_active AS (
             SELECT q.question_id, q.question_version, q.difficulty, q.modality, q.scenario_id,
                    row_number() OVER (PARTITION BY q.question_id ORDER BY q.question_version DESC) AS version_rank
               FROM private.expert_v5_questions q WHERE q.status = 'ACTIVE'
           )
           SELECT difficulty, count(*)::int AS count FROM current_active WHERE version_rank = 1
            GROUP BY difficulty ORDER BY difficulty`,
        ),
        getPostgresPool().query(
          `WITH current_active AS (
             SELECT q.question_id, q.question_version, q.modality, q.scenario_id,
                    row_number() OVER (PARTITION BY q.question_id ORDER BY q.question_version DESC) AS version_rank
               FROM private.expert_v5_questions q WHERE q.status = 'ACTIVE'
           )
           SELECT coalesce(s.modality, q.modality, 'URL') AS modality, count(*)::int AS count
             FROM current_active q
             LEFT JOIN private.expert_v5_scenarios s ON s.scenario_id = q.scenario_id
            WHERE q.version_rank = 1 GROUP BY coalesce(s.modality, q.modality, 'URL') ORDER BY modality`,
        ),
      ]);
      const run = runs.rows[0] || {};
      const generated = Number(run.generated || 0);
      const summarizeRejectionRate = (value) => generated ? Number(value || 0) / generated : null;
      const scenariosByModality = {};
      const scenariosByStatus = {};
      for (const row of scenarios.rows) {
        scenariosByModality[row.modality] = (scenariosByModality[row.modality] || 0) + Number(row.count);
        scenariosByStatus[row.status] = (scenariosByStatus[row.status] || 0) + Number(row.count);
      }
      return {
        scenariosTotal: Object.values(scenariosByModality).reduce((sum, count) => sum + count, 0),
        scenariosByModality,
        scenariosByStatus,
        questionsGenerated: generated,
        questionsValidated: Number(run.validated || 0),
        questionsRejected: Number(run.rejected || 0),
        questionsActive: activeModalities.rows.reduce((sum, row) => sum + Number(row.count), 0),
        activeByDifficulty: Object.fromEntries(difficulties.rows.map((row) => [row.difficulty, Number(row.count)])),
        activeByModality: Object.fromEntries(activeModalities.rows.map((row) => [row.modality, Number(row.count)])),
        duplicateRejectionRate: summarizeRejectionRate(run.duplicate_rejected),
        groundingRejectionRate: summarizeRejectionRate(run.grounding_rejected),
        ambiguityRejectionRate: summarizeRejectionRate(run.ambiguity_rejected),
        semanticDedup: "NOT_CONFIGURED",
        generationRuns: Number(run.runs || 0),
      };
    } catch (caught) { throw storageError(caught); }
  }
}
