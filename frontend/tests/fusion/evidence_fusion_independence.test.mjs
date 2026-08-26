import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionIndependenceEngine } from "../../src/lib/intelligence/fusion/evidenceFusionIndependenceEngine.js";
import { KNOWLEDGE_LAYER } from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionIndependenceTestSuite", () => {
  it("should recognize Official -> Expert -> AI as a linear derivation chain and not 3 independent confirmations", () => {
    const claims = [
      {
        claimId: "C_OFFICIAL",
        layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH,
        sourceRef: { sourceId: "DOC_3116" }
      },
      {
        claimId: "C_EXPERT",
        layer: KNOWLEDGE_LAYER.EXPERT_INTERPRETATION,
        derivationChain: ["DOC_3116"]
      },
      {
        claimId: "C_AI",
        layer: KNOWLEDGE_LAYER.AI_VERIFIED_REASONING,
        derivationChain: ["DOC_3116"]
      }
    ];

    const res = EvidenceFusionIndependenceEngine.evaluateIndependence(claims);
    assert.strictEqual(res.isLinearDerivation, true);
    assert.strictEqual(res.independentClusterCount, 1);
  });
});
