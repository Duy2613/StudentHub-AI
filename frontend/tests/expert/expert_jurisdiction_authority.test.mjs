import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS,
  JURISDICTION_TYPE
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertJurisdictionAuthority", () => {
  it("should flag AUTHORITY_MISMATCH when professor without registrar role asserts HCMUTE official policy", () => {
    const professor = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_PROF_CS",
      name: "GS.TS. AI Specialist",
      hasRegistrarAuthority: false,
      scopes: [
        { domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG }
      ]
    });

    const administrativeClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "HCMUTE chính thức dời hạn nộp chứng chỉ tiếng Anh sang tháng 11.",
      domain: "ACADEMIC_REGULATION",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });

    const result = ExpertScopeEngine.evaluateClaimScope(professor, administrativeClaim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.AUTHORITY_MISMATCH);
    assert.strictEqual(result.isWithinJurisdiction, false);
    assert.ok(result.explanation.includes("Lệch thẩm quyền quy chế"));
  });

  it("should permit institutional claims when expert holds registrar authority role", () => {
    const registrarDirector = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_REGISTRAR",
      name: "Trưởng Phòng Đào Tạo",
      hasRegistrarAuthority: true,
      scopes: [
        { domain: "ACADEMIC_REGULATION", level: EXPERTISE_LEVEL.STRONG, jurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN }
      ]
    });

    const administrativeClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Phòng Đào Tạo thông báo gia hạn đăng ký học phần đợt 2.",
      domain: "ACADEMIC_REGULATION",
      claimJurisdiction: JURISDICTION_TYPE.INSTITUTIONAL_ADMIN
    });

    const result = ExpertScopeEngine.evaluateClaimScope(registrarDirector, administrativeClaim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);
    assert.strictEqual(result.isWithinJurisdiction, true);
  });
});
