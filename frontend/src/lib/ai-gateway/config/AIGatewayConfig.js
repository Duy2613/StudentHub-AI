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
  GEMINI_EXTENDED_QA_MODEL_IDS,
  getConfiguredGeminiModelChain,
  isQaExtendedFallbackEnabled,
  validateGeminiProductionRoute,
  validateGeminiExtendedQaRoute,
} from "./GeminiModelCatalog.js";

export const GEMINI_PRODUCTION_CHAIN_ENTRY_IDS = Object.freeze([
  "GEMINI_3_8_FLASH",
  "GEMINI_3_7_FLASH",
  "GEMINI_3_6_FLASH",
]);

export const GEMINI_EXTENDED_QA_CHAIN_ENTRY_IDS = Object.freeze([
  "GEMINI_3_5_FLASH",
  "GEMINI_3_5_FLASH_LITE",
  "GEMINI_3_1_FLASH_LITE",
]);

const GEMINI_CAPABILITIES = Object.freeze([
  AI_CAPABILITY.MULTIMODAL,
  AI_CAPABILITY.FAST_CLASSIFICATION,
  AI_CAPABILITY.CLAIM_EXTRACTION,
  AI_CAPABILITY.DEEP_REASONING,
  AI_CAPABILITY.DOCUMENT,
  AI_CAPABILITY.SUMMARIZATION,
]);

function geminiEntry(id, model, {
  thinkingLevel = "low",
  active = true,
  shadowOnly = false,
  compatibilityGate = null,
  productionTier = "PRIMARY",
  qaFallbackEligible = true,
  priority = 1,
  strengthClass = "HIGH",
  costClass = "LOW",
  latencyClass = "MEDIUM",
  admittedAt = "2026-03-01T00:00:00Z",
  probeStatus = "PROVEN",
} = {}) {
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
    supportsImageInput: true,
    structuredOutputContract: active ? "L4_TRUST_VERIFICATION_V1" : "PENDING_COMPATIBILITY_GATE",
    active,
    shadowOnly,
    compatibilityGate,
    productionTier,
    qaFallbackEligible,
    priority,
    strengthClass,
    costClass,
    latencyClass,
    cooldownPolicy: {
      baseCooldownMs: 5000,
      dailyQuotaCooldownMs: 60 * 60 * 1000,
    },
    admittedAt,
    probeStatus,
  };
}

const CONFIGURED_GEMINI_ROUTE = getConfiguredGeminiModelChain();
const CONFIGURED_GEMINI_ENTRY_IDS = Object.freeze(
  CONFIGURED_GEMINI_ROUTE.configured && CONFIGURED_GEMINI_ROUTE.valid
    ? CONFIGURED_GEMINI_ROUTE.models.map((_, index) => `GEMINI_CONFIGURED_${index + 1}`)
    : [],
);
const CONFIGURED_GEMINI_ENTRIES = Object.fromEntries(
  CONFIGURED_GEMINI_ENTRY_IDS.map((entryId, index) => [
    entryId,
    geminiEntry(entryId, CONFIGURED_GEMINI_ROUTE.models[index], {
      priority: index + 1,
      strengthClass: index === 0 ? "HIGH" : "MEDIUM",
      latencyClass: index === 0 ? "MEDIUM" : "FAST",
      productionTier: "CONFIGURED",
      qaFallbackEligible: true,
    }),
  ]),
);
// If an explicit route exists but is invalid, the active route is empty and
// the gateway reports NOT_CONFIGURED/MODEL_INCOMPATIBLE instead of guessing.
const ACTIVE_GEMINI_CHAIN_ENTRY_IDS = Object.freeze(
  CONFIGURED_GEMINI_ROUTE.configured ? [...CONFIGURED_GEMINI_ENTRY_IDS] : [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS],
);

export const GEMINI_CONFIGURED_CHAIN_ENTRY_IDS = CONFIGURED_GEMINI_ENTRY_IDS;

export const AI_GATEWAY_CONFIG = {
  VERSION: "ai-gateway-v1.4.0-gemini-extended-qa",

  SLA: {
    DEFAULT_TIMEOUT_MS: 2500,
    FAST_TIMEOUT_MS: 1500,
  },

  LIMITS: {
    // Source/evidence URLs are lossless at the trust boundary. Keep a large
    // transport envelope for complete OCR/QR context and full URL sets; the
    // provider still owns its own context-window enforcement.
    MAX_PROMPT_CHARACTERS: 4_000_000,
    MAX_OUTPUT_TOKENS: 8192,
    MAX_ROUTER_ATTEMPTS: 12,
    MAX_TRACE_ATTEMPTS: 12,
  },

  // Layer 4 may need to hop across several model-specific quota buckets. The
  // final synthesis therefore gets a larger bounded budget than the generic
  // gateway default; the gap-analysis pass remains deliberately shorter.
  BUDGET: {
    // Six-model failover window: enough time to try every candidate in order
    // when a provider reports quota/capacity pressure on earlier models.
    L4_TOTAL_MS: 45_000,
    L4_GAP_TOTAL_MS: 15_000,
    L4_TOTAL_DEMO_BUDGET_MS: 60_000,
    L4_HEALTHY_MODEL_TIMEOUT_MS: 7500,
    L4_UNKNOWN_MODEL_TIMEOUT_MS: 5000,
    L4_PER_MODEL_TIMEOUT_MS: 7500,
    L4_GAP_PER_MODEL_TIMEOUT_MS: 5000,
    L4_RESERVED_HEALTHY_BUDGET_MS: 7500,
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
    GEMINI_3_8_FLASH: geminiEntry("GEMINI_3_8_FLASH", GEMINI_PRODUCTION_MODEL_IDS[0], { priority: 1, strengthClass: "HIGH", latencyClass: "MEDIUM", productionTier: "PRIMARY" }),
    GEMINI_3_7_FLASH: geminiEntry("GEMINI_3_7_FLASH", GEMINI_PRODUCTION_MODEL_IDS[1], { priority: 2, strengthClass: "HIGH", latencyClass: "FAST", productionTier: "PRIMARY" }),
    GEMINI_3_6_FLASH: geminiEntry("GEMINI_3_6_FLASH", GEMINI_PRODUCTION_MODEL_IDS[2], { priority: 3, strengthClass: "MEDIUM", latencyClass: "FAST", productionTier: "PRIMARY" }),

    // Operator-supplied server-only route. These entries exist only when the
    // configured model chain passed the catalog validation above.
    ...CONFIGURED_GEMINI_ENTRIES,

    // ── Extended QA fallback chain ─────────────────────────────────────────
    GEMINI_3_5_FLASH: geminiEntry("GEMINI_3_5_FLASH", "gemini-3.5-flash", { priority: 4, strengthClass: "MEDIUM", latencyClass: "FAST", costClass: "LOW", productionTier: "EXTENDED_QA", admittedAt: "2026-09-18T00:00:00Z", probeStatus: "PROVEN" }),
    GEMINI_3_5_FLASH_LITE: geminiEntry("GEMINI_3_5_FLASH_LITE", "gemini-3.5-flash-lite", { priority: 5, strengthClass: "LIGHT", latencyClass: "ULTRA_FAST", costClass: "VERY_LOW", productionTier: "EXTENDED_QA", admittedAt: "2026-09-18T00:00:00Z", probeStatus: "PROVEN" }),
    GEMINI_3_1_FLASH_LITE: geminiEntry("GEMINI_3_1_FLASH_LITE", "gemini-3.1-flash-lite", { priority: 6, strengthClass: "LIGHT", latencyClass: "ULTRA_FAST", costClass: "VERY_LOW", productionTier: "EXTENDED_QA", admittedAt: "2026-09-18T00:00:00Z", probeStatus: "PROVEN" }),

    GEMINI_2_5_FLASH: {
      ...geminiEntry("GEMINI_2_5_FLASH", "gemini-2.5-flash", { active: false, shadowOnly: true, compatibilityGate: "UNAVAILABLE_TO_NEW_USERS", productionTier: "RETIRED", qaFallbackEligible: false, priority: 99, probeStatus: "RETIRED" }),
      legacyAlias: true,
      supportsJsonMode: false,
      supportsStructuredOutput: false,
      supportsImageInput: false,
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
      ...geminiEntry("GEMINI_FLASH_LITE", "gemini-3.5-flash-lite", { active: false, shadowOnly: true, compatibilityGate: "EXTENDED_QA_FALLBACK_ONLY", productionTier: "EXTENDED_QA" }),
      legacyAlias: true,
      supportsJsonMode: true,
      supportsStructuredOutput: true,
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
    [AI_CAPABILITY.FAST_CLASSIFICATION]: [...ACTIVE_GEMINI_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.CLAIM_EXTRACTION]: [...ACTIVE_GEMINI_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.DEEP_REASONING]: [...ACTIVE_GEMINI_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.MULTIMODAL]: [...ACTIVE_GEMINI_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.DOCUMENT]: [...ACTIVE_GEMINI_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.EMBEDDING]: [],
    [AI_CAPABILITY.RERANKING]: [...ACTIVE_GEMINI_CHAIN_ENTRY_IDS],
    [AI_CAPABILITY.SUMMARIZATION]: [...ACTIVE_GEMINI_CHAIN_ENTRY_IDS],
  },
};

export function resolveCapabilityRoute(capability, { allowQaExtended = null } = {}) {
  const qaExtendedActive = typeof allowQaExtended === "boolean" ? allowQaExtended : isQaExtendedFallbackEnabled();
  const base = AI_GATEWAY_CONFIG.CAPABILITY_ROUTES[capability] || [];
  if (CONFIGURED_GEMINI_ROUTE.configured) return [...base];
  if (!qaExtendedActive) {
    return [...base];
  }
  if (capability === AI_CAPABILITY.MULTIMODAL || capability === AI_CAPABILITY.DEEP_REASONING || capability === AI_CAPABILITY.DOCUMENT || capability === AI_CAPABILITY.RERANKING) {
    return [...GEMINI_PRODUCTION_CHAIN_ENTRY_IDS, ...GEMINI_EXTENDED_QA_CHAIN_ENTRY_IDS];
  }
  if (capability === AI_CAPABILITY.FAST_CLASSIFICATION || capability === AI_CAPABILITY.CLAIM_EXTRACTION || capability === AI_CAPABILITY.SUMMARIZATION) {
    return ["GEMINI_3_5_FLASH_LITE", "GEMINI_3_1_FLASH_LITE", "GEMINI_3_5_FLASH", "GEMINI_3_8_FLASH", "GEMINI_3_7_FLASH", "GEMINI_3_6_FLASH"];
  }
  return [...base];
}

export const GEMINI_MODEL_ROUTE_VALIDATION = validateGeminiProductionRoute(
  GEMINI_PRODUCTION_CHAIN_ENTRY_IDS.map((entryId) => AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId].model)
);

export const GEMINI_EXTENDED_MODEL_ROUTE_VALIDATION = validateGeminiExtendedQaRoute(
  GEMINI_EXTENDED_QA_CHAIN_ENTRY_IDS.map((entryId) => AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId].model)
);

export function validateCatalogModelEntry(entryId, { allowQaExtended = null } = {}) {
  const qaExtendedActive = typeof allowQaExtended === "boolean" ? allowQaExtended : isQaExtendedFallbackEnabled();
  const entry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
  if (!entry) return { valid: false, entryId, model: null, code: "CATALOG_ENTRY_MISSING" };
  if (entry.provider !== PROVIDER_FAMILY.GEMINI) {
    return { valid: false, entryId, model: entry.model || null, code: "PROVIDER_NOT_IN_GEMINI_ROUTE" };
  }
  const isPrimary = GEMINI_PRODUCTION_MODEL_IDS.includes(entry.model);
  const isExtended = GEMINI_EXTENDED_QA_MODEL_IDS.includes(entry.model);
  if (!isPrimary && (!isExtended || !qaExtendedActive)) {
    return { valid: false, entryId, model: entry.model || null, code: isExtended ? "QA_EXTENDED_GATE_REQUIRED" : "MODEL_NOT_IN_PRODUCTION_CHAIN" };
  }
  if (entry.active !== true || entry.shadowOnly === true) {
    return { valid: false, entryId, model: entry.model, code: "MODEL_NOT_ACTIVE" };
  }
  if (entry.supportsJsonMode !== true || entry.supportsStructuredOutput !== true || entry.structuredOutputContract !== "L4_TRUST_VERIFICATION_V1") {
    return { valid: false, entryId, model: entry.model, code: "MODEL_INCOMPATIBLE" };
  }
  return { valid: true, entryId, model: entry.model, code: "MODEL_ENTRY_VALID" };
}

export function validateActiveModelIdentifiers() {
  if (CONFIGURED_GEMINI_ROUTE.configured) {
    const entries = CONFIGURED_GEMINI_ROUTE.models.map((model, index) => {
      const entryId = CONFIGURED_GEMINI_ENTRY_IDS[index];
      return entryId
        ? validateCatalogModelEntry(entryId, { allowQaExtended: isQaExtendedFallbackEnabled() })
        : { valid: false, entryId: `GEMINI_CONFIGURED_${index + 1}`, model, code: "MODEL_ROUTE_INVALID" };
    });
    return Object.freeze({
      valid: CONFIGURED_GEMINI_ROUTE.valid && entries.length > 0 && entries.every((entry) => entry.valid),
      entries,
      expectedModels: [...CONFIGURED_GEMINI_ROUTE.models],
      source: "SERVER_ENVIRONMENT",
      code: CONFIGURED_GEMINI_ROUTE.code,
    });
  }
  const entries = GEMINI_PRODUCTION_CHAIN_ENTRY_IDS.map((id) => validateCatalogModelEntry(id, { allowQaExtended: false }));
  return Object.freeze({
    valid: GEMINI_MODEL_ROUTE_VALIDATION.valid && entries.every((entry) => entry.valid),
    entries,
    expectedModels: [...GEMINI_PRODUCTION_MODEL_IDS],
    source: "STATIC_COMPATIBILITY_CATALOG",
    code: "MODEL_ROUTE_COMPATIBILITY_DEFAULT",
  });
}

export function getTrustL4ResultPriority() {
  const env = (process.env.TRUST_L4_RESULT_PRIORITY || "").trim().toUpperCase();
  return env === "DEMO" ? "DEMO" : "NORMAL";
}

export function isL4DemoPriorityEnabled() {
  return getTrustL4ResultPriority() === "DEMO";
}

