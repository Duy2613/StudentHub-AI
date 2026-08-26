/**
 * StudentHub AI — Comprehensive Expert Scope & Jurisdiction Engine V1
 * 
 * Enforces the core invariants:
 * 1. EXPERTISE NEVER AUTOMATICALLY CREATES INSTITUTIONAL AUTHORITY.
 * 2. Time-bounded roles do not silently persist beyond their valid interval.
 * 3. Shared citations are collapsed into shared evidence clusters, not independent consensus.
 * 4. Retracted publications invalidate dependent expert claims.
 */

import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  JURISDICTION_TYPE,
  QUERY_ANSWER_MODE,
  CLAIM_STATUS
} from "./expertIntelligenceModel.js";

export class ExpertScopeEngine {
  /**
   * Evaluates an expert claim against the expert's Scope Graph, Temporal Roles & Conflicts
   * @param {object} expert Expert Profile object
   * @param {object} claim Expert Claim object
   * @returns {object} ExpertEvaluation object
   */
  static evaluateClaimScope(expert, claim) {
    if (!expert || !claim) {
      throw new Error("[EXPERT_SCOPE_ENGINE] Both expert and claim are required for evaluation.");
    }

    const expertObj = ExpertIntelligenceModel.createExpert(expert);
    const claimObj = ExpertIntelligenceModel.createExpertClaim(claim);

    // 0. Identity Verification Check
    if (!expertObj.isVerified) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.NOT_ESTABLISHED,
        claimStatus: EXPERT_CLAIM_STATUS.OUT_OF_SCOPE,
        answerMode: QUERY_ANSWER_MODE.UNVERIFIED_EXPERT,
        isWithinExpertise: false,
        isWithinJurisdiction: false,
        hasConflictOfInterest: false,
        explanation: `Hồ sơ chuyên gia ${expertObj.name} chưa được xác thực danh tính từ cổng dữ liệu cơ quan hoặc ORCID.`
      });
    }

    // 1. Retraction check (Self retraction or cited publication retraction)
    if (claimObj.isRetracted || claimObj.status === CLAIM_STATUS.RETRACTED) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.NOT_ESTABLISHED,
        claimStatus: EXPERT_CLAIM_STATUS.RETRACTED,
        answerMode: QUERY_ANSWER_MODE.EXPERT_OPINION,
        isWithinExpertise: false,
        isWithinJurisdiction: false,
        hasConflictOfInterest: false,
        explanation: "Ý kiến hoặc công trình khoa học đã bị tác giả hoặc hội đồng chuyên môn rút bài/thu hồi (Retracted)."
      });
    }

    // 2. Conflict of interest / Commercial endorsement check
    const hasActiveConflict = expertObj.conflicts.some(cf => cf.isActive) || claimObj.isCommercialEndorsement;
    if (hasActiveConflict) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.DISQUALIFIED,
        claimStatus: EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST,
        answerMode: QUERY_ANSWER_MODE.EXPERT_CONFLICTED,
        isWithinExpertise: false,
        isWithinJurisdiction: false,
        hasConflictOfInterest: true,
        explanation: "Phát hiện dấu hiệu xung đột lợi ích hoặc tài trợ thương mại. Ý kiến không được phân loại là đánh giá chuyên gia độc lập."
      });
    }

    // 3. Institutional Jurisdiction check (Core Invariant: Expertise != Authority)
    if (claimObj.claimJurisdiction === JURISDICTION_TYPE.INSTITUTIONAL_ADMIN) {
      const activeRegistrarRole = expertObj.roles.some(
        r => (r.roleTitle === "REGISTRAR_DIRECTOR" || r.roleTitle === "RECTOR") && r.isCurrent
      );

      if (!activeRegistrarRole && !expertObj.hasRegistrarAuthority) {
        return ExpertIntelligenceModel.createExpertEvaluation({
          expertId: expertObj.expertId,
          claim: claimObj,
          scopeLevel: EXPERTISE_LEVEL.NOT_ESTABLISHED,
          claimStatus: EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH,
          answerMode: QUERY_ANSWER_MODE.EXPERT_OPINION,
          isWithinExpertise: true,
          isWithinJurisdiction: false, // lacks current active institutional authority
          hasConflictOfInterest: false,
          explanation: `Lệch thẩm quyền quy chế: Chuyên gia ${expertObj.name} có học hàm/học vị nhưng không giữ thẩm quyền hành chính Phòng Đào Tạo trong thời gian hiện hành. Ý kiến chỉ mang tính nhận định cá nhân, không cấu thành quy chế chính thức.`
        });
      }
    }

    // 4. Domain & Subdomain Scope Graph Match
    const targetDomain = (claimObj.domain || "GENERAL").toUpperCase();
    const matchedScope = expertObj.scopes.find(s => s.domain === targetDomain);

    if (!matchedScope || matchedScope.level === EXPERTISE_LEVEL.NOT_ESTABLISHED) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.NOT_ESTABLISHED,
        claimStatus: EXPERT_CLAIM_STATUS.OUT_OF_SCOPE,
        answerMode: QUERY_ANSWER_MODE.EXPERT_SCOPE_MISMATCH,
        isWithinExpertise: false,
        isWithinJurisdiction: true,
        hasConflictOfInterest: false,
        explanation: `Ngoài phạm vi chuyên môn: Lĩnh vực ${targetDomain} chưa được xác lập trong đồ thị năng lực khoa học của chuyên gia ${expertObj.name}.`
      });
    }

    if (matchedScope.level === EXPERTISE_LEVEL.STRONG) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.STRONG,
        claimStatus: EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION,
        answerMode: QUERY_ANSWER_MODE.EXPERT_SUPPORTED,
        isWithinExpertise: true,
        isWithinJurisdiction: true,
        hasConflictOfInterest: false,
        explanation: `Đúng chuyên môn chuyên sâu: Khẳng định thuộc lĩnh vực ${targetDomain} được xác thực qua hồ sơ công trình và học vị tiến sĩ/phó giáo sư của chuyên gia.`
      });
    }

    if (matchedScope.level === EXPERTISE_LEVEL.MODERATE) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.MODERATE,
        claimStatus: EXPERT_CLAIM_STATUS.INTERPRETATION_ONLY,
        answerMode: QUERY_ANSWER_MODE.EXPERT_CONTEXT,
        isWithinExpertise: true,
        isWithinJurisdiction: true,
        hasConflictOfInterest: false,
        explanation: `Ý kiến diễn giải bổ trợ: Lĩnh vực ${targetDomain} thuộc chuyên môn liên ngành mức độ trung bình của chuyên gia.`
      });
    }

    return ExpertIntelligenceModel.createExpertEvaluation({
      expertId: expertObj.expertId,
      claim: claimObj,
      scopeLevel: EXPERTISE_LEVEL.NOT_ESTABLISHED,
      claimStatus: EXPERT_CLAIM_STATUS.OUT_OF_SCOPE,
      answerMode: QUERY_ANSWER_MODE.EXPERT_SCOPE_MISMATCH,
      isWithinExpertise: false,
      isWithinJurisdiction: false,
      hasConflictOfInterest: false,
      explanation: "Không thể xác định mức độ phù hợp chuyên môn của khẳng định."
    });
  }

  /**
   * Clusters expert claims sharing the exact same cited evidence/paper into Shared Provenance Clusters
   * @param {Array} claims List of ExpertClaim objects
   * @returns {object} { clusterCount, clusters }
   */
  static clusterExpertConsensus(claims = []) {
    if (!Array.isArray(claims) || claims.length === 0) {
      return { totalClaims: 0, clusterCount: 0, clusters: [], isIndependentConsensus: false };
    }

    const clustersByEvidence = new Map();
    const independentExperts = new Set();

    for (const cl of claims) {
      independentExperts.add(cl.expertId);
      const evidenceKey = cl.citedEvidenceIds && cl.citedEvidenceIds.length > 0
        ? cl.citedEvidenceIds.slice().sort().join("::")
        : `SELF_CLAIM_${cl.claimId}`;

      if (!clustersByEvidence.has(evidenceKey)) {
        clustersByEvidence.set(evidenceKey, []);
      }
      clustersByEvidence.get(evidenceKey).push(cl);
    }

    const clusterCount = clustersByEvidence.size;
    const isIndependentConsensus = clusterCount >= 3 && independentExperts.size >= 3;

    return {
      totalClaims: claims.length,
      clusterCount,
      independentExpertsCount: independentExperts.size,
      isIndependentConsensus,
      explanation: isIndependentConsensus
        ? `Đồng thuận chuyên gia độc lập (${independentExperts.size} chuyên gia với ${clusterCount} nguồn bằng chứng độc lập).`
        : `Cụm bằng chứng dùng chung (${claims.length} chuyên gia cùng trích dẫn ${clusterCount} nguồn gốc tài liệu).`
    };
  }
}
