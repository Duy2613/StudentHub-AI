import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionStore } from "../../src/lib/intelligence/fusion/evidenceFusionStore.js";
import { EPISTEMIC_FINAL_STATE } from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionKnowledgeObjectTestSuite", () => {
  it("should retrieve stored Knowledge Object with complete layered properties", () => {
    const kno = EvidenceFusionStore.getById("KNO_GRADUATION_DEADLINE_2026", { redactPrivate: true });

    assert.ok(kno);
    assert.strictEqual(kno.knowledgeObjectId, "KNO_GRADUATION_DEADLINE_2026");
    assert.strictEqual(kno.authoritativeState, EPISTEMIC_FINAL_STATE.AUTHORITATIVE);
    assert.strictEqual(kno.officialTruth.value, "05/09/2026");
    assert.ok(kno.expertInterpretation.length > 0);
    assert.ok(kno.communityReality);
    assert.strictEqual(kno.realityGaps.length, 1);
  });
});
