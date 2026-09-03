import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AiTrustEngine } from "../../src/lib/intelligence/trust/aiTrustEngine.js";

describe("AiTrustV2MetamorphicTests", () => {
  it("Metamorphic 1: JSON Serialization roundtrip preserves all epistemic fields and metrics", () => {
    const input = {
      query: "Chứng chỉ ngoại ngữ K24",
      rawAnswer: "Yêu cầu TOEIC 550 điểm.",
      sources: [{ sourceId: "SRC_1", name: "HCMUTE", authorityTier: 100 }],
      evidenceSpans: [{ evidenceId: "E1", passage: "Yêu cầu TOEIC 550 điểm cho K24.", authorityTier: 100 }]
    };

    const res = AiTrustEngine.evaluate(input);
    const serialized = JSON.stringify(res);
    const parsed = JSON.parse(serialized);

    assert.strictEqual(parsed.epistemicState, res.epistemicState);
    assert.strictEqual(parsed.answerMode, res.answerMode);
    assert.strictEqual(parsed.metrics.authorityScore, res.metrics.authorityScore);
  });
});
