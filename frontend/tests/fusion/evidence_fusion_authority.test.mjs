import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionAdjudicator } from "../../src/lib/intelligence/fusion/evidenceFusionAdjudicator.js";
import {
  EPISTEMIC_FINAL_STATE,
  KNOWLEDGE_LAYER
} from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionAuthorityTestSuite", () => {
  it("should enforce official truth precedence over 10,000 viral community rumors", () => {
    const claims = [
      {
        statement: "Hạn chót nộp hồ sơ tốt nghiệp là 05/09/2026.",
        layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH,
        sourceRef: { citation: "Thông báo 185/TB-ĐHSPKT" }
      },
      {
        statement: "Hạn chót nộp hồ sơ tốt nghiệp là 10/09/2026.",
        layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY,
        value: "10/09/2026",
        upvotes: 10000
      }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      claims
    });

    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.AUTHORITATIVE);
    assert.strictEqual(kno.officialTruth.value, "05/09/2026");
    assert.ok(kno.contradictions.some(c => c.type === "COMMUNITY_RUMOR_VS_OFFICIAL"));
  });

  it("should prevent AI 99% confidence from creating authoritative state without official source", () => {
    const claims = [
      {
        statement: "Chắc chắn kỳ này trường miễn thi chuẩn đầu ra.",
        layer: KNOWLEDGE_LAYER.AI_VERIFIED_REASONING,
        confidence: 0.99
      }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "EXEMPTION",
      claims
    });

    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.UNKNOWN);
    assert.strictEqual(kno.officialTruth, null);
  });
});
