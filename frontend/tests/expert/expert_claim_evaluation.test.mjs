import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertClaimEvaluation", () => {
  it("should evaluate expert claim and return complete auditable evaluation object", () => {
    const expert = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_NETWORKS",
      name: "TS. Hoàng",
      scopes: [
        { domain: "COMPUTER_NETWORKS", level: EXPERTISE_LEVEL.STRONG }
      ]
    });

    const claim = ExpertIntelligenceModel.createExpertClaim({
      text: "Giao thức QUIC giúp giảm độ trễ bắt tay kết nối so với TCP truyền thống.",
      domain: "COMPUTER_NETWORKS"
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, claim);

    assert.ok(result.evaluationId);
    assert.strictEqual(result.expertId, "EXP_NETWORKS");
    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION);
    assert.strictEqual(result.isWithinExpertise, true);
  });
});
