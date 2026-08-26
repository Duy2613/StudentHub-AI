/**
 * StudentHub AI — Expert Scope & Jurisdiction Engine V1
 * 
 * Enforces the core invariant: EXPERTISE ≠ INSTITUTIONAL AUTHORITY.
 * Evaluates whether an expert's claim falls within their verified domain scope
 * and checks if they have administrative jurisdiction over institutional policies.
 */

import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  JURISDICTION_TYPE
} from "./expertIntelligenceModel.js";

export class ExpertScopeEngine {
  /**
   * Evaluates an expert claim against the expert's Scope Graph & Institutional Jurisdiction
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

    // 1. Retraction check
    if (claimObj.isRetracted) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.NOT_ESTABLISHED,
        claimStatus: EXPERT_CLAIM_STATUS.RETRACTED,
        isWithinExpertise: false,
        isWithinJurisdiction: false,
        hasConflictOfInterest: false,
        explanation: "Ý kiến hoặc phát ngôn của chuyên gia đã bị chính chuyên gia hoặc hội đồng thu hồi/cải chính."
      });
    }

    // 2. Conflict of interest / Commercial endorsement check
    if (claimObj.isCommercialEndorsement) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.DISQUALIFIED,
        claimStatus: EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST,
        isWithinExpertise: false,
        isWithinJurisdiction: false,
        hasConflictOfInterest: true,
        explanation: "Phát hiện dấu hiệu quảng bá thương mại hoặc xung đột lợi ích. Ý kiến không được xếp hạng chuyên gia độc lập."
      });
    }

    // 3. Institutional Jurisdiction check (Core Invariant: Expertise != Authority)
    // If claim asserts institutional regulations (e.g. HCMUTE policy, tuition, graduation deadlines)
    if (claimObj.claimJurisdiction === JURISDICTION_TYPE.INSTITUTIONAL_ADMIN) {
      if (!expertObj.hasRegistrarAuthority) {
        return ExpertIntelligenceModel.createExpertEvaluation({
          expertId: expertObj.expertId,
          claim: claimObj,
          scopeLevel: EXPERTISE_LEVEL.NOT_ESTABLISHED,
          claimStatus: EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH,
          isWithinExpertise: true, // might have high academic rank
          isWithinJurisdiction: false, // lacks official registrar administrative authority
          hasConflictOfInterest: false,
          explanation: `Lệch thẩm quyền quy chế: Chuyên gia ${expertObj.name} có học hàm/học vị nhưng không giữ thẩm quyền hành chính Phòng Đào Tạo. Ý kiến chỉ mang tính nhận định cá nhân, không cấu thành quy chế chính thức.`
        });
      }
    }

    // 4. Domain Scope Graph Match
    const targetDomain = (claimObj.domain || "GENERAL").toUpperCase();
    const matchedScope = expertObj.scopes.find(s => s.domain === targetDomain);

    if (!matchedScope || matchedScope.level === EXPERTISE_LEVEL.NOT_ESTABLISHED) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.NOT_ESTABLISHED,
        claimStatus: EXPERT_CLAIM_STATUS.OUT_OF_SCOPE,
        isWithinExpertise: false,
        isWithinJurisdiction: true,
        hasConflictOfInterest: false,
        explanation: `Ngoài phạm vi chuyên môn: Lĩnh vực ${targetDomain} chưa được xác lập trong đồ thị năng lực của chuyên gia ${expertObj.name}.`
      });
    }

    if (matchedScope.level === EXPERTISE_LEVEL.STRONG) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.STRONG,
        claimStatus: EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION,
        isWithinExpertise: true,
        isWithinJurisdiction: true,
        hasConflictOfInterest: false,
        explanation: `Đúng chuyên môn chuyên sâu: Khẳng định thuộc lĩnh vực ${targetDomain} đã được xác thực qua công trình nghiên cứu và học vị của chuyên gia.`
      });
    }

    if (matchedScope.level === EXPERTISE_LEVEL.MODERATE) {
      return ExpertIntelligenceModel.createExpertEvaluation({
        expertId: expertObj.expertId,
        claim: claimObj,
        scopeLevel: EXPERTISE_LEVEL.MODERATE,
        claimStatus: EXPERT_CLAIM_STATUS.INTERPRETATION_ONLY,
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
      isWithinExpertise: false,
      isWithinJurisdiction: false,
      hasConflictOfInterest: false,
      explanation: "Không thể xác định mức độ phù hợp chuyên môn của khẳng định."
    });
  }
}
