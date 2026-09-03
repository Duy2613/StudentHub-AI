import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AiTrustStore } from "../../src/lib/intelligence/trust/aiTrustStore.js";
import { AiTrustEngine } from "../../src/lib/intelligence/trust/aiTrustEngine.js";
import {
  EPISTEMIC_STATE,
  ANSWER_MODE
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustV2E2E", () => {
  beforeEach(() => {
    AiTrustStore.clear();
  });

  it("Scenario A: Golden User Experience — TOEIC K24 regulation lookup fully verified against official document", () => {
    const evaluation = AiTrustEngine.evaluate({
      query: "Quy định hiện tại yêu cầu TOEIC K24 bao nhiêu?",
      rawAnswer: "Sinh viên khóa K24 cần đạt chuẩn TOEIC 550 điểm.",
      sources: [
        { sourceId: "SRC_REGISTRAR", name: "Phòng Đào Tạo HCMUTE", authorityTier: 100 }
      ],
      evidenceSpans: [
        {
          evidenceId: "EVID_QD_3116",
          sourceId: "SRC_REGISTRAR",
          documentId: "QD_3116_2025",
          passage: "Chuẩn ngoại ngữ đầu ra áp dụng cho sinh viên trình độ đại học chính quy từ khóa 2024 (K24) trở đi là TOEIC 550 điểm.",
          authorityTier: 100,
          validFrom: "2025-08-22"
        }
      ]
    });

    assert.strictEqual(evaluation.epistemicState, EPISTEMIC_STATE.VERIFIED);
    assert.strictEqual(evaluation.answerMode, ANSWER_MODE.DIRECT_VERIFIED);
    assert.ok(evaluation.structuredResponse.conclusion.includes("550"));
    assert.strictEqual(evaluation.structuredResponse.evidence.length, 1);

    // Save to store
    AiTrustStore.saveEvaluation(evaluation);
    const retrieved = AiTrustStore.getEvaluation(evaluation.evaluationId);
    assert.ok(retrieved);
  });
});
