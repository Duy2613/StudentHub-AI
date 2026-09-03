import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  JURISDICTION_TYPE
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertIntelligenceMutationGuard", () => {
  it("Mutant 1: Academic professor opinion must NEVER automatically become official institutional regulation", () => {
    const prof = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_PROF",
      name: "GS. A",
      hasRegistrarAuthority: false,
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG }]
    });

    const policyClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Nhà trường sẽ cho phép sinh viên thi lại 3 lần mà không tính điểm F.",
      domain: "ACADEMIC_REGULATION",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });

    const result = ExpertScopeEngine.evaluateClaimScope(prof, policyClaim);
    assert.notStrictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
    assert.strictEqual(result.isWithinJurisdiction, false);
  });

  it("Mutant 2: High reputation score must NEVER override an unestablished domain in scope graph", () => {
    const superstarProf = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_STAR",
      name: "GS. Hàng Đầu",
      reputationScore: 99,
      scopes: [
        { domain: "ROBOTICS", level: EXPERTISE_LEVEL.STRONG },
        { domain: "VIETNAM_VISA_LAW", level: EXPERTISE_LEVEL.NOT_ESTABLISHED }
      ]
    });

    const visaClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Quy định visa du học sinh sẽ thay đổi từ tháng 9.",
      domain: "VIETNAM_VISA_LAW"
    });

    const result = ExpertScopeEngine.evaluateClaimScope(superstarProf, visaClaim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.OUT_OF_SCOPE);
    assert.strictEqual(result.isWithinExpertise, false);
  });

  it("Mutant 3: Retracted statement must NEVER be classified as QUALIFIED_EXPERT_OPINION", () => {
    const expert = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_RETRACTED",
      scopes: [{ domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG }]
    });

    const retractedClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Mô hình đạt SOTA 99.9% (đã rút bài).",
      domain: "AI_ML",
      isRetracted: true
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, retractedClaim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.RETRACTED);
    assert.notStrictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);
  });

  it("Mutant 4: Commercial endorsement must NEVER be classified as independent expert opinion", () => {
    const expert = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_COMMERCIAL",
      scopes: [{ domain: "EDTECH", level: EXPERTISE_LEVEL.STRONG }]
    });

    const commercialClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Khóa học luyện thi TOEIC của trung tâm XYZ là tốt nhất.",
      domain: "EDTECH",
      isCommercialEndorsement: true
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, commercialClaim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST);
    assert.strictEqual(result.hasConflictOfInterest, true);
  });
});
