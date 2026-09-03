/**
 * AI Gateway — Types, Enums & Standardized Contract Definitions
 *
 * StudentHubAI never hard-codes application logic to one AI vendor/model.
 * This module defines the canonical capability taxonomy, model tiers, and
 * normalized DTOs shared by every provider adapter and the ModelRouter.
 *
 * See: docs/AI-MODEL-ROUTER.md, docs/PROVIDER-REGISTRY.md
 */

import { createSecureId } from "../security/secureId.js";

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
  INVALID_JSON: "INVALID_JSON",       // structured output could not be parsed
  SCHEMA_VALIDATION_FAILED: "SCHEMA_VALIDATION_FAILED", // parsed JSON failed the caller schema
  EMPTY_RESPONSE: "EMPTY_RESPONSE",   // provider returned no usable content
  BUDGET_EXCEEDED: "BUDGET_EXCEEDED", // request-scoped investigation budget refused a call
};

const MAX_SAFE_MODEL_TOKENS = 1_000_000;
const COST_CLASS_MULTIPLIER = Object.freeze({ LOW: 1, MEDIUM: 3, HIGH: 8 });

function boundedTokenCount(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0
    ? Math.min(MAX_SAFE_MODEL_TOKENS, Math.floor(number))
    : null;
}

/**
 * Normalizes vendor-specific usage metadata without allowing prompts,
 * responses, headers, or provider request bodies to cross the gateway.
 */
export function normalizeModelUsage(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const inputTokens = boundedTokenCount(value.inputTokens ?? value.input_tokens ?? value.prompt_tokens);
  const outputTokens = boundedTokenCount(value.outputTokens ?? value.output_tokens ?? value.completion_tokens);
  const totalTokens = boundedTokenCount(value.totalTokens ?? value.total_tokens);
  if (inputTokens === null && outputTokens === null && totalTokens === null) return null;
  const safeInput = inputTokens ?? 0;
  const safeOutput = outputTokens ?? 0;
  const safeTotal = totalTokens ?? Math.min(MAX_SAFE_MODEL_TOKENS, safeInput + safeOutput);
  return {
    inputTokens: safeInput,
    outputTokens: safeOutput,
    totalTokens: safeTotal,
    source: ["estimated", "mixed"].includes(value.source) ? value.source : "provider",
  };
}

/**
 * Conservative token estimate used for budget admission when a provider does
 * not return usage metadata. It is intentionally approximate and never a
 * billing claim.
 */
export function estimateModelUsage({ systemPrompt = "", userPrompt = "", text = "", maxOutputTokens = 0 } = {}) {
  const inputCharacters = String(systemPrompt || "").length + String(userPrompt || "").length;
  const outputCharacters = String(text || "").length;
  const inputTokens = Math.min(MAX_SAFE_MODEL_TOKENS, Math.ceil(inputCharacters / 4));
  const outputTokens = outputCharacters > 0
    ? Math.min(MAX_SAFE_MODEL_TOKENS, Math.ceil(outputCharacters / 4))
    : Math.min(MAX_SAFE_MODEL_TOKENS, Math.max(0, Math.floor(Number(maxOutputTokens) || 0)));
  return {
    inputTokens,
    outputTokens,
    totalTokens: Math.min(MAX_SAFE_MODEL_TOKENS, inputTokens + outputTokens),
    source: "estimated",
  };
}

export function mergeModelUsage(left, right) {
  const first = normalizeModelUsage(left);
  const second = normalizeModelUsage(right);
  if (!first) return second;
  if (!second) return first;
  return {
    inputTokens: Math.min(MAX_SAFE_MODEL_TOKENS, first.inputTokens + second.inputTokens),
    outputTokens: Math.min(MAX_SAFE_MODEL_TOKENS, first.outputTokens + second.outputTokens),
    totalTokens: Math.min(MAX_SAFE_MODEL_TOKENS, first.totalTokens + second.totalTokens),
    source: first.source === second.source ? first.source : "mixed",
  };
}

/** Relative cost units for admission/observability only; not provider price. */
export function estimatedCostCentsFor({ costClass = "LOW", usage = null } = {}) {
  const safeUsage = normalizeModelUsage(usage) || { totalTokens: 0 };
  const multiplier = COST_CLASS_MULTIPLIER[String(costClass || "LOW").toUpperCase()] || COST_CLASS_MULTIPLIER.LOW;
  return Math.max(1, Math.ceil(safeUsage.totalTokens / 1_000) * multiplier);
}

/** Public-safe error text. Provider response bodies, URLs and stack details
 * must never cross the gateway boundary or be persisted in attempt telemetry. */
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
      return "The AI response did not match the required structured format.";
    case GATEWAY_ERROR_TYPE.SCHEMA_VALIDATION_FAILED:
      return "The AI response did not match the required structured format.";
    case GATEWAY_ERROR_TYPE.EMPTY_RESPONSE:
      return "The AI provider returned an empty response.";
    case GATEWAY_ERROR_TYPE.BUDGET_EXCEEDED:
      return "The investigation budget does not allow another AI provider call.";
    default:
      return "The AI request could not be completed.";
  }
}

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
  usage = null,
  estimatedCostCents = null,
}) {
  return {
    provider,
    model,
    ok,
    errorType,
    errorMessage: ok ? null : sanitizeGatewayError(errorType, errorMessage),
    latencyMs: Number(latencyMs.toFixed?.(2) ?? latencyMs),
    usage: normalizeModelUsage(usage),
    estimatedCostCents: Number.isFinite(Number(estimatedCostCents))
      ? Math.max(0, Math.floor(Number(estimatedCostCents)))
      : null,
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
  usage = null,
  estimatedCostCents = 0,
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
    errorMessage: ok ? null : sanitizeGatewayError(errorType, errorMessage),
    requestId: requestId || createSecureId("req_gw"),
    totalLatencyMs: Number(totalLatencyMs.toFixed?.(2) ?? totalLatencyMs),
    usage: normalizeModelUsage(usage),
    estimatedCostCents: Number.isFinite(Number(estimatedCostCents))
      ? Math.max(0, Math.floor(Number(estimatedCostCents)))
      : 0,
    timestamp: Date.now(),
    schemaVersion: "ai-gateway-v1",
  };
}
