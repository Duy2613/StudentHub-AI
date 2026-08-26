/**
 * StudentHub AI — Comprehensive Expert Scope & Jurisdiction Engine V2
 * 
 * Enforces the core invariants:
 * 1. EXPERTISE NEVER AUTOMATICALLY CREATES INSTITUTIONAL AUTHORITY.
 * 2. Time-bounded roles do not silently persist beyond their valid interval.
 * 3. Scope boundaries explicitly declare WHERE NOT TO TRUST an expert.
 * 4. Retracted publications invalidate dependent expert claims.
 * 5. Commercial conflicts disqualify claims from being independent peer advice.
 */

import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  JURISDICTION_TYPE,
  QUERY_ANSWER_MODE,
  CLAIM_STATUS,
  CLAIM_TYPE
} from "./expertIntelligenceModel.js";

export class ExpertScopeEngine {
  /**
   * Evaluates an expert claim against the expert's Scope Graph, Temporal Roles & Conflicts
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
        scopeLevel: EXPERTISE_LEVEL.OUT_OF_SCOPE,
        claimStatus: EXPERT_CLAIM_STATUS.OUT_OF_SCOPE,
        answerMode: QUERY_ANSWER_MODE.UNVERIFIED_EXPERT,
        isWithinExpertise: false,
        isWithinJurisdiction: false,
        hasConflictOfInterest: false,
        explanation: `Hồ sơ chuyên gia ${expertObj.name} chưa được xác thực danh tính từ cổng dữ liệu cơ quan hoặc ORCID.`
      });
    }

    // 1. Retraction check (Self retraction or cited publication retraction)
    if (claimObj.isRetracted || claimObj.status === CLAIM_STATUS.RETRACTED || claimObj.status === CLAIM_STATUS.NEEDS_REEVALUATION) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.OUT_OF_SCOPE,
        claimStatus: EXPERT_CLAIM_STATUS.RETRACTED,
        answerMode: QUERY_ANSWER_MODE.EXPERT_OPINION,
        isWithinExpertise: false,
        isWithinJurisdiction: false,
        hasConflictOfInterest: false,
        explanation: "Ý kiến hoặc công trình khoa học đã bị rút bài/thu hồi (Retracted) hoặc cần tái đánh giá do nguồn trích dẫn bị hủy."
      });
    }

    // 2. Conflict of interest / Commercial endorsement check
    const hasActiveConflict = (expertObj.conflicts && expertObj.conflicts.some(cf => cf.isActive && (!cf.domain || cf.domain === claimObj.domain || cf.domain === "ALL" || cf.domain === "GENERAL"))) ||
      claimObj.isCommercialEndorsement;

    if (hasActiveConflict) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.OUT_OF_SCOPE,
        claimStatus: EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST,
        answerMode: QUERY_ANSWER_MODE.EXPERT_CONFLICTED,
        isWithinExpertise: false,
        isWithinJurisdiction: false,
        hasConflictOfInterest: true,
        explanation: "Phát hiện dấu hiệu xung đột lợi ích hoặc tài trợ thương mại trong lĩnh vực này. Ý kiến không được phân loại là đánh giá chuyên môn độc lập."
      });
    }

    // 3. Institutional Jurisdiction check (Core Invariant: Expertise != Authority)
    if (claimObj.claimJurisdiction === JURISDICTION_TYPE.INSTITUTIONAL_ADMIN || claimObj.claimType === CLAIM_TYPE.OFFICIAL_POLICY_CLAIM) {
      const activeRegistrarRole = expertObj.roles.some(
        r => (r.roleTitle === "REGISTRAR_DIRECTOR" || r.roleTitle === "RECTOR" || r.roleTitle === "HEAD_OF_REGISTRAR") && r.isCurrent
      );

      if (!activeRegistrarRole && !expertObj.hasRegistrarAuthority) {
        return ExpertIntelligenceModel.createExpertEvaluation({
          expertId: expertObj.expertId,
          claim: claimObj,
          scopeLevel: EXPERTISE_LEVEL.OUT_OF_SCOPE,
          claimStatus: EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH,
          answerMode: QUERY_ANSWER_MODE.EXPERT_OPINION,
          isWithinExpertise: true,
          isWithinJurisdiction: false, // lacks active institutional authority
          hasConflictOfInterest: false,
          explanation: `Lệch thẩm quyền quy chế: Chuyên gia ${expertObj.name} có học hàm/học vị chuyên môn nhưng KHÔNG giữ thẩm quyền hành chính Phòng Đào Tạo trong thời gian hiện hành. Nhận định về quy chế học vụ không có giá trị pháp lý chính thức.`
        });
      }
    }

    // 4. Domain Expertise Matching
    const matchedScope = expertObj.scopes.find(s => s.domain === claimObj.domain);

    if (!matchedScope || matchedScope.level === EXPERTISE_LEVEL.OUT_OF_SCOPE || matchedScope.level === "NOT_ESTABLISHED") {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.OUT_OF_SCOPE,
        claimStatus: EXPERT_CLAIM_STATUS.OUT_OF_SCOPE,
        answerMode: QUERY_ANSWER_MODE.EXPERT_SCOPE_MISMATCH,
        isWithinExpertise: false,
        isWithinJurisdiction: true,
        hasConflictOfInterest: false,
        explanation: `Phạm vi chuyên môn không khớp: Chuyên gia ${expertObj.name} không có công trình hoặc hồ sơ nghiên cứu được xác thực trong lĩnh vực '${claimObj.domain}'.`
      });
    }

    if (matchedScope.level === EXPERTISE_LEVEL.ESTABLISHED || matchedScope.level === "STRONG") {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.ESTABLISHED,
        claimStatus: EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION,
        answerMode: QUERY_ANSWER_MODE.EXPERT_SUPPORTED,
        isWithinExpertise: true,
        isWithinJurisdiction: true,
        hasConflictOfInterest: false,
        explanation: `Ý kiến chuyên môn vững chắc (ESTABLISHED): Chuyên gia có các công trình nghiên cứu và vai trò học thuật được kiểm chứng trực tiếp trong lĩnh vực ${matchedScope.subdomain || claimObj.domain}.`
      });
    }

    if (matchedScope.level === EXPERTISE_LEVEL.SUPPORTED || matchedScope.level === EXPERTISE_LEVEL.EMERGING || matchedScope.level === "MODERATE") {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: matchedScope.level,
        claimStatus: EXPERT_CLAIM_STATUS.INTERPRETATION_ONLY,
        answerMode: QUERY_ANSWER_MODE.EXPERT_CONTEXT,
        isWithinExpertise: true,
        isWithinJurisdiction: true,
        hasConflictOfInterest: false,
        explanation: `Ý kiến phân tích tham khảo (${matchedScope.level}): Chuyên gia có kinh nghiệm nghiên cứu liên quan nhưng nhận định nên được đối chiếu thêm với tài liệu chính thống.`
      });
    }

    return ExpertIntelligenceModel.createExpertEvaluation({
      expertId: expertObj.expertId,
      claim: claimObj,
      scopeLevel: EXPERTISE_LEVEL.LIMITED,
      claimStatus: EXPERT_CLAIM_STATUS.OUT_OF_SCOPE,
      answerMode: QUERY_ANSWER_MODE.EXPERT_OPINION,
      isWithinExpertise: false,
      isWithinJurisdiction: true,
      hasConflictOfInterest: false,
      explanation: `Hạn chế chuyên môn (LIMITED): Lĩnh vực ${claimObj.domain} chỉ là nhánh phụ, khuyến nghị tham vấn chuyên gia chuyên sâu.`
    });
  }

  /**
   * Consensus Clustering for shared citations
   */
  static clusterExpertConsensus(claims = []) {
    const claimsArray = Array.isArray(claims) ? claims : [];
    const clusterMap = new Map();
    const uniqueExperts = new Set();

    for (const clm of claimsArray) {
      if (clm.expertId) uniqueExperts.add(clm.expertId);
      const evidenceList = (clm.citedEvidenceIds && clm.citedEvidenceIds.length > 0)
        ? clm.citedEvidenceIds
        : (clm.evidenceRefs && clm.evidenceRefs.length > 0
          ? clm.evidenceRefs
          : (clm.citedPublicationDoi ? [clm.citedPublicationDoi] : ["DEFAULT_CLUSTER"]));
      for (const ev of evidenceList) {
        if (!clusterMap.has(ev)) {
          clusterMap.set(ev, []);
        }
        clusterMap.get(ev).push(clm);
      }
    }

    const clusterCount = clusterMap.size || (claimsArray.length > 0 ? 1 : 0);
    const isSingleClusterEcho = uniqueExperts.size > 1 && clusterCount === 1;
    const isIndependent = !isSingleClusterEcho && uniqueExperts.size >= 2 && clusterCount >= 2;

    const explanation = isSingleClusterEcho
      ? `Cụm bằng chứng dùng chung: ${uniqueExperts.size} chuyên gia cùng trích dẫn 1 nguồn nghiên cứu duy nhất. Đây là hiện tượng lặp nguồn (Echo), không cấu thành đồng thuận độc lập.`
      : `Ghi nhận ${uniqueExperts.size} chuyên gia với ${clusterCount} cụm bằng chứng độc lập.`;

    return {
      clusterCount,
      clusters: Array.from(clusterMap.entries()).map(([key, val]) => ({ clusterId: key, claims: val })),
      isIndependentConsensus: isIndependent,
      independentExpertCount: uniqueExperts.size,
      explanation
    };
  }

  /**
   * Generates a Scope Boundary Report: "Where NOT to trust this expert"
   */
  static generateScopeBoundaries(expert) {
    const expertObj = ExpertIntelligenceModel.createExpert(expert);
    
    const established = [];
    const supported = [];
    const emerging = [];
    const limited = [];

    for (const scope of expertObj.scopes) {
      if (scope.level === EXPERTISE_LEVEL.ESTABLISHED || scope.level === "STRONG") {
        established.push(`${scope.domain} (${scope.subdomain || "Chuyên sâu"})`);
      } else if (scope.level === EXPERTISE_LEVEL.SUPPORTED || scope.level === "MODERATE") {
        supported.push(`${scope.domain} (${scope.subdomain || "Nghiên cứu liên quan"})`);
      } else if (scope.level === EXPERTISE_LEVEL.EMERGING) {
        emerging.push(`${scope.domain} (${scope.subdomain || "Mới tiếp cận"})`);
      } else {
        limited.push(`${scope.domain} (${scope.subdomain || "Hạn chế bằng chứng"})`);
      }
    }

    const unestablished = [
      "Quy chế Đào tạo & Điểm rèn luyện HCMUTE (Trừ khi giữ vai trò Phòng Đào Tạo)",
      "Chính sách Học phí & Miễn giảm tài chính",
      "Quy định Pháp lý ngoài lĩnh vực kỹ thuật"
    ];

    return {
      expertId: expertObj.expertId,
      name: expertObj.name,
      established,
      supported,
      emerging,
      limited,
      unestablished,
      whereNotToTrust: [
        "Không tin cậy khi chuyên gia phát biểu về quy chế học vụ nếu không có chức danh Phòng Đào Tạo.",
        "Không dùng uy tín ngành A để khẳng định chân lý trong ngành B.",
        "Cảnh giác với các sản phẩm công nghệ thương mại mà chuyên gia có nhận tài trợ."
      ]
    };
  }
}
