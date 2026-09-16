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
    fallbackModelId: "gemini-3.5-flash-lite",
    knownLimitations: "OpenAI runtime is disabled intentionally for the Gemini-only production release; compatibility code is retained without active routing.",
  },
  {
    providerId: "gemini",
    modelId: "gemini-3.8-flash",
    assignedRole: "MULTIMODAL_INSPECTION_SYNTHESIS",
    capabilities: [
      "MULTIMODAL",
      "MULTIMODAL_INSPECTION",
      "DOCUMENT",
      "CLAIM_EXTRACTION",
      "DEEP_REASONING",
    ],
    configured: Boolean(canonicalEnv.GEMINI_API_KEY),
    active: true,
    runtimeStatus: "ACTIVE",
    structuredOutputSupport: true,
    multimodal: true,
    toolSupport: false,
    approxCostClass: "LOW_COST_MULTIMODAL",
    fallbackModelId: "gemini-3.5-flash-lite",
    knownLimitations: "Subject to upstream availability; the adapter uses Interactions first and an explicit generateContent compatibility fallback.",
  },
  {
    providerId: "gemini",
    modelId: "gemini-3.5-flash-lite",
    assignedRole: "MULTIMODAL_FAST_FALLBACK",
    capabilities: [
      "MULTIMODAL",
      "MULTIMODAL_INSPECTION",
      "DOCUMENT",
      "FAST_CLASSIFICATION",
      "CLAIM_EXTRACTION",
    ],
    configured: Boolean(canonicalEnv.GEMINI_API_KEY),
    active: false,
    runtimeStatus: "COMPATIBILITY_FALLBACK_NOT_ACTIVE",
    structuredOutputSupport: true,
    multimodal: true,
    toolSupport: false,
    approxCostClass: "LOW_COST_MULTIMODAL",
    fallbackModelId: "DeterministicPolicyReasoner_v5",
    knownLimitations: "Lower reasoning budget than Gemini 3.8 Flash; live smoke verified a minimal Interactions response, while quota remains deployment-controlled.",
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
