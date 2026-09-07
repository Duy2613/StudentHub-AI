import crypto from "node:crypto";

import { hashCanonicalJson, sha256Hex } from "./CanonicalJson.js";

export { canonicalJson, hashCanonicalJson, sha256Hex } from "./CanonicalJson.js";

export const LABBE_MODES = Object.freeze(["DISABLED", "SHADOW", "STAGING", "CONTROLLED"]);
export const LABBE_EVENT_TYPE = "security.studenthub.trust_decision.v1";
export const LABBE_SCHEMA_VERSION = "studenthub-security-event-v1";
export const LABBE_PAYLOAD_FIELDS = Object.freeze([
  "case_id",
  "case_revision",
  "run_id",
  "pipeline_status",
  "security",
  "truth",
  "action",
]);

const IDENTIFIER = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;
const EVENT_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,179}$/;
const CASE_ID = /^[A-Za-z0-9_-]{1,64}$/;
const CLASSIFICATIONS = new Set(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]);
const PIPELINE_STATUSES = new Set(["COMPLETED", "PARTIAL", "FAILED", "CANCELLED", "UNKNOWN"]);

function bounded(value, max = 128) {
  if (value === null || value === undefined) return "";
  return String(value).replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max);
}

function safeIdentifier(value, fallback = null) {
  const candidate = bounded(value, 128);
  return IDENTIFIER.test(candidate) ? candidate : fallback;
}

function normalizedTimestamp(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function modeValue(value) {
  const mode = String(value || "DISABLED").trim().toUpperCase();
  return LABBE_MODES.includes(mode) ? mode : "DISABLED";
}

function trustDecisionValue(pipelineResult, key) {
  const decision = pipelineResult?.finalDecision || pipelineResult?.decision || {};
  return bounded(decision[key] ?? pipelineResult?.[key] ?? "UNKNOWN", 160).toUpperCase() || "UNKNOWN";
}

function normalizedPayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return { ok: false, code: "PAYLOAD_OBJECT_REQUIRED" };
  }

  const keys = Object.keys(payload);
  const unexpected = keys.filter((key) => !LABBE_PAYLOAD_FIELDS.includes(key));
  if (unexpected.length) return { ok: false, code: "PAYLOAD_FIELD_NOT_ALLOWED" };
  if (LABBE_PAYLOAD_FIELDS.some((key) => !Object.hasOwn(payload, key))) {
    return { ok: false, code: "PAYLOAD_FIELD_REQUIRED" };
  }

  const caseId = bounded(payload.case_id, 64);
  if (!CASE_ID.test(caseId)) return { ok: false, code: "PAYLOAD_CASE_ID_INVALID" };

  if (!Number.isInteger(payload.case_revision) || payload.case_revision < 1) {
    return { ok: false, code: "PAYLOAD_CASE_REVISION_INVALID" };
  }

  let runId = null;
  if (payload.run_id !== null) {
    runId = safeIdentifier(payload.run_id);
    if (!runId) return { ok: false, code: "PAYLOAD_RUN_ID_INVALID" };
  }

  const pipelineStatus = bounded(payload.pipeline_status, 40).toUpperCase();
  if (!PIPELINE_STATUSES.has(pipelineStatus)) return { ok: false, code: "PAYLOAD_PIPELINE_STATUS_INVALID" };

  const decisionFields = {};
  for (const key of ["security", "truth", "action"]) {
    if (typeof payload[key] !== "string") return { ok: false, code: "PAYLOAD_DECISION_INVALID" };
    decisionFields[key] = bounded(payload[key], 160).toUpperCase() || "UNKNOWN";
  }

  return {
    ok: true,
    payload: {
      case_id: caseId,
      case_revision: payload.case_revision,
      run_id: runId,
      pipeline_status: pipelineStatus,
      ...decisionFields,
    },
  };
}

function sameHash(left, right) {
  if (!/^[0-9a-f]{64}$/i.test(String(left || "")) || !/^[0-9a-f]{64}$/i.test(String(right || ""))) return false;
  return crypto.timingSafeEqual(Buffer.from(String(left).toLowerCase(), "hex"), Buffer.from(String(right).toLowerCase(), "hex"));
}

/**
 * Validates and normalizes the only event shape allowed to cross the bridge.
 * Unknown fields are rejected, including raw input/evidence/token-shaped keys.
 */
export function validateLabbeEvent(event = {}) {
  const eventId = bounded(event.event_id, 180);
  if (!EVENT_ID.test(eventId)) return { ok: false, code: "EVENT_ID_INVALID", eventId: eventId || null };
  if (event.event_type !== LABBE_EVENT_TYPE) return { ok: false, code: "EVENT_TYPE_INVALID", eventId };
  if (event.schema_version !== LABBE_SCHEMA_VERSION) return { ok: false, code: "SCHEMA_VERSION_INVALID", eventId };

  const occurredAt = normalizedTimestamp(event.occurred_at);
  const producedAt = normalizedTimestamp(event.produced_at);
  if (!occurredAt || !producedAt) return { ok: false, code: "EVENT_TIMESTAMP_INVALID", eventId };
  if (event.producer !== "StudentHub-AI") return { ok: false, code: "EVENT_PRODUCER_INVALID", eventId };

  const correlationId = safeIdentifier(event.correlation_id);
  const causationId = event.causation_id === null || event.causation_id === undefined
    ? null
    : safeIdentifier(event.causation_id);
  const subject = safeIdentifier(event.subject);
  if (!correlationId || (event.causation_id !== null && event.causation_id !== undefined && !causationId) || !subject) {
    return { ok: false, code: "EVENT_IDENTIFIER_INVALID", eventId };
  }

  const classification = bounded(event.classification || "INTERNAL", 32).toUpperCase();
  if (!CLASSIFICATIONS.has(classification)) return { ok: false, code: "CLASSIFICATION_INVALID", eventId };

  const payloadResult = normalizedPayload(event.payload);
  if (!payloadResult.ok) return { ok: false, code: payloadResult.code, eventId };

  const payloadHash = bounded(event.payload_hash, 64).toLowerCase();
  const expectedHash = hashCanonicalJson(payloadResult.payload);
  if (!sameHash(payloadHash, expectedHash)) return { ok: false, code: "PAYLOAD_HASH_MISMATCH", eventId };

  return {
    ok: true,
    event: {
      event_id: eventId,
      event_type: LABBE_EVENT_TYPE,
      schema_version: LABBE_SCHEMA_VERSION,
      occurred_at: occurredAt,
      produced_at: producedAt,
      producer: "StudentHub-AI",
      environment: bounded(event.environment || "development", 64),
      correlation_id: correlationId,
      causation_id: causationId,
      subject,
      classification,
      payload: payloadResult.payload,
      payload_hash: expectedHash,
    },
  };
}

export function getLabbeConfig(env = process.env) {
  const mode = modeValue(env.STUDENTHUB_LABBE_MODE);
  const baseUrl = bounded(env.STUDENTHUB_LABBE_BASE_URL || env.LABBE_BASE_URL, 500).replace(/\/+$/, "");
  const accessToken = String(env.STUDENTHUB_LABBE_TOKEN || env.LABBE_ACCESS_TOKEN || "").trim();
  const scope = bounded(env.STUDENTHUB_LABBE_SCOPE || env.LABBE_WORKLOAD_SCOPE, 160);
  const classification = bounded(env.STUDENTHUB_LABBE_CLASSIFICATION || "INTERNAL", 32).toUpperCase();
  let validBaseUrl = false;
  try {
    const parsed = new URL(baseUrl);
    validBaseUrl = parsed.protocol === "https:"
      && !parsed.username
      && !parsed.password
      && !parsed.search
      && !parsed.hash;
  } catch {
    validBaseUrl = false;
  }
  const remoteConfigured = validBaseUrl && accessToken.length > 0 && scope.length > 0;
  return Object.freeze({
    mode,
    baseUrl: validBaseUrl ? baseUrl : "",
    accessToken,
    scope,
    classification: CLASSIFICATIONS.has(classification) ? classification : "INTERNAL",
    remoteConfigured,
    writeback: "DISABLED",
  });
}

export function getLabbeReadiness(env = process.env) {
  const config = getLabbeConfig(env);
  const staging = config.mode === "STAGING";
  return {
    mode: config.mode,
    status: config.mode === "DISABLED"
      ? "DISABLED"
      : config.mode === "SHADOW"
        ? "SHADOW"
        : config.mode === "CONTROLLED"
          ? "CONTROLLED_DISABLED"
          : staging && config.remoteConfigured ? "READY" : "NOT_CONFIGURED",
    configured: config.remoteConfigured,
    delivery: config.mode === "DISABLED" || config.mode === "CONTROLLED" ? "NONE" : "OUTBOX",
    writeback: "DISABLED",
    scopeConfigured: Boolean(config.scope),
  };
}

export function buildTrustDecisionEvent({
  caseId,
  caseRevision = 1,
  runId = null,
  pipelineResult = {},
  correlationId = null,
  occurredAt = new Date().toISOString(),
  env = process.env,
} = {}) {
  const normalizedCaseId = bounded(caseId, 64);
  if (!CASE_ID.test(normalizedCaseId)) return null;
  const revision = Number.isInteger(caseRevision) && caseRevision > 0 ? caseRevision : 1;
  const normalizedRunId = runId ? safeIdentifier(runId) || "run-unknown" : null;
  const pipelineStatusCandidate = bounded(pipelineResult?.pipelineStatus || pipelineResult?.status || "COMPLETED", 40).toUpperCase();
  const payload = {
    case_id: normalizedCaseId,
    case_revision: revision,
    run_id: normalizedRunId,
    pipeline_status: PIPELINE_STATUSES.has(pipelineStatusCandidate) ? pipelineStatusCandidate : "UNKNOWN",
    security: trustDecisionValue(pipelineResult, "security"),
    truth: trustDecisionValue(pipelineResult, "truth"),
    action: trustDecisionValue(pipelineResult, "action"),
  };
  const payloadHash = hashCanonicalJson(payload);
  const eventId = `sh-trust-${sha256Hex(`${normalizedCaseId}:${revision}:${normalizedRunId || "run-unknown"}:${payloadHash}`).slice(0, 40)}`;
  const now = normalizedTimestamp(occurredAt);
  if (!now) return null;
  const producedAt = new Date().toISOString();
  const correlation = safeIdentifier(correlationId) || `corr-${sha256Hex(eventId).slice(0, 24)}`;
  const event = {
    event_id: eventId,
    event_type: LABBE_EVENT_TYPE,
    schema_version: LABBE_SCHEMA_VERSION,
    occurred_at: now,
    produced_at: producedAt,
    producer: "StudentHub-AI",
    environment: bounded(env.NODE_ENV || "development", 64),
    correlation_id: correlation,
    causation_id: normalizedRunId,
    subject: `case:${normalizedCaseId}`,
    classification: getLabbeConfig(env).classification,
    payload,
    payload_hash: payloadHash,
  };
  return validateLabbeEvent(event).ok ? event : null;
}

export async function deliverLabbeEvent(event, { env = process.env, fetchImpl = globalThis.fetch, timeoutMs = 5000 } = {}) {
  const config = getLabbeConfig(env);
  const eventId = event?.event_id || null;
  if (config.mode === "DISABLED") return { status: "DISABLED", delivered: false, eventId };
  if (config.mode === "SHADOW") return { status: "SHADOW", delivered: false, eventId };
  if (config.mode === "CONTROLLED") return { status: "CONTROLLED_DISABLED", delivered: false, eventId };
  if (!config.remoteConfigured || typeof fetchImpl !== "function") return { status: "NOT_CONFIGURED", delivered: false, eventId };

  const validation = validateLabbeEvent(event);
  if (!validation.ok) return { status: "INVALID_EVENT", delivered: false, eventId, reason: validation.code };
  const transportEvent = validation.event;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort("labbe-timeout"), Math.min(30_000, Math.max(250, timeoutMs)));
  try {
    const response = await fetchImpl(`${config.baseUrl}/api/v1/integrations/studenthub/events`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.accessToken}`,
        "Idempotency-Key": transportEvent.event_id,
        "X-StudentHub-Payload-Hash": transportEvent.payload_hash,
        "X-StudentHub-Workload-Scope": config.scope,
        "X-StudentHub-Classification": transportEvent.classification,
      },
      body: JSON.stringify(transportEvent),
      signal: controller.signal,
    });
    if (response.status === 409) return { status: "CONFLICT", delivered: false, eventId: transportEvent.event_id, httpStatus: response.status };
    if (response.status === 401) return { status: "UNAUTHORIZED", delivered: false, eventId: transportEvent.event_id, httpStatus: response.status };
    if (response.status === 403) return { status: "FORBIDDEN", delivered: false, eventId: transportEvent.event_id, httpStatus: response.status };
    if (response.status === 408 || response.status === 504) return { status: "TIMEOUT", delivered: false, eventId: transportEvent.event_id, httpStatus: response.status };
    if (response.status === 429) return { status: "RATE_LIMITED", delivered: false, eventId: transportEvent.event_id, httpStatus: response.status };
    if (!response.ok) return { status: "REJECTED", delivered: false, eventId: transportEvent.event_id, httpStatus: response.status };
    return { status: "DELIVERED", delivered: true, eventId: transportEvent.event_id, httpStatus: response.status };
  } catch (error) {
    return { status: error?.name === "AbortError" ? "TIMEOUT" : "UNAVAILABLE", delivered: false, eventId: transportEvent.event_id };
  } finally {
    clearTimeout(timer);
  }
}
