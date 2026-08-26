import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertConflict", () => {
  it("should flag CONFLICT_OF_INTEREST when active commercial sponsorship or conflict is registered", () => {
    const sponsoredExpert = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_SPONSORED",
      name: "TS. Công Nghệ",
      orcid: "0000-0004-1122-3344",
      scopes: [{ domain: "EDTECH", level: EXPERTISE_LEVEL.STRONG }],
      conflicts: [
        { entityName: "Trung tâm Tiếng Anh ABC", relationship: "SPONSOR", isActive: true }
      ]
    });

    const promoClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Các bạn nên tham gia khóa học tại trung tâm ABC để đạt kết quả tốt nhất.",
      domain: "EDTECH"
    });

    const result = ExpertScopeEngine.evaluateClaimScope(sponsoredExpert, promoClaim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST);
    assert.strictEqual(result.hasConflictOfInterest, true);
    assert.strictEqual(result.isWithinExpertise, false);
  });
});
