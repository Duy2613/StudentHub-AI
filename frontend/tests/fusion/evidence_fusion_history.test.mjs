import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionStore } from "../../src/lib/intelligence/fusion/evidenceFusionStore.js";

describe("EvidenceFusionHistoryDiffTestSuite", () => {
  it("should generate structured Knowledge Diff between V1 and V2", () => {
    const diff = EvidenceFusionStore.computeKnowledgeDiff("KNO_GRADUATION_DEADLINE_2026");

    assert.strictEqual(diff.hasPreviousVersion, true);
    assert.strictEqual(diff.previousVersion, 1);
    assert.strictEqual(diff.currentVersion, 2);
    assert.strictEqual(diff.diff.previousOfficialValue, "30/08/2026");
    assert.strictEqual(diff.diff.currentOfficialValue, "05/09/2026");
    assert.ok(diff.diff.explanation.includes("Gia hạn thời hạn chính thức"));
  });
});
