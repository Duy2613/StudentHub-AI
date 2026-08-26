import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AiTrustEngine } from "../../src/lib/intelligence/trust/aiTrustEngine.js";
import {
  EPISTEMIC_STATE,
  ANSWER_MODE
} from "../../src/lib/intelligence/trust/aiTrustModel.js";

describe("AiTrustSelfCritiqueEngine", () => {
  it("should run 5-pass self-critique: generate -> verify -> check counter-evidence -> prune overclaim -> synthesize structured answer", () => {
    const result = AiTrustEngine.evaluate({
      query: "Chuẩn tiếng Anh K24 là gì?",
      rawAnswer: "Sinh viên K24 cần TOEIC 550 và nộp trực tuyến trước 05/09.",
      sources: [
        { sourceId: "SRC_1", name: "QĐ 3116 ĐHSPKT", authorityTier: 100 }
      ],
      evidenceSpans: [
        {
          evidenceId: "EVID_1",
          sourceId: "SRC_1",
          documentId: "QD_3116",
          passage: "Chuẩn đầu ra ngoại ngữ áp dụng cho khóa 2024 (K24) là TOEIC 550 điểm.",
          authorityTier: 100,
          validFrom: "2025-08-22"
        }
      ]
    });

    assert.strictEqual(result.epistemicState, EPISTEMIC_STATE.PARTIALLY_SUPPORTED);
    assert.strictEqual(result.answerMode, ANSWER_MODE.PARTIALLY_SUPPORTED);
    assert.ok(result.overclaimChecks.some(c => c.hasOverclaim));
    assert.ok(result.structuredResponse.conclusion.includes("550"));
  });
});
