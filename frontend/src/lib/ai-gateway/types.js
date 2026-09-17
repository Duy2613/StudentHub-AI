/**
 * AI Gateway — Types, Enums & Standardized Contract Definitions
 *
 * Provider adapters may expose vendor-specific details internally, but only
 * the bounded values in this module cross the gateway boundary. In particular,
 * attempt telemetry never contains an API key or a raw upstream response body.
 */

import { createSecureId } from "../security/secureId.js";

export const AI_CAPABILITY = Object.freeze({
  FAST_CLASSIFICATION: "FAST_CLASSIFICATION",
  CLAIM_EXTRACTION: "CLAIM_EXTRACTION",
  DEEP_REASONING: "DEEP_REASONING",
  MULTIMODAL: "MULTIMODAL",
  DOCUMENT: "DOCUMENT",
  EMBEDDING: "EMBEDDING",
  RERANKING: "RERANKING",
  SUMMARIZATION: "SUMMARIZATION",
});

export const MODEL_TIER = Object.freeze({
  FAST_CHEAP: "FAST_CHEAP",
  BALANCED: "BALANCED",
  DEEP: "DEEP",
  MULTIMODAL: "MULTIMODAL",
});

export const PROVIDER_FAMILY = Object.freeze({
  OPENAI_COMPATIBLE: "openai_compatible",
  GEMINI: "gemini",
});

export const GATEWAY_ERROR_TYPE = Object.freeze({
  NOT_CONFIGURED: "NOT_CONFIGURED",
  TIMEOUT: "TIMEOUT",
  HTTP_ERROR: "HTTP_ERROR",
  NETWORK_ERROR: "NETWORK_ERROR",
  INVALID_JSON: "INVALID_JSON",
  SCHEMA_VALIDATION_FAILED: "SCHEMA_VALIDATION_FAILED",
  EMPTY_RESPONSE: "EMPTY_RESPONSE",
  MODEL_INCOMPATIBLE: "MODEL_INCOMPATIBLE",
  BUDGET_EXHAUSTED: "BUDGET_EXHAUSTED",
  CIRCUIT_OPEN: "CIRCUIT_OPEN",
});

const SAFE_CODE_PATTERN = /^[A-Z0-9][A-Z0-9_.:-]{0,79}$/;

function boundedText(value, maxLength = 160) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, maxLength)
    : "";
}

function safeHttpStatus(value) {
  const status = Number(value);
  return Number.isInteger(status) && status >= 100 && status <= 599 ? status : null;
}

export function normalizeProviderErrorCode(value) {
  const code = typeof value === "string" ? value.trim().toUpperCase() : "";
  return SAFE_CODE_PATTERN.test(code) ? code : null;
}

function safeCode(value, fallback = null) {
  return normalizeProviderErrorCode(value) || fallback;
}

/**
 * Maps a transport failure into a bounded provider status. This classification
 * is descriptive; `isFailoverEligible` below is the only failover policy.
 */
export function classifyGatewayFailure({ errorType = null, httpStatus = null, providerErrorCode = null } = {}) {
  const status = safeHttpStatus(httpStatus);
  const code = normalizeProviderErrorCode(providerErrorCode);

  if (errorType === GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE) return "MODEL_INCOMPATIBLE";
  if (errorType === GATEWAY_ERROR_TYPE.TIMEOUT) return "TIMEOUT";
  if (errorType === GATEWAY_ERROR_TYPE.NOT_CONFIGURED) return "NOT_CONFIGURED";
  if (errorType === GATEWAY_ERROR_TYPE.CIRCUIT_OPEN) return "COOLDOWN";
  if (errorType === GATEWAY_ERROR_TYPE.BUDGET_EXHAUSTED) return "BUDGET_EXHAUSTED";
  if ([GATEWAY_ERROR_TYPE.INVALID_JSON, GATEWAY_ERROR_TYPE.SCHEMA_VALIDATION_FAILED, GATEWAY_ERROR_TYPE.EMPTY_RESPONSE].includes(errorType)) {
    return "INVALID_RESPONSE";
  }
  if (errorType === GATEWAY_ERROR_TYPE.NETWORK_ERROR) {
    return code === "NETWORK_TIMEOUT" ? "NETWORK_TIMEOUT" : "NETWORK_ERROR";
  }
  if (errorType === GATEWAY_ERROR_TYPE.HTTP_ERROR) {
    if (status === 401 || code === "UNAUTHENTICATED") return "AUTH_FAILED";
    if (status === 403 || code === "PERMISSION_DENIED") return "PERMISSION_DENIED";
    if (status === 404 || code === "NOT_FOUND" || code === "MODEL_NOT_FOUND") return "MODEL_NOT_AVAILABLE";
    if (status === 408 || status === 504 || code === "DEADLINE_EXCEEDED") return "TIMEOUT";
    if (status === 429 || code === "RESOURCE_EXHAUSTED" || code === "QUOTA_EXHAUSTED" || code === "RATE_LIMITED") return "RATE_LIMITED";
    if (status === 503 || code === "UNAVAILABLE" || code === "SERVICE_UNAVAILABLE") return "SERVICE_UNAVAILABLE";
    if (status === 400 || code === "INVALID_ARGUMENT" || code === "INVALID_REQUEST") return "INVALID_REQUEST";
    if (status !== null && status >= 500) return "UPSTREAM_ERROR";
    return "INVALID_REQUEST";
  }
  return "UPSTREAM_ERROR";
}

/**
 * Strict failover policy for the Google model chain. 401, 403 and 400 are
 * deliberately excluded even if another field happens to contain a transient
 * looking word. Explicit MODEL_INCOMPATIBLE is the sole non-transport skip:
 * it means the candidate cannot satisfy the already-fixed caller schema.
 */
export function isFailoverEligible({ errorType = null, httpStatus = null, providerErrorCode = null } = {}) {
  const status = safeHttpStatus(httpStatus);
  const code = normalizeProviderErrorCode(providerErrorCode);

  // Failover NO: Global client/auth/schema defects that cannot be resolved by model hopping
  if ([401, 403, 400].includes(status)) return false;
  if ([
    "UNAUTHENTICATED",
    "AUTHENTICATION_FAILED",
    "PERMISSION_DENIED",
    "REQUEST_SCHEMA_INVALID",
    "CLIENT_CONFIGURATION_ERROR",
    "INVALID_PROVIDER_CONFIGURATION",
    "INVALID_ARGUMENT",
    "INVALID_REQUEST",
  ].includes(code)) return false;
  if (errorType === GATEWAY_ERROR_TYPE.NOT_CONFIGURED || errorType === GATEWAY_ERROR_TYPE.INVALID_ARGUMENT) return false;

  // Failover YES: Model-specific capacity, latency, schema-output, or availability failures
  if (
    errorType === GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE ||
    errorType === GATEWAY_ERROR_TYPE.TIMEOUT ||
    errorType === GATEWAY_ERROR_TYPE.NETWORK_ERROR
  ) return true;

  if ([429, 503, 504, 404, 408].includes(status)) return true;

  return [
    "RATE_LIMITED",
    "RESOURCE_EXHAUSTED",
    "QUOTA_EXHAUSTED",
    "SERVICE_UNAVAILABLE",
    "UNAVAILABLE",
    "PROVIDER_TIMEOUT",
    "MODEL_OUTPUT_INCOMPATIBLE",
    "MODEL_CAPABILITY_INCOMPATIBLE",
    "MODEL_NOT_FOUND",
    "MODEL_UNAVAILABLE",
    "NETWORK_TIMEOUT",
    "DEADLINE_EXCEEDED",
    "HIGH_DEMAND",
  ].includes(code);
}

export function traceResultForFailure({ errorType = null, httpStatus = null, providerErrorCode = null, result = null } = {}) {
  if (result) return safeCode(result, "FAILED");
  if (errorType === GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE) return "MODEL_INCOMPATIBLE";
  const status = classifyGatewayFailure({ errorType, httpStatus, providerErrorCode });
  if (status === "SERVICE_UNAVAILABLE") return "SERVICE_UNAVAILABLE";
  if (status === "MODEL_NOT_AVAILABLE") return "MODEL_NOT_FOUND";
  if (status === "AUTH_FAILED") return "AUTH_FAILED";
  if (status === "PERMISSION_DENIED") return "PERMISSION_DENIED";
  return safeCode(status, "FAILED");
}

/** Public-safe error text. Raw provider messages and response bodies never
 * cross the gateway boundary or enter persisted attempt telemetry. */
export function sanitizeGatewayError(errorType, _errorMessage = "") {
  switch (errorType) {
    case GATEWAY_ERROR_TYPE.NOT_CONFIGURED:
      return "No configured AI provider is available for this capability.";
    case GATEWAY_ERROR_TYPE.TIMEOUT:
      return "The AI provider exceeded its response time limit.";
    case GATEWAY_ERROR_TYPE.HTTP_ERROR:
      return "The AI provider returned an upstream error.";
    case GATEWAY_ERROR_TYPE.NETWORK_ERROR:
      return "The AI provider is temporarily unavailable.";
    case GATEWAY_ERROR_TYPE.INVALID_JSON:
    case GATEWAY_ERROR_TYPE.SCHEMA_VALIDATION_FAILED:
    case GATEWAY_ERROR_TYPE.MODEL_INCOMPATIBLE:
      return "The AI response did not match the required structured format.";
    case GATEWAY_ERROR_TYPE.EMPTY_RESPONSE:
      return "The AI provider returned an empty response.";
    case GATEWAY_ERROR_TYPE.BUDGET_EXHAUSTED:
      return "The AI provider budget was exhausted before a valid result arrived.";
    case GATEWAY_ERROR_TYPE.CIRCUIT_OPEN:
      return "The model is temporarily cooling down after a provider failure.";
    default:
      return "The AI request could not be completed.";
  }
}

function safeStartedAt(value) {
  if ((typeof value !== "string" && typeof value !== "number") || !String(value).trim()) return null;
  const timestamp = new Date(value);
  return Number.isNaN(timestamp.getTime()) ? null : timestamp.toISOString();
}

function safeDuration(value) {
  const duration = Number(value);
  return Number.isFinite(duration) ? Math.max(0, Math.min(duration, 120_000)) : 0;
}

/**
 * One bounded record per model-routing attempt. `attempts` is also exposed as
 * `modelTrace` by the gateway result for clients that use the mission wording.
 */
export function createAttemptRecord({
  provider,
  model,
  ok = false,
  attemptNumber = 0,
  startedAt = null,
  durationMs = 0,
  httpStatus = null,
  providerErrorCode = null,
  result = null,
  errorType = null,
  errorMessage = null,
} = {}) {
  const safeResult = traceResultForFailure({ errorType, httpStatus, providerErrorCode, result: ok ? "SUCCESS" : result });
  return {
    provider: boundedText(provider, 80) || "unknown",
    model: boundedText(model, 160) || null,
    attemptNumber: Number.isInteger(Number(attemptNumber)) && Number(attemptNumber) > 0 ? Number(attemptNumber) : 0,
    startedAt: safeStartedAt(startedAt),
    durationMs: Number(safeDuration(durationMs).toFixed(2)),
    httpStatus: safeHttpStatus(httpStatus),
    providerErrorCode: normalizeProviderErrorCode(providerErrorCode),
    result: safeResult,

    // Compatibility fields used by existing audit consumers. They are all
    // derived from the same bounded values above.
    ok: ok === true,
    errorType: boundedText(errorType, 80) || null,
    errorMessage: ok ? null : sanitizeGatewayError(errorType, errorMessage),
    latencyMs: Number(safeDuration(durationMs).toFixed(2)),
  };
}

export function sanitizeAttemptRecord(attempt = {}) {
  return createAttemptRecord({
    provider: attempt?.provider,
    model: attempt?.model,
    ok: attempt?.ok === true || attempt?.result === "SUCCESS",
    attemptNumber: attempt?.attemptNumber,
    startedAt: attempt?.startedAt,
    durationMs: attempt?.durationMs ?? attempt?.latencyMs,
    httpStatus: attempt?.httpStatus,
    providerErrorCode: attempt?.providerErrorCode,
    result: attempt?.result,
    errorType: attempt?.errorType,
    errorMessage: attempt?.errorMessage,
  });
}

function safeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    transport: boundedText(value.transport, 120) || null,
    thinkingLevel: boundedText(value.thinkingLevel, 40) || null,
    providerErrorCode: normalizeProviderErrorCode(value.providerErrorCode),
  };
}

function safeCooldownResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return {
    skippedModels: Array.isArray(value.skippedModels)
      ? value.skippedModels.slice(0, 8).map((item) => boundedText(item, 160)).filter(Boolean)
      : [],
    cooldownModels: Array.isArray(value.cooldownModels)
      ? value.cooldownModels.slice(0, 8).map((item) => boundedText(item, 160)).filter(Boolean)
      : [],
    activeCooldowns: Array.isArray(value.activeCooldowns)
      ? value.activeCooldowns.slice(0, 8).map((item) => ({
        model: boundedText(item?.model, 160) || null,
        cooldownUntil: safeStartedAt(item?.cooldownUntil),
        cooldownRemainingMs: Number.isFinite(Number(item?.cooldownRemainingMs)) ? Math.max(0, Math.min(Number(item.cooldownRemainingMs), 86_400_000)) : null,
      })).filter((item) => item.model)
      : [],
  };
}

export function createGatewayResult({
  ok,
  capability,
  provider = null,
  model = null,
  text = null,
  json = null,
  attempts = [],
  errorType = null,
  errorMessage = null,
  requestId = null,
  totalLatencyMs = 0,
  totalBudgetMs = null,
  providerMetadata = null,
  httpStatus = null,
  providerErrorCode = null,
  requestedPrimaryModel = null,
  executedModel = null,
  fallbackUsed = false,
  fallbackReason = null,
  providerStatus = null,
  operationStatus = null,
  cooldownResult = null,
} = {}) {
  const safeAttempts = Array.isArray(attempts) ? attempts.slice(0, 12).map(sanitizeAttemptRecord) : [];
  const safeOk = ok === true;
  const safeProviderStatus = safeCode(providerStatus, safeOk ? "SUCCESS" : classifyGatewayFailure({ errorType, httpStatus, providerErrorCode }));
  const safeOperationStatus = safeCode(operationStatus, safeOk ? "COMPLETED" : "PARTIAL");
  const safeRequestedPrimary = boundedText(requestedPrimaryModel, 160) || null;
  const safeExecuted = boundedText(executedModel || (safeOk ? model : ""), 160) || null;
  return {
    ok: safeOk,
    capability: boundedText(capability, 80) || null,
    provider: boundedText(provider, 80) || null,
    model: boundedText(model, 160) || null,
    text: safeOk && typeof text === "string" ? text : null,
    json: safeOk ? json : null,
    attempts: safeAttempts,
    modelTrace: safeAttempts,
    errorType: boundedText(errorType, 80) || null,
    errorMessage: safeOk ? null : sanitizeGatewayError(errorType, errorMessage),
    requestId: requestId || createSecureId("req_gw"),
    totalLatencyMs: Number(safeDuration(totalLatencyMs).toFixed(2)),
    totalBudgetMs: Number.isFinite(Number(totalBudgetMs)) ? Math.max(0, Math.min(Number(totalBudgetMs), 120_000)) : null,
    httpStatus: safeHttpStatus(httpStatus),
    providerErrorCode: normalizeProviderErrorCode(providerErrorCode),
    providerStatus: safeProviderStatus,
    operationStatus: safeOperationStatus,
    requestedPrimaryModel: safeRequestedPrimary,
    executedModel: safeExecuted,
    fallbackUsed: fallbackUsed === true,
    fallbackReason: safeCode(fallbackReason),
    providerMetadata: safeMetadata(providerMetadata),
    cooldownResult: safeCooldownResult(cooldownResult),
    timestamp: Date.now(),
    schemaVersion: "ai-gateway-v1.1",
  };
}
