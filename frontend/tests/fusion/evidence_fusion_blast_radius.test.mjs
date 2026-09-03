import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionBlastRadius } from "../../src/lib/intelligence/fusion/evidenceFusionBlastRadius.js";
import { EvidenceFusionStore } from "../../src/lib/intelligence/fusion/evidenceFusionStore.js";

describe("EvidenceFusionBlastRadiusTestSuite", () => {
  it("should compute downstream consumers impacted by deadline and exit standard updates", () => {
    const kno = EvidenceFusionStore.getById("KNO_GRADUATION_DEADLINE_2026");
    const blast = EvidenceFusionBlastRadius.computeBlastRadius(kno);

    assert.ok(blast.impactedCount >= 3);
    assert.ok(blast.consumers.some(c => c.systemId === "ACADEMIC_WORKFLOW"));
    assert.ok(blast.consumers.some(c => c.systemId === "ACADEMIC_NOTIFICATIONS"));
  });
});
