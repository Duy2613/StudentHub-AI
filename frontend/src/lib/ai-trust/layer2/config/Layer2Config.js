/**
 * Layer 2 — Configuration, SLA Thresholds, Weights & Limits
 */

export const LAYER_2_CONFIG = {
  // Service level agreements
  SLA: {
    MAX_TIMEOUT_MS: 3000,                // Maximum LLM wait time before falling back to deterministic heuristics
    TARGET_LATENCY_MS: 1200,             // Target multimodal reasoning latency
    FALLBACK_LATENCY_TARGET_MS: 25,      // Latency target for zero-LLM fallback engine
  },

  // Request-level safety is enforced by the API/media artifact boundary.
  // Keep the semantic layer lossless for user text, OCR, and QR payloads;
  // provider context windows still decide how much can be processed at once.
  LIMITS: {
    MAX_TEXT_CHARACTERS: 500000,
    MAX_OCR_CHARACTERS: 500000,
    MAX_CLAIMS_TO_EXTRACT: 15,
    MAX_ENTITIES_TO_EXTRACT: 20,
    MAX_VERIFICATION_TASKS: 10,
  },

  // Confidence Bounds for Decision Resolution
  CONFIDENCE: {
    HARD_BLOCK_THRESHOLD: 0.90,          // Strong compound contextual proof required for BLOCK
    SUSPICIOUS_HIGH_THRESHOLD: 0.70,     // Strong anomaly -> SUSPICIOUS
    NEEDS_VERIFICATION_THRESHOLD: 0.50,  // Unverified claim present -> NEEDS_VERIFICATION
    PASS_MINIMUM_CONFIDENCE: 0.85,       // Clean content confidence
  },

  // Compound weight multipliers
  WEIGHTS: {
    LAYER_1_PRIOR_WEIGHT: 0.40,
    SEMANTIC_INTENT_WEIGHT: 0.35,
    CROSS_MODAL_WEIGHT: 0.15,
    CONSISTENCY_WEIGHT: 0.10,
  },

  // Default Model Parameters
  MODEL: {
    DEFAULT_PROVIDER: "deterministic", // Default for deterministic test suites
    ROUTING_SOURCE: "AI_GATEWAY_CONFIG",
    TEMPERATURE: 0.1,                 // Low temperature for strict factual reasoning
    MAX_OUTPUT_TOKENS: 2048,
  },
};
