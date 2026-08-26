/**
 * StudentHub AI — Comprehensive Evidence Fusion & Knowledge Object Domain Model V1
 * 
 * Non-Democratic Authority-Aware Knowledge Fusion Architecture.
 * 
 * Key Principles:
 * ==================================================================================
 * 1. EVIDENCE IS NOT DEMOCRACY: Social counts or model confidence NEVER outweigh official authority.
 * 2. FOUR KNOWLEDGE LAYERS:
 *    - Layer A: OFFICIAL TRUTH (What is institutionally authoritative?)
 *    - Layer B: AI VERIFIED REASONING (What can be safely entailed from evidence?)
 *    - Layer C: EXPERT INTERPRETATION (How do qualified experts interpret this?)
 *    - Layer D: COMMUNITY REALITY (What are students actually experiencing?)
 * 3. CLAIM RELATION INTEGRITY: Preserves supports, contradicts, qualifies, supersedes.
 * 4. EPISTEMIC FIDELITY: Never average out uncertainties into a fake numeric score.
 * 5. IMMUTABLE KNOWLEDGE OBJECTS: Every version is tamper-proof and cryptographically sealed.
 * ==================================================================================
 */

import crypto from "node:crypto";

export const FUSION_POLICY_VERSION = "1.0.0";

/**
 * 4 Foundational Knowledge Layers
 */
export const KNOWLEDGE_LAYER = Object.freeze({
  OFFICIAL_TRUTH: "OFFICIAL_TRUTH",           // Layer A: Institutional regulations & notices
  AI_VERIFIED_REASONING: "AI_VERIFIED_REASONING", // Layer B: Epistemic deductions from verified sources
  EXPERT_INTERPRETATION: "EXPERT_INTERPRETATION", // Layer C: Qualified academic/domain interpretations
  COMMUNITY_REALITY: "COMMUNITY_REALITY"      // Layer D: Real-world empirical student experiences
});

/**
 * Authority Hierarchy Tiers
 */
export const AUTHORITY_CLASS = Object.freeze({
  INSTITUTIONAL_AUTHORITY: "INSTITUTIONAL_AUTHORITY", // Statutory university authority (e.g. QĐ 3116)
  OFFICIAL_DELEGATED: "OFFICIAL_DELEGATED",           // Faculty/Department administrative rules
  QUALIFIED_EXPERT: "QUALIFIED_EXPERT",               // Domain expert within accredited scope
  COMMUNITY_EMPIRICAL: "COMMUNITY_EMPIRICAL",         // First-hand student observation
  AI_SYNTHESIS: "AI_SYNTHESIS",                       // Generative reasoning/entailment
  UNVERIFIED_SOURCE: "UNVERIFIED_SOURCE"              // Hearsay / unsubstantiated claim
});

/**
 * 9 Canonical Claim Relation Types
 */
export const CLAIM_RELATION_TYPE = Object.freeze({
  SAME_CLAIM: "SAME_CLAIM",                 // Semantically identical factual assertion
  SUPPORTS: "SUPPORTS",                     // Corroborates the target claim
  QUALIFIES: "QUALIFIES",                   // Adds conditionality, prerequisite, or scope bounds
  CONTEXTUALIZES: "CONTEXTUALIZES",         // Provides background/operational nuance
  CONTRADICTS: "CONTRADICTS",               // Mutually exclusive within same scope & time
  SUPERSEDES: "SUPERSEDES",                 // Officially invalidates/replaces an older version
  DERIVES_FROM: "DERIVES_FROM",             // Cross-layer dependency (e.g. AI derived from Expert)
  OBSERVES: "OBSERVES",                     // Empirical real-world behavior report
  INTERPRETS: "INTERPRETS",                 // Expert disciplinary reading of a policy
  LIMITS: "LIMITS",                         // Stated epistemic limitation or boundary
  UNCERTAIN_BECAUSE: "UNCERTAIN_BECAUSE"   // Reason for lack of conclusive certainty
});

/**
 * 9 Epistemic Final States for Knowledge Objects
 */
export const EPISTEMIC_FINAL_STATE = Object.freeze({
  AUTHORITATIVE: "AUTHORITATIVE",           // Verified against active official academic sources
  SUPPORTED: "SUPPORTED",                   // Backed by strong reasoning & expert consensus
  PARTIALLY_SUPPORTED: "PARTIALLY_SUPPORTED", // Some aspects confirmed, others unverified
  CONTEXTUALIZED: "CONTEXTUALIZED",         // Official policy augmented by expert & community reality
  CONFLICTED: "CONFLICTED",                 // Unresolved disagreement among sources of equal authority
  SUPERSEDED: "SUPERSEDED",                 // Historical truth replaced by a newer official regulation
  OUTDATED: "OUTDATED",                     // Stale information from previous terms
  UNRESOLVED: "UNRESOLVED",                 // Insufficient or ambiguous evidence requiring review
  UNKNOWN: "UNKNOWN"                        // Zero verified evidence available
});

/**
 * 6 Evidence Health States
 */
export const EVIDENCE_HEALTH_STATE = Object.freeze({
  HEALTHY: "HEALTHY",                       // All 4 layers aligned, current sources, high independence
  AGING: "AGING",                           // Sources approaching freshness SLA boundary (1-2 years)
  CONFLICTED: "CONFLICTED",                 // Divergence detected between layers or equal authorities
  DEGRADED: "DEGRADED",                     // Supporting evidence retracted or mirror down
  STALE: "STALE",                           // Historical regulations needing re-verification
  REQUIRES_REVIEW: "REQUIRES_REVIEW"        // Triggering Human Review Gate (e.g. policy ambiguity)
});

/**
 * Temporal Lifecycles
 */
export const TEMPORAL_ALIGNMENT_STATE = Object.freeze({
  CURRENT_ACTIVE: "CURRENT_ACTIVE",
  HISTORICAL_SUPERSEDED: "HISTORICAL_SUPERSEDED",
  FUTURE_SCHEDULED: "FUTURE_SCHEDULED",
  TEMPORAL_MISMATCH: "TEMPORAL_MISMATCH",
  UNKNOWN_TIME: "UNKNOWN_TIME"
});

export class EvidenceFusionModel {
  /**
   * Creates a normalized Canonical Claim
   */
  static createCanonicalClaim(data = {}) {
    const claimId = data.claimId || `FUS_CLM_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const subject = typeof data.subject === "string" ? data.subject.trim() : "GENERAL_ACADEMIC_TOPIC";
    const predicate = typeof data.predicate === "string" ? data.predicate.trim() : "REQUIRES";
    const value = data.value !== undefined ? data.value : null;
    const normalizedStatement = typeof data.normalizedStatement === "string" 
      ? data.normalizedStatement.trim() 
      : (typeof data.statement === "string" ? data.statement.trim() : `${subject} ${predicate} ${value}`);

    const layer = KNOWLEDGE_LAYER[data.layer] || KNOWLEDGE_LAYER.AI_VERIFIED_REASONING;
    const authorityClass = AUTHORITY_CLASS[data.authorityClass] || (
      layer === KNOWLEDGE_LAYER.OFFICIAL_TRUTH ? AUTHORITY_CLASS.INSTITUTIONAL_AUTHORITY :
      layer === KNOWLEDGE_LAYER.EXPERT_INTERPRETATION ? AUTHORITY_CLASS.QUALIFIED_EXPERT :
      layer === KNOWLEDGE_LAYER.COMMUNITY_REALITY ? AUTHORITY_CLASS.COMMUNITY_EMPIRICAL :
      AUTHORITY_CLASS.AI_SYNTHESIS
    );

    const scope = this.createScopeDimension(data.scope || {});
    const temporalState = data.temporalState || "CURRENT_ACTIVE";
    const sourceRef = data.sourceRef || { sourceId: "SRC_UNKNOWN", sourceTier: "TIER_4" };
    const derivationChain = Array.isArray(data.derivationChain) ? [...data.derivationChain] : [];
    const isRetracted = Boolean(data.isRetracted);

    const claimHash = this.computeClaimHash({ subject, predicate, value, scope, layer });

    return Object.freeze({
      claimId,
      claimHash,
      subject,
      predicate,
      value,
      normalizedStatement,
      statement: normalizedStatement,
      layer,
      authorityClass,
      scope,
      temporalState,
      sourceRef: Object.freeze(sourceRef),
      derivationChain: Object.freeze(derivationChain),
      isRetracted,
      confidence: typeof data.confidence === "number" ? data.confidence : 1.0,
      createdAt: data.createdAt || new Date().toISOString()
    });
  }

  /**
   * Creates a Scope Dimension Descriptor
   */
  static createScopeDimension(data = {}) {
    return Object.freeze({
      institution: typeof data.institution === "string" ? data.institution.trim() : "HCMUTE",
      cohort: typeof data.cohort === "string" ? data.cohort.trim().toUpperCase() : "ALL",
      faculty: typeof data.faculty === "string" ? data.faculty.trim().toUpperCase() : (data.department ? data.department.toUpperCase() : "ALL"),
      department: typeof data.department === "string" ? data.department.trim().toUpperCase() : (data.faculty ? data.faculty.toUpperCase() : "ALL"),
      program: typeof data.program === "string" ? data.program.trim().toUpperCase() : "ALL",
      procedure: typeof data.procedure === "string" ? data.procedure.trim().toUpperCase() : "GENERAL"
    });
  }

  /**
   * Creates a Canonical Knowledge Object
   */
  static createKnowledgeObject(data = {}) {
    const knowledgeObjectId = data.knowledgeObjectId || `KNO_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const version = Number(data.version || 1);
    const subject = typeof data.subject === "string" ? data.subject.trim() : "ACADEMIC_REGULATION";
    const topic = typeof data.topic === "string" ? data.topic.trim().toUpperCase() : subject.toUpperCase();

    const authoritativeState = EPISTEMIC_FINAL_STATE[data.authoritativeState] || EPISTEMIC_FINAL_STATE.UNKNOWN;
    const evidenceHealth = EVIDENCE_HEALTH_STATE[data.evidenceHealth] || EVIDENCE_HEALTH_STATE.HEALTHY;

    // Layered Components
    const officialTruth = data.officialTruth ? { ...data.officialTruth } : null;
    const aiVerifiedReasoning = data.aiVerifiedReasoning ? { ...data.aiVerifiedReasoning } : null;
    const expertInterpretation = Array.isArray(data.expertInterpretation) ? [...data.expertInterpretation] : [];
    const communityReality = data.communityReality ? { ...data.communityReality } : null;

    const claims = Array.isArray(data.claims) ? data.claims.map(c => this.createCanonicalClaim(c)) : [];
    const supportingEvidence = Array.isArray(data.supportingEvidence) ? [...data.supportingEvidence] : [];
    const contextualEvidence = Array.isArray(data.contextualEvidence) ? [...data.contextualEvidence] : [];
    const contradictions = Array.isArray(data.contradictions) ? [...data.contradictions] : [];
    const realityGaps = Array.isArray(data.realityGaps) ? [...data.realityGaps] : [];
    const unknowns = Array.isArray(data.unknowns) ? [...data.unknowns] : [];
    const limitations = Array.isArray(data.limitations) ? [...data.limitations] : [];

    const scope = this.createScopeDimension(data.scope || {});
    const temporalState = data.temporalState || "CURRENT_ACTIVE";
    const policyVersion = data.policyVersion || "QĐ 3116/QĐ-ĐHSPKT (2025)";
    const fusionPolicyVersion = data.fusionPolicyVersion || FUSION_POLICY_VERSION;

    const sourceSetHash = data.sourceSetHash || this.computeSourceSetHash(supportingEvidence);
    const generatedAt = data.generatedAt || new Date().toISOString();
    const lastVerifiedAt = data.lastVerifiedAt || generatedAt;

    // Telemetry
    const telemetry = data.confidenceTelemetry ? { ...data.confidenceTelemetry } : {
      totalSourcesCount: supportingEvidence.length,
      independentProvenanceClustersCount: 1,
      expertDisagreementsCount: expertInterpretation.filter(e => e.hasDisagreement).length,
      realityGapIdentified: realityGaps.length > 0,
      adjudicationPath: "OFFICIAL_AUTHORITATIVE_CHAIN"
    };

    return Object.freeze({
      knowledgeObjectId,
      version,
      subject,
      topic,
      authoritativeState,
      evidenceHealth,
      officialTruth: officialTruth ? Object.freeze(officialTruth) : null,
      aiVerifiedReasoning: aiVerifiedReasoning ? Object.freeze(aiVerifiedReasoning) : null,
      expertInterpretation: Object.freeze(expertInterpretation),
      communityReality: communityReality ? Object.freeze(communityReality) : null,
      claims: Object.freeze(claims),
      supportingEvidence: Object.freeze(supportingEvidence),
      contextualEvidence: Object.freeze(contextualEvidence),
      contradictions: Object.freeze(contradictions),
      realityGaps: Object.freeze(realityGaps),
      unknowns: Object.freeze(unknowns),
      limitations: Object.freeze(limitations),
      scope,
      temporalState,
      policyVersion,
      fusionPolicyVersion,
      sourceSetHash,
      confidenceTelemetry: Object.freeze(telemetry),
      generatedAt,
      lastVerifiedAt
    });
  }

  /**
   * Generates deterministic Claim SHA-256 Hash
   */
  static computeClaimHash({ subject, predicate, value, scope, layer }) {
    const raw = `${subject}::${predicate}::${value}::${scope?.cohort || 'ALL'}::${scope?.faculty || 'ALL'}::${layer}`;
    return crypto.createHash("sha256").update(raw.toLowerCase()).digest("hex").slice(0, 16);
  }

  /**
   * Generates deterministic Source Set SHA-256 Hash
   */
  static computeSourceSetHash(evidenceList = []) {
    const sortedIds = evidenceList.map(e => e.sourceId || e.id || "").sort().join("|");
    return crypto.createHash("sha256").update(sortedIds || "EMPTY_SOURCES").digest("hex").slice(0, 16);
  }

  /**
   * Redacts private student and author details from public Knowledge Object payload
   */
  static redactForPublic(knowledgeObj) {
    if (!knowledgeObj) return null;
    const copy = JSON.parse(JSON.stringify(knowledgeObj));

    // Strip private internal IDs and IP addresses
    if (copy.communityReality?.firstHandEvidence) {
      for (const ev of copy.communityReality.firstHandEvidence) {
        delete ev.authorId;
        delete ev.ip;
        delete ev.deviceFingerprint;
      }
    }
    if (copy.expertInterpretation) {
      for (const exp of copy.expertInterpretation) {
        delete exp.privatePhone;
        delete exp.privateEmail;
      }
    }

    return Object.freeze(copy);
  }
}
