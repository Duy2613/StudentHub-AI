import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AiTrustStore } from "../../src/lib/intelligence/trust/aiTrustStore.js";

describe("AiTrustRecoveryAndCorrection", () => {
  beforeEach(() => {
    AiTrustStore.clear();
  });

  it("should record immutable correction event when an answer is revised without rewriting history", () => {
    const correction = AiTrustStore.recordCorrection({
      previousEvaluationId: "EVAL_TOEIC_OLD",
      reason: "Ban hành Quyết định 3116/QĐ-ĐHSPKT ngày 22/08/2025 cập nhật chuẩn TOEIC 550 điểm.",
      oldAnswer: "Chuẩn TOEIC là 500 điểm.",
      correctedAnswer: "Chuẩn TOEIC là 550 điểm theo quyết định mới nhất.",
      newEvidenceIds: ["EVID_QD_3116"]
    });

    assert.ok(correction.correctionId);
    assert.strictEqual(AiTrustStore.getAllCorrections().length, 1);
  });
});
