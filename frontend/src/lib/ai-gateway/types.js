/**
 * AI Gateway — Types, Enums & Standardized Contract Definitions
 *
 * StudentHubAI never hard-codes application logic to one AI vendor/model.
 * This module defines the canonical capability taxonomy, model tiers, and
 * normalized DTOs shared by every provider adapter and the ModelRouter.
 *
 * See: docs/AI-MODEL-ROUTER.md, docs/PROVIDER-REGISTRY.md
 */

/**
 * Capability classes a caller may request. The router maps a capability
 * to the cheapest/fastest model catalog entry that can satisfy it, with an
 * explicit fallback chain — never a random direct model call from UI code.
 */
export const AI_CAPABILITY = {
  FAST_CLASSIFICATION: "FAST_CLASSIFICATION", // cheap/low-latency triage, intent/claim heuristics
  CLAIM_EXTRACTION: "CLAIM_EXTRACTION",       // structured claim/entity extraction
  DEEP_REASONING: "DEEP_REASONING",           // multi-step adjudication, narrative synthesis
  MULTIMODAL: "MULTIMODAL",                   // image/OCR-aware reasoning
  DOCUMENT: "DOCUMENT",                       // long-document/PDF analysis
  EMBEDDING: "EMBEDDING",                     // vector embedding generation
  RERANKING: "RERANKING",                     // relevance re-ranking of retrieved evidence
  SUMMARIZATION: "SUMMARIZATION",             // grounded summarization with citation preservation
};

/**
 * Cost/latency tiers. Capability routing prefers the cheapest tier that can
 * reliably satisfy the requested capability; DEEP is reserved for cases the
 * FAST/BALANCED tiers cannot resolve (see ModelRouter fallback chains).
 */
export const MODEL_TIER = {
  FAST_CHEAP: "FAST_CHEAP",
  BALANCED: "BALANCED",
  DEEP: "DEEP",
  MULTIMODAL: "MULTIMODAL",
};

/** Normalized provider adapter family identifiers. */
export const PROVIDER_FAMILY = {
  OPENAI_COMPATIBLE: "openai_compatible", // GenSpark LLM proxy (OpenAI-compatible chat.completions)
  GEMINI: "gemini",                       // Google Generative Language API (direct REST)
};

/** Normalized error classification — never leak raw vendor stack traces. */
export const GATEWAY_ERROR_TYPE = {
  NOT_CONFIGURED: "NOT_CONFIGURED",   // no valid API key/base URL for any candidate provider
  TIMEOUT: "TIMEOUT",                 // provider did not respond within SLA
  HTTP_ERROR: "HTTP_ERROR",           // provider returned non-2xx status
  NETWORK_ERROR: "NETWORK_ERROR",     // fetch-level failure (DNS, connection refused, abort)
  INVALID_JSON: "INVALID_JSON",       // structured output could not be parsed/validated
  EMPTY_RESPONSE: "EMPTY_RESPONSE",   // provider returned no usable content
};

/**
 * Builds a normalized Gateway invocation attempt record for provenance/audit.
 * One entry is recorded per candidate (provider, model) tried in the fallback chain.
 */
export function createAttemptRecord({
  provider,
  model,
  ok,
  errorType = null,
  errorMessage = null,
  latencyMs = 0,
}) {
  return {
    provider,
    model,
    ok,
    errorType,
    errorMessage,
    latencyMs: Number(latencyMs.toFixed?.(2) ?? latencyMs),
  };
}

/**
 * Builds the normalized Gateway response contract returned by
 * AIGatewayService.generateStructured() / generateText().
 *
 * `ok: false` MUST always be handled by callers via graceful fallback to a
 * deterministic engine — never surfaced directly as a fabricated verdict.
 */
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
}) {
  return {
    ok,
    capability,
    provider,
    model,
    text,
    json,
    attempts,
    errorType,
    errorMessage,
    requestId: requestId || `req_gw_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    totalLatencyMs: Number(totalLatencyMs.toFixed?.(2) ?? totalLatencyMs),
    timestamp: Date.now(),
    schemaVersion: "ai-gateway-v1",
  };
}
