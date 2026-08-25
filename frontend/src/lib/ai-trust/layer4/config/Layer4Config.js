/**
 * Layer 4 — Configuration, SLA Thresholds, Weights & Policies
 */

export const LAYER_4_CONFIG = {
  VERSION: "layer4-v1.0.0",

  // Service Level Agreements
  SLA: {
    MAX_TIMEOUT_MS: 3000,
    TARGET_LATENCY_MS: 50,
  },

  // Decision Thresholds
  THRESHOLDS: {
    CRITICAL_RISK_BLOCK_THRESHOLD: 0.85,
    HIGH_RISK_RESTRICT_THRESHOLD: 0.70,
    VERIFIED_TRUE_CONFIDENCE_THRESHOLD: 0.80,
    MIN_COMPLETENESS_FOR_DEFINITIVE_VERDICT: 0.75,
  },

  // Harm Categories
  HARM_CATEGORIES: {
    CREDENTIAL_THEFT: "credential_theft",
    FINANCIAL_LOSS: "financial_loss",
    IDENTITY_THEFT: "identity_theft",
    MALWARE_INFECTION: "malware_infection",
    ACADEMIC_MISINFORMATION: "academic_misinformation",
    REPUTATIONAL_DAMAGE: "reputational_damage",
  },
};
