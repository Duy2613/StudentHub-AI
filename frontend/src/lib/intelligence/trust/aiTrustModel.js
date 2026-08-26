/**
 * StudentHub AI — AI Trust Engine Domain Model V2
 * Self-Verifying Epistemic Intelligence & Evidence-Constrained Reasoning System
 */

import crypto from "node:crypto";

export const EPISTEMIC_STATE = Object.freeze({
  KNOWN: "KNOWN",
  VERIFIED: "VERIFIED",
  SUPPORTED: "SUPPORTED",
  PARTIALLY_SUPPORTED: "PARTIALLY_SUPPORTED",
  INFERRED: "INFERRED",
  PLAUSIBLE: "PLAUSIBLE",
  UNCERTAIN: "UNCERTAIN",
  UNSUPPORTED: "UNSUPPORTED",
  CONTRADICTED: "CONTRADICTED",
  CONFLICTED: "CONFLICTED",
  OUTDATED: "OUTDATED",
  RETRACTED: "RETRACTED",
  UNKNOWN: "UNKNOWN",
  UNVERIFIED: "UNSUPPORTED",
  AUTHORITATIVE: "VERIFIED"
});

export const TRUST_STATUS = Object.freeze({
  ...EPISTEMIC_STATE,
  AUTHORITATIVE: "VERIFIED",
  UNVERIFIED: "UNSUPPORTED"
});

export const STAKE_LEVEL = Object.freeze({
  LOW: "LOW",
  LOW_STAKE: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  HIGH_STAKE: "HIGH",
  CRITICAL: "CRITICAL"
});

export const EVIDENCE_BUDGET = STAKE_LEVEL;

export const CLAIM_TYPE = Object.freeze({
  FACTUAL: "FACTUAL",
  REGULATORY: "REGULATORY",
  ACADEMIC_POLICY: "ACADEMIC_POLICY",
  PROCEDURAL: "PROCEDURAL",
  TEMPORAL: "TEMPORAL",
  NUMERIC: "NUMERIC",
  IDENTITY: "IDENTITY",
  EXPERT_OPINION: "EXPERT_OPINION",
  INTERPRETATION: "INTERPRETATION",
  RECOMMENDATION: "RECOMMENDATION",
  SPECULATION: "SPECULATION"
});

export const SOURCE_TYPE = Object.freeze({
  OFFICIAL: "OFFICIAL",
  OFFICIAL_MIRROR: "OFFICIAL_MIRROR",
  REGISTRY: "REGISTRY",
  EXPERT: "EXPERT",
  COMMUNITY: "COMMUNITY",
  SEARCH_RESULT: "SEARCH_RESULT",
  AI_GENERATED: "AI_GENERATED",
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

export const SOURCE_LINEAGE = Object.freeze({
  ORIGINAL: "ORIGINAL",
  MIRROR: "MIRROR",
  QUOTE: "QUOTE",
  SUMMARY: "SUMMARY",
  REPOST: "REPOST",
  SYNDICATED: "SYNDICATED",
  AI_GENERATED: "AI_GENERATED",
  UNKNOWN: "UNKNOWN"
});

export const TEMPORAL_STATUS = Object.freeze({
  CURRENTLY_VALID: "CURRENTLY_VALID",
  VALID: "CURRENTLY_VALID",
  HISTORICALLY_TRUE: "HISTORICALLY_TRUE",
  HISTORICAL: "HISTORICALLY_TRUE",
  SUPERSEDED: "SUPERSEDED",
  STALE: "STALE",
  RETRACTED: "RETRACTED",
  UNKNOWN: "UNKNOWN"
});

export const CITATION_STATUS = Object.freeze({
  VALID_ENTAILMENT: "VALID_ENTAILMENT",
  CITATION_VALID: "VALID_ENTAILMENT",
  PARTIAL_ENTAILMENT: "PARTIAL_ENTAILMENT",
  CITATION_PARTIAL: "PARTIAL_ENTAILMENT",
  CITATION_MISMATCH: "CITATION_MISMATCH",
  CITATION_FABRICATED: "CITATION_FABRICATED",
  CITATION_MISSING: "CITATION_MISSING",
  MISSING_EVIDENCE: "CITATION_MISSING"
});

export const CLAIM_RELATION = Object.freeze({
  SUPPORTS: "supports",
  DEPENDS_ON: "depends_on",
  CONTRADICTS: "contradicts",
  QUALIFIES: "qualifies",
  SUPERSEDES: "supersedes",
  DERIVES_FROM: "derives_from",
  UNCERTAIN_BECAUSE: "uncertain_because"
});

export const BLIND_SPOT_TYPE = Object.freeze({
  MISSING_SOURCE: "MISSING_SOURCE",
  MISSING_TIME_SCOPE: "MISSING_TIME_SCOPE",
  MISSING_COHORT_SCOPE: "MISSING_COHORT_SCOPE",
  MISSING_JURISDICTION: "MISSING_JURISDICTION",
  MISSING_EVIDENCE: "MISSING_EVIDENCE",
  UNVERIFIED_IDENTITY: "UNVERIFIED_IDENTITY",
  UNRESOLVED_CONTRADICTION: "UNRESOLVED_CONTRADICTION",
  SOURCE_ACCESS_FAILURE: "SOURCE_ACCESS_FAILURE"
});

export const INFERENCE_TYPE = Object.freeze({
  DIRECT_EVIDENCE: "DIRECT_EVIDENCE",
  DERIVED_INFERENCE: "DERIVED_INFERENCE",
  SPECULATION: "SPECULATION"
});

export const ANSWER_MODE = Object.freeze({
  DIRECT_VERIFIED: "DIRECT_VERIFIED",
  SUPPORTED: "SUPPORTED",
  PARTIALLY_SUPPORTED: "PARTIALLY_SUPPORTED",
  INFERRED: "INFERRED",
  CONFLICTED: "CONFLICTED",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  HUMAN_REVIEW_REQUIRED: "HUMAN_REVIEW_REQUIRED"
});

export const ABSTENTION_REASON = Object.freeze({
  NONE: "NONE",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  OFFICIAL_CONFLICT: "OFFICIAL_CONFLICT",
  HIGH_STAKE_UNVERIFIED: "HIGH_STAKE_UNVERIFIED",
  SOURCE_RETRACTED: "SOURCE_RETRACTED",
  PROMPT_INJECTION_DETECTED: "PROMPT_INJECTION_DETECTED",
  POLICY_SUPERSEDED: "POLICY_SUPERSEDED",
  BLIND_SPOT_UNRESOLVED: "BLIND_SPOT_UNRESOLVED"
});

export class AiTrustModel {
  static createClaim(data = {}) {
    const claimId = data.claimId || `CLAIM_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const text = typeof data.text === "string" ? data.text.trim() : (typeof data.statement === "string" ? data.statement.trim() : "");
    const subject = typeof data.subject === "string" ? data.subject.trim() : "HCMUTE";
    const predicate = typeof data.predicate === "string" ? data.predicate.trim() : "REQUIRES";
    const object = typeof data.object === "string" ? data.object.trim() : "";
    const qualifiers = Array.isArray(data.qualifiers) ? [...data.qualifiers] : [];
    const scope = typeof data.scope === "string" ? data.scope.trim() : (data.cohort || "ALL");
    const jurisdiction = typeof data.jurisdiction === "string" ? data.jurisdiction.trim() : (data.department || "HCMUTE");
    const claimType = CLAIM_TYPE[data.claimType] || CLAIM_TYPE.FACTUAL;
    const stakeLevel = STAKE_LEVEL[data.stakeLevel] || STAKE_LEVEL.MEDIUM;

    const epistemicState = EPISTEMIC_STATE[data.epistemicState || data.status] || EPISTEMIC_STATE.UNVERIFIED;
    const inferenceType = INFERENCE_TYPE[data.inferenceType] || INFERENCE_TYPE.DIRECT_EVIDENCE;

    return Object.freeze({
      claimId,
      text,
      statement: text,
      subject,
      predicate,
      object,
      qualifiers: Object.freeze(qualifiers),
      scope,
      cohort: scope,
      jurisdiction,
      department: jurisdiction,
      claimType,
      stakeLevel,
      epistemicState,
      status: epistemicState,
      inferenceType,
      inferenceTrace: data.inferenceTrace ? Object.freeze({ ...data.inferenceTrace }) : null,
      numericValue: data.numericValue !== undefined ? Number(data.numericValue) : null,
      numericUnit: data.numericUnit || null,
      effectiveFrom: data.effectiveFrom || null,
      effectiveUntil: data.effectiveUntil || null,
      citationIds: Object.freeze(Array.isArray(data.citationIds) ? [...data.citationIds] : []),
      overclaimFlags: Object.freeze(Array.isArray(data.overclaimFlags) ? [...data.overclaimFlags] : []),
      version: Number(data.version || 1)
    });
  }

  static createEvidenceSpan(data = {}) {
    const evidenceId = data.evidenceId || `EVID_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sourceId = typeof data.sourceId === "string" ? data.sourceId.trim() : "SRC_OFFICIAL";
    const documentId = typeof data.documentId === "string" ? data.documentId.trim() : "DOC_GENERAL";
    const passage = typeof data.passage === "string" ? data.passage.trim() : "";
    const section = data.section || null;
    const charStart = typeof data.charStart === "number" ? data.charStart : 0;
    const charEnd = typeof data.charEnd === "number" ? data.charEnd : passage.length;
    const contentHash = data.contentHash || this.computeContentHash(passage);
    const sourceLineage = SOURCE_LINEAGE[data.sourceLineage] || SOURCE_LINEAGE.ORIGINAL;
    const provenanceClusterId = data.provenanceClusterId || `CLUSTER_${contentHash.slice(0, 8)}`;
    const authorityTier = Number(data.authorityTier || AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR);
    const temporalStatus = TEMPORAL_STATUS[data.temporalStatus] || TEMPORAL_STATUS.CURRENTLY_VALID;

    return Object.freeze({
      evidenceId,
      sourceId,
      documentId,
      passage,
      section,
      charStart,
      charEnd,
      contentHash,
      sourceLineage,
      provenanceClusterId,
      authorityTier,
      temporalStatus,
      observedAt: data.observedAt || new Date().toISOString(),
      validFrom: data.validFrom || "2025-01-01",
      validUntil: data.validUntil || null,
      supersededAt: data.supersededAt || null,
      retractedAt: data.retractedAt || null
    });
  }

  static createCitation(data = {}) {
    return Object.freeze({
      citationId: data.citationId || `CITE_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      claimId: data.claimId,
      evidenceId: data.evidenceId,
      status: CITATION_STATUS[data.citationStatus || data.status] || CITATION_STATUS.VALID_ENTAILMENT,
      citationStatus: CITATION_STATUS[data.citationStatus || data.status] || CITATION_STATUS.VALID_ENTAILMENT,
      sourceId: data.sourceId || "SRC_OFFICIAL",
      url: data.url || null,
      title: data.title || "Văn bản quy định trích dẫn"
    });
  }

  static createSourceNode(data = {}) {
    const sourceId = data.sourceId || `SRC_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const name = typeof data.name === "string" ? data.name.trim() : "HCMUTE Official Source";
    const url = typeof data.url === "string" ? data.url.trim() : "https://hcmute.edu.vn";
    const sourceType = SOURCE_TYPE[data.sourceType] || SOURCE_TYPE.OFFICIAL;
    const authorityTier = Number(data.authorityTier || AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR);
    const lineage = SOURCE_LINEAGE[data.lineage] || SOURCE_LINEAGE.ORIGINAL;

    return Object.freeze({
      sourceId,
      name,
      url,
      sourceType,
      authorityTier,
      lineage,
      isRetracted: Boolean(data.isRetracted),
      temporalStatus: data.temporalStatus || (data.isRetracted ? TEMPORAL_STATUS.RETRACTED : TEMPORAL_STATUS.CURRENTLY_VALID),
      isVerifiedAuthority: authorityTier >= AUTHORITY_TIER.TIER_2_FACULTY_DEPARTMENT,
      citesSourceId: data.citesSourceId || null
    });
  }

  static createSource(data = {}) {
    return this.createSourceNode(data);
  }

  static createClaimEdge(data = {}) {
    return Object.freeze({
      edgeId: data.edgeId || `EDGE_${Math.random().toString(36).slice(2, 8)}`,
      fromClaimId: data.fromClaimId,
      toClaimId: data.toClaimId,
      relation: CLAIM_RELATION[data.relation] || CLAIM_RELATION.SUPPORTS,
      weight: Number(data.weight ?? 1.0),
      reason: data.reason || ""
    });
  }

  static createEvidenceCoverage(data = {}) {
    return Object.freeze({
      claimCoverage: {
        total: Number(data.totalClaims || 0),
        supported: Number(data.supportedClaims || 0),
        ratio: Number(data.totalClaims > 0 ? (data.supportedClaims / data.totalClaims).toFixed(2) : 0)
      },
      sourceCoverage: {
        totalSources: Number(data.totalSources || 0),
        officialSources: Number(data.officialSources || 0),
        ratio: Number(data.totalSources > 0 ? (data.officialSources / data.totalSources).toFixed(2) : 0)
      },
      scopeCoverage: {
        cohortMatched: Boolean(data.cohortMatched ?? true),
        jurisdictionMatched: Boolean(data.jurisdictionMatched ?? true),
        ratio: (Boolean(data.cohortMatched ?? true) && Boolean(data.jurisdictionMatched ?? true)) ? 1.0 : 0.5
      },
      temporalCoverage: {
        currentRatio: Number(data.currentRatio ?? 1.0),
        hasSupersededSources: Boolean(data.hasSupersededSources ?? false)
      }
    });
  }

  static createKnowledgeGapReport(data = {}) {
    return Object.freeze({
      gapId: data.gapId || `GAP_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      blindSpots: Object.freeze(Array.isArray(data.blindSpots) ? [...data.blindSpots] : []),
      requiredEvidenceRequests: Object.freeze(Array.isArray(data.requiredEvidenceRequests) ? [...data.requiredEvidenceRequests] : []),
      actionableGuidance: data.actionableGuidance || "Cần bổ sung văn bản quy định chính thức để xác minh đầy đủ."
    });
  }

  static createHumanReviewPacket(data = {}) {
    return Object.freeze({
      reviewId: data.reviewId || `REV_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      claim: data.claim ? this.createClaim(data.claim) : null,
      supportingEvidence: Object.freeze(Array.isArray(data.supportingEvidence) ? [...data.supportingEvidence] : []),
      counterEvidence: Object.freeze(Array.isArray(data.counterEvidence) ? [...data.counterEvidence] : []),
      sourceLineage: data.sourceLineage || SOURCE_LINEAGE.ORIGINAL,
      temporalState: data.temporalState || TEMPORAL_STATUS.CURRENTLY_VALID,
      riskLevel: STAKE_LEVEL[data.riskLevel] || STAKE_LEVEL.HIGH,
      recommendedReviewQuestion: data.recommendedReviewQuestion || "Quy định này có áp dụng cho sinh viên thuộc khóa hiện tại không?",
      isHumanAuthorized: Boolean(data.isHumanAuthorized ?? false),
      createdAt: new Date().toISOString()
    });
  }

  static createEpistemicEvaluation(data = {}) {
    const answerMode = ANSWER_MODE[data.answerMode] || ANSWER_MODE.DIRECT_VERIFIED;
    const claims = Array.isArray(data.claims) ? data.claims.map(c => this.createClaim(c)) : [];
    const evidenceSpans = Array.isArray(data.evidenceSpans) ? data.evidenceSpans.map(e => this.createEvidenceSpan(e)) : [];
    const counterEvidenceSpans = Array.isArray(data.counterEvidenceSpans) ? data.counterEvidenceSpans.map(e => this.createEvidenceSpan(e)) : [];
    const blindSpots = Array.isArray(data.blindSpots) ? [...data.blindSpots] : [];

    const supportedCount = claims.filter(c => c.epistemicState === EPISTEMIC_STATE.VERIFIED || c.epistemicState === EPISTEMIC_STATE.SUPPORTED).length;
    const evidenceCoverage = data.evidenceCoverage || this.createEvidenceCoverage({
      totalClaims: claims.length,
      supportedClaims: supportedCount,
      totalSources: evidenceSpans.length,
      officialSources: evidenceSpans.filter(e => e.authorityTier >= AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR).length
    });

    const structuredResponse = {
      conclusion: data.conclusion || (claims[0]?.text || "Thông tin đã được kiểm chứng đối soát cùng văn bản quy định hiện hành."),
      basis: data.basis || "Căn cứ theo quyết định ban hành chuẩn đào tạo của Trường Đại học Sư phạm Kỹ thuật TP.HCM.",
      evidence: evidenceSpans.map(e => ({ documentId: e.documentId, passage: e.passage, authorityTier: e.authorityTier })),
      limits: blindSpots.length > 0 ? blindSpots.map(b => b.description || b.type) : ["Áp dụng đúng phạm vi niên khóa và chương trình đào tạo quy định."],
      contradictions: counterEvidenceSpans.length > 0 ? counterEvidenceSpans.map(c => c.passage) : ["Không phát hiện mâu thuẫn chính thức."],
      verificationLevel: answerMode
    };

    let epistemicState = data.epistemicState;
    if (!epistemicState) {
      if (answerMode === ANSWER_MODE.DIRECT_VERIFIED) epistemicState = EPISTEMIC_STATE.VERIFIED;
      else if (answerMode === ANSWER_MODE.CONFLICTED || answerMode === ANSWER_MODE.HUMAN_REVIEW_REQUIRED) epistemicState = EPISTEMIC_STATE.CONFLICTED;
      else if (answerMode === ANSWER_MODE.INSUFFICIENT_EVIDENCE) epistemicState = EPISTEMIC_STATE.UNSUPPORTED;
      else if (answerMode === ANSWER_MODE.PARTIALLY_SUPPORTED) epistemicState = EPISTEMIC_STATE.PARTIALLY_SUPPORTED;
      else epistemicState = EPISTEMIC_STATE.SUPPORTED;
    }

    return Object.freeze({
      evaluationId: data.evaluationId || `EVAL_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      query: typeof data.query === "string" ? data.query.trim() : "",
      answerMode,
      epistemicState,
      abstentionReason: ABSTENTION_REASON[data.abstentionReason] || ABSTENTION_REASON.NONE,
      claims: Object.freeze(claims),
      evidenceSpans: Object.freeze(evidenceSpans),
      counterEvidenceSpans: Object.freeze(counterEvidenceSpans),
      blindSpots: Object.freeze(blindSpots),
      evidenceCoverage,
      structuredResponse: Object.freeze(structuredResponse),
      disproveAnalysis: data.disproveAnalysis ? Object.freeze({ ...data.disproveAnalysis }) : null,
      sensitivityAnalysis: data.sensitivityAnalysis ? Object.freeze({ ...data.sensitivityAnalysis }) : null,
      humanReviewPacket: data.humanReviewPacket || null,
      auditRecord: {
        timestamp: new Date().toISOString(),
        evaluationId: data.evaluationId || `EVAL_${Date.now()}`,
        policyVersion: data.policyVersion || "V2.0_2025",
        modelVersion: data.modelVersion || "StudentHub-Epistemic-V2",
        immutableHash: this.computeContentHash(JSON.stringify(claims))
      }
    });
  }

  static createTrustEvaluation(data = {}) {
    return this.createEpistemicEvaluation(data);
  }

  static computeContentHash(text = "") {
    return crypto.createHash("sha256").update(String(text).trim()).digest("hex");
  }
}
