import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertConflictOfInterest", () => {
  it("should flag CONFLICT_OF_INTEREST and disqualify claim when commercial endorsement is present", () => {
    const expert = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_FINTECH",
      name: "Chuyên Gia Tài Chính",
      scopes: [
        { domain: "FINTECH", level: EXPERTISE_LEVEL.STRONG }
      ]
    });

    const commercialClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Các bạn sinh viên nên đăng ký mở thẻ tại ngân hàng X để được miễn phí chuyển tiền.",
      domain: "FINTECH",
      isCommercialEndorsement: true
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, commercialClaim);

    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST);
    assert.strictEqual(result.hasConflictOfInterest, true);
    assert.strictEqual(result.isWithinExpertise, false);
    assert.ok(result.explanation.includes("xung đột lợi ích"));
  });
});
