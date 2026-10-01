import { createHash } from "node:crypto";
import { getPostgresPool } from "../database/PostgresPool.js";
import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import { authenticatedUserId, ExpertQualificationError } from "./ExpertQualificationService.js";
import { ExpertQuestionBankService } from "./ExpertQuestionBankService.js";
import { normalizeModalityInputs } from "./ExpertQuestionPipeline.js";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SHA256 = /^[a-f0-9]{64}$/i;
const DOMAIN = /^[A-Z][A-Z0-9_:-]{1,79}$/;
const ALLOWED_SKILLS = new Set([
  "SOURCE_VERIFICATION", "CLAIM_REASONING", "EVIDENCE_SELECTION", "EVIDENCE_MATCHING",
  "CONTEXT_ANALYSIS", "MISINFORMATION_DETECTION", "ENTITY_RESOLUTION", "TEMPORAL_REASONING",
  "IMAGE_INTERPRETATION", "URL_EVALUATION", "QR_SAFETY", "CONFLICT_RESOLUTION",
  "NUMERICAL_REASONING", "SOURCE_AUTHORITY", "FRESHNESS_CHECK", "UNCERTAINTY_CALIBRATION",
]);
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

function scenarioError(code, message, statusCode = 400) {
  return new ExpertQualificationError(code, message, statusCode);
}

function digest(value) {
  return createHash("sha256").update(typeof value === "string" ? value : JSON.stringify(value)).digest("hex");
}

function boundedText(value, maxLength = 2_048) {
  return typeof value === "string" ? value.normalize("NFC").trim().replace(/\u0000/g, "").slice(0, maxLength) : "";
}

function normalizeId(value, field) {
  const candidate = String(value || "").trim();
  if (!UUID.test(candidate)) throw scenarioError("EXPERT_V5_SCENARIO_INPUT_INVALID", `${field} must be a durable identifier.`, 400);
  return candidate.toLowerCase();
}

function safeCanonicalUrl(value) {
  const check = validateRemoteUrlSync(String(value || ""));
  if (!check.ok) throw scenarioError("EXPERT_V5_SCENARIO_URL_INVALID", "Only a safe public HTTPS source URL can be used in a scenario.", 422);
  const url = new URL(check.url);
  if (url.protocol !== "https:") throw scenarioError("EXPERT_V5_SCENARIO_URL_INVALID", "Only a safe public HTTPS source URL can be used in a scenario.", 422);
  url.username = "";
  url.password = "";
  url.search = "";
  url.hash = "";
  return url.toString();
}

function normalizeImageBytes(value, mimeType) {
  const raw = boundedText(value, 12 * 1024 * 1024);
  const dataUri = raw.match(/^data:(image\/[a-z0-9.+-]+);base64,([a-z0-9+/=\s]+)$/i);
  const base64 = (dataUri ? dataUri[2] : raw).replace(/\s/g, "");
  const declaredMimeType = boundedText(mimeType || dataUri?.[1] || "image/png", 120).toLowerCase();
  if (!base64 || !/^[a-z0-9+/]+={0,2}$/i.test(base64) || !declaredMimeType.startsWith("image/")) {
    throw scenarioError("EXPERT_V5_SCENARIO_IMAGE_INVALID", "Provide a valid encoded image and MIME type.", 422);
  }
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length || bytes.length > MAX_IMAGE_BYTES || bytes.toString("base64").replace(/=+$/, "") !== base64.replace(/=+$/, "")) {
    throw scenarioError("EXPERT_V5_SCENARIO_IMAGE_INVALID", "Encoded images must be valid and no larger than 8 MiB.", bytes.length > MAX_IMAGE_BYTES ? 413 : 422);
  }
  return { bytes: base64, mimeType: declaredMimeType };
}

function normalizeInput(raw, index) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw scenarioError("EXPERT_V5_SCENARIO_INPUT_INVALID", `Input ${index + 1} is invalid.`, 400);
  const type = boundedText(raw.type, 20).toUpperCase();
  if (type === "TEXT") {
    const content = boundedText(raw.content, 50_000);
    if (content.length < 10) throw scenarioError("EXPERT_V5_SCENARIO_TEXT_REQUIRED", "Text inputs must contain at least 10 characters.", 422);
    return { type, trustType: "text", content, metadata: {} };
  }
  if (type === "URL") {
    const url = safeCanonicalUrl(raw.url || raw.content);
    return { type, trustType: "url", content: url, metadata: { url }, registryId: normalizeId(raw.registryId, "registryId") };
  }
  if (type === "IMAGE") {
    const mediaArtifactId = boundedText(raw.mediaArtifactId, 64);
    const imageHash = boundedText(raw.imageHash, 64).toLowerCase();
    const imageBytes = raw.imageBase64 || raw.bytes ? normalizeImageBytes(raw.imageBase64 || raw.bytes, raw.mimeType) : null;
    if (imageBytes) return { type, trustType: "image", content: "", metadata: imageBytes, mediaBytes: imageBytes.bytes };
    if (!/^art_[0-9a-f-]{36}$/i.test(mediaArtifactId) || !SHA256.test(imageHash)) {
      throw scenarioError("EXPERT_V5_SCENARIO_IMAGE_REQUIRED", "Image scenarios must reference an authorized durable image artifact and its SHA-256 hash.", 422);
    }
    return { type, trustType: "image", content: "", metadata: { mediaArtifactId, imageHash }, mediaArtifactId, mediaSha256: imageHash };
  }
  if (type === "QR") {
    const mediaArtifactId = boundedText(raw.mediaArtifactId, 64);
    const imageHash = boundedText(raw.imageHash, 64).toLowerCase();
    const qrPayload = boundedText(raw.qrPayload || raw.content, 4_000);
    if (mediaArtifactId) {
      if (!/^art_[0-9a-f-]{36}$/i.test(mediaArtifactId) || !SHA256.test(imageHash)) {
        throw scenarioError("EXPERT_V5_SCENARIO_QR_INVALID", "QR image scenarios need an authorized durable artifact and its SHA-256 hash.", 422);
      }
      return { type, trustType: "qr", content: "", metadata: { mediaArtifactId, imageHash }, mediaArtifactId, mediaSha256: imageHash };
    }
    if (raw.imageBase64 || raw.bytes) {
      const imageBytes = normalizeImageBytes(raw.imageBase64 || raw.bytes, raw.mimeType);
      return { type, trustType: "qr", content: "", metadata: imageBytes, mediaBytes: imageBytes.bytes };
    }
    if (qrPayload.length < 4) throw scenarioError("EXPERT_V5_SCENARIO_QR_INVALID", "Provide a decoded QR payload or a stored QR image artifact.", 422);
    return { type, trustType: "qr", content: "", metadata: { qrPayload } };
  }
  throw scenarioError("EXPERT_V5_SCENARIO_INPUT_TYPE_INVALID", "Supported scenario inputs are TEXT, URL, IMAGE, and QR.", 422);
}

function uniqueText(values, limit, maxLength = 120) {
  return [...new Set((Array.isArray(values) ? values : []).map((value) => boundedText(value, maxLength)).filter(Boolean))].slice(0, limit);
}

function validateSkills(values) {
  const skills = uniqueText(values, 8).map((value) => value.toUpperCase().replace(/[ -]+/g, "_"));
  if (skills.some((skill) => !ALLOWED_SKILLS.has(skill))) throw scenarioError("EXPERT_V5_SCENARIO_SKILLS_INVALID", "One or more scenario skills are unsupported.", 422);
  return skills;
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
    return scenarioError("EXPERT_V5_MIGRATION_REQUIRED", "The grounded Question Bank migration is not initialized.", 503);
  }
  return scenarioError("EXPERT_V5_SCENARIO_STORAGE_UNAVAILABLE", "Scenario intake is temporarily unavailable.", 503);
}

function scenarioDto(row) {
  return {
    scenarioId: row.scenario_id,
    title: row.title,
    domainCode: row.domain_code,
    modality: row.modality,
    status: row.status,
    inputFingerprint: row.input_fingerprint,
    inputLanguage: row.input_language,
    expectedSkills: Array.isArray(row.expected_skills) ? row.expected_skills : [],
    difficultyPotential: Array.isArray(row.difficulty_potential) ? row.difficulty_potential : [],
    limitations: Array.isArray(row.limitations) ? row.limitations : [],
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    retrievedAt: row.retrieved_at ? new Date(row.retrieved_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
  };
}

async function canonicalCasePackage(client, caseId, ownerId) {
  const caseResult = await client.query(
    `SELECT c.id, c.owner_id, c.state, c.visibility,
            latest.revision AS case_revision,
            inputs.input_type, inputs.content_hash AS input_fingerprint,
            asset.media_artifact_id, asset.media_sha256
       FROM public.trust_cases c
       LEFT JOIN LATERAL (
         SELECT revision FROM public.trust_case_revisions WHERE case_id = c.id ORDER BY revision DESC LIMIT 1
       ) latest ON true
       LEFT JOIN LATERAL (
         SELECT input_type, content_hash FROM public.case_inputs WHERE case_id = c.id ORDER BY created_at ASC LIMIT 1
       ) inputs ON true
       LEFT JOIN LATERAL (
         SELECT 'art_' || so.id::text AS media_artifact_id, encode(so.sha256, 'hex') AS media_sha256
           FROM public.screenshot_objects so
          WHERE so.case_id = c.id AND so.owner_id = c.owner_id AND so.deleted_at IS NULL
            AND (so.expires_at IS NULL OR so.expires_at > now())
          ORDER BY so.created_at DESC LIMIT 1
       ) asset ON true
      WHERE c.id = $1 AND c.owner_id = $2`, [caseId, ownerId],
  );
  const row = caseResult.rows[0];
  if (!row || !Number(row.case_revision) || !SHA256.test(String(row.input_fingerprint || "")) || row.state === "FAILED") {
    throw scenarioError("EXPERT_V5_TRUST_CASE_NOT_DURABLE", "The canonical Trust case is unavailable, failed, or has no durable input revision.", 422);
  }
  const [claimResult, evidenceResult] = await Promise.all([
    client.query(
      `SELECT c.id, c.statement, c.status,
              array_agg(DISTINCT cs.evidence_id::text) FILTER (WHERE cs.evidence_id IS NOT NULL) AS evidence_ids
         FROM public.claims c
         JOIN public.claim_sources cs ON cs.claim_id = c.id
         JOIN public.evidence e ON e.id = cs.evidence_id AND e.case_id = $1
        WHERE c.creator_id = $2
        GROUP BY c.id, c.statement, c.status
        ORDER BY c.id`, [caseId, ownerId],
    ),
    client.query(
      `SELECT id, source_type, source_identifier, observed_at, confidence, provenance
         FROM public.evidence WHERE case_id = $1 ORDER BY observed_at, id`, [caseId],
    ),
  ]);
  if (!claimResult.rows.length || !evidenceResult.rows.length) {
    throw scenarioError("EXPERT_V5_CANONICAL_EVIDENCE_REQUIRED", "A question scenario requires canonical Trust claim and evidence records.", 422);
  }
  return {
    row,
    claims: claimResult.rows,
    evidence: evidenceResult.rows,
  };
}

async function runTrustForInput({ request, principal, securityContext, input, key, urlRegistryId }) {
  if (input.type === "URL") {
    const ingested = await ExpertQuestionBankService.ingestFromTrust({
      request, principal, securityContext,
      registryId: urlRegistryId, url: input.content, idempotencyKey: key,
    });
    if (ingested.snapshot.retrievalStatus !== "SUCCESS" || !ingested.snapshot.trustCaseId) {
      throw scenarioError("EXPERT_V5_SOURCE_NOT_RETRIEVED", "The registered URL did not produce a durable live source snapshot and Trust case.", 422);
    }
    return {
      trustCaseId: normalizeId(ingested.snapshot.trustCaseId, "trustCaseId"),
      sourceSnapshotId: normalizeId(ingested.snapshot.snapshotId, "sourceSnapshotId"),
      canonicalUrl: ingested.snapshot.canonicalUrl,
      title: ingested.snapshot.title,
      publisher: ingested.snapshot.publisher,
      sourceType: ingested.snapshot.sourceType,
      publishedAt: ingested.snapshot.publishedAt,
      retrievedAt: ingested.snapshot.retrievedAt,
      mediaArtifactId: null,
      mediaSha256: null,
    };
  }
  const response = await ExpertQuestionBankService.runTrustInput({
    request, principal, securityContext,
    input: { type: input.trustType, content: input.content, metadata: input.metadata },
    idempotencyKey: `qb-scenario:${key}`,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success !== true || payload?.persistence?.persisted !== true || !payload?.caseId) {
    throw scenarioError("EXPERT_V5_TRUST_INGEST_FAILED", "Canonical Trust did not persist this input; no scenario was created.", response.status >= 400 ? response.status : 503);
  }
  return {
    trustCaseId: normalizeId(payload.caseId, "trustCaseId"),
    sourceSnapshotId: null,
    canonicalUrl: null,
    title: null,
    publisher: null,
    sourceType: null,
    publishedAt: null,
    retrievedAt: new Date().toISOString(),
    mediaArtifactId: input.mediaArtifactId || null,
    mediaSha256: input.mediaSha256 || null,
  };
}

export class ExpertScenarioService {
  static async ingestScenario({ request, principal, securityContext, body, idempotencyKey }) {
    const actorId = authenticatedUserId(principal);
    const key = boundedText(idempotencyKey, 160);
    if (!/^[A-Za-z0-9._:-]{1,160}$/.test(key)) throw scenarioError("EXPERT_V5_SCENARIO_IDEMPOTENCY_REQUIRED", "A valid Idempotency-Key is required for scenario intake.", 400);
    if (!body || typeof body !== "object" || Array.isArray(body)) throw scenarioError("EXPERT_V5_SCENARIO_INPUT_INVALID", "Scenario fields are required.", 400);
    const inputs = (Array.isArray(body.inputs) ? body.inputs : []).map(normalizeInput);
    const modalityResult = normalizeModalityInputs(inputs);
    if (!modalityResult.valid) throw scenarioError(modalityResult.code, "This modality combination is not supported.", 422);
    const domainCode = boundedText(body.domainCode, 80).toUpperCase();
    if (!DOMAIN.test(domainCode)) throw scenarioError("EXPERT_V5_SCENARIO_DOMAIN_INVALID", "A valid domain code is required.", 400);
    const title = boundedText(body.title, 240);
    const inputLanguage = boundedText(body.inputLanguage || "MIXED", 16).toUpperCase();
    if (!["VI", "EN", "MIXED", "UNKNOWN"].includes(inputLanguage)) throw scenarioError("EXPERT_V5_SCENARIO_LANGUAGE_INVALID", "Scenario language must be VI, EN, MIXED, or UNKNOWN.", 422);
    const expectedSkills = validateSkills(body.expectedSkills);
    const difficultyPotential = uniqueText(body.difficultyPotential, 3).map((value) => value.toUpperCase());
    if (!difficultyPotential.length || difficultyPotential.some((value) => !["EASY", "MEDIUM", "HARD"].includes(value))) {
      throw scenarioError("EXPERT_V5_SCENARIO_DIFFICULTY_INVALID", "Choose one or more supported difficulty levels.", 422);
    }
    const limitations = uniqueText(body.limitations, 8, 500);
    const inputFingerprint = digest(inputs.map((input) => ({
      type: input.type,
      contentHash: digest(input.content || input.metadata?.qrPayload || input.mediaSha256 || input.mediaBytes || input.content),
      registryId: input.registryId || null,
      mediaSha256: input.mediaSha256 || null,
    })));

    try {
      const reservation = await withTransaction(async (client) => {
        const inserted = await client.query(
          `INSERT INTO private.expert_v5_scenario_intakes(idempotency_key, actor_id, input_fingerprint, state, lease_expires_at)
           VALUES ($1,$2,$3,'PROCESSING',now() + interval '10 minutes')
           ON CONFLICT (idempotency_key) DO NOTHING RETURNING idempotency_key`, [key, actorId, inputFingerprint],
        );
        const selected = await client.query(
          `SELECT actor_id, input_fingerprint, state, lease_expires_at, scenario_id
             FROM private.expert_v5_scenario_intakes WHERE idempotency_key = $1 FOR UPDATE`, [key],
        );
        const row = selected.rows[0];
        if (!row || String(row.actor_id) !== actorId || row.input_fingerprint !== inputFingerprint) {
          throw scenarioError("EXPERT_V5_SCENARIO_IDEMPOTENCY_CONFLICT", "This Idempotency-Key is bound to a different scenario or account.", 409);
        }
        if (row.state === "COMPLETED" && row.scenario_id) {
          const current = await client.query(`SELECT * FROM private.expert_v5_scenarios WHERE scenario_id = $1`, [row.scenario_id]);
          if (current.rows[0]) return { existing: scenarioDto(current.rows[0]) };
        }
        if (row.state === "PROCESSING" && new Date(row.lease_expires_at).getTime() > Date.now() && !inserted.rows[0]) {
          throw scenarioError("EXPERT_V5_SCENARIO_IN_PROGRESS", "This scenario intake is already running.", 409);
        }
        await client.query(
          `UPDATE private.expert_v5_scenario_intakes SET state = 'PROCESSING', scenario_id = NULL,
             error_code = NULL, lease_expires_at = now() + interval '10 minutes', updated_at = now()
            WHERE idempotency_key = $1`, [key],
        );
        return { reserved: true };
      });
      if (reservation.existing) return { scenario: reservation.existing, idempotent: true };

      const resolvedInputs = [];
      for (let index = 0; index < inputs.length; index += 1) {
        const input = inputs[index];
        const childKey = `scenario:${key}:${index}`;
        const trustInput = await runTrustForInput({
          request, principal, securityContext, input, key: childKey, urlRegistryId: input.registryId,
        });
        const packageData = await withTransaction(async (client) => {
          const canonical = await canonicalCasePackage(client, trustInput.trustCaseId, actorId);
          let snapshot = null;
          if ((input.type === "IMAGE" || input.mediaArtifactId || input.mediaBytes)
            && !(trustInput.mediaArtifactId || canonical.row.media_artifact_id)) {
            throw scenarioError("EXPERT_V5_SCENARIO_MEDIA_NOT_DURABLE", "Canonical Trust did not persist a durable authorized media reference for this image input.", 422);
          }
          if (trustInput.sourceSnapshotId) {
            const snapshotResult = await client.query(
              `SELECT s.id, s.source_id, s.trust_case_id, s.content_hash, s.canonical_url, s.title, s.publisher,
                      s.source_type, s.published_at, s.retrieved_at, s.retrieval_status, r.domain_code
                 FROM private.expert_v5_source_snapshots s
                 JOIN private.expert_v5_source_registry r ON r.id = s.source_id
                WHERE s.id = $1 AND s.trust_case_id = $2`, [trustInput.sourceSnapshotId, trustInput.trustCaseId],
            );
            snapshot = snapshotResult.rows[0];
            if (!snapshot || snapshot.retrieval_status !== "SUCCESS" || snapshot.domain_code !== domainCode) {
              throw scenarioError("EXPERT_V5_SCENARIO_SNAPSHOT_INVALID", "URL snapshot must be live, registered, and approved for the scenario domain.", 422);
            }
          }
          return { canonical, snapshot };
        });
        resolvedInputs.push({ input, trustInput, ...packageData });
      }

      const mergedClaims = [...new Map(resolvedInputs.flatMap(({ canonical }) => canonical.claims).map((claim) => [String(claim.id), claim])).values()];
      const mergedEvidence = [...new Map(resolvedInputs.flatMap(({ canonical }) => canonical.evidence).map((item) => [String(item.id), item])).values()];
      const effectiveTitle = title || boundedText(mergedClaims[0]?.statement, 240) || "Evidence verification scenario";
      const digestParts = resolvedInputs.map(({ input, canonical, snapshot }) => ({
        type: input.type,
        inputFingerprint: canonical.row.input_fingerprint,
        sourceRegistryId: snapshot?.source_id || null,
        snapshotHash: snapshot?.content_hash || null,
      }));
      const packageFingerprint = digest({ modality: modalityResult.modality, domainCode, digestParts });
      const scenarioResult = await withTransaction(async (client) => {
        const duplicate = await client.query(
          `SELECT * FROM private.expert_v5_scenarios
            WHERE input_fingerprint = $1 AND created_by = $2 AND status = 'READY'
              AND private.expert_v5_scenario_is_current(scenario_id)
            ORDER BY created_at DESC LIMIT 1`, [packageFingerprint, actorId],
        );
        let scenario = duplicate.rows[0];
        if (!scenario) {
          const inserted = await client.query(
            `INSERT INTO private.expert_v5_scenarios
              (title, domain_code, modality, status, input_fingerprint, input_language,
               expected_skills, difficulty_potential, limitations, retrieved_at, idempotency_key, created_by)
             VALUES ($1,$2,$3,'READY',$4,$5,$6::jsonb,$7::text[],$8::jsonb,now(),$9,$10)
             RETURNING *`,
            [effectiveTitle, domainCode, modalityResult.modality, packageFingerprint,
              inputLanguage, JSON.stringify(expectedSkills), difficultyPotential,
              JSON.stringify(limitations), key, actorId],
          );
          scenario = inserted.rows[0];
        }
        for (let index = 0; index < resolvedInputs.length; index += 1) {
          const { input, trustInput, canonical, snapshot } = resolvedInputs[index];
          await client.query(
            `INSERT INTO private.expert_v5_scenario_inputs
              (scenario_id, input_index, input_type, trust_case_id, case_revision, source_snapshot_id,
               media_artifact_id, media_sha256, input_fingerprint, canonical_url, retrieved_at, published_at)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
             ON CONFLICT (scenario_id, input_index) DO NOTHING`,
            [scenario.scenario_id, index, input.type, trustInput.trustCaseId, Number(canonical.row.case_revision),
              snapshot?.id || null, trustInput.mediaArtifactId || canonical.row.media_artifact_id,
              trustInput.mediaSha256 || canonical.row.media_sha256,
              canonical.row.input_fingerprint, snapshot?.canonical_url || trustInput.canonicalUrl || null,
              snapshot?.retrieved_at || trustInput.retrievedAt, snapshot?.published_at || trustInput.publishedAt],
          );
          for (const claim of canonical.claims) {
            await client.query(
              `INSERT INTO private.expert_v5_scenario_claims(scenario_id, input_index, claim_id)
               VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [scenario.scenario_id, index, claim.id],
            );
          }
          for (const item of canonical.evidence) {
            await client.query(
              `INSERT INTO private.expert_v5_scenario_evidence(scenario_id, input_index, evidence_id)
               VALUES ($1,$2,$3) ON CONFLICT DO NOTHING`, [scenario.scenario_id, index, item.id],
            );
          }
        }
        await client.query(
          `UPDATE private.expert_v5_scenario_intakes SET state = 'COMPLETED', scenario_id = $2,
             lease_expires_at = now(), updated_at = now() WHERE idempotency_key = $1`, [key, scenario.scenario_id],
        );
        return scenarioDto(scenario);
      });
      return {
        scenario: scenarioResult,
        inputCount: resolvedInputs.length,
        claimCount: mergedClaims.length,
        evidenceCount: mergedEvidence.length,
        idempotent: false,
      };
    } catch (caught) {
      await withTransaction(async (client) => client.query(
        `UPDATE private.expert_v5_scenario_intakes SET state = 'FAILED', error_code = $2,
           lease_expires_at = now(), updated_at = now() WHERE idempotency_key = $1 AND state = 'PROCESSING'`,
        [key, /^[A-Z0-9_:-]{1,100}$/.test(caught?.code || "") ? caught.code : "SCENARIO_INTAKE_FAILED"],
      )).catch(() => {});
      throw storageError(caught);
    }
  }

  static async listScenarios({ limit = 100, modality = null, status = null } = {}) {
    const boundedLimit = Math.max(1, Math.min(200, Number(limit) || 100));
    const validModality = ["TEXT", "URL", "IMAGE", "QR", "TEXT_URL", "TEXT_IMAGE", "IMAGE_URL", "QR_URL", "TEXT_URL_IMAGE"].includes(String(modality || "").toUpperCase())
      ? String(modality).toUpperCase() : null;
    const validStatus = ["READY", "STALE", "REVIEW_REQUIRED", "INACTIVE"].includes(String(status || "").toUpperCase())
      ? String(status).toUpperCase() : null;
    try {
      const result = await getPostgresPool().query(
        `SELECT s.*,
                (SELECT count(*)::int FROM private.expert_v5_questions q WHERE q.scenario_id = s.scenario_id) AS question_count,
                (SELECT count(*)::int FROM private.expert_v5_scenario_claims c WHERE c.scenario_id = s.scenario_id) AS claim_count,
                (SELECT count(*)::int FROM private.expert_v5_scenario_evidence e WHERE e.scenario_id = s.scenario_id) AS evidence_count
           FROM private.expert_v5_scenarios s
          WHERE ($1::text IS NULL OR s.modality = $1) AND ($2::text IS NULL OR s.status = $2)
          ORDER BY s.created_at DESC LIMIT $3`, [validModality, validStatus, boundedLimit],
      );
      return result.rows.map((row) => ({ ...scenarioDto(row), questionCount: Number(row.question_count), claimCount: Number(row.claim_count), evidenceCount: Number(row.evidence_count) }));
    } catch (caught) { throw storageError(caught); }
  }
}
