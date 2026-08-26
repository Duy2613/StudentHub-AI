import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ExpertScopeEngine } from "../../src/lib/intelligence/expert/expertScopeEngine.js";
import {
  ExpertIntelligenceModel,
  EXPERTISE_LEVEL,
  EXPERT_CLAIM_STATUS
} from "../../src/lib/intelligence/expert/expertIntelligenceModel.js";

describe("ExpertRetractionCorrection", () => {
  it("should mark claim RETRACTED when expert or council withdraws the statement", () => {
    const expert = ExpertIntelligenceModel.createExpert({
      expertId: "EXP_DATA",
      name: "TS. Dữ Liệu",
      scopes: [{ domain: "DATA_SCIENCE", level: EXPERTISE_LEVEL.STRONG }]
    });

    const retractedClaim = ExpertIntelligenceModel.createExpertClaim({
      text: "Thuật toán A có độ chính xác 99% trên bộ dữ liệu B.",
      domain: "DATA_SCIENCE",
      isRetracted: true
    });

    const result = ExpertScopeEngine.evaluateClaimScope(expert, retractedClaim);

    assert.strictEqual(result.claimStatus, EXPERT_CLAIM_STATUS.RETRACTED);
    assert.strictEqual(result.isWithinExpertise, false);
    assert.ok(result.explanation.includes("thu hồi/cải chính"));
  });
});
