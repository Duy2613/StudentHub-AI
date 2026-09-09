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
    modelId: "gpt-5.6-luna",
    assignedRole: "REASONER_CRITIC_CLASSIFIER",
    capabilities: [
      "FAST_CLASSIFICATION",
      "CLAIM_EXTRACTION",
      "QUERY_GENERATION",
      "RELATION_CHECKING",
      "INDEPENDENT_CRITIC",
      "REASONING",
    ],
    configured: Boolean(canonicalEnv.OPENAI_API_KEY),
    structuredOutputSupport: true,
    multimodal: false,
    toolSupport: true,
    approxCostClass: "LOW_COST_HIGH_THROUGHPUT",
    fallbackModelId: "DeterministicPolicyReasoner_v5",
    knownLimitations: "Text-only input; requires citation validation to prevent hallucinated IDs.",
  },
  {
    providerId: "gemini",
    modelId: "gemini-3.8-flash",
    assignedRole: "MULTIMODAL_INSPECTION_SYNTHESIS",
    capabilities: [
      "MULTIMODAL_INSPECTION",
      "SCREENSHOT_ANALYSIS",
      "PDF_DOCUMENT_OCR",
      "CLAIM_EXTRACTION",
      "DEEP_SYNTHESIS",
    ],
    configured: Boolean(canonicalEnv.GEMINI_API_KEY),
    structuredOutputSupport: true,
    multimodal: true,
    toolSupport: true,
    approxCostClass: "LOW_COST_MULTIMODAL",
    fallbackModelId: "gemini-3.6-flash",
    knownLimitations: "Subject to upstream 503 high demand during peak spikes; requires maxOutputTokens >= 1024 due to thought tokens.",
  },
  {
    providerId: "gemini",
    modelId: "gemini-3.6-flash",
    assignedRole: "MULTIMODAL_RESILLIENT_FALLBACK",
    capabilities: [
      "MULTIMODAL_INSPECTION",
      "SCREENSHOT_ANALYSIS",
      "FAST_SYNTHESIS",
    ],
    configured: Boolean(canonicalEnv.GEMINI_API_KEY),
    structuredOutputSupport: true,
    multimodal: true,
    toolSupport: true,
    approxCostClass: "VERY_LOW_COST",
    fallbackModelId: "DeterministicPolicyReasoner_v5",
    knownLimitations: "Slightly lower reasoning depth than 3.8 Flash, but highly available with low latency.",
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
      structuredOutputSupport: m.structuredOutputSupport,
      multimodal: m.multimodal,
      approxCostClass: m.approxCostClass,
      fallbackModelId: m.fallbackModelId,
      knownLimitations: m.knownLimitations,
    }));
  }
}
