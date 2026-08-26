import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { EvidenceFusionTemporalEngine } from "../../src/lib/intelligence/fusion/evidenceFusionTemporalEngine.js";
import {
  TEMPORAL_ALIGNMENT_STATE,
  KNOWLEDGE_LAYER
} from "../../src/lib/intelligence/fusion/evidenceFusionModel.js";

describe("EvidenceFusionTemporalTestSuite", () => {
  it("should evaluate supersession when a newer official notice replaces an older one", () => {
    const oldNotice = {
      layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH,
      publishedAt: "2026-08-01T00:00:00Z"
    };
    const newNotice = {
      layer: KNOWLEDGE_LAYER.OFFICIAL_TRUTH,
      publishedAt: "2026-08-20T00:00:00Z"
    };

    const res = EvidenceFusionTemporalEngine.evaluateTemporalRelation(newNotice, oldNotice);
    assert.strictEqual(res.isSupersession, true);
    assert.strictEqual(res.activeSource, newNotice);
    assert.strictEqual(res.supersededSource, oldNotice);
  });

  it("should categorize 3-year old claims as HISTORICAL_SUPERSEDED", () => {
    const oldClaim = {
      statement: "Quy trình năm 2022",
      createdAt: "2022-01-01T00:00:00Z"
    };
    const currentClaim = {
      statement: "Quy trình năm 2026",
      createdAt: "2026-08-01T00:00:00Z"
    };

    const { active, historical } = EvidenceFusionTemporalEngine.alignTemporalClaims([oldClaim, currentClaim]);
    assert.strictEqual(active.length, 1);
    assert.strictEqual(historical.length, 1);
    assert.strictEqual(historical[0].temporalState, "HISTORICAL_SUPERSEDED");
  });
});
