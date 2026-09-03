import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertScope", () => {
  const expert = ExpertIntelligenceModel.createExpert({
    expertId: "EXP_SCOPE_1",
    name: "TS. Nguyễn Văn Minh",
    orcid: "0000-0002-1825-0097",
    scopes: [
      { domain: "AI_ML", subdomain: "NLP", level: EXPERTISE_LEVEL.STRONG },
      { domain: "EDTECH", subdomain: "LMS", level: EXPERTISE_LEVEL.MODERATE },
      { domain: "TUITION_POLICY", subdomain: "Finance", level: EXPERTISE_LEVEL.NOT_ESTABLISHED }
    ]
  });

  it("should match strong subdomain to QUALIFIED_EXPERT_OPINION", () => {
    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Mô hình Transformer phù hợp cho bài toán dịch máy.",
      domain: "AI_ML"
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, claim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);
    assert.strictEqual(result.isWithinExpertise, true);
  });

  it("should classify out-of-scope domain as OUT_OF_SCOPE", () => {
    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Học phí học kỳ hè sẽ giảm 20%.",
      domain: "TUITION_POLICY"
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, claim);
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.OUT_OF_SCOPE);
    assert.strictEqual(result.isWithinExpertise, false);
  });
});
