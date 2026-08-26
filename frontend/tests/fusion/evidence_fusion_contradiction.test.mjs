import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionAdjudicator } from "../../src/lib/intelligence/fusion/evidenceFusionAdjudicator.js";
import {
  EPISTEMIC_FINAL_STATE,
  EVIDENCE_HEALTH_STATE,
  KNOWLEDGE_LAYER
} from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionContradictionTestSuite", () => {
  it("should trigger CONFLICTED and REQUIRES_REVIEW when two active official sources contradict each other", () => {
    const conflictingClaims = [
      {
        statement: "Hạn chót là 05/09/2026",
        value: "05/09/2026",
        layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH,
        sourceRef: { sourceId: "DOC_OFFICIAL_A" }
      },
      {
        statement: "Hạn chót là 15/09/2026",
        value: "15/09/2026",
        layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH,
        sourceRef: { sourceId: "DOC_OFFICIAL_B" }
      }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      claims: conflictingClaims
    });

    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.CONFLICTED);
    assert.strictEqual(kno.evidenceHealth, EVIDENCE_HEALTH_STATE.REQUIRES_REVIEW);
    assert.ok(kno.contradictions.some(c => c.type === "AUTHORITATIVE_OFFICIAL_CONFLICT"));
  });

  it("should preserve expert disagreements without modifying official authoritative truth", () => {
    const claims = [
      {
        statement: "Hạn chót là 05/09/2026",
        value: "05/09/2026",
        layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH
      },
      {
        statement: "Áp dụng cho K24",
        value: "K24_ONLY",
        layer: KNOWLEDGE_LAYER.EXPERT_INTERPRETATION,
        authorId: "EXP_A"
      },
      {
        statement: "Áp dụng cho toàn trường",
        value: "ALL_COHORTS",
        layer: KNOWLEDGE_LAYER.EXPERT_INTERPRETATION,
        authorId: "EXP_B"
      }
    ];

    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      claims
    });

    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.AUTHORITATIVE);
    assert.ok(kno.contradictions.some(c => c.type === "EXPERT_DISAGREEMENT"));
  });
});
