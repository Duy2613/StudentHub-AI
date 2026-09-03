import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CounterEvidenceEngine } from "../../src/lib/intelligence/trust/counterEvidenceEngine.js";
import {
  AiTrustModel,
  AUTHORITY_TIER,
  TEMPORAL_STATUS
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustCounterEvidence", () => {
  it("should actively discover counter-evidence and weaken or conflict preliminary conclusions", () => {
    const claim = AiTrustModel.createClaim({
      text: "Chuẩn tốt nghiệp TOEIC là 550 điểm",
      numericValue: 550,
      scope: "K24"
    });

    const candidatePool = [
      AiTrustModel.createEvidenceSpan({
        passage: "Quy định cũ năm 2021 yêu cầu chuẩn TOEIC 500 điểm.",
        temporalStatus: TEMPORAL_STATUS.HISTORICALLY_TRUE,
        authorityTier: AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR
      })
    ];

    const result = CounterEvidenceEngine.searchCounterEvidence(claim, candidatePool);
    assert.strictEqual(result.counterEvidence.length, 1);
    assert.strictEqual(result.outcome, "WEAKENED");
    assert.ok(result.explanation.includes("lịch sử"));
  });
});
