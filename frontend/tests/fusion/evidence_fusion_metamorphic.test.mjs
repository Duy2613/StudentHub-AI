import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionAdjudicator } from "../../src/lib/intelligence/fusion/evidenceFusionAdjudicator.js";
import { EvidenceFusionModel, KNOWLEDGE_LAYER } from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionMetamorphicTestSuite", () => {
  it("Metamorphic 1: Reordering multi-layer inputs produces semantically identical Knowledge Object", () => {
    const claimsA = [
      { statement: "Hạn chót 05/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH },
      { statement: "TS. Minh diễn giải K24", layer: KNOWLEDGE_LAYER.EXPERT_INTERPRETATION },
      { statement: "Sinh viên nộp 6-8 ngày", layer: KNOWLEDGE_LAYER.COMMUNITY_REALITY }
    ];
    const claimsB = [
      claimsA[2],
      claimsA[0],
      claimsA[1]
    ];

    const knoA = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims: claimsA });
    const knoB = EvidenceFusionAdjudicator.adjudicate({ subject: "DEADLINE", claims: claimsB });

    assert.strictEqual(knoA.authoritativeState, knoB.authoritativeState);
    assert.strictEqual(knoA.officialTruth?.value, knoB.officialTruth?.value);
    assert.strictEqual(knoA.realityGaps.length, knoB.realityGaps.length);
  });

  it("Metamorphic 2: JSON serialization roundtrip preserves entity structure and state", () => {
    const kno = EvidenceFusionAdjudicator.adjudicate({
      subject: "DEADLINE",
      claims: [{ statement: "Hạn chót 05/09/2026", layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH }]
    });

    const str = JSON.stringify(kno);
    const deserialized = EvidenceFusionModel.createKnowledgeObject(JSON.parse(str));

    assert.strictEqual(deserialized.knowledgeObjectId, kno.knowledgeObjectId);
    assert.strictEqual(deserialized.authoritativeState, kno.authoritativeState);
    assert.strictEqual(deserialized.officialTruth.value, kno.officialTruth.value);
  });
});
