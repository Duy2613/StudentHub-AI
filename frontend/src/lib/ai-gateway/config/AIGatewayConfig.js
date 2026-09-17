/**
 * AI Gateway — configuration, model catalog and capability routes.
 *
 * The active Google chain is deliberately explicit and ordered.  A model
 * being present in a public catalog does not make it available to this
 * project; provider initialization validates each identifier and the router
 * still treats upstream availability as runtime state.
 */

import { AI_CAPABILITY, MODEL_TIER, PROVIDER_FAMILY } from "../types.js";
import {
  GEMMA_SHADOW_MODEL_IDS,
  GEMINI_PRODUCTION_MODEL_IDS,
  validateGeminiProductionRoute,
} from "./GeminiModelCatalog.js";

export const GEMINI_PRODUCTION_CHAIN_ENTRY_IDS = Object.freeze([
  "GEMINI_3_8_FLASH",
  "GEMINI_3_7_FLASH",
  "GEMINI_3_6_FLASH",
]);

const GEMINI_CAPABILITIES = Object.freeze([
  AI_CAPABILITY.MULTIMODAL,
  AI_CAPABILITY.FAST_CLASSIFICATION,
  AI_CAPABILITY.CLAIM_EXTRACTION,
  AI_CAPABILITY.DEEP_REASONING,
  AI_CAPABILITY.DOCUMENT,
  AI_CAPABILITY.SUMMARIZATION,
]);

function geminiEntry(id, model, { thinkingLevel = "low", active = true, shadowOnly = false, compatibilityGate = null } = {}) {
  return {
    id,
    provider: PROVIDER_FAMILY.GEMINI,
    model,
    tier: MODEL_TIER.MULTIMODAL,
    envKey: "GEMINI_API_KEY",
    capabilities: [...GEMINI_CAPABILITIES],
    thinkingLevel,
    supportsJsonMode: active,
    supportsStructuredOutput: active,
    structuredOutputContract: active ? "L4_TRUST_VERIFICATION_V1" : "PENDING_COMPATIBILITY_GATE",
    active,
    shadowOnly,
    compatibilityGate,
    costClass: "LOW",
  };
}

export const AI_GATEWAY_CONFIG = {
  VERSION: "ai-gateway-v1.3.0-gemini-multi-model",

  SLA: {
    DEFAULT_TIMEOUT_MS: 2500,
    FAST_TIMEOUT_MS: 1500,
  },

  LIMITS: {
    MAX_PROMPT_CHARACTERS: 16_000,
    MAX_OUTPUT_TOKENS: 1024,
    MAX_ROUTER_ATTEMPTS: GEMINI_PRODUCTION_CHAIN_ENTRY_IDS.length,
    MAX_TRACE_ATTEMPTS: 12,
  },

  // Health-aware budget reservation: ensure healthy terminal candidates (3.6)
  // preserve ~6.8s of the total 10s budget to complete structured generation.
  BUDGET: {
    L4_TOTAL_MS: 10_000,
    L4_PER_MODEL_TIMEOUT_MS: 7000,
    L4_RESERVED_HEALTHY_BUDGET_MS: 6800,
    DEFAULT_TOTAL_MS: 10_000,
    MIN_ATTEMPT_MS: 250,
  },

  RETRY: {
    // A model-specific fallback is cheaper and clearer than retrying the same
    // quota bucket. One provider call is made per model in a routing sequence.
    MAX_RETRIES_PER_CANDIDATE: 0,
    RETRYABLE_HTTP_STATUS: [429, 503, 404],
  },

  CIRCUIT_BREAKER: {
    MAX_ENTRIES: 32,
    BASE_COOLDOWN_MS: 5000,
    MAX_COOLDOWN_MS: 30 * 60 * 1000,
    DAILY_QUOTA_COOLDOWN_MS: 60 * 60 * 1000,
  },

  MODEL_CATALOG: {
    // Compatibility metadata remains available to old imports, but no active
    // capability route below can select OpenAI in this release.
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
      active: false,
      compatibilityOnly: true,
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
      active: false,
      compatibilityOnly: true,
      costClass: "MEDIUM",
    },

    // ── Active Google Gemini production chain ────────────────────────────
    GEMINI_3_8_FLASH: geminiEntry("GEMINI_3_8_FLASH", GEMINI_PRODUCTION_MODEL_IDS[0]),
    GEMINI_3_7_FLASH: geminiEntry("GEMINI_3_7_FLASH", GEMINI_PRODUCTION_MODEL_IDS[1]),
    GEMINI_3_6_FLASH: geminiEntry("GEMINI_3_6_FLASH", GEMINI_PRODUCTION_MODEL_IDS[2]),
    GEMINI_2_5_FLASH: {
      ...geminiEntry("GEMINI_2_5_FLASH", "gemini-2.5-flash", { active: false, shadowOnly: true, compatibilityGate: "UNAVAILABLE_TO_NEW_USERS" }),
      legacyAlias: true,
      supportsJsonMode: false,
      supportsStructuredOutput: false,
    },

    // Legacy catalog aliases are inactive so they cannot create an accidental
    // fifth route or bypass the explicit production chain.
    GEMINI_FLASH: {
      ...geminiEntry("GEMINI_FLASH", GEMINI_PRODUCTION_MODEL_IDS[0], { active: false, shadowOnly: true }),
      legacyAlias: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
      structuredOutputContract: "L4_TRUST_VERIFICATION_V1",
    },
    GEMINI_FLASH_LITE: {
      ...geminiEntry("GEMINI_FLASH_LITE", "gemini-3.5-flash-lite", { active: false, shadowOnly: true, compatibilityGate: "NOT_IN_PRODUCTION_CHAIN" }),
      legacyAlias: true,
      supportsJsonMode: false,
      supportsStructuredOutput: false,
    },

    // Gemma remains outside production routing until the exact Layer 4 gate
    // passes. These entries are discoverable for an explicit probe only.
    GEMMA_4_31B_IT: {
      ...geminiEntry("GEMMA_4_31B_IT", GEMMA_SHADOW_MODEL_IDS[0], { active: false, shadowOnly: true, compatibilityGate: "REQUIRED" }),
      supportsJsonMode: false,
      supportsStructuredOutput: false,
    },
    GEMMA_4_26B_A4B_IT: {
      ...geminiEntry("GEMMA_4_26B_A4B_IT", GEMMA_SHADOW_MODEL_IDS[1], { active: false, shadowOnly: true, compatibilityGate: "REQUIRED" }),
      supportsJsonMode: false,
      supportsStructuredOutput: false,
    },
  },

  CAPABILITY_ROUTES: {
    [AI_CAPABILITY.FAST_CLASSIFICATION]: [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.CLAIM_EXTRACTION]: [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.DEEP_REASONING]: [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.MULTIMODAL]: [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.DOCUMENT]: [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.EMBEDDING]: [],
    [AI_CAPABILITY.RERANKING]: [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.SUMMARIZATION]: [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS],
  },
};

export const GEMINI_MODEL_ROUTE_VALIDATION = validateGeminiProductionRoute(
  GEMINI_PRODUCTION_CHAIN_ENTRY_IDS.map((entryId) => AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId].model)
);

export function validateCatalogModelEntry(entryId) {
  const entry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
  if (!entry) return { valid: false, entryId, model: null, code: "CATALOG_ENTRY_MISSING" };
  if (entry.provider !== PROVIDER_FAMILY.GEMINI) {
    return { valid: false, entryId, model: entry.model || null, code: "PROVIDER_NOT_IN_GEMINI_ROUTE" };
  }
  const model = GEMINI_PRODUCTION_MODEL_IDS.includes(entry.model)
    ? entry.model
    : null;
  if (!model) return { valid: false, entryId, model: entry.model || null, code: "MODEL_NOT_IN_PRODUCTION_CHAIN" };
  if (entry.active !== true || entry.shadowOnly === true) {
    return { valid: false, entryId, model, code: "MODEL_NOT_ACTIVE" };
  }
  if (entry.supportsJsonMode !== true || entry.supportsStructuredOutput !== true || entry.structuredOutputContract !== "L4_TRUST_VERIFICATION_V1") {
    return { valid: false, entryId, model, code: "MODEL_INCOMPATIBLE" };
  }
  return { valid: true, entryId, model, code: "MODEL_ENTRY_VALID" };
}

export function validateActiveModelIdentifiers() {
  const entries = GEMINI_PRODUCTION_CHAIN_ENTRY_IDS.map(validateCatalogModelEntry);
  return Object.freeze({
    valid: GEMINI_MODEL_ROUTE_VALIDATION.valid && entries.every((entry) => entry.valid),
    entries,
    expectedModels: [...GEMINI_PRODUCTION_MODEL_IDS],
  });
}
