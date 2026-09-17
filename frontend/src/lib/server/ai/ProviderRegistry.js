/**
 * StudentHub AI — Canonical ProviderRegistry (Section 21)
 *
 * Exposes factual, non-sensitive metadata for all integrated AI providers & models:
 * - providerId
 * - modelId
 * - assignedRole (Section 22, 41)
 * - capabilities
 * - configured (boolean)
 * - structuredOutputSupport
 * - multimodal
 * - toolSupport
 * - approxCostClass
 * - fallbackModelId
 * - knownLimitations
 *
 * NEVER exposes raw credentials or API keys.
 */

import { canonicalEnv } from "../env/canonicalEnv.js";
import { AI_GATEWAY_CONFIG, GEMINI_PRODUCTION_CHAIN_ENTRY_IDS } from "../../ai-gateway/config/AIGatewayConfig.js";

const GEMINI_MODEL_PROFILES = GEMINI_PRODUCTION_CHAIN_ENTRY_IDS.map((entryId, index) => {
  const entry = AI_GATEWAY_CONFIG.MODEL_CATALOG[entryId];
  const nextEntry = AI_GATEWAY_CONFIG.MODEL_CATALOG[GEMINI_PRODUCTION_CHAIN_ENTRY_IDS[index + 1]];
  return {
    providerId: "gemini",
    modelId: entry.model,
    assignedRole: index === 0 ? "MULTIMODAL_INSPECTION_SYNTHESIS" : "ORDERED_MODEL_FALLBACK",
    capabilities: [...entry.capabilities],
    configured: Boolean(canonicalEnv.GEMINI_API_KEY),
    active: true,
    runtimeStatus: "ACTIVE_ORDERED_FALLBACK",
    structuredOutputSupport: entry.supportsStructuredOutput === true,
    multimodal: entry.capabilities.includes("MULTIMODAL"),
    toolSupport: false,
    approxCostClass: "LOW_COST_MULTIMODAL",
    fallbackModelId: nextEntry?.model || "DeterministicPolicyReasoner_v5",
    knownLimitations: "The router validates project availability at runtime, applies per-model cooldown, and keeps the deterministic Trust policy authoritative.",
  };
});

export const PROVIDER_REGISTRY = [
  {
    providerId: "openai",
    modelId: "gpt-4o-mini",
    assignedRole: "COMPATIBILITY_ONLY_DISABLED",
    capabilities: [
      "FAST_CLASSIFICATION",
      "CLAIM_EXTRACTION",
      "RERANKING",
      "SUMMARIZATION",
    ],
    configured: false,
    active: false,
    runtimeStatus: canonicalEnv.OPENAI_RUNTIME,
    structuredOutputSupport: true,
    multimodal: false,
    toolSupport: false,
    approxCostClass: "LOW_COST",
    fallbackModelId: "DeterministicPolicyReasoner_v5",
    knownLimitations: "OpenAI runtime is disabled intentionally for the Gemini-only production release; compatibility code is retained without active routing.",
  },
  ...GEMINI_MODEL_PROFILES,
  {
    providerId: "gemini",
    modelId: "gemma-4-31b-it",
    assignedRole: "SHADOW_COMPATIBILITY_CANDIDATE",
    capabilities: ["DEEP_REASONING", "MULTIMODAL", "DOCUMENT"],
    configured: Boolean(canonicalEnv.GEMINI_API_KEY),
    active: false,
    runtimeStatus: "SHADOW_GATE_REQUIRED",
    structuredOutputSupport: false,
    multimodal: true,
    toolSupport: false,
    approxCostClass: "UNVERIFIED",
    fallbackModelId: null,
    knownLimitations: "Not in production fallback until the exact Layer 4 prompt/schema, Vietnamese grounding, safety, latency, quota, and parser gate passes.",
  },
  {
    providerId: "gemini",
    modelId: "gemma-4-26b-a4b-it",
    assignedRole: "SHADOW_COMPATIBILITY_CANDIDATE",
    capabilities: ["DEEP_REASONING", "MULTIMODAL", "DOCUMENT"],
    configured: Boolean(canonicalEnv.GEMINI_API_KEY),
    active: false,
    runtimeStatus: "SHADOW_GATE_REQUIRED",
    structuredOutputSupport: false,
    multimodal: true,
    toolSupport: false,
    approxCostClass: "UNVERIFIED",
    fallbackModelId: null,
    knownLimitations: "Not in production fallback until the exact Layer 4 compatibility gate passes.",
  },
  {
    providerId: "local_engine",
    modelId: "FraudRiskEngine_v1",
    assignedRole: "DOMAIN_SPECIALIST_ADVISORY",
    capabilities: [
      "VIETNAMESE_SCAM_CLASSIFICATION",
      "STUDENT_FINANCIAL_FRAUD_HEURISTICS",
      "URGENCY_PRESSURE_DETECTION",
    ],
    configured: true,
    structuredOutputSupport: true,
    multimodal: false,
    toolSupport: false,
    approxCostClass: "ZERO_EXTERNAL_COST_LOCAL",
    fallbackModelId: null,
    knownLimitations: "Advisory-only heuristic engine; never sole final verdict authority (Section 20).",
  },
];

export class ProviderRegistry {
  static getAllModels() {
    return PROVIDER_REGISTRY;
  }

  static getModel(modelId) {
    return PROVIDER_REGISTRY.find((m) => m.modelId === modelId) || null;
  }

  static getModelsForCapability(capability) {
    return PROVIDER_REGISTRY.filter((m) => m.capabilities.includes(capability));
  }

  static getPublicSummary() {
    return PROVIDER_REGISTRY.map((m) => ({
      providerId: m.providerId,
      modelId: m.modelId,
      assignedRole: m.assignedRole,
      configured: m.configured,
      active: m.active !== false,
      runtimeStatus: m.runtimeStatus || null,
      structuredOutputSupport: m.structuredOutputSupport,
      multimodal: m.multimodal,
      approxCostClass: m.approxCostClass,
      fallbackModelId: m.fallbackModelId,
      knownLimitations: m.knownLimitations,
    }));
  }
}
