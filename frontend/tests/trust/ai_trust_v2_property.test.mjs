import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AiTrustEngine } from "../../src/lib/intelligence/trust/aiTrustEngine.js";

describe("AiTrustV2PropertyTests", () => {
  it("Property 1: Idempotency — evaluating same input twice yields identical decision", () => {
    const input = {
      query: "Chuẩn tốt nghiệp",
      rawAnswer: "Cần TOEIC 550",
      sources: [{ sourceId: "SRC_1", name: "ĐHSPKT", authorityTier: 100 }],
      evidenceSpans: [{ evidenceId: "E1", passage: "Yêu cầu TOEIC 550 điểm", authorityTier: 100 }]
    };

    const res1 = AiTrustEngine.evaluate(input);
    const res2 = AiTrustEngine.evaluate(input);

    assert.strictEqual(res1.epistemicState, res2.epistemicState);
    assert.strictEqual(res1.answerMode, res2.answerMode);
    assert.strictEqual(res1.requiresAbstention, res2.requiresAbstention);
  });

  it("Property 2: Source Order Invariance — reordering sources does not alter authority hierarchy", () => {
    const s1 = { sourceId: "SRC_1", name: "Official", authorityTier: 100 };
    const s2 = { sourceId: "SRC_2", name: "Community", authorityTier: 30 };

    const resA = AiTrustEngine.evaluate({
      query: "Quy định",
      rawAnswer: "TOEIC 550",
      sources: [s1, s2],
      evidenceSpans: [{ evidenceId: "E1", passage: "TOEIC 550", authorityTier: 100 }]
    });

    const resB = AiTrustEngine.evaluate({
      query: "Quy định",
      rawAnswer: "TOEIC 550",
      sources: [s2, s1],
      evidenceSpans: [{ evidenceId: "E1", passage: "TOEIC 550", authorityTier: 100 }]
    });

    assert.strictEqual(resA.epistemicState, resB.epistemicState);
  });
});
