/**
 * StudentHub AI — AI Trust Engine Domain Model V1
 * 
 * Canonical contracts, immutable factories, multi-dimensional trust metrics,
 * and taxonomic constants for AI Reliability, Claim Grounding & Verification.
 * 
 * Core Invariant: CONFIDENCE NEVER CREATES AUTHORITY.
 */

export const STAKE_LEVEL = Object.freeze({
  LOW: "LOW",                 // Study technique, general advice
  MEDIUM: "MEDIUM",           // Course tips, elective recommendations
  HIGH: "HIGH",               // Prerequisite requirements, graduation conditions
  CRITICAL: "CRITICAL"        // Official academic regulations, disciplinary policy, tuition fees, legal
});

export const CLAIM_TYPE = Object.freeze({
  FACTUAL: "FACTUAL",
  TEMPORAL: "TEMPORAL",
  NUMERIC: "NUMERIC",
  REGULATORY: "REGULATORY",
  ACADEMIC_POLICY: "ACADEMIC_POLICY",
  PROCEDURAL: "PROCEDURAL",
  IDENTITY: "IDENTITY",
  EXPERT_OPINION: "EXPERT_OPINION",
  INTERPRETATION: "INTERPRETATION",
  RECOMMENDATION: "RECOMMENDATION"
});

export const SOURCE_TYPE = Object.freeze({
  OFFICIAL: "OFFICIAL",                   // Official HCMUTE registrar, academic office
  OFFICIAL_MIRROR: "OFFICIAL_MIRROR",     // Official department mirror
  REGISTRY: "REGISTRY",                   // Official student records registry
  EXPERT: "EXPERT",                       // Verified faculty/specialist
  COMMUNITY: "COMMUNITY",                 // Student forum, unverified peer
  SEARCH_RESULT: "SEARCH_RESULT",         // Web crawler result
  AI_GENERATED: "AI_GENERATED",           // Synthetic/LLM generated
  UNKNOWN: "UNKNOWN"
});

export const AUTHORITY_TIER = Object.freeze({
  TIER_1_OFFICIAL_REGISTRAR: 100,
  TIER_2_FACULTY_DEPARTMENT: 80,
  TIER_3_VERIFIED_EXPERT: 60,
  TIER_4_COMMUNITY_STUDENT: 30,
  TIER_5_UNVERIFIED_WEB: 10,
  TIER_0_UNTRUSTED: 0
});

export const TEMPORAL_STATUS = Object.freeze({
  VALID: "VALID",                         // Currently active and effective
  HISTORICAL: "HISTORICAL",               // Past record, archived
  SUPERSEDED: "SUPERSEDED",               // Replaced by a newer policy version
  STALE: "STALE",                         // Out of date or unverified for current cohort
  RETRACTED: "RETRACTED",                 // Officially withdrawn
  UNKNOWN: "UNKNOWN"
});

export const CITATION_STATUS = Object.freeze({
  VALID_ENTAILMENT: "VALID_ENTAILMENT",   // Exact passage entails claim
  PARTIAL_ENTAILMENT: "PARTIAL_ENTAILMENT", // Partially entails, missing some constraints
  CITATION_MISMATCH: "CITATION_MISMATCH", // Passage does not support claim
  CITATION_FABRICATED: "CITATION_FABRICATED", // Non-existent source or hallucinated URL
  MISSING_EVIDENCE: "MISSING_EVIDENCE"    // No citation/evidence attached
});

export const TRUST_STATUS = Object.freeze({
  AUTHORITATIVE: "AUTHORITATIVE",         // Grounded in Tier-1 official source with active validity
  VERIFIED: "VERIFIED",                   // 100% supported by valid authoritative citations
  SUPPORTED: "SUPPORTED",                 // Supported by reputable evidence
  PARTIALLY_SUPPORTED: "PARTIALLY_SUPPORTED", // Some claims supported, others lack proof
  UNVERIFIED: "UNVERIFIED",               // No authoritative evidence attached
  UNSUPPORTED: "UNSUPPORTED",             // Evidence exists but does not support claim
  CONTRADICTED: "CONTRADICTED",           // Evidence explicitly disproves claim
  CONFLICTED: "CONFLICTED",               // Multiple authoritative sources contradict each other
  OUTDATED: "OUTDATED",                   // Grounded in superseded/stale document
  RETRACTED: "RETRACTED",                 // Grounded in retracted source
  UNKNOWN: "UNKNOWN"
});

export const ABSTENTION_REASON = Object.freeze({
  NONE: "NONE",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  OFFICIAL_CONFLICT: "OFFICIAL_CONFLICT",
  HIGH_STAKE_UNVERIFIED: "HIGH_STAKE_UNVERIFIED",
  SOURCE_RETRACTED: "SOURCE_RETRACTED",
  PROMPT_INJECTION_DETECTED: "PROMPT_INJECTION_DETECTED",
  POLICY_SUPERSEDED: "POLICY_SUPERSEDED"
});

export class AiTrustModel {
  /**
   * Creates a canonical Atomic Claim entity
   */
  static createClaim(data = {}) {
    const claimId = data.claimId || `CLAIM_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const text = typeof data.text === "string" ? data.text.trim() : "";
    const subject = typeof data.subject === "string" ? data.subject.trim() : "HCMUTE";
    const predicate = typeof data.predicate === "string" ? data.predicate.trim() : "STATES";
    const object = typeof data.object === "string" ? data.object.trim() : "";
    const qualifiers = Array.isArray(data.qualifiers) ? [...data.qualifiers] : [];
    const scope = typeof data.scope === "string" ? data.scope.trim() : "ALL"; // e.g. K24
    const jurisdiction = typeof data.jurisdiction === "string" ? data.jurisdiction.trim() : "HCMUTE";
    const claimType = CLAIM_TYPE[data.claimType] || CLAIM_TYPE.FACTUAL;
    const stakeLevel = STAKE_LEVEL[data.stakeLevel] || STAKE_LEVEL.MEDIUM;

    return Object.freeze({
      claimId,
      text,
      subject,
      predicate,
      object,
      qualifiers,
      scope,
      jurisdiction,
      claimType,
      stakeLevel,
      numericValue: data.numericValue !== undefined ? Number(data.numericValue) : null,
      numericUnit: data.numericUnit || null,
      effectiveFrom: data.effectiveFrom || null,
      effectiveUntil: data.effectiveUntil || null,
      citationIds: Array.isArray(data.citationIds) ? [...data.citationIds] : [],
      status: TRUST_STATUS[data.status] || TRUST_STATUS.UNVERIFIED,
      version: data.version || 1
    });
  }

  /**
   * Creates a canonical Evidence Span entity
   */
  static createEvidenceSpan(data = {}) {
    const evidenceId = data.evidenceId || `EVID_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sourceId = typeof data.sourceId === "string" ? data.sourceId.trim() : "SRC_UNKNOWN";
    const documentId = typeof data.documentId === "string" ? data.documentId.trim() : "DOC_UNKNOWN";
    const passage = typeof data.passage === "string" ? data.passage.trim() : "";
    const section = data.section || null;
    const charStart = typeof data.charStart === "number" ? data.charStart : 0;
    const charEnd = typeof data.charEnd === "number" ? data.charEnd : passage.length;
    const contentHash = data.contentHash || this.computeContentHash(passage);

    return Object.freeze({
      evidenceId,
      sourceId,
      documentId,
      passage,
      section,
      charStart,
      charEnd,
      contentHash,
      observedAt: data.observedAt || new Date().toISOString()
    });
  }

  /**
   * Creates a canonical Source entity
   */
  static createSource(data = {}) {
    const sourceId = typeof data.sourceId === "string" ? data.sourceId.trim() : `SRC_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sourceType = SOURCE_TYPE[data.sourceType] || SOURCE_TYPE.UNKNOWN;
    const authorityTier = typeof data.authorityTier === "number" ? data.authorityTier : (
      sourceType === SOURCE_TYPE.OFFICIAL ? AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR :
      sourceType === SOURCE_TYPE.OFFICIAL_MIRROR ? AUTHORITY_TIER.TIER_2_FACULTY_DEPARTMENT :
      sourceType === SOURCE_TYPE.EXPERT ? AUTHORITY_TIER.TIER_3_VERIFIED_EXPERT :
      sourceType === SOURCE_TYPE.COMMUNITY ? AUTHORITY_TIER.TIER_4_COMMUNITY_STUDENT :
      AUTHORITY_TIER.TIER_5_UNVERIFIED_WEB
    );
    const url = typeof data.url === "string" ? data.url.trim() : "";
    const canonicalHost = data.canonicalHost || this.extractHost(url);
    const publisher = typeof data.publisher === "string" ? data.publisher.trim() : "HCMUTE";
    const domainScope = typeof data.domainScope === "string" ? data.domainScope.trim() : "ACADEMIC_REGULATION";
    const publishedAt = data.publishedAt || new Date().toISOString();
    const temporalStatus = TEMPORAL_STATUS[data.temporalStatus] || TEMPORAL_STATUS.VALID;
    const contentHash = data.contentHash || "";
    const version = data.version || "1.0";
    const isRetracted = Boolean(data.isRetracted);

    return Object.freeze({
      sourceId,
      sourceType,
      authorityTier,
      url,
      canonicalHost,
      publisher,
      domainScope,
      publishedAt,
      effectiveFrom: data.effectiveFrom || publishedAt,
      effectiveUntil: data.effectiveUntil || null,
      supersededBy: data.supersededBy || null,
      temporalStatus: isRetracted ? TEMPORAL_STATUS.RETRACTED : temporalStatus,
      contentHash,
      version,
      isRetracted
    });
  }

  /**
   * Creates a canonical Citation entity linking Claim to Evidence
   */
  static createCitation(data = {}) {
    const citationId = data.citationId || `CITE_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const claimId = typeof data.claimId === "string" ? data.claimId.trim() : "";
    const sourceId = typeof data.sourceId === "string" ? data.sourceId.trim() : "";
    const evidenceId = typeof data.evidenceId === "string" ? data.evidenceId.trim() : "";
    const citationStatus = CITATION_STATUS[data.citationStatus] || CITATION_STATUS.VALID_ENTAILMENT;
    const entailmentScore = typeof data.entailmentScore === "number" ? data.entailmentScore : 1.0;

    return Object.freeze({
      citationId,
      claimId,
      sourceId,
      evidenceId,
      citationStatus,
      entailmentScore,
      explanation: typeof data.explanation === "string" ? data.explanation : ""
    });
  }

  /**
   * Creates an Auditable Trust Evaluation entity with multi-dimensional trust metrics
   */
  static createTrustEvaluation(data = {}) {
    const evaluationId = data.evaluationId || `TRUST_EVAL_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const query = typeof data.query === "string" ? data.query.trim() : "";
    const rawAnswer = typeof data.rawAnswer === "string" ? data.rawAnswer.trim() : "";
    const queryStake = STAKE_LEVEL[data.queryStake] || STAKE_LEVEL.MEDIUM;
    const claims = Array.isArray(data.claims) ? data.claims.map(c => this.createClaim(c)) : [];
    const citations = Array.isArray(data.citations) ? data.citations.map(c => this.createCitation(c)) : [];
    const evidenceSpans = Array.isArray(data.evidenceSpans) ? data.evidenceSpans.map(e => this.createEvidenceSpan(e)) : [];
    const sources = Array.isArray(data.sources) ? data.sources.map(s => this.createSource(s)) : [];

    const trustStatus = TRUST_STATUS[data.trustStatus] || TRUST_STATUS.UNVERIFIED;
    const abstentionReason = ABSTENTION_REASON[data.abstentionReason] || ABSTENTION_REASON.NONE;
    const requiresAbstention = Boolean(data.requiresAbstention || abstentionReason !== ABSTENTION_REASON.NONE);

    // Multi-dimensional metric representation
    const metrics = Object.freeze({
      provenanceScore: Number(data.metrics?.provenanceScore ?? 1.0),
      authorityScore: Number(data.metrics?.authorityScore ?? 100),
      evidenceQuality: Number(data.metrics?.evidenceQuality ?? 1.0),
      claimCoverage: Number(data.metrics?.claimCoverage ?? 1.0), // fraction of claims supported
      citationAccuracy: Number(data.metrics?.citationAccuracy ?? 1.0),
      temporalValidity: Number(data.metrics?.temporalValidity ?? 1.0),
      sourceIndependenceScore: Number(data.metrics?.sourceIndependenceScore ?? 1.0),
      contradictionSeverity: Number(data.metrics?.contradictionSeverity ?? 0),
      manipulationRisk: Number(data.metrics?.manipulationRisk ?? 0),
      uncertainty: Number(data.metrics?.uncertainty ?? 0)
    });

    return Object.freeze({
      evaluationId,
      query,
      queryStake,
      rawAnswer,
      verifiedAnswer: typeof data.verifiedAnswer === "string" ? data.verifiedAnswer : rawAnswer,
      claims,
      citations,
      evidenceSpans,
      sources,
      trustStatus,
      requiresAbstention,
      abstentionReason,
      explanation: typeof data.explanation === "string" ? data.explanation : "",
      contradictions: Array.isArray(data.contradictions) ? [...data.contradictions] : [],
      unsupportedClaims: Array.isArray(data.unsupportedClaims) ? [...data.unsupportedClaims] : [],
      provenanceClusters: Array.isArray(data.provenanceClusters) ? [...data.provenanceClusters] : [],
      metrics,
      metadata: Object.freeze({
        policyVersion: data.metadata?.policyVersion || "1.0.0",
        evaluator: "StudentHub_AiTrustEngine_v1",
        evaluatedAt: data.metadata?.evaluatedAt || new Date().toISOString()
      })
    });
  }

  /**
   * Deterministic simple content hasher
   */
  static computeContentHash(text) {
    if (!text || typeof text !== "string") return "0";
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = ((hash << 5) - hash) + text.charCodeAt(i);
      hash |= 0;
    }
    return String(Math.abs(hash));
  }

  /**
   * Helper to extract hostname from URL
   */
  static extractHost(url) {
    if (!url || typeof url !== "string") return "unknown.hcmute.edu.vn";
    try {
      const parsed = new URL(url);
      return parsed.hostname.toLowerCase();
    } catch {
      return "hcmute.edu.vn";
    }
  }
}
