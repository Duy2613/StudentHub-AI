/**
 * AI Gateway — Configuration, Model Catalog & Capability Routing Table
 *
 * Single source of truth for which (provider, model) pairs may serve which
 * capability, in fallback order. Update this file when a new provider is
 * researched and documented in docs/PROVIDER-REGISTRY.md — never hard-code
 * a model name inside a Layer/Engine.
 */

import { AI_CAPABILITY, MODEL_TIER, PROVIDER_FAMILY } from "../types.js";

export const AI_GATEWAY_CONFIG = {
  VERSION: "ai-gateway-v1.0.0",

  SLA: {
    // Hard per-attempt timeout. Layer 2/Layer 4 callers rely on this to stay
    // within their own SLA budgets (Layer2Config/Layer4Config = 3000ms).
    DEFAULT_TIMEOUT_MS: 2500,
    FAST_TIMEOUT_MS: 1500,
  },

  LIMITS: {
    MAX_PROMPT_CHARACTERS: 16000,
    MAX_OUTPUT_TOKENS: 1024,
    MAX_ROUTER_ATTEMPTS: 3, // cap fallback chain length per request
  },

  RETRY: {
    // Only 429/timeout are retried, and only once, on the SAME candidate,
    // before moving to the next candidate in the fallback chain.
    MAX_RETRIES_PER_CANDIDATE: 1,
    RETRYABLE_HTTP_STATUS: [429, 500, 502, 503, 504],
  },

  /**
   * Model catalog: normalized entries describing every model this gateway
   * knows how to call. `envKey` is the environment variable that must be
   * non-empty for the entry to be considered CONFIGURED.
   */
  MODEL_CATALOG: {
    // ── GenSpark OpenAI-compatible LLM proxy ────────────────────────────
    // Docs: get_external_api_docs("openai") — official base URL/model list.
    // Requires OPENAI_API_KEY + OPENAI_BASE_URL (auto-injected by the
    // platform when the user configures an LLM API key for this project).
    GPT_5_NANO: {
      id: "GPT_5_NANO",
      provider: PROVIDER_FAMILY.OPENAI_COMPATIBLE,
      model: "gpt-5-nano",
      tier: MODEL_TIER.FAST_CHEAP,
      envKey: "OPENAI_API_KEY",
      capabilities: [AI_CAPABILITY.FAST_CLASSIFICATION],
      supportsJsonMode: true,
      costClass: "LOW",
    },
    GPT_5_MINI: {
      id: "GPT_5_MINI",
      provider: PROVIDER_FAMILY.OPENAI_COMPATIBLE,
      model: "gpt-5-mini",
      tier: MODEL_TIER.BALANCED,
      envKey: "OPENAI_API_KEY",
      capabilities: [
        AI_CAPABILITY.FAST_CLASSIFICATION,
        AI_CAPABILITY.CLAIM_EXTRACTION,
        AI_CAPABILITY.SUMMARIZATION,
        AI_CAPABILITY.RERANKING,
      ],
      supportsJsonMode: true,
      costClass: "MEDIUM",
    },
    GPT_5_1: {
      id: "GPT_5_1",
      provider: PROVIDER_FAMILY.OPENAI_COMPATIBLE,
      model: "gpt-5.1",
      tier: MODEL_TIER.DEEP,
      envKey: "OPENAI_API_KEY",
      capabilities: [
        AI_CAPABILITY.DEEP_REASONING,
        AI_CAPABILITY.CLAIM_EXTRACTION,
        AI_CAPABILITY.DOCUMENT,
        AI_CAPABILITY.SUMMARIZATION,
      ],
      supportsJsonMode: true,
      costClass: "HIGH",
    },
    GPT_5_2: {
      id: "GPT_5_2",
      provider: PROVIDER_FAMILY.OPENAI_COMPATIBLE,
      model: "gpt-5.2",
      tier: MODEL_TIER.DEEP,
      envKey: "OPENAI_API_KEY",
      capabilities: [
        AI_CAPABILITY.DEEP_REASONING,
        AI_CAPABILITY.DOCUMENT,
      ],
      supportsJsonMode: true,
      costClass: "HIGH",
    },
    // ── Google Gemini (direct REST, multimodal) ─────────────────────────
    // Historical provider from the Trust Engine seed (atudent.pdf). Kept as
    // a first-class multimodal candidate — used only if the operator
    // configures GEMINI_API_KEY; otherwise silently excluded from routing.
    GEMINI_FLASH: {
      id: "GEMINI_FLASH",
      provider: PROVIDER_FAMILY.GEMINI,
      model: "gemini-2.5-flash",
      tier: MODEL_TIER.MULTIMODAL,
      envKey: "GEMINI_API_KEY",
      capabilities: [
        AI_CAPABILITY.MULTIMODAL,
        AI_CAPABILITY.FAST_CLASSIFICATION,
        AI_CAPABILITY.CLAIM_EXTRACTION,
      ],
      supportsJsonMode: true,
      costClass: "LOW",
    },
  },

  /**
   * Capability -> ordered fallback chain of model catalog entry ids.
   * The router tries entries in order, skipping any whose envKey is unset,
   * and stops at the first successful, schema-valid response.
   */
  CAPABILITY_ROUTES: {
    [AI_CAPABILITY.FAST_CLASSIFICATION]: ["GPT_5_NANO", "GEMINI_FLASH", "GPT_5_MINI"],
    [AI_CAPABILITY.CLAIM_EXTRACTION]: ["GPT_5_MINI", "GEMINI_FLASH", "GPT_5_1"],
    [AI_CAPABILITY.DEEP_REASONING]: ["GPT_5_1", "GPT_5_2", "GPT_5_MINI"],
    [AI_CAPABILITY.MULTIMODAL]: ["GEMINI_FLASH", "GPT_5_MINI"],
    [AI_CAPABILITY.DOCUMENT]: ["GPT_5_1", "GPT_5_2"],
    [AI_CAPABILITY.EMBEDDING]: [],   // no embedding provider configured yet — router returns NOT_CONFIGURED
    [AI_CAPABILITY.RERANKING]: ["GPT_5_MINI"],
    [AI_CAPABILITY.SUMMARIZATION]: ["GPT_5_MINI", "GPT_5_1"],
  },
};
