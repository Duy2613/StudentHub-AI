/**
 * Layer 3 — Types, Enums & Standardized Contract Definitions
 * 
 * Defines the core evidence data transfer objects (DTOs) for:
 * - Layer 3 Status: VERIFIED, VERIFIED_WITH_CONFLICT, CONTESTED, UNVERIFIED, INSUFFICIENT_EVIDENCE
 * - Claim Evidence Relations: STRONGLY_SUPPORTS, SUPPORTS, PARTIALLY_SUPPORTS, STRONGLY_CONTRADICTS, CONTRADICTS, PARTIALLY_CONTRADICTS, CONTEXTUALIZES, NEUTRAL, INSUFFICIENT
 * - Source Authority Tiers: TIER_5_PRIMARY_AUTHORITATIVE, TIER_4_HIGH_REPUTABLE_SECONDARY, TIER_3_REPUTABLE_SECONDARY, TIER_2_COMMUNITY_AGGREGATOR, TIER_1_UNKNOWN_LOW
 * - Source Freshness: CURRENT, RECENT, AGING, OUTDATED, UNKNOWN
 * - Claim Status, Candidate Source, Evidence Item, and Layer 4 Verification Package builders
 */

export const LAYER_3_STATUS = {
  VERIFIED: "VERIFIED",                               // High-authority evidence conclusively confirms or refutes claim
  VERIFIED_WITH_CONFLICT: "VERIFIED_WITH_CONFLICT",   // Primary evidence found but secondary discrepancies exist
  CONTESTED: "CONTESTED",                             // Direct contradiction between independent authoritative sources
  UNVERIFIED: "UNVERIFIED",                           // No reliable external evidence found (NOT FALSE!)
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",     // Incomplete / outdated / inconclusive evidence
};

export const CLAIM_EVIDENCE_RELATION = {
  STRONGLY_SUPPORTS: "STRONGLY_SUPPORTS",
  SUPPORTS: "SUPPORTS",
  PARTIALLY_SUPPORTS: "PARTIALLY_SUPPORTS",
  STRONGLY_CONTRADICTS: "STRONGLY_CONTRADICTS",
  CONTRADICTS: "CONTRADICTS",
  PARTIALLY_CONTRADICTS: "PARTIALLY_CONTRADICTS",
  CONTEXTUALIZES: "CONTEXTUALIZES",
  NEUTRAL: "NEUTRAL",
  INSUFFICIENT: "INSUFFICIENT",
};

export const SOURCE_AUTHORITY_TIER = {
  TIER_5_PRIMARY_AUTHORITATIVE: "TIER_5_PRIMARY_AUTHORITATIVE",       // Official domain / Primary institutional document
  TIER_4_HIGH_REPUTABLE_SECONDARY: "TIER_4_HIGH_REPUTABLE_SECONDARY", // Major reputable news / Verified organization
  TIER_3_REPUTABLE_SECONDARY: "TIER_3_REPUTABLE_SECONDARY",           // Trade press / Established educational blog
  TIER_2_COMMUNITY_AGGREGATOR: "TIER_2_COMMUNITY_AGGREGATOR",         // Wikipedia / Forum / Aggregator
  TIER_1_UNKNOWN_LOW: "TIER_1_UNKNOWN_LOW",                           // Unknown site / Social post / Random blog
};

export const FRESHNESS_STATUS = {
  CURRENT: "CURRENT",       // Within validity window (e.g. current year or recent weeks)
  RECENT: "RECENT",         // Recent enough for general context
  AGING: "AGING",           // May have undergone revisions
  OUTDATED: "OUTDATED",     // Deprecated or explicitly superseded by newer policies
  UNKNOWN: "UNKNOWN",
};

export const CONFLICT_TYPES = {
  POLICY_DISCREPANCY: "POLICY_DISCREPANCY",
  FACTUAL_DISPUTE: "FACTUAL_DISPUTE",
  TEMPORAL_DISCREPANCY: "TEMPORAL_DISCREPANCY",
  NUMERICAL_DISCREPANCY: "NUMERICAL_DISCREPANCY",
};

/**
 * Creates an Extracted Evidence DTO
 */
export function createEvidence({
  evidenceId = `ev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  claimId,
  sourceId,
  sourceUrl,
  sourceTitle = "",
  excerpt = "",
  relation = CLAIM_EVIDENCE_RELATION.NEUTRAL,
  relevance = 0.85,
  strength = 0.85,
  publishedAt = null,
  retrievedAt = new Date().toISOString(),
  freshness = FRESHNESS_STATUS.CURRENT,
  authorityTier = SOURCE_AUTHORITY_TIER.TIER_3_REPUTABLE_SECONDARY,
  clusterId = null,
  isDirectQuote = false,
}) {
  return {
    evidenceId,
    claimId,
    sourceId,
    sourceUrl,
    sourceTitle,
    excerpt: excerpt.trim(),
    relation,
    relevance: Number(relevance.toFixed(2)),
    strength: Number(strength.toFixed(2)),
    publishedAt,
    retrievedAt,
    freshness,
    authorityTier,
    clusterId: clusterId || sourceId,
    isDirectQuote,
  };
}

/**
 * Creates a Source DTO
 */
export function createSource({
  sourceId = `src-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  url,
  domain,
  title = "",
  publisher = "",
  authorityTier = SOURCE_AUTHORITY_TIER.TIER_3_REPUTABLE_SECONDARY,
  authorityScore = 0.70,
  authorityBasis = [],
  publishedAt = null,
  retrievedAt = new Date().toISOString(),
  clusterId = null,
  isOfficial = false,
}) {
  return {
    sourceId,
    url,
    domain: domain || (url ? new URL(url).hostname : ""),
    title,
    publisher,
    authorityTier,
    authorityScore: Number(authorityScore.toFixed(2)),
    authorityBasis,
    publishedAt,
    retrievedAt,
    clusterId: clusterId || sourceId,
    isOfficial,
  };
}

/**
 * Creates a Layer 3 Result DTO
 */
export function createLayer3Result({
  status = LAYER_3_STATUS.UNVERIFIED,
  claims = [],
  claimStatuses = {},
  sources = [],
  evidence = [],
  sourceAuthority = {},
  sourceIndependence = { totalClusters: 0, clusters: [] },
  crossSourceAgreement = { agreementScore: 0, supportingSourcesCount: 0, contradictingSourcesCount: 0 },
  conflicts = [],
  temporalAssessment = { allCurrent: true, outdatedEvidenceCount: 0 },
  verificationCompleteness = 0.0,
  evidenceConfidence = 0.5,
  limitations = [],
  nextLayer = 4,
  requestId = null,
  metrics = {},
}) {
  return {
    layer: 3,
    status,
    claims,
    claimStatuses,
    sources,
    evidence,
    sourceAuthority,
    sourceIndependence,
    crossSourceAgreement,
    conflicts,
    temporalAssessment,
    verificationCompleteness: Number(verificationCompleteness.toFixed(2)),
    evidenceConfidence: Number(evidenceConfidence.toFixed(2)),
    limitations,
    nextLayer,
    requestId: requestId || `req_l3_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    metrics: {
      executionTimeMs: metrics.executionTimeMs || 0,
      queriesExecutedCount: metrics.queriesExecutedCount || 0,
      sourcesRetrievedCount: sources.length,
      evidenceItemsCount: evidence.length,
      retrievalProvider: metrics.retrievalProvider || "knowledge_base_retriever",
      timestamp: metrics.timestamp || Date.now(),
    },
  };
}
