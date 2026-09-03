import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionTemporalEngine } from "../../src/lib/intelligence/fusion/evidenceFusionTemporalEngine.js";
import { EvidenceFusionStore } from "../../src/lib/intelligence/fusion/evidenceFusionStore.js";
import { KNOWLEDGE_LAYER } from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionSupersessionTestSuite", () => {
  it("should invalidate old official version when newer regulation version is published", () => {
    const diff = EvidenceFusionStore.computeKnowledgeDiff("KNO_GRADUATION_DEADLINE_2026");

    assert.strictEqual(diff.hasPreviousVersion, true);
    assert.strictEqual(diff.currentVersion, 2);
    assert.strictEqual(diff.diff.officialTruthChanged, true);
    assert.strictEqual(diff.diff.currentOfficialValue, "05/09/2026");
  });
});
