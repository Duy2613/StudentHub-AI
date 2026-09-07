import crypto from "node:crypto";
import { getPostgresPool } from "../database/PostgresPool.js";

export const REPORT_TYPES = Object.freeze(["TRUST_CASE"]);
export const REPORT_TEMPLATE_VERSION = "trust-case.report.v1";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{1,160}$/;

export class ReportServiceError extends Error {
  constructor(code, message, statusCode = 400) {
    super(message);
    this.name = "ReportServiceError";
    this.code = code;
    this.statusCode = statusCode;
  }
}

function uuid(value, label) {
  const normalized = String(value || "").trim();
  if (!UUID_PATTERN.test(normalized)) throw new ReportServiceError(`${label.toUpperCase()}_UUID_REQUIRED`, "A durable report identity is required.", 400);
  return normalized.toLowerCase();
}

function idempotencyKey(value) {
  if (value === null || value === undefined || value === "") return null;
  const normalized = String(value).trim();
  if (!IDEMPOTENCY_PATTERN.test(normalized)) throw new ReportServiceError("REPORT_IDEMPOTENCY_KEY_INVALID", "The report idempotency key is invalid.", 400);
  return normalized;
}

function canonicalValue(value) {
  if (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (value && typeof value === "object") return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonicalValue(value[key])]));
  return null;
}

function digest(value) {
  return crypto.createHash("sha256").update(JSON.stringify(canonicalValue(value))).digest();
}

function digestHex(value) {
  if (Buffer.isBuffer(value)) return value.toString("hex");
  if (value instanceof Uint8Array) return Buffer.from(value).toString("hex");
  if (typeof value === "string" && /^\\x[0-9a-f]+$/i.test(value)) return value.slice(2).toLowerCase();
  if (typeof value === "string" && /^[0-9a-f]+$/i.test(value)) return value.toLowerCase();
  return null;
}

function verifiedArtifactDocument(row, artifact) {
  const document = parseJson(artifact?.document, null);
  const storedHash = digestHex(row?.artifact_hash);
  const declaredHash = typeof document?.artifactHash === "string" ? document.artifactHash.toLowerCase() : null;
  if (!document || !storedHash || declaredHash !== storedHash) {
    throw new ReportServiceError("REPORT_ARTIFACT_INTEGRITY_FAILED", "The stored report artifact failed its integrity check.", 503);
  }
  const { artifactHash: _artifactHash, ...documentWithoutHash } = document;
  const computedHash = digest(documentWithoutHash).toString("hex");
  if (computedHash !== storedHash) {
    throw new ReportServiceError("REPORT_ARTIFACT_INTEGRITY_FAILED", "The stored report artifact failed its integrity check.", 503);
  }
  return document;
}

function sameDigest(left, right) {
  const leftHex = digestHex(left);
  const rightHex = digestHex(right);
  if (!leftHex || !rightHex || leftHex.length !== rightHex.length) return false;
  const a = Buffer.from(leftHex, "hex");
  const b = Buffer.from(rightHex, "hex");
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function parseJson(value, fallback) {
  if (value && typeof value === "object") return value;
  if (typeof value === "string") {
    try { return JSON.parse(value); } catch { return fallback; }
  }
  return fallback;
}

function reportDTO(row, artifact = null) {
  if (!row) return null;
  return {
    reportId: row.id,
    type: row.report_type,
    subject: { type: row.subject_type, id: row.subject_id },
    status: row.status,
    snapshotRevision: Number(row.snapshot_revision),
    templateVersion: row.template_version,
    policyVersion: row.policy_version || null,
    artifactHash: digestHex(row.artifact_hash),
    failureCode: row.failure_code || null,
    generatedAt: row.generated_at ? new Date(row.generated_at).toISOString() : null,
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : null,
    updatedAt: row.updated_at ? new Date(row.updated_at).toISOString() : null,
    ...(artifact ? { document: verifiedArtifactDocument(row, artifact) } : {}),
  };
}

async function storedReport(queryable, row) {
  const artifact = await queryable.query(`SELECT document FROM private.report_artifacts WHERE report_id = $1`, [row.id]);
  return reportDTO(row, artifact.rows[0] || null);
}

function statusSeverity(state) {
  const normalized = String(state || "UNKNOWN").toUpperCase();
  if (["DANGEROUS", "MALICIOUS", "BLOCK", "HIGH_RISK"].some((value) => normalized.includes(value))) return "HIGH";
  if (["SUSPICIOUS", "PARTIAL", "CONFLICT", "UNKNOWN"].some((value) => normalized.includes(value))) return "MEDIUM";
  return "INFO";
}

function eventRefs(stageRows) {
  return stageRows.flatMap((row) => {
    const summary = parseJson(row.summary, {});
    return Array.isArray(summary.evidenceRefs)
      ? summary.evidenceRefs.filter((value) => typeof value === "string").slice(0, 20).map((value) => `stage:${row.stage_id}:${value}`)
      : [];
  }).slice(0, 100);
}

function reportDocument({ reportId, caseRow, runRow, caseRevision, verdictRevision, stageRows, inputRows, evidenceRows, claimRows, generatedAt }) {
  const verdict = parseJson(verdictRevision?.verdict, {});
  const state = caseRevision.state || caseRow.state || verdict.security || "UNKNOWN";
  const environment = process.env.NODE_ENV || "development";
  const evidenceReferences = eventRefs(stageRows);
  const inputHashes = inputRows.map((row) => digestHex(row.content_hash)).filter(Boolean);
  const findings = [
    {
      id: `case-state:${caseRevision.revision}`,
      severity: statusSeverity(state),
      status: "OBSERVED",
      claim: `Trust case state is ${state}.`,
      evidence: evidenceReferences.slice(0, 20),
      limitations: ["This report preserves the committed Trust decision; it is not a guarantee of future safety."],
    },
    ...stageRows.filter((row) => parseJson(row.summary, {}).finding).map((row) => {
      const summary = parseJson(row.summary, {});
      return {
        id: `stage:${row.stage_id}:${row.attempt}`,
        severity: statusSeverity(summary.finding),
        status: row.status,
        claim: `${row.stage_id.toUpperCase()} reported ${summary.finding}.`,
        evidence: Array.isArray(summary.evidenceRefs) ? summary.evidenceRefs.slice(0, 20) : [],
        limitations: Array.isArray(summary.limitations) ? summary.limitations.slice(0, 8) : ["Stage limitations were not published."],
      };
    }).slice(0, 20),
  ];
  const unknowns = stageRows
    .filter((row) => ["NOT_STARTED", "PARTIAL", "FAILED", "BLOCKED"].includes(row.status))
    .map((row) => `${row.stage_id.toUpperCase()} status is ${row.status}; the report does not infer a clean result.`)
    .slice(0, 20);
  const documentWithoutHash = {
    schemaVersion: "trust.case.report.v1",
    reportId,
    type: "TRUST_CASE",
    scope: { subjectType: "TRUST_CASE", subjectId: caseRow.id },
    snapshotRevision: Number(caseRevision.revision),
    inputHashes,
    generatedAt,
    templateVersion: REPORT_TEMPLATE_VERSION,
    policyVersion: runRow?.pipeline_version || null,
    evidenceRefs: [...new Set(evidenceReferences)].slice(0, 100),
    findings,
    checks: [
      { id: "trust-case-committed", result: "PASS", environment, observedAt: generatedAt, artifactHash: null },
      { id: "trust-case-revision-committed", result: "PASS", environment, observedAt: generatedAt, artifactHash: null },
      { id: "trust-verdict-revision-committed", result: verdictRevision ? "PASS" : "UNKNOWN", environment, observedAt: generatedAt, artifactHash: null },
    ],
    unknowns,
    nextActions: unknowns.length ? ["Đọc các stage còn thiếu hoặc yêu cầu review chuyên gia theo đúng phạm vi."] : ["Giữ lại report theo revision; kiểm tra lại nếu nguồn hoặc case có revision mới."],
    supersedes: null,
    accessPolicy: "OWNER_OR_SERVICE",
    sourceSummary: {
      evidenceItems: evidenceRows.length,
      claimItems: claimRows.length,
      stageItems: stageRows.length,
    },
    verdict: {
      security: verdict.security || null,
      truth: verdict.truth || null,
      action: verdict.action || null,
    },
  };
  const artifactHash = digest(documentWithoutHash);
  return { document: { ...documentWithoutHash, artifactHash: artifactHash.toString("hex") }, artifactHash };
}

function transition(client, reportId, sequence, fromStatus, toStatus, metadata = {}) {
  return client.query(
    `INSERT INTO private.report_job_events(report_id, sequence, from_status, to_status, metadata)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [reportId, sequence, fromStatus, toStatus, JSON.stringify(metadata)]
  );
}

async function snapshotTrustCase(client, ownerId, caseId, requestedRevision) {
  const caseResult = await client.query(
    `SELECT id, owner_id, state, visibility, created_at, updated_at
       FROM public.trust_cases
      WHERE id = $1 AND owner_id = $2
      FOR SHARE`,
    [caseId, ownerId]
  );
  const caseRow = caseResult.rows[0];
  if (!caseRow) throw new ReportServiceError("REPORT_SUBJECT_NOT_FOUND", "The requested Trust case is not available.", 404);

  const revisionQuery = requestedRevision
    ? `SELECT id, case_id, owner_id, revision, run_id, state, snapshot, created_at
         FROM public.trust_case_revisions
        WHERE case_id = $1 AND owner_id = $2 AND revision = $3`
    : `SELECT id, case_id, owner_id, revision, run_id, state, snapshot, created_at
         FROM public.trust_case_revisions
        WHERE case_id = $1 AND owner_id = $2
        ORDER BY revision DESC
        LIMIT 1`;
  const revisionValues = requestedRevision ? [caseId, ownerId, requestedRevision] : [caseId, ownerId];
  const revisionResult = await client.query(revisionQuery, revisionValues);
  const caseRevision = revisionResult.rows[0];
  if (!caseRevision) throw new ReportServiceError("REPORT_REVISION_NOT_FOUND", "The requested Trust revision is not available.", 404);

  const runResult = await client.query(
    `SELECT id, case_id, owner_id, pipeline_version, status, input_fingerprint, created_at
       FROM public.trust_runs
      WHERE id = $1 AND case_id = $2 AND owner_id = $3`,
    [caseRevision.run_id, caseId, ownerId]
  );
  const verdictResult = await client.query(
    `SELECT id, case_id, owner_id, revision, run_id, verdict, decision_digest, created_at
       FROM public.trust_verdict_revisions
      WHERE case_id = $1 AND owner_id = $2 AND revision = $3`,
    [caseId, ownerId, caseRevision.revision]
  );
  const stageResult = await client.query(
    `SELECT stage_id, stage_index, status, attempt, summary
       FROM public.trust_stage_runs
      WHERE run_id = $1 AND case_id = $2 AND owner_id = $3
      ORDER BY stage_index ASC, attempt ASC`,
    [caseRevision.run_id, caseId, ownerId]
  );
  const inputResult = await client.query(
    `SELECT content_hash FROM public.case_inputs WHERE case_id = $1 ORDER BY created_at ASC`,
    [caseId]
  );
  const evidenceResult = await client.query(
    `SELECT source_type, source_identifier, observed_at
       FROM public.evidence
      WHERE case_id = $1
      ORDER BY observed_at ASC
      LIMIT 100`,
    [caseId]
  );
  const claimResult = await client.query(
    `SELECT c.id, c.statement, c.status
       FROM public.claims c
       JOIN public.claim_sources cs ON cs.claim_id = c.id
       JOIN public.evidence e ON e.id = cs.evidence_id AND e.case_id = $2
      WHERE c.creator_id = $1
      ORDER BY c.created_at ASC
      LIMIT 100`,
    [ownerId, caseId]
  );
  if (!runResult.rows[0]) throw new ReportServiceError("REPORT_RUN_NOT_FOUND", "The Trust execution for this revision is not available.", 409);
  return {
    caseRow,
    caseRevision,
    runRow: runResult.rows[0],
    verdictRevision: verdictResult.rows[0] || null,
    stageRows: stageResult.rows,
    inputRows: inputResult.rows,
    evidenceRows: evidenceResult.rows,
    claimRows: claimResult.rows,
  };
}

async function transaction(operation) {
  const pool = getPostgresPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN ISOLATION LEVEL REPEATABLE READ");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

function withStorageErrors(error) {
  if (error instanceof ReportServiceError) return error;
  if (error?.code === "23505") return new ReportServiceError("REPORT_IDEMPOTENCY_RACE", "The report request was already committed by another request.", 409);
  return new ReportServiceError("REPORT_STORAGE_UNAVAILABLE", "Report storage is temporarily unavailable.", 503);
}

export class ReportService {
  static async createTrustCaseReport({ ownerId, caseId, requestedRevision = null, idempotencyKey: rawIdempotencyKey = null }) {
    const normalizedOwnerId = uuid(ownerId, "owner");
    const normalizedCaseId = uuid(caseId, "case");
    const normalizedRevision = requestedRevision === null || requestedRevision === undefined ? null : Number(requestedRevision);
    if (normalizedRevision !== null && (!Number.isInteger(normalizedRevision) || normalizedRevision < 1)) throw new ReportServiceError("REPORT_REVISION_INVALID", "Report revision must be a positive integer.", 400);
    const normalizedIdempotencyKey = idempotencyKey(rawIdempotencyKey);
    const requestFingerprint = digest({ reportType: "TRUST_CASE", subjectId: normalizedCaseId, requestedRevision: normalizedRevision || "LATEST" });

    try {
      return await transaction(async (client) => {
        const existing = normalizedIdempotencyKey
          ? await client.query(`SELECT * FROM private.report_jobs WHERE owner_id = $1 AND idempotency_key = $2 FOR UPDATE`, [normalizedOwnerId, normalizedIdempotencyKey])
          : { rows: [] };
        if (existing.rows[0]) {
          if (!sameDigest(existing.rows[0].request_fingerprint, requestFingerprint)) throw new ReportServiceError("REPORT_IDEMPOTENCY_CONFLICT", "The report idempotency key is already bound to another report request.", 409);
          return { report: await storedReport(client, existing.rows[0]), idempotent: true };
        }

        const source = await snapshotTrustCase(client, normalizedOwnerId, normalizedCaseId, normalizedRevision);
        const reportId = crypto.randomUUID();
        const generatedAt = new Date().toISOString();
        const { document, artifactHash } = reportDocument({ reportId, ...source, generatedAt });
        await client.query(
          `INSERT INTO private.report_jobs
            (id, owner_id, report_type, subject_type, subject_id, snapshot_revision, status,
             template_version, policy_version, request_fingerprint, idempotency_key,
             artifact_hash, generated_at, created_at, updated_at)
           VALUES ($1, $2, 'TRUST_CASE', 'TRUST_CASE', $3, $4, 'REQUESTED', $5, $6, $7, $8, $9, $10, now(), now())`,
          [reportId, normalizedOwnerId, normalizedCaseId, source.caseRevision.revision, REPORT_TEMPLATE_VERSION, source.runRow.pipeline_version || null, requestFingerprint, normalizedIdempotencyKey, artifactHash, generatedAt]
        );
        await transition(client, reportId, 1, null, "REQUESTED", { subjectId: normalizedCaseId });
        await client.query(`UPDATE private.report_jobs SET status = 'SNAPSHOTTING', updated_at = now() WHERE id = $1`, [reportId]);
        await transition(client, reportId, 2, "REQUESTED", "SNAPSHOTTING");
        await client.query(`UPDATE private.report_jobs SET status = 'GENERATING', updated_at = now() WHERE id = $1`, [reportId]);
        await transition(client, reportId, 3, "SNAPSHOTTING", "GENERATING");
        await client.query(`UPDATE private.report_jobs SET status = 'VALIDATING', updated_at = now() WHERE id = $1`, [reportId]);
        await transition(client, reportId, 4, "GENERATING", "VALIDATING");
        await client.query(
          `INSERT INTO private.report_artifacts(report_id, snapshot_revision, document, artifact_hash)
           VALUES ($1, $2, $3::jsonb, $4)`,
          [reportId, source.caseRevision.revision, JSON.stringify(document), artifactHash]
        );
        const ready = await client.query(
          `UPDATE private.report_jobs
              SET status = 'READY', generated_at = $2, updated_at = now()
            WHERE id = $1
            RETURNING *`,
          [reportId, generatedAt]
        );
        await transition(client, reportId, 5, "VALIDATING", "READY", { artifactHash: artifactHash.toString("hex") });
        return { report: reportDTO(ready.rows[0], { document }), idempotent: false };
      });
    } catch (error) {
      const mapped = withStorageErrors(error);
      if (mapped.code === "REPORT_IDEMPOTENCY_RACE" && normalizedIdempotencyKey) {
        const pool = getPostgresPool();
        const existing = await pool.query(`SELECT * FROM private.report_jobs WHERE owner_id = $1 AND idempotency_key = $2`, [normalizedOwnerId, normalizedIdempotencyKey]);
        if (existing.rows[0]) {
          if (!sameDigest(existing.rows[0].request_fingerprint, requestFingerprint)) throw new ReportServiceError("REPORT_IDEMPOTENCY_CONFLICT", "The report idempotency key is already bound to another report request.", 409);
          return { report: await storedReport(pool, existing.rows[0]), idempotent: true };
        }
      }
      throw mapped;
    }
  }

  static async getReportForOwner({ ownerId, reportId, includeDocument = true }) {
    const normalizedOwnerId = uuid(ownerId, "owner");
    const normalizedReportId = uuid(reportId, "report");
    const pool = getPostgresPool();
    const result = await pool.query(`SELECT * FROM private.report_jobs WHERE id = $1 AND owner_id = $2`, [normalizedReportId, normalizedOwnerId]);
    if (!result.rows[0]) return null;
    const artifact = includeDocument ? await pool.query(`SELECT document FROM private.report_artifacts WHERE report_id = $1`, [normalizedReportId]) : { rows: [] };
    return reportDTO(result.rows[0], artifact.rows[0] || null);
  }

  static async listReportsForOwner({ ownerId, caseId = null, limit = 20 }) {
    const normalizedOwnerId = uuid(ownerId, "owner");
    const normalizedCaseId = caseId ? uuid(caseId, "case") : null;
    const boundedLimit = Math.min(100, Math.max(1, Number.isInteger(limit) ? limit : 20));
    const pool = getPostgresPool();
    const result = await pool.query(
      `SELECT * FROM private.report_jobs
        WHERE owner_id = $1 AND ($2::uuid IS NULL OR subject_id = $2)
        ORDER BY created_at DESC
        LIMIT $3`,
      [normalizedOwnerId, normalizedCaseId, boundedLimit]
    );
    return result.rows.map((row) => reportDTO(row));
  }
}
