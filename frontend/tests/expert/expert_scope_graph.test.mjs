import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertScopeGraph", () => {
  const expert = ExpertIntelligenceModel.createExpert({
    expertId: "EXP_AI_1",
    name: "Dr. A",
    scopes: [
      { domain: "AI_ML", level: EXPERTISE_LEVEL.STRONG },
      { domain: "EDTECH", level: EXPERTISE_LEVEL.MODERATE },
      { domain: "TUITION_POLICY", level: EXPERTISE_LEVEL.NOT_ESTABLISHED }
    ]
  });

  it("should classify strong domain match as QUALIFIED_EXPERT_OPINION", () => {
    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Mô hình Transformer phù hợp cho bài toán dịch máy.",
      domain: "AI_ML"
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, claim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);
    assert.strictEqual(result.isWithinExpertise, true);
  });

  it("should classify moderate domain match as INTERPRETATION_ONLY", () => {
    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Hệ thống LMS nên tích hợp thêm công cụ quiz tương tác.",
      domain: "EDTECH"
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, claim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.INTERPRETATION_ONLY);
  });

  it("should classify unestablished domain as OUT_OF_SCOPE", () => {
    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Học phí học kỳ hè sẽ giảm 20%.",
      domain: "TUITION_POLICY"
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, claim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.OUT_OF_SCOPE);
    assert.strictEqual(result.isWithinExpertise, false);
  });
});
