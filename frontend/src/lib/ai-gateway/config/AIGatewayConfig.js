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
  VERSION: "ai-gateway-v1.2.0-gemini-only",

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
   * knows how to call. `envKey` is a public-safe configuration label; provider
   * adapters accept the canonical name and the current deployment alias.
   */
  MODEL_CATALOG: {
    // ── OpenAI provider ─────────────────────────────────────────────────
    // The official endpoint uses the Responses API.  An explicitly configured
    // approved proxy may still use the compatibility path in the adapter.
    OPENAI_FAST: {
      id: "OPENAI_FAST",
      provider: PROVIDER_FAMILY.OPENAI_COMPATIBLE,
      model: "gpt-4o-mini",
      tier: MODEL_TIER.FAST_CHEAP,
      envKey: "OPEN_AI_KEY_1 | OPENAI_API_KEY",
      capabilities: [
        AI_CAPABILITY.FAST_CLASSIFICATION,
        AI_CAPABILITY.CLAIM_EXTRACTION,
        AI_CAPABILITY.RERANKING,
        AI_CAPABILITY.SUMMARIZATION,
      ],
      supportsJsonMode: true,
      costClass: "LOW",
    },
    OPENAI_STANDARD: {
      id: "OPENAI_STANDARD",
      provider: PROVIDER_FAMILY.OPENAI_COMPATIBLE,
      model: "gpt-4o",
      tier: MODEL_TIER.BALANCED,
      envKey: "OPEN_AI_KEY_1 | OPENAI_API_KEY",
      capabilities: [
        AI_CAPABILITY.CLAIM_EXTRACTION,
        AI_CAPABILITY.DEEP_REASONING,
        AI_CAPABILITY.DOCUMENT,
        AI_CAPABILITY.RERANKING,
        AI_CAPABILITY.SUMMARIZATION,
      ],
      supportsJsonMode: true,
      costClass: "MEDIUM",
    },

    // ── Google Gemini Interactions API ───────────────────────────────────
    GEMINI_FLASH: {
      id: "GEMINI_FLASH",
      provider: PROVIDER_FAMILY.GEMINI,
      model: "gemini-3.8-flash",
      tier: MODEL_TIER.MULTIMODAL,
      envKey: "GEMINI_API_KEY | GEMINI_KEY_1",
      capabilities: [
        AI_CAPABILITY.MULTIMODAL,
        AI_CAPABILITY.FAST_CLASSIFICATION,
        AI_CAPABILITY.CLAIM_EXTRACTION,
        AI_CAPABILITY.DEEP_REASONING,
        AI_CAPABILITY.DOCUMENT,
      ],
      thinkingLevel: "low",
      supportsJsonMode: true,
      costClass: "LOW",
    },
    GEMINI_FLASH_LITE: {
      id: "GEMINI_FLASH_LITE",
      provider: PROVIDER_FAMILY.GEMINI,
      model: "gemini-3.5-flash-lite",
      tier: MODEL_TIER.MULTIMODAL,
      envKey: "GEMINI_API_KEY | GEMINI_KEY_1",
      capabilities: [
        AI_CAPABILITY.MULTIMODAL,
        AI_CAPABILITY.FAST_CLASSIFICATION,
        AI_CAPABILITY.CLAIM_EXTRACTION,
        AI_CAPABILITY.DOCUMENT,
      ],
      thinkingLevel: "minimal",
      supportsJsonMode: true,
      costClass: "LOW",
    },
  },

  /**
   * Capability -> ordered fallback chain of model catalog entry ids.
   * Gemini is the only active production provider in this release. The
   * catalog retains compatibility metadata for OpenAI, but no active route
   * may select it while OPENAI_RUNTIME is intentionally disabled.
   */
  CAPABILITY_ROUTES: {
    [AI_CAPABILITY.FAST_CLASSIFICATION]: ["GEMINI_FLASH"],
    [AI_CAPABILITY.CLAIM_EXTRACTION]: ["GEMINI_FLASH"],
    [AI_CAPABILITY.DEEP_REASONING]: ["GEMINI_FLASH"],
    [AI_CAPABILITY.MULTIMODAL]: ["GEMINI_FLASH"],
    [AI_CAPABILITY.DOCUMENT]: ["GEMINI_FLASH"],
    [AI_CAPABILITY.EMBEDDING]: [],   // no embedding provider configured yet — router returns NOT_CONFIGURED
    [AI_CAPABILITY.RERANKING]: ["GEMINI_FLASH"],
    [AI_CAPABILITY.SUMMARIZATION]: ["GEMINI_FLASH"],
  },
};
