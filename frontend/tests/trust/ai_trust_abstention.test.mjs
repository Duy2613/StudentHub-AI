import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AiTrustEngine } from "../../src/lib/intelligence/trust/aiTrustEngine.js";
import {
  ABSTENTION_REASON,
  STAKE_LEVEL,
  TRUST_STATUS
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustAbstention", () => {
  it("should trigger abstention when high-stake query has no authoritative evidence", () => {
    const evalResult = AiTrustEngine.evaluate({
      query: "Quy định kỷ luật buộc thôi học của HCMUTE áp dụng như thế nào?",
      rawAnswer: "Sinh viên bị buộc thôi học nếu điểm rèn luyện dưới 30.",
      sources: [],
      evidenceSpans: [],
      stakeLevel: STAKE_LEVEL.CRITICAL
    });

    assert.strictEqual(evalResult.requiresAbstention, true);
    assert.strictEqual(evalResult.abstentionReason, ABSTENTION_REASON.HIGH_STAKE_UNVERIFIED);
    assert.strictEqual(evalResult.trustStatus, TRUST_STATUS.UNVERIFIED);
    assert.ok(evalResult.verifiedAnswer.includes("[TỪ CHỐI KHẲNG ĐỊNH"));
  });

  it("should trigger abstention when active official sources conflict on critical policy", () => {
    const evalResult = AiTrustEngine.evaluate({
      query: "Chuẩn đầu ra TOEIC K24 là bao nhiêu?",
      rawAnswer: "K24 yêu cầu TOEIC 550 điểm và K24 yêu cầu TOEIC 500 điểm.",
      sources: [
        { sourceId: "S1", sourceType: "OFFICIAL", authorityTier: 100 },
        { sourceId: "S2", sourceType: "OFFICIAL", authorityTier: 100 }
      ],
      evidenceSpans: [
        { evidenceId: "E1", sourceId: "S1", passage: "Chuẩn đầu ra K24 tiếng Anh là TOEIC 550 điểm." },
        { evidenceId: "E2", sourceId: "S2", passage: "Chuẩn đầu ra K24 tiếng Anh là TOEIC 500 điểm." }
      ],
      stakeLevel: STAKE_LEVEL.HIGH
    });

    assert.strictEqual(evalResult.requiresAbstention, true);
    assert.strictEqual(evalResult.abstentionReason, ABSTENTION_REASON.OFFICIAL_CONFLICT);
    assert.strictEqual(evalResult.trustStatus, TRUST_STATUS.CONFLICTED);
  });
});
