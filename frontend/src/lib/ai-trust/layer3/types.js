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

import { createSecureId } from "../../security/secureId.js";

export const LAYER_3_STATUS = {
  VERIFIED: "VERIFIED",                               // High-authority evidence conclusively confirms or refutes claim
  VERIFIED_WITH_CONFLICT: "VERIFIED_WITH_CONFLICT",   // Primary evidence found but secondary discrepancies exist
  CONTESTED: "CONTESTED",                             // Direct contradiction between independent authoritative sources
  UNVERIFIED: "UNVERIFIED",                           // No reliable external evidence found (NOT FALSE!)
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",     // Incomplete / outdated / inconclusive evidence
  PARTIAL: "PARTIAL",                                 // Local or incomplete evidence only; not externally verified
  NOT_APPLICABLE: "NOT_APPLICABLE",                   // No factual claim was submitted for verification
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

export const SOURCE_TYPE = {
  OFFICIAL_INSTITUTION: "OFFICIAL_INSTITUTION",
  REPUTABLE_SECONDARY: "REPUTABLE_SECONDARY",
  COMMUNITY_OR_AGGREGATOR: "COMMUNITY_OR_AGGREGATOR",
  THREAT_INTELLIGENCE: "THREAT_INTELLIGENCE",
  SEARCH_RETRIEVAL: "SEARCH_RETRIEVAL",
  LOCAL_KNOWLEDGE_BASE: "LOCAL_KNOWLEDGE_BASE",
  USER_SUPPLIED: "USER_SUPPLIED",
  UNKNOWN: "UNKNOWN",
};

export const EVIDENCE_PROVIDER_STATUS = {
  SUCCESS: "SUCCESS",
  PARTIAL: "PARTIAL",
  TIMEOUT: "TIMEOUT",
  UNAVAILABLE: "UNAVAILABLE",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  LOCAL_ONLY: "LOCAL_ONLY",
  UNKNOWN: "UNKNOWN",
};

function boundedString(value, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function boundedUnit(value, fallback = 0) {
  return Number.isFinite(Number(value))
    ? Number(Math.max(0, Math.min(1, Number(value))).toFixed(2))
    : fallback;
}

function safeHostname(url) {
  if (typeof url !== "string" || !url.trim()) return "";
  try {
    const parsed = new URL(url);
    return /^https?:$/.test(parsed.protocol) ? parsed.hostname.toLowerCase() : "";
  } catch {
    return "";
  }
}

function safeHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) return null;
  try {
    const parsed = new URL(value);
    if (!/^https?:$/.test(parsed.protocol) || parsed.username || parsed.password) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function safeNonNegativeNumber(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Math.max(0, Number(value)) : fallback;
}

function normalizeClaimStatusMap(value, claimIds) {
  const allowed = new Set(["SUPPORTED", "CONTRADICTED", "PARTIALLY_SUPPORTED", "CONTESTED", "UNVERIFIED", "OUTDATED_EVIDENCE", "INSUFFICIENT_EVIDENCE"]);
  const source = safeObject(value);
  const output = {};
  let entries = [];
  try { entries = Object.entries(source).slice(0, 40); } catch { return output; }
  for (const [claimId, status] of entries) {
    if (!claimIds.has(claimId) || typeof status !== "string" || !allowed.has(status)) continue;
    output[boundedString(claimId, 160)] = status;
  }
  return output;
}

function normalizeConflict(value) {
  const source = safeObject(value);
  return {
    conflictId: boundedString(source.conflictId, 160) || null,
    claimId: boundedString(source.claimId, 160) || null,
    conflictType: boundedString(source.conflictType, 100) || "UNKNOWN",
    resolutionRecommendation: boundedString(source.resolutionRecommendation, 500),
  };
}

/**
 * Creates an Extracted Evidence DTO
 */
export function createEvidence(input = {}) {
  const {
  evidenceId = createSecureId("ev"),
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
  sourceType = SOURCE_TYPE.UNKNOWN,
  providerStatus = EVIDENCE_PROVIDER_STATUS.UNKNOWN,
  liveEvidence = false,
  sourceFingerprint = null,
  contentFingerprint = null,
  evidenceScope = "claim_specific",
  retrievalOutcome = "SUCCESS",
  } = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const safeSourceUrl = safeHttpUrl(sourceUrl);
  const safeRelation = Object.values(CLAIM_EVIDENCE_RELATION).includes(relation)
    ? relation
    : CLAIM_EVIDENCE_RELATION.INSUFFICIENT;
  const safeSourceType = Object.values(SOURCE_TYPE).includes(sourceType) ? sourceType : SOURCE_TYPE.UNKNOWN;
  const safeProviderStatus = Object.values(EVIDENCE_PROVIDER_STATUS).includes(providerStatus)
    ? providerStatus
    : EVIDENCE_PROVIDER_STATUS.UNKNOWN;
  const safeSourceFingerprint = boundedString(sourceFingerprint, 128) || null;
  const safeLiveEvidence = liveEvidence === true &&
    safeSourceType !== SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE &&
    safeProviderStatus === EVIDENCE_PROVIDER_STATUS.SUCCESS &&
    retrievalOutcome === "SUCCESS" &&
    Boolean(safeSourceFingerprint);
  return {
    evidenceId: boundedString(evidenceId, 160),
    claimId: boundedString(claimId, 160),
    sourceId: boundedString(sourceId, 160),
    sourceUrl: safeSourceUrl,
    sourceTitle: boundedString(sourceTitle, 240),
    excerpt: boundedString(excerpt, 400),
    relation: safeRelation,
    relevance: boundedUnit(relevance),
    strength: boundedUnit(strength),
    publishedAt: typeof publishedAt === "string" ? publishedAt : null,
    retrievedAt: typeof retrievedAt === "string" ? retrievedAt : new Date().toISOString(),
    freshness: Object.values(FRESHNESS_STATUS).includes(freshness) ? freshness : FRESHNESS_STATUS.UNKNOWN,
    authorityTier: Object.values(SOURCE_AUTHORITY_TIER).includes(authorityTier)
      ? authorityTier
      : SOURCE_AUTHORITY_TIER.TIER_1_UNKNOWN_LOW,
    clusterId: boundedString(clusterId || sourceId, 160),
    isDirectQuote: Boolean(isDirectQuote),
    sourceType: safeSourceType,
    providerStatus: safeProviderStatus,
    liveEvidence: safeLiveEvidence,
    sourceFingerprint: safeSourceFingerprint,
    contentFingerprint: boundedString(contentFingerprint, 128) || null,
    evidenceScope: boundedString(evidenceScope, 120) || "claim_specific",
    retrievalOutcome: boundedString(retrievalOutcome, 80) || "UNKNOWN",
    contentTrust: "UNTRUSTED_RETRIEVED_CONTENT",
  };
}

/**
 * Creates a Source DTO
 */
export function createSource(input = {}) {
  const {
  sourceId = createSecureId("src"),
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
  sourceType = null,
  providerStatus = EVIDENCE_PROVIDER_STATUS.UNKNOWN,
  liveEvidence = false,
  sourceFingerprint = null,
  contentFingerprint = null,
  retrievalOutcome = "UNKNOWN",
  sourceScope = "claim_specific",
  } = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const safeUrl = safeHttpUrl(url);
  const resolvedDomain = boundedString(domain, 180).toLowerCase() || safeHostname(safeUrl);
  const inferredSourceType = sourceType || (
    isOfficial
      ? SOURCE_TYPE.OFFICIAL_INSTITUTION
      : authorityTier === SOURCE_AUTHORITY_TIER.TIER_4_HIGH_REPUTABLE_SECONDARY
        ? SOURCE_TYPE.REPUTABLE_SECONDARY
        : SOURCE_TYPE.UNKNOWN
  );

  const safeSourceType = Object.values(SOURCE_TYPE).includes(inferredSourceType) ? inferredSourceType : SOURCE_TYPE.UNKNOWN;
  const safeProviderStatus = Object.values(EVIDENCE_PROVIDER_STATUS).includes(providerStatus)
    ? providerStatus
    : EVIDENCE_PROVIDER_STATUS.UNKNOWN;
  const safeSourceFingerprint = boundedString(sourceFingerprint, 128) || null;
  const safeLiveEvidence = liveEvidence === true &&
    safeSourceType !== SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE &&
    safeProviderStatus === EVIDENCE_PROVIDER_STATUS.SUCCESS &&
    retrievalOutcome === "SUCCESS" &&
    Boolean(safeSourceFingerprint);

  return {
    sourceId: boundedString(sourceId, 160),
    url: safeUrl,
    domain: resolvedDomain,
    title: boundedString(title, 240),
    publisher: boundedString(publisher, 180),
    authorityTier: Object.values(SOURCE_AUTHORITY_TIER).includes(authorityTier)
      ? authorityTier
      : SOURCE_AUTHORITY_TIER.TIER_1_UNKNOWN_LOW,
    authorityScore: boundedUnit(authorityScore),
    authorityBasis: Array.isArray(authorityBasis) ? authorityBasis.slice(0, 12).map((item) => boundedString(item, 120)).filter(Boolean) : [],
    publishedAt: typeof publishedAt === "string" ? publishedAt : null,
    retrievedAt: typeof retrievedAt === "string" ? retrievedAt : new Date().toISOString(),
    clusterId: boundedString(clusterId || sourceId, 160),
    isOfficial: Boolean(isOfficial),
    sourceType: safeSourceType,
    providerStatus: safeProviderStatus,
    liveEvidence: safeLiveEvidence,
    sourceFingerprint: safeSourceFingerprint,
    contentFingerprint: boundedString(contentFingerprint, 128) || null,
    retrievalOutcome: boundedString(retrievalOutcome, 80) || "UNKNOWN",
    sourceScope: boundedString(sourceScope, 120) || "claim_specific",
    contentTrust: "UNTRUSTED_RETRIEVED_CONTENT",
  };
}

/**
 * Creates a Layer 3 Result DTO
 */
export function createLayer3Result(input = {}) {
  const {
  status = LAYER_3_STATUS.INSUFFICIENT_EVIDENCE,
  claims = [],
  claimStatuses = {},
  sources = [],
  evidence = [],
  sourceAuthority = {},
  sourceIndependence = { totalClusters: 0, clusters: [] },
  crossSourceAgreement = { agreementScore: 0, supportingSourcesCount: 0, contradictingSourcesCount: 0 },
  conflicts = [],
  temporalAssessment = { allCurrent: false, outdatedEvidenceCount: 0 },
  verificationCompleteness = 0.0,
  evidenceConfidence = 0,
  limitations = [],
  nextLayer = 4,
  requestId = null,
  metrics = {},
  retrievalStatus = EVIDENCE_PROVIDER_STATUS.UNKNOWN,
  retrievalMode = "UNKNOWN",
  externalEvidence = false,
  auditEvents = [],
  } = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const safeClaims = Array.isArray(claims) ? claims.slice(0, 40).filter((claim) => claim && typeof claim === "object" && !Array.isArray(claim)).map((claim) => ({
    claimId: boundedString(claim.claimId, 160),
    subject: boundedString(claim.subject, 240),
    predicate: boundedString(claim.predicate, 500),
    object: boundedString(claim.object, 800),
    scope: boundedString(claim.scope, 160) || "general",
    time: boundedString(claim.time, 80) || null,
    rawText: boundedString(claim.rawText, 1200),
    claimType: boundedString(claim.claimType, 80) || "GENERAL_FACT",
    importance: boundedString(claim.importance, 40) || "medium",
    verificationRequired: claim.verificationRequired !== false,
  })) : [];
  const safeSources = Array.isArray(sources) ? sources.slice(0, 80).filter((source) => source && typeof source === "object" && !Array.isArray(source)).map((source) => createSource(source)) : [];
  const safeEvidence = Array.isArray(evidence) ? evidence.slice(0, 160).filter((item) => item && typeof item === "object" && !Array.isArray(item)).map((item) => createEvidence(item)) : [];
  const safeConflicts = Array.isArray(conflicts) ? conflicts.slice(0, 80).filter((conflict) => conflict && typeof conflict === "object" && !Array.isArray(conflict)).map(normalizeConflict) : [];
  const validExternalEvidence = safeEvidence.some((item) =>
    item.liveEvidence === true &&
    item.sourceType !== SOURCE_TYPE.LOCAL_KNOWLEDGE_BASE &&
    item.providerStatus === EVIDENCE_PROVIDER_STATUS.SUCCESS &&
    item.retrievalOutcome === "SUCCESS" &&
    typeof item.sourceFingerprint === "string" && item.sourceFingerprint.length > 0
  );
  const safeExternalEvidence = externalEvidence === true && validExternalEvidence;
  let safeStatus = Object.values(LAYER_3_STATUS).includes(status) ? status : LAYER_3_STATUS.INSUFFICIENT_EVIDENCE;
  if ((safeStatus === LAYER_3_STATUS.VERIFIED || safeStatus === LAYER_3_STATUS.VERIFIED_WITH_CONFLICT) && !safeExternalEvidence) {
    safeStatus = safeEvidence.length > 0 ? LAYER_3_STATUS.PARTIAL : LAYER_3_STATUS.INSUFFICIENT_EVIDENCE;
  }
  const safeMetrics = metrics && typeof metrics === "object" && !Array.isArray(metrics) ? metrics : {};
  return {
    layer: 3,
    status: safeStatus,
    claims: safeClaims,
    claimStatuses: normalizeClaimStatusMap(claimStatuses, new Set(safeClaims.map((claim) => claim.claimId).filter(Boolean))),
    sources: safeSources,
    evidence: safeEvidence,
    sourceAuthority: (() => {
      const source = safeObject(sourceAuthority);
      return {
        totalEvaluated: safeNonNegativeNumber(source.totalEvaluated),
        primaryCount: safeNonNegativeNumber(source.primaryCount),
        bySource: Array.isArray(source.bySource) ? source.bySource.slice(0, 80).filter((item) => item && typeof item === "object").map((item) => ({
          sourceId: boundedString(item.sourceId, 160),
          tier: boundedString(item.tier, 100),
          scope: boundedString(item.scope, 120),
          sourceType: boundedString(item.sourceType, 100),
        })) : [],
      };
    })(),
    sourceIndependence: (() => {
      const source = safeObject(sourceIndependence);
      return {
        totalClusters: safeNonNegativeNumber(source.totalClusters),
        independentSourcesCount: safeNonNegativeNumber(source.independentSourcesCount),
        clusters: Array.isArray(source.clusters) ? source.clusters.slice(0, 80).map((cluster) => boundedString(cluster, 160)).filter(Boolean) : [],
      };
    })(),
    crossSourceAgreement: (() => {
      const source = safeObject(crossSourceAgreement);
      return {
        agreementScore: boundedUnit(source.agreementScore),
        supportingSourcesCount: safeNonNegativeNumber(source.supportingSourcesCount),
        contradictingSourcesCount: safeNonNegativeNumber(source.contradictingSourcesCount),
        unresolved: source.unresolved === true,
      };
    })(),
    conflicts: safeConflicts,
    temporalAssessment: (() => {
      const source = safeObject(temporalAssessment);
      return {
        allCurrent: source.allCurrent === true,
        outdatedEvidenceCount: safeNonNegativeNumber(source.outdatedEvidenceCount),
        unknownDateCount: safeNonNegativeNumber(source.unknownDateCount),
      };
    })(),
    verificationCompleteness: boundedUnit(verificationCompleteness),
    evidenceConfidence: boundedUnit(evidenceConfidence),
    limitations: Array.isArray(limitations) ? limitations.slice(0, 20).filter((item) => typeof item === "string").map((item) => boundedString(item, 600)) : [],
    nextLayer: Number.isInteger(nextLayer) && nextLayer > 0 && nextLayer <= 4 ? nextLayer : 4,
    requestId: boundedString(requestId, 160) || createSecureId("req_l3"),
    metrics: {
      executionTimeMs: Number.isFinite(safeMetrics.executionTimeMs) ? Math.max(0, safeMetrics.executionTimeMs) : 0,
      queriesExecutedCount: Number.isFinite(safeMetrics.queriesExecutedCount) ? Math.max(0, safeMetrics.queriesExecutedCount) : 0,
      sourcesRetrievedCount: safeSources.length,
      evidenceItemsCount: safeEvidence.length,
      retrievalProvider: boundedString(safeMetrics.retrievalProvider, 120) || "knowledge_base_retriever",
      retrievalStatus: boundedString(safeMetrics.retrievalStatus, 80) || retrievalStatus,
      retrievalMode: boundedString(safeMetrics.retrievalMode, 80) || retrievalMode,
      externalEvidence: safeExternalEvidence,
      providerIndependent: safeMetrics.providerIndependent !== false,
      timestamp: Number.isFinite(safeMetrics.timestamp) ? safeMetrics.timestamp : Date.now(),
    },
    retrievalStatus: Object.values(EVIDENCE_PROVIDER_STATUS).includes(retrievalStatus) ? retrievalStatus : EVIDENCE_PROVIDER_STATUS.UNKNOWN,
    retrievalMode: boundedString(retrievalMode, 80) || "UNKNOWN",
    externalEvidence: safeExternalEvidence,
    auditEvents: Array.isArray(auditEvents) ? auditEvents.slice(-100).filter((event) => event && typeof event === "object").map((event) => ({
      type: boundedString(event.type, 100) || "AUDIT_EVENT",
      code: boundedString(event.code, 120) || null,
      sourceId: boundedString(event.sourceId, 160) || null,
      at: boundedString(event.at, 80) || new Date().toISOString(),
    })) : [],
  };
}
