/**
 * Layer 3 — Configuration, SLA Thresholds, Weights & Limits
 */

export const LAYER_3_CONFIG = {
  // Service Level Agreements
  SLA: {
    MAX_TIMEOUT_MS: 3500,                // Maximum retrieval & reasoning time
    TARGET_LATENCY_MS: 1500,             // Target evidence retrieval latency
    FALLBACK_LATENCY_TARGET_MS: 35,      // Offline knowledge base retrieval latency
  },

  // Retrieval & Evidence Bounds
  LIMITS: {
    MAX_QUERIES_PER_CLAIM: 6,
    MAX_CANDIDATE_SOURCES_PER_CLAIM: 8,
    MAX_EVIDENCE_ITEMS_PER_CLAIM: 5,
    MAX_EXCERPT_LENGTH: 400,             // Concise, high-relevance evidence passages
    MIN_EXCERPT_LENGTH: 20,
  },

  // Authority Tier Scores [0.0 - 1.0]
  AUTHORITY_SCORES: {
    TIER_5_PRIMARY_AUTHORITATIVE: 0.98,
    TIER_4_HIGH_REPUTABLE_SECONDARY: 0.85,
    TIER_3_REPUTABLE_SECONDARY: 0.70,
    TIER_2_COMMUNITY_AGGREGATOR: 0.50,
    TIER_1_UNKNOWN_LOW: 0.25,
  },

  // Freshness Decay Windows (in days)
  FRESHNESS_DAYS: {
    BREAKING_NEWS: 7,                    // 7 days
    POLICY_ANNOUNCEMENT: 365,            // 1 year
    GENERAL_KNOWLEDGE: 1825,             // 5 years
  },

  // Completeness Weights
  WEIGHTS: {
    PRIMARY_SOURCE_BONUS: 0.40,
    INDEPENDENT_CORROBORATION: 0.30,
    EXACT_RELATION_WEIGHT: 0.20,
    TEMPORAL_VALIDITY_WEIGHT: 0.10,
  },
};
