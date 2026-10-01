import { createHash, randomUUID } from "node:crypto";
import { getPostgresPool } from "../database/PostgresPool.js";
import { authenticatedUserId, ExpertQualificationError } from "./ExpertQualificationService.js";
import { validateRemoteUrl, validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";
import {
  canServeQuestion,
  classifyRemoteRetrieval,
  deriveQuestionDifficulty,
  EXPERT_V5_DIFFICULTIES,
  EXPERT_V5_MODALITIES,
  EXPERT_V5_QUESTION_TYPES,
  validateQuestionActivation,
} from "./ExpertV5Domain.js";
import { normalizeQuestionText } from "./ExpertQuestionPipeline.js";

function error(code, message, statusCode = 400) {
  return new ExpertQualificationError(code, message, statusCode);
}

function normalizeUuid(value, field) {
  const candidate = String(value || "").trim();
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)) {
    throw error("EXPERT_V5_INPUT_INVALID", `${field} must be a durable identifier.`, 400);
  }
  return candidate.toLowerCase();
}

function storageError(caught) {
  if (caught instanceof ExpertQualificationError) return caught;
  if (["42P01", "42703", "3F000"].includes(caught?.code)) {
    return error("EXPERT_V5_MIGRATION_REQUIRED", "Expert V5 storage is not initialized; no fallback data is available.", 503);
  }
  return error("EXPERT_V5_STORAGE_UNAVAILABLE", "The source and question bank is temporarily unavailable.", 503);
}

async function withStorageErrors(operation) {
  try { return await operation(); } catch (caught) { throw storageError(caught); }
}

async function transaction(operation) {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (caught) {
    await client.query("ROLLBACK").catch(() => {});
    throw caught;
  } finally {
    client.release();
  }
}

function parseJson(value, fallback) {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value;
  if (typeof value !== "string") return fallback;
  try { return JSON.parse(value); } catch { return fallback; }
}

function text(value, maxLength = 2_048) {
  return typeof value === "string" ? value.trim().replace(/\u0000/g, "").slice(0, maxLength) : "";
}

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeCanonicalUrl(value) {
  const safe = validateRemoteUrlSync(String(value || ""));
  if (!safe.ok) throw error("EXPERT_V5_SOURCE_URL_INVALID", "Only safe public HTTP(S) source URLs are supported.", 400);
  const url = new URL(safe.url);
  url.hash = "";
  return url.toString();
}

function sourceDto(row) {
  return {
    id: row.id,
    canonicalHost: row.canonical_host,
    domainCode: row.domain_code,
    category: row.category,
    fetchPolicy: row.fetch_policy,
    licenseNotes: row.license_notes,
    enabled: row.enabled === true,
    maxRequestsPerDay: Number(row.max_requests_per_day),
    minRequestIntervalSeconds: Number(row.min_request_interval_seconds),
    lastRequestAt: row.last_request_at ? new Date(row.last_request_at).toISOString() : null,
    createdBy: row.created_by || null,
    createdAt: validDate(row.created_at),
  };
}

async function registryEvent(client, { sourceId, actorId, eventType, payload }) {
  await client.query(
    `INSERT INTO private.expert_v5_source_events(source_id, actor_id, event_type, payload, idempotency_key)
     VALUES ($1,$2,$3,$4::jsonb,$5)`,
    [sourceId, actorId, eventType, JSON.stringify(payload || {}), `source-registry:${sourceId}:${randomUUID()}`],
  );
}

function snapshotDto(row) {
  return {
    snapshotId: row.id,
    sourceId: row.source_id,
    trustCaseId: row.trust_case_id || null,
    requestedUrl: row.requested_url,
    canonicalUrl: row.canonical_url,
    title: row.title,
    publisher: row.publisher,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    retrievedAt: row.retrieved_at ? new Date(row.retrieved_at).toISOString() : null,
    sourceType: row.source_type,
    contentHash: row.content_hash,
    retrievalStatus: row.retrieval_status,
    blockedReason: row.blocked_reason,
    evidenceItems: Array.isArray(row.evidence_items) ? row.evidence_items : parseJson(row.evidence_items, []),
    providerMetadata: parseJson(row.provider_metadata, {}),
  };
}

function payloadPipeline(payload) {
  const value = payload?.data?.data || payload?.data || {};
  const layer3 = value?.layerResults?.layer3 || value?.layer3 || value?.layers?.layer3 || {};
  return { value, layer3 };
}

function samePublicPage(left, right) {
  try {
    const a = new URL(left);
    const b = new URL(right);
    a.hash = "";
    b.hash = "";
    return a.protocol === "https:" && b.protocol === "https:" && a.hostname.toLowerCase() === b.hostname.toLowerCase()
      && a.pathname.replace(/\/$/, "") === b.pathname.replace(/\/$/, "");
  } catch { return false; }
}

function directSourceCandidate(layer3, requestedUrl) {
  const sources = Array.isArray(layer3?.sources) ? layer3.sources : [];
  return sources.find((source) => (source?.retrievalOrigin === "DIRECT_INPUT" || source?.sourceScope === "direct_input")
    && samePublicPage(source?.requestedUrl || source?.finalUrl || source?.url, requestedUrl)) || null;
}

function extractEvidence(layer3, source, requestedUrl) {
  const items = Array.isArray(layer3?.evidence) ? layer3.evidence : [];
  const matched = items.filter((item) => item?.liveEvidence === true
      && item?.providerStatus === "SUCCESS"
      && item?.retrievalOutcome === "SUCCESS"
      && samePublicPage(item?.sourceUrl, source?.finalUrl || source?.url || requestedUrl))
    .map((item) => ({
      id: text(item.evidenceId, 160),
      excerpt: text(item.excerpt, 400),
      relation: text(item.relation, 80) || null,
      retrievedAt: validDate(item.retrievedAt),
      sourceUrl: normalizeCanonicalUrl(item.sourceUrl || requestedUrl),
      sourceFingerprint: text(item.sourceFingerprint, 128) || null,
    }))
    .filter((item) => item.id && item.excerpt.length >= 20)
    .slice(0, 20);
  return [...new Map(matched.map((item) => [item.id, item])).values()];
}

function toSnapshotResult({ requestedUrl, responsePayload, responseStatus, failedCode }) {
  const { value, layer3 } = payloadPipeline(responsePayload);
  const source = directSourceCandidate(layer3, requestedUrl);
  const evidenceItems = source?.liveEvidence === true && source?.providerStatus === "SUCCESS" && source?.retrievalOutcome === "SUCCESS"
    ? extractEvidence(layer3, source, requestedUrl) : [];
  const retrieval = classifyRemoteRetrieval({
    outcome: source?.retrievalOutcome || layer3?.retrievalStatus,
    status: layer3?.retrievalStatus || value?.retrievalStatus,
    httpStatus: source?.httpStatus || responsePayload?.httpStatus || responseStatus,
    reason: source?.providerStatus || source?.errorCode || source?.blockingReason || source?.retrievalReason || failedCode || responsePayload?.error?.code,
  });
  const successful = Boolean(source && evidenceItems.length && retrieval.remoteRetrieval === "SUCCESS");
  const remoteRetrieval = successful ? "SUCCESS" : retrieval.remoteRetrieval;
  const retrievalStatus = successful ? "SUCCESS" : remoteRetrieval === "BLOCKED" ? "BLOCKED" : "UNAVAILABLE";
  const canonicalUrl = successful ? normalizeCanonicalUrl(source.finalUrl || source.url || requestedUrl) : null;
  const contentHash = successful
    ? createHash("sha256").update(JSON.stringify({
      canonicalUrl,
      sourceFingerprint: source.sourceFingerprint || source.contentFingerprint || null,
      evidenceItems: evidenceItems.map(({ id, excerpt, sourceFingerprint }) => ({ id, excerpt, sourceFingerprint })),
    })).digest("hex")
    : null;
  const sourceType = String(source?.sourceType || "").toUpperCase();
  const mappedSourceType = sourceType.includes("DOCUMENT") ? "OFFICIAL_DOCUMENTATION"
    : sourceType.includes("GOVERNMENT") || sourceType.includes("OFFICIAL_INSTITUTION") ? "GOVERNMENT"
      : sourceType.includes("UNIVERSITY") ? "UNIVERSITY"
        : sourceType.includes("RESEARCH") || sourceType.includes("ACADEMIC") ? "RESEARCH"
          : sourceType.includes("DATASET") ? "PUBLIC_DATASET" : "PUBLIC_WEB";
  const blockedReason = retrievalStatus === "BLOCKED" ? "REMOTE_ACCESS_BLOCKED"
    : retrievalStatus === "UNAVAILABLE" ? text(failedCode || responsePayload?.error?.code || "NO_LIVE_SOURCE_EVIDENCE", 120)
      : null;
  return {
    trustCaseId: /^[0-9a-f-]{36}$/i.test(String(responsePayload?.caseId || "")) ? String(responsePayload.caseId).toLowerCase() : null,
    requestedUrl,
    canonicalUrl,
    title: successful ? text(source.title, 500) || null : null,
    publisher: successful ? text(source.publisher || new URL(canonicalUrl).hostname, 300) : null,
    publishedAt: successful ? validDate(source.publishedAt) : null,
    sourceType: mappedSourceType,
    contentHash,
    retrievalStatus,
    blockedReason,
    evidenceItems: successful ? evidenceItems : [],
    providerMetadata: {
      providerStatus: text(source?.providerStatus || layer3?.retrievalStatus || "UNKNOWN", 80),
      trustAnalysis: retrievalStatus === "BLOCKED" ? "N/A" : successful ? "PENDING_EDITORIAL_REVIEW" : "N/A",
      layer3Status: text(layer3?.status || "UNKNOWN", 80),
      layer3RetrievalMode: text(layer3?.retrievalMode || "UNKNOWN", 80),
      layer3SourceCount: Array.isArray(layer3?.sources) ? layer3.sources.length : 0,
      layer3EvidenceCount: Array.isArray(layer3?.evidence) ? layer3.evidence.length : 0,
      directInputSourceFound: Boolean(source),
      directInputRetrievalOutcome: text(source?.retrievalOutcome || "NO_DIRECT_INPUT_SOURCE", 80),
      storedEvidenceCount: evidenceItems.length,
      trustConclusionIsNotQuestionAnswerKey: true,
    },
  };
}

async function logQuestionEvent(client, { questionId, questionVersion, actorId, eventType, payload, idempotencyKey }) {
  await client.query(
    `INSERT INTO private.expert_v5_question_events(question_id, question_version, actor_id, event_type, payload, idempotency_key)
     VALUES ($1, $2, $3, $4, $5::jsonb, $6) ON CONFLICT (idempotency_key) DO NOTHING`,
    [questionId, questionVersion, actorId, eventType, JSON.stringify(payload || {}), idempotencyKey],
  );
}

async function markDependentQuestionsStale(client, sourceId, currentHash, reason) {
  const rows = await client.query(
    `UPDATE private.expert_v5_questions q
        SET status = 'REVALIDATION_REQUIRED', updated_at = now()
       FROM private.expert_v5_source_snapshots old_snapshot
      WHERE old_snapshot.id = q.source_snapshot_id
        AND old_snapshot.source_id = $1
        AND q.status = 'ACTIVE'
        AND ($2::text IS NULL OR q.source_content_hash <> $2::text)
      RETURNING q.question_id, q.question_version`, [sourceId, currentHash],
  );
  for (const row of rows.rows) {
    await logQuestionEvent(client, {
      questionId: row.question_id, questionVersion: Number(row.question_version), actorId: null,
      eventType: "REVALIDATION_REQUIRED", payload: { reason },
      idempotencyKey: `question-revalidate:${row.question_id}:${row.question_version}:${currentHash || reason}`,
    });
  }
}

function normalizedChoices(value) {
  if (!Array.isArray(value) || value.length < 2 || value.length > 6) throw error("EXPERT_V5_CHOICES_INVALID", "Provide between two and six answer options.", 400);
  const choices = value.map((choice, index) => ({
    id: text(choice?.id, 32) || String.fromCharCode(97 + index),
    label: text(choice?.label, 500),
  }));
  if (choices.some((choice) => !choice.label) || new Set(choices.map((choice) => choice.id)).size !== choices.length) {
    throw error("EXPERT_V5_CHOICES_INVALID", "Every answer option needs a unique ID and label.", 400);
  }
  return choices;
}

export class ExpertQuestionBankService {
  static async runTrustInput({ request, principal, securityContext, input, idempotencyKey }) {
    const { runCanonicalTrust } = await import("@/app/api/v1/trust/route.js");
    const trustRequest = new Request(new URL("/api/v1/trust", request.url), {
      method: "POST",
      headers: { "content-type": "application/json", "Idempotency-Key": idempotencyKey },
      body: JSON.stringify({ ...input, version: "v5" }),
      signal: request.signal,
    });
    return runCanonicalTrust(trustRequest, null, principal, securityContext);
  }

  static async listSources() {
    return withStorageErrors(() => transaction(async (client) => {
      const result = await client.query(
        `SELECT id, canonical_host, domain_code, category, fetch_policy, license_notes,
                enabled, max_requests_per_day, min_request_interval_seconds, last_request_at,
                created_by, created_at
           FROM private.expert_v5_source_registry ORDER BY canonical_host ASC`,
      );
      return result.rows.map(sourceDto);
    }));
  }

  static async listSourceSnapshots({ sourceId, limit = 100 } = {}) {
    const id = normalizeUuid(sourceId, "sourceId");
    const boundedLimit = Math.max(1, Math.min(200, Number(limit) || 100));
    return withStorageErrors(() => transaction(async (client) => {
      const result = await client.query(
        `SELECT id, source_id, trust_case_id, requested_url, canonical_url, title, publisher,
                published_at, retrieved_at, source_type, content_hash, retrieval_status,
                blocked_reason, evidence_items, provider_metadata
           FROM private.expert_v5_source_snapshots
          WHERE source_id = $1 ORDER BY retrieved_at DESC LIMIT $2`, [id, boundedLimit],
      );
      return result.rows.map(snapshotDto);
    }));
  }

  static async registerSource({ principal, source }) {
    const actorId = authenticatedUserId(principal);
    if (!source || typeof source !== "object" || Array.isArray(source)) throw error("EXPERT_V5_SOURCE_INVALID", "A source registry entry is required.", 400);
    let canonicalHost = text(source.canonicalHost, 253).toLowerCase().replace(/\.$/, "");
    if (canonicalHost.includes("://") || canonicalHost.includes("/") || canonicalHost.includes("@")) {
      throw error("EXPERT_V5_SOURCE_HOST_INVALID", "Register a hostname only, without path, credentials, or scheme.", 400);
    }
    const validation = validateRemoteUrlSync(`https://${canonicalHost}/`);
    if (!validation.ok || validation.hostname !== canonicalHost) throw error("EXPERT_V5_SOURCE_HOST_INVALID", "The source hostname is invalid or restricted.", 400);
    const domainCode = text(source.domainCode, 80).toUpperCase();
    const category = text(source.category, 80).toUpperCase();
    const licenseNotes = text(source.licenseNotes, 1_000);
    if (!/^[A-Z][A-Z0-9_:-]{1,79}$/.test(domainCode) || !/^[A-Z][A-Z0-9_:-]{1,79}$/.test(category) || licenseNotes.length < 3) {
      throw error("EXPERT_V5_SOURCE_INVALID", "Domain, category, and license/access notes are required.", 400);
    }
    const fetchPolicy = String(source.fetchPolicy || "TRUST_PUBLIC_RETRIEVAL").toUpperCase();
    if (fetchPolicy !== "TRUST_PUBLIC_RETRIEVAL") throw error("EXPERT_V5_FETCH_POLICY_UNSUPPORTED", "V5 currently retrieves sources through canonical Trust public retrieval only.", 422);
    const enabled = source.enabled === true;
    const maxRequestsPerDay = Math.max(1, Math.min(1000, Math.trunc(Number(source.maxRequestsPerDay) || 10)));
    const minRequestIntervalSeconds = Math.max(1, Math.min(86400, Math.trunc(Number(source.minRequestIntervalSeconds) || 60)));
    return withStorageErrors(() => transaction(async (client) => {
      const previousResult = await client.query(
        `SELECT id, domain_code, category, fetch_policy, license_notes, enabled
           FROM private.expert_v5_source_registry WHERE canonical_host = $1 FOR UPDATE`, [canonicalHost],
      );
      const previous = previousResult.rows[0] || null;
      const result = await client.query(
        `INSERT INTO private.expert_v5_source_registry
          (canonical_host, domain_code, category, fetch_policy, license_notes, enabled,
           max_requests_per_day, min_request_interval_seconds, created_by, updated_at)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,now())
         ON CONFLICT (canonical_host) DO UPDATE SET
           domain_code = EXCLUDED.domain_code, category = EXCLUDED.category,
           fetch_policy = EXCLUDED.fetch_policy, license_notes = EXCLUDED.license_notes,
           enabled = EXCLUDED.enabled, max_requests_per_day = EXCLUDED.max_requests_per_day,
           min_request_interval_seconds = EXCLUDED.min_request_interval_seconds, updated_at = now()
         RETURNING id, canonical_host, domain_code, category, fetch_policy, license_notes,
                    enabled, max_requests_per_day, min_request_interval_seconds, last_request_at,
                    created_by, created_at`,
        [canonicalHost, domainCode, category, fetchPolicy, licenseNotes, enabled, maxRequestsPerDay, minRequestIntervalSeconds, actorId],
      );
      const saved = result.rows[0];
      const eventType = !previous ? "REGISTERED"
        : previous.enabled !== enabled ? enabled ? "ENABLED" : "DISABLED"
          : "POLICY_UPDATED";
      await registryEvent(client, {
        sourceId: saved.id, actorId, eventType,
        payload: {
          canonicalHost, domainCode, category, fetchPolicy, enabled,
          maxRequestsPerDay, minRequestIntervalSeconds,
          licenseNotesHash: createHash("sha256").update(licenseNotes).digest("hex"),
        },
      });
      if (previous && String(previous.domain_code).toUpperCase() !== domainCode) {
        await markDependentQuestionsStale(client, saved.id, null, "SOURCE_DOMAIN_POLICY_CHANGED");
      }
      return sourceDto(saved);
    }));
  }

  static async ingestSource({ principal, registryId, url, idempotencyKey, trustRunner }) {
    authenticatedUserId(principal);
    const sourceId = normalizeUuid(registryId, "registryId");
    const ingestKey = text(idempotencyKey, 120);
    if (!/^[A-Za-z0-9._:-]{1,120}$/.test(ingestKey)) throw error("EXPERT_V5_INGEST_IDEMPOTENCY_REQUIRED", "A valid Idempotency-Key of at most 120 characters is required for source ingestion.", 400);
    const requestedUrl = normalizeCanonicalUrl(url);
    const durableIngestionKey = `source-ingest:${sourceId}:${ingestKey}`;
    const prepared = await withStorageErrors(() => transaction(async (client) => {
      const leaseSecondsResult = await client.query(
        `SELECT COALESCE((config_value #>> '{}')::integer, 180) AS seconds
           FROM private.expert_v5_config WHERE config_key = 'room_ingestion_lease_seconds'`,
      );
      const leaseSeconds = Math.max(60, Math.min(600, Number(leaseSecondsResult.rows[0]?.seconds || 180)));
      const reservation = await client.query(
        `INSERT INTO private.expert_v5_ingestion_requests
          (ingestion_key, source_id, requested_url, state, lease_expires_at)
         VALUES ($1,$2,$3,'PROCESSING',now() + ($4::text || ' seconds')::interval)
         ON CONFLICT (ingestion_key) DO NOTHING RETURNING ingestion_key`, [durableIngestionKey, sourceId, requestedUrl, leaseSeconds],
      );
      const requestResult = await client.query(
        `SELECT source_id, requested_url, state, lease_expires_at, snapshot_id
           FROM private.expert_v5_ingestion_requests WHERE ingestion_key = $1 FOR UPDATE`, [durableIngestionKey],
      );
      const requestRow = requestResult.rows[0];
      if (!requestRow || String(requestRow.source_id) !== sourceId || requestRow.requested_url !== requestedUrl) {
        throw error("EXPERT_V5_INGEST_IDEMPOTENCY_CONFLICT", "This Idempotency-Key is bound to another source request.", 409);
      }
      if (requestRow.state === "COMPLETED" && requestRow.snapshot_id) {
        const existing = await client.query(`SELECT * FROM private.expert_v5_source_snapshots WHERE id = $1`, [requestRow.snapshot_id]);
        if (existing.rows[0]) return { existing: snapshotDto(existing.rows[0]) };
      }
      if (requestRow.state === "PROCESSING" && new Date(requestRow.lease_expires_at).getTime() > Date.now()) {
        // The first request has reserved this key and is still talking to Trust.
        // A concurrent retry must not create a second remote fetch.
        const replay = await client.query(
          `SELECT * FROM private.expert_v5_source_snapshots WHERE ingestion_key = $1`, [durableIngestionKey],
        );
        if (replay.rows[0]) return { existing: snapshotDto(replay.rows[0]) };
        if (!reservation.rows[0]) {
          throw error("EXPERT_V5_INGEST_IN_PROGRESS", "This source request is already being retrieved. Retry after the current request finishes.", 409);
        }
      } else {
        await client.query(
          `UPDATE private.expert_v5_ingestion_requests SET state = 'PROCESSING', snapshot_id = NULL,
             lease_expires_at = now() + ($2::text || ' seconds')::interval, updated_at = now()
           WHERE ingestion_key = $1`, [durableIngestionKey, leaseSeconds],
        );
      }
      const selected = await client.query(
        `SELECT id, canonical_host, domain_code, enabled, max_requests_per_day,
                min_request_interval_seconds, requests_in_window, window_started_at, last_request_at
           FROM private.expert_v5_source_registry WHERE id = $1 FOR UPDATE`, [sourceId],
      );
      const registry = selected.rows[0];
      if (!registry || registry.enabled !== true) throw error("EXPERT_V5_SOURCE_NOT_APPROVED", "This source is not enabled in the approved source registry.", 403);
      const host = new URL(requestedUrl).hostname.toLowerCase();
      if (host !== String(registry.canonical_host).toLowerCase()) throw error("EXPERT_V5_SOURCE_HOST_MISMATCH", "The URL host does not match the approved registry entry.", 403);
      const budget = await client.query(
        `SELECT now() >= COALESCE($1::timestamptz, '-infinity'::timestamptz) + ($2::text || ' seconds')::interval AS interval_elapsed,
                $3::timestamptz <= now() - interval '24 hours' AS window_expired`,
        [registry.last_request_at, registry.min_request_interval_seconds, registry.window_started_at],
      );
      const newWindow = budget.rows[0]?.window_expired === true;
      const requestCount = newWindow ? 0 : Number(registry.requests_in_window || 0);
      if (requestCount >= Number(registry.max_requests_per_day)) throw error("EXPERT_V5_SOURCE_RATE_LIMITED", "The registered source has reached its retrieval limit.", 429);
      if (!newWindow && budget.rows[0]?.interval_elapsed !== true) throw error("EXPERT_V5_SOURCE_RATE_LIMITED", "Wait before requesting this source again.", 429);
      await client.query(
        `UPDATE private.expert_v5_source_registry
            SET requests_in_window = $2, window_started_at = CASE WHEN $3 THEN now() ELSE window_started_at END,
                last_request_at = now(), updated_at = now()
          WHERE id = $1`, [sourceId, requestCount + 1, newWindow],
      );
      return { registry: { ...registry, requests_in_window: requestCount + 1 } };
    }));
    if (prepared.existing) return { snapshot: prepared.existing, idempotent: true };

    let responsePayload = null;
    let responseStatus = 503;
    let failedCode = null;
    try {
      const response = await trustRunner({
        type: "url", content: requestedUrl, metadata: { url: requestedUrl }, version: "v5",
      }, `expert-v5-source:${sourceId}:${ingestKey}`);
      responseStatus = response.status;
      responsePayload = await response.json();
      if (!response.ok || responsePayload?.success !== true) failedCode = responsePayload?.error?.code || `TRUST_HTTP_${response.status}`;
    } catch (caught) {
      failedCode = caught?.code || "TRUST_PIPELINE_UNAVAILABLE";
    }
    const snapshot = toSnapshotResult({ requestedUrl, responsePayload, responseStatus, failedCode });

    return withStorageErrors(() => transaction(async (client) => {
      const result = await client.query(
        `INSERT INTO private.expert_v5_source_snapshots
          (source_id, trust_case_id, requested_url, canonical_url, title, publisher, published_at,
           source_type, content_hash, retrieval_status, blocked_reason, ingestion_key,
           evidence_items, provider_metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13::jsonb,$14::jsonb)
         ON CONFLICT DO NOTHING
         RETURNING *`,
          [sourceId, snapshot.trustCaseId, snapshot.requestedUrl, snapshot.canonicalUrl, snapshot.title, snapshot.publisher,
          snapshot.publishedAt, snapshot.sourceType, snapshot.contentHash, snapshot.retrievalStatus,
          snapshot.blockedReason, durableIngestionKey,
          JSON.stringify(snapshot.evidenceItems), JSON.stringify(snapshot.providerMetadata)],
      );
      let stored = result.rows[0];
      if (!stored) {
        const replay = await client.query(
          `SELECT * FROM private.expert_v5_source_snapshots
            WHERE ingestion_key = $1 OR ($2::text IS NOT NULL AND source_id = $3 AND content_hash = $2)
            ORDER BY (ingestion_key = $1) DESC LIMIT 1`,
          [durableIngestionKey, snapshot.contentHash, sourceId],
        );
        stored = replay.rows[0];
      }
      if (!stored) throw error("EXPERT_V5_SNAPSHOT_WRITE_FAILED", "The source retrieval result could not be stored.", 503);
      await client.query(
        `UPDATE private.expert_v5_ingestion_requests
            SET state = 'COMPLETED', snapshot_id = $2, updated_at = now()
          WHERE ingestion_key = $1`, [durableIngestionKey, stored.id],
      );
      await registryEvent(client, {
        sourceId, actorId: authenticatedUserId(principal),
        eventType: snapshot.retrievalStatus === "SUCCESS" ? "INGEST_SUCCEEDED"
          : snapshot.retrievalStatus === "BLOCKED" ? "INGEST_BLOCKED" : "INGEST_UNAVAILABLE",
        payload: {
          requestedUrl: snapshot.requestedUrl,
          retrievalStatus: snapshot.retrievalStatus,
          canonicalUrl: snapshot.canonicalUrl,
          contentHash: snapshot.contentHash,
          evidenceCount: snapshot.evidenceItems.length,
          blockedReason: snapshot.blockedReason,
        },
      });
      await markDependentQuestionsStale(client, sourceId, snapshot.retrievalStatus === "SUCCESS" ? snapshot.contentHash : null,
        snapshot.retrievalStatus === "SUCCESS" ? "SOURCE_CONTENT_CHANGED" : snapshot.blockedReason || "SOURCE_UNAVAILABLE");
      return { snapshot: snapshotDto(stored), idempotent: stored.ingestion_key !== durableIngestionKey };
    }));
  }

  static async listQuestions({ status = null, limit = 100, scenarioId = null, questionId = null, questionVersion = null, questionType = null, modality = null } = {}) {
    const allowedStatus = new Set(["DRAFT", "ACTIVE", "REVALIDATION_REQUIRED", "RETIRED"]);
    const filter = allowedStatus.has(String(status || "").toUpperCase()) ? String(status).toUpperCase() : null;
    const boundedLimit = Math.max(1, Math.min(200, Number(limit) || 100));
    const scenarioFilter = scenarioId ? normalizeUuid(scenarioId, "scenarioId") : null;
    const questionFilter = questionId ? normalizeUuid(questionId, "questionId") : null;
    const versionFilter = Number.isInteger(Number(questionVersion)) && Number(questionVersion) > 0 ? Number(questionVersion) : null;
    const typeFilter = EXPERT_V5_QUESTION_TYPES.includes(String(questionType || "").toUpperCase()) ? String(questionType).toUpperCase() : null;
    const modalityFilter = EXPERT_V5_MODALITIES.includes(String(modality || "").toUpperCase()) ? String(modality).toUpperCase() : null;
    return withStorageErrors(() => transaction(async (client) => {
      const result = await client.query(
        `SELECT q.question_id, q.question_version, q.source_snapshot_id, q.scenario_id, q.modality,
                q.domain_code,
                q.question_type, q.difficulty, q.prompt, q.choices, q.answer_key,
                q.explanation, q.evidence_refs, q.claim_refs, q.rubric, q.skills, q.limitations,
                q.generation_provenance, q.validation_status, q.difficulty_features, q.source_content_hash,
                q.status, q.valid_until, q.editorial_reviewer_id, q.reviewed_at,
                q.created_by, q.created_at, s.canonical_url, s.title AS source_title,
                s.publisher, s.retrieved_at, s.retrieval_status, sc.title AS scenario_title,
                sc.status AS scenario_status, sc.input_fingerprint AS scenario_fingerprint
           FROM private.expert_v5_questions q
           LEFT JOIN private.expert_v5_source_snapshots s ON s.id = q.source_snapshot_id
           LEFT JOIN private.expert_v5_scenarios sc ON sc.scenario_id = q.scenario_id
           WHERE ($1::text IS NULL OR q.status = $1)
             AND ($2::uuid IS NULL OR q.scenario_id = $2)
             AND ($3::uuid IS NULL OR q.question_id = $3)
             AND ($4::integer IS NULL OR q.question_version = $4)
             AND ($5::text IS NULL OR q.question_type = $5)
             AND ($6::text IS NULL OR q.modality = $6)
           ORDER BY q.created_at DESC, q.question_id, q.question_version DESC LIMIT $7`,
        [filter, scenarioFilter, questionFilter, versionFilter, typeFilter, modalityFilter, boundedLimit],
      );
      return result.rows.map((row) => ({
        questionId: row.question_id,
        questionVersion: Number(row.question_version),
        sourceSnapshotId: row.source_snapshot_id,
        scenarioId: row.scenario_id || null,
        modality: row.modality || null,
        scenario: row.scenario_id ? { title: row.scenario_title, status: row.scenario_status, inputFingerprint: row.scenario_fingerprint } : null,
        domainCode: row.domain_code,
        questionType: row.question_type,
        difficulty: row.difficulty,
        prompt: row.prompt,
        choices: parseJson(row.choices, []),
        answerKey: parseJson(row.answer_key, row.answer_key),
        explanation: row.explanation,
        evidenceRefs: parseJson(row.evidence_refs, []),
        claimRefs: parseJson(row.claim_refs, []),
        rubric: parseJson(row.rubric, {}),
        skills: parseJson(row.skills, []),
        limitations: parseJson(row.limitations, []),
        generationProvenance: parseJson(row.generation_provenance, {}),
        validationStatus: row.validation_status || "PENDING",
        difficultyFeatures: parseJson(row.difficulty_features, {}),
        sourceContentHash: row.source_content_hash,
        status: row.status,
        validUntil: validDate(row.valid_until),
        editorialReviewerId: row.editorial_reviewer_id ? String(row.editorial_reviewer_id) : null,
        reviewedAt: validDate(row.reviewed_at),
        createdBy: row.created_by ? String(row.created_by) : null,
        createdAt: validDate(row.created_at),
        source: { canonicalUrl: row.canonical_url, title: row.source_title, publisher: row.publisher, retrievedAt: validDate(row.retrieved_at), retrievalStatus: row.retrieval_status },
      }));
    }));
  }

  static async createQuestionDraft({ principal, question }) {
    const actorId = authenticatedUserId(principal);
    if (!question || typeof question !== "object" || Array.isArray(question)) throw error("EXPERT_V5_QUESTION_INVALID", "Question input is required.", 400);
    const snapshotId = normalizeUuid(question.sourceSnapshotId, "sourceSnapshotId");
    const questionType = text(question.questionType, 40).toUpperCase();
    if (!EXPERT_V5_QUESTION_TYPES.includes(questionType)) throw error("EXPERT_V5_QUESTION_TYPE_UNSUPPORTED", "This answer type has no deterministic evaluator.", 400);
    const prompt = text(question.prompt, 1200);
    const choices = normalizedChoices(question.choices);
    const answerValues = [...new Set((Array.isArray(question.answerKey) ? question.answerKey : []).map((id) => text(id, 32)))];
    const answerKey = ["MULTIPLE_CHOICE", "MULTI_SELECT", "SOURCE_RANKING"].includes(questionType)
      ? questionType === "SOURCE_RANKING" ? answerValues : answerValues.sort()
      : questionType === "TRUE_FALSE" ? text(question.answerKey, 32).toUpperCase() : text(question.answerKey, 32);
    const explanation = text(question.explanation, 2400);
    const evidenceIds = Array.isArray(question.evidenceIds) ? [...new Set(question.evidenceIds.map((id) => text(id, 160)).filter(Boolean))].slice(0, 10) : [];
    const ambiguity = Math.max(0, Math.min(2, Math.trunc(Number(question.difficultyReview?.ambiguity) || 0)));
    const temporalReasoning = question.difficultyReview?.temporalReasoning === true;

    return withStorageErrors(() => transaction(async (client) => {
      const result = await client.query(
        `SELECT s.id, s.content_hash, s.retrieval_status, s.canonical_url, s.title,
                s.publisher, s.retrieved_at, s.evidence_items, r.domain_code,
                r.enabled AS registry_enabled
           FROM private.expert_v5_source_snapshots s
           JOIN private.expert_v5_source_registry r ON r.id = s.source_id
          WHERE s.id = $1`, [snapshotId],
      );
      const source = result.rows[0];
      if (!source || source.retrieval_status !== "SUCCESS" || source.registry_enabled !== true) {
        throw error("EXPERT_V5_SOURCE_NOT_QUESTIONABLE", "Only successfully retrieved sources from an enabled registry entry can support questions.", 409);
      }
      const sourceEvidence = Array.isArray(source.evidence_items) ? source.evidence_items : parseJson(source.evidence_items, []);
      const evidenceRefs = evidenceIds.map((id) => {
        const item = sourceEvidence.find((entry) => String(entry?.id) === id);
        if (!item) throw error("EXPERT_V5_EVIDENCE_REF_INVALID", "Every question evidence reference must point to a stored retrieval excerpt.", 400);
        return { evidenceId: id, excerpt: text(item.excerpt, 400), sourceUrl: text(item.sourceUrl, 2048) };
      });
      const difficultyFeatures = { sourceCount: 1, evidenceCount: evidenceRefs.length, ambiguity, temporalReasoning };
      const difficulty = deriveQuestionDifficulty(difficultyFeatures);
      const questionId = randomUUID();
      const questionVersion = 1;
      const saved = await client.query(
        `INSERT INTO private.expert_v5_questions
          (question_id, question_version, source_snapshot_id, domain_code, question_type,
           difficulty, prompt, choices, answer_key, explanation, evidence_refs,
           difficulty_features, source_content_hash, status, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,$9::jsonb,$10,$11::jsonb,$12::jsonb,$13,'DRAFT',$14)
         RETURNING question_id, question_version, domain_code, question_type, difficulty, prompt, status, created_at`,
        [questionId, questionVersion, source.id, source.domain_code, questionType, difficulty,
          prompt, JSON.stringify(choices), JSON.stringify(answerKey), explanation,
          JSON.stringify(evidenceRefs), JSON.stringify(difficultyFeatures), source.content_hash, actorId],
      );
      await logQuestionEvent(client, {
        questionId, questionVersion, actorId, eventType: "DRAFT_CREATED",
        payload: { sourceSnapshotId: snapshotId, contentHash: source.content_hash, difficulty },
        idempotencyKey: `question-draft:${questionId}:1`,
      });
      return { ...saved.rows[0], questionVersion: Number(saved.rows[0].question_version), difficultyFeatures };
    }));
  }

  static async createQuestionVersion({ principal, questionId, questionVersion = 1, changes = {} }) {
    const actorId = authenticatedUserId(principal);
    const id = normalizeUuid(questionId, "questionId");
    const version = Math.max(1, Math.trunc(Number(questionVersion) || 1));
    if (!changes || typeof changes !== "object" || Array.isArray(changes)) {
      throw error("EXPERT_V5_QUESTION_VERSION_INVALID", "Version changes must be an object.", 400);
    }
    return withStorageErrors(() => transaction(async (client) => {
      const selected = await client.query(
        `SELECT * FROM private.expert_v5_questions WHERE question_id = $1 AND question_version = $2 FOR UPDATE`, [id, version],
      );
      const old = selected.rows[0];
      if (!old) throw error("EXPERT_V5_QUESTION_NOT_FOUND", "Question version was not found.", 404);
      if (old.status === "RETIRED") throw error("EXPERT_V5_QUESTION_VERSION_RETIRED", "A retired question version cannot be used as an edit base.", 409);
      const questionType = text(changes.questionType ?? old.question_type, 40).toUpperCase();
      if (!EXPERT_V5_QUESTION_TYPES.includes(questionType)) throw error("EXPERT_V5_QUESTION_TYPE_UNSUPPORTED", "This answer type has no deterministic evaluator.", 400);
      const prompt = text(changes.prompt ?? old.prompt, 1200);
      const choices = normalizedChoices(changes.choices ?? parseJson(old.choices, []));
      const rawAnswer = changes.answerKey === undefined ? parseJson(old.answer_key, old.answer_key) : changes.answerKey;
      const answerKey = ["MULTIPLE_CHOICE", "MULTI_SELECT", "SOURCE_RANKING"].includes(questionType)
        ? [...new Set((Array.isArray(rawAnswer) ? rawAnswer : []).map((value) => text(value, 32)).filter(Boolean))]
          .sort((left, right) => questionType === "SOURCE_RANKING" ? (Array.isArray(rawAnswer) ? rawAnswer.indexOf(left) - rawAnswer.indexOf(right) : 0) : left.localeCompare(right))
        : questionType === "TRUE_FALSE" ? text(rawAnswer, 32).toUpperCase() : text(rawAnswer, 32);
      const explanation = text(changes.explanation ?? old.explanation, 2400);
      const evidenceRefs = changes.evidenceRefs === undefined ? parseJson(old.evidence_refs, []) : changes.evidenceRefs;
      const claimRefs = changes.claimRefs === undefined ? parseJson(old.claim_refs, []) : changes.claimRefs;
      const rubric = changes.rubric === undefined ? parseJson(old.rubric, {}) : changes.rubric;
      const skills = changes.skills === undefined ? parseJson(old.skills, []) : changes.skills;
      const limitations = changes.limitations === undefined ? parseJson(old.limitations, []) : changes.limitations;
      const difficulty = text(changes.difficulty ?? old.difficulty, 16).toUpperCase();
      if (!EXPERT_V5_DIFFICULTIES.includes(difficulty)) throw error("EXPERT_V5_DIFFICULTY_INVALID", "Difficulty must be EASY, MEDIUM, or HARD.", 400);
      if (!Array.isArray(evidenceRefs) || !Array.isArray(claimRefs) || !Array.isArray(skills) || !Array.isArray(limitations)
        || !rubric || typeof rubric !== "object" || Array.isArray(rubric)) {
        throw error("EXPERT_V5_QUESTION_VERSION_INVALID", "Version evidence, claims, rubric, skills, and limitations must use their canonical shapes.", 400);
      }
      const versionResult = await client.query(`SELECT COALESCE(max(question_version), 0)::integer AS latest FROM private.expert_v5_questions WHERE question_id = $1`, [id]);
      const nextVersion = Number(versionResult.rows[0]?.latest || 0) + 1;
      const promptHash = createHash("sha256").update(normalizeQuestionText(prompt)).digest("hex");
      const provenance = {
        ...parseJson(old.generation_provenance, {}),
        editedBy: actorId,
        editedAt: new Date().toISOString(),
        editedFromVersion: version,
        generationIsNotEditorialApproval: true,
      };
      const inserted = await client.query(
        `INSERT INTO private.expert_v5_questions
          (question_id, question_version, source_snapshot_id, scenario_id, modality, domain_code,
           question_type, difficulty, prompt, choices, answer_key, explanation, evidence_refs,
           difficulty_features, source_content_hash, status, created_by, claim_refs, rubric,
           skills, limitations, generation_provenance, validation_status, normalized_prompt_hash,
           source_claim_fingerprint, semantic_fingerprint, generation_run_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,$11::jsonb,$12,$13::jsonb,$14::jsonb,$15,'DRAFT',$16,$17::jsonb,$18::jsonb,$19::jsonb,$20::jsonb,$21::jsonb,'PENDING',$22,$23,$24,$25)
         RETURNING question_id, question_version, question_type, difficulty, status, created_at`,
        [id, nextVersion, old.source_snapshot_id, old.scenario_id, old.modality, old.domain_code,
          questionType, difficulty, prompt, JSON.stringify(choices), JSON.stringify(answerKey), explanation,
          JSON.stringify(evidenceRefs), JSON.stringify(parseJson(old.difficulty_features, {})), old.source_content_hash,
          actorId, JSON.stringify(claimRefs), JSON.stringify(rubric), JSON.stringify(skills), JSON.stringify(limitations),
          JSON.stringify(provenance), promptHash, old.source_claim_fingerprint || null, old.semantic_fingerprint || null,
          old.generation_run_id || null],
      );
      await client.query(
        `INSERT INTO private.expert_v5_question_events(question_id, question_version, actor_id, event_type, payload, idempotency_key)
         VALUES ($1,$2,$3,'VERSION_CREATED',$4::jsonb,$5) ON CONFLICT (idempotency_key) DO NOTHING`,
        [id, nextVersion, actorId, JSON.stringify({ previousVersion: version, promptHash, sourceContentHash: old.source_content_hash }), `question-version:${id}:${nextVersion}`],
      );
      return {
        questionId: inserted.rows[0].question_id,
        questionVersion: Number(inserted.rows[0].question_version),
        questionType: inserted.rows[0].question_type,
        difficulty: inserted.rows[0].difficulty,
        status: inserted.rows[0].status,
        validationStatus: "PENDING",
      };
    }));
  }

  static async activateQuestion({ principal, questionId, questionVersion = 1, reviewChecks }) {
    const actorId = authenticatedUserId(principal);
    const id = normalizeUuid(questionId, "questionId");
    const version = Math.max(1, Math.trunc(Number(questionVersion) || 1));
    return withStorageErrors(() => transaction(async (client) => {
      const result = await client.query(
        `SELECT q.question_id, q.question_version, q.source_snapshot_id, q.scenario_id, q.modality,
                q.domain_code,
                q.question_type, q.difficulty, q.prompt, q.choices, q.answer_key,
                q.explanation, q.evidence_refs, q.source_content_hash, q.status,
                s.canonical_url, s.content_hash, s.retrieval_status, s.evidence_items, s.retrieved_at,
                r.enabled AS registry_enabled,
                sc.status AS scenario_status, sc.input_fingerprint AS scenario_fingerprint
           FROM private.expert_v5_questions q
           LEFT JOIN private.expert_v5_source_snapshots s ON s.id = q.source_snapshot_id
           LEFT JOIN private.expert_v5_source_registry r ON r.id = s.source_id
           LEFT JOIN private.expert_v5_scenarios sc ON sc.scenario_id = q.scenario_id
          WHERE q.question_id = $1 AND q.question_version = $2 FOR UPDATE OF q`, [id, version],
      );
      const row = result.rows[0];
      if (!row) throw error("EXPERT_V5_QUESTION_NOT_FOUND", "Question draft was not found.", 404);
      if (!["DRAFT", "REVALIDATION_REQUIRED"].includes(row.status)) {
        throw error("EXPERT_V5_QUESTION_STATE_INVALID", "Only a draft or revalidation-required question can be activated.", 409);
      }
      const sourceEvidence = Array.isArray(row.evidence_items) ? row.evidence_items : parseJson(row.evidence_items, []);
      const sourceSnapshot = {
        canonicalUrl: row.canonical_url,
        contentHash: row.content_hash,
        retrievalStatus: row.retrieval_status,
        remoteRetrieval: row.retrieval_status === "SUCCESS" ? "SUCCESS" : row.retrieval_status,
        retrievedAt: row.retrieved_at,
        evidenceItems: sourceEvidence,
      };
      if (row.scenario_id) {
        const scenarioLinks = await client.query(
          `SELECT sc.status, sc.input_fingerprint,
                  private.expert_v5_scenario_is_current(sc.scenario_id) AS is_current,
                  coalesce((SELECT array_agg(claim_id::text) FROM private.expert_v5_scenario_claims WHERE scenario_id = sc.scenario_id), '{}') AS claim_ids,
                  coalesce((SELECT array_agg(evidence_id::text) FROM private.expert_v5_scenario_evidence WHERE scenario_id = sc.scenario_id), '{}') AS evidence_ids,
                  coalesce((
                    SELECT jsonb_object_agg(edges.claim_id::text, to_jsonb(edges.evidence_ids))
                      FROM (
                        SELECT claim_links.claim_id, array_agg(DISTINCT cs.evidence_id::text) AS evidence_ids
                          FROM private.expert_v5_scenario_claims claim_links
                          JOIN private.expert_v5_scenario_inputs inputs
                            ON inputs.scenario_id = claim_links.scenario_id AND inputs.input_index = claim_links.input_index
                          JOIN public.claim_sources cs ON cs.claim_id = claim_links.claim_id
                          JOIN public.evidence ev ON ev.id = cs.evidence_id AND ev.case_id = inputs.trust_case_id
                         WHERE claim_links.scenario_id = sc.scenario_id
                         GROUP BY claim_links.claim_id
                      ) edges
                  ), '{}'::jsonb) AS claim_evidence_map,
                  EXISTS (
                    SELECT 1 FROM private.expert_v5_scenario_inputs si
                    LEFT JOIN LATERAL (
                      SELECT revision FROM public.trust_case_revisions WHERE case_id = si.trust_case_id ORDER BY revision DESC LIMIT 1
                    ) latest ON true
                    LEFT JOIN private.expert_v5_source_snapshots snap ON snap.id = si.source_snapshot_id
                    LEFT JOIN private.expert_v5_source_registry registry ON registry.id = snap.source_id
                    LEFT JOIN LATERAL (
                      SELECT content_hash FROM private.expert_v5_source_snapshots current
                       WHERE current.source_id = snap.source_id
                       ORDER BY current.retrieved_at DESC LIMIT 1
                    ) current_snapshot ON true
                    WHERE si.scenario_id = sc.scenario_id AND (
                      si.case_revision <> coalesce(latest.revision, 0)
                      OR (si.source_snapshot_id IS NOT NULL AND (
                        snap.retrieval_status <> 'SUCCESS' OR registry.enabled IS DISTINCT FROM true
                        OR snap.content_hash <> current_snapshot.content_hash
                      ))
                    )
                  ) AS stale
             FROM private.expert_v5_scenarios sc WHERE sc.scenario_id = $1 FOR UPDATE`, [row.scenario_id],
        );
        const scenarioState = scenarioLinks.rows[0];
        const scenarioNotCurrent = scenarioState?.is_current !== true || scenarioState?.stale === true;
        if (scenarioNotCurrent) {
          await client.query(`UPDATE private.expert_v5_scenarios SET status = 'STALE', updated_at = now() WHERE scenario_id = $1`, [row.scenario_id]);
          await client.query(`UPDATE private.expert_v5_questions SET status = 'REVALIDATION_REQUIRED', updated_at = now() WHERE scenario_id = $1 AND status = 'ACTIVE'`, [row.scenario_id]);
        }
        sourceSnapshot.status = scenarioNotCurrent ? "STALE" : scenarioState?.status;
        sourceSnapshot.packageDigest = scenarioState?.input_fingerprint;
        sourceSnapshot.claimIds = Array.isArray(scenarioState?.claim_ids) ? scenarioState.claim_ids : [];
        sourceSnapshot.evidenceItems = (Array.isArray(scenarioState?.evidence_ids) ? scenarioState.evidence_ids : []).map((id) => ({ id }));
        sourceSnapshot.claimEvidenceMap = parseJson(scenarioState?.claim_evidence_map, {});
      }
      const validity = await client.query(`SELECT COALESCE((config_value #>> '{}')::integer, 30) AS days FROM private.expert_v5_config WHERE config_key = 'question_validity_days'`);
      const sourceFresh = row.scenario_id
        ? sourceSnapshot.status === "READY" && row.source_content_hash === sourceSnapshot.packageDigest
        : row.registry_enabled === true && canServeQuestion({ status: row.retrieval_status === "SUCCESS" ? "ACTIVE" : "BLOCKED", retrievedAt: row.retrieved_at, validityDays: Number(validity.rows[0]?.days || 30) }) && row.source_content_hash === row.content_hash;
      const validation = sourceFresh
        ? validateQuestionActivation({
          question: {
            scenarioId: row.scenario_id,
            modality: row.modality,
            questionType: row.question_type,
            prompt: row.prompt,
            choices: parseJson(row.choices, []),
            answerKey: parseJson(row.answer_key, row.answer_key),
            explanation: row.explanation,
            difficulty: row.difficulty,
            domainCode: row.domain_code,
            evidenceRefs: parseJson(row.evidence_refs, []),
            claimRefs: parseJson(row.claim_refs, []),
            correctAnswerEvidenceIds: parseJson(row.rubric, {}).correctChoiceEvidenceIds,
            uncertaintyMode: parseJson(row.rubric, {}).uncertaintyMode || parseJson(row.generation_provenance, {}).uncertaintyMode,
          },
          sourceSnapshot,
          reviewerId: actorId,
          reviewChecks,
        })
        : { valid: false, status: "REVALIDATION_REQUIRED", reasons: [row.scenario_id ? "SCENARIO_NOT_CURRENT" : "SOURCE_NOT_CURRENT_OR_DISABLED"] };
      if (!validation.valid) {
        const needsRevalidation = validation.reasons.includes("SOURCE_NOT_RETRIEVED")
          || validation.reasons.includes("SOURCE_NOT_CURRENT_OR_DISABLED")
          || validation.reasons.includes("SCENARIO_NOT_CURRENT")
          || validation.reasons.includes("SCENARIO_NOT_READY");
        if (needsRevalidation) {
          await client.query(
            `UPDATE private.expert_v5_questions SET status = 'REVALIDATION_REQUIRED', updated_at = now()
              WHERE question_id = $1 AND question_version = $2`, [id, version],
          );
          await logQuestionEvent(client, {
            questionId: id, questionVersion: version, actorId,
            eventType: "REVALIDATION_REQUIRED", payload: { reasons: validation.reasons },
            idempotencyKey: `question-revalidate:${id}:${version}:activation`,
          });
        }
        return { activated: false, status: needsRevalidation ? "REVALIDATION_REQUIRED" : "DRAFT", reasons: validation.reasons };
      }
      await client.query(
        `UPDATE private.expert_v5_questions
            SET status = 'ACTIVE', editorial_reviewer_id = $3, reviewed_at = now(), updated_at = now()
          WHERE question_id = $1 AND question_version = $2`, [id, version, actorId],
      );
      if (row.scenario_id) {
        await client.query(
          `UPDATE private.expert_v5_scenarios SET status = 'READY', updated_at = now() WHERE scenario_id = $1`, [row.scenario_id],
        );
      }
      await logQuestionEvent(client, {
        questionId: id, questionVersion: version, actorId, eventType: "ACTIVATED",
        payload: {
          sourceSnapshotId: row.source_snapshot_id,
          contentHash: row.content_hash,
          difficulty: row.difficulty,
          reviewChecks: {
            sourceSupport: reviewChecks?.sourceSupport === true,
            distractorsReviewed: reviewChecks?.distractorsReviewed === true,
            domainFit: reviewChecks?.domainFit === true,
            difficultyConfirmed: reviewChecks?.difficultyConfirmed === true,
            groundingConfirmed: reviewChecks?.groundingConfirmed === true,
            ambiguityReviewed: reviewChecks?.ambiguityReviewed === true,
          },
        },
        idempotencyKey: `question-activated:${id}:${version}`,
      });
      return { activated: true, status: "ACTIVE", questionId: id, questionVersion: version, difficulty: row.difficulty, domainCode: row.domain_code };
    }));
  }

  static async ingestFromTrust({ request, principal, securityContext, registryId, url, idempotencyKey }) {
    const target = normalizeCanonicalUrl(url);
    const remoteGuard = await validateRemoteUrl(target, { resolveDns: true });
    if (!remoteGuard.ok) throw error("EXPERT_V5_REMOTE_RETRIEVAL_BLOCKED", "The URL failed safe public retrieval checks and was not fetched.", 422);
    return this.ingestSource({
      principal, registryId, url: target, idempotencyKey,
      trustRunner: (input, trustKey) => this.runTrustInput({
        request, principal, securityContext, input,
        idempotencyKey: `expert-v5-source:${createHash("sha256").update(trustKey).digest("hex")}`,
      }),
    });
  }
}
