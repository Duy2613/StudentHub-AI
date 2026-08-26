import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityRealityGapEngine } from "../../src/lib/intelligence/community/communityRealityGapEngine.js";
import {
  CommunityIntelligenceModel,
  REALITY_GAP_STATE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityV2RealityGapEngine", () => {
  it("should evaluate SIGNIFICANT_OPERATIONAL_GAP when community turnaround is 6-8 days vs 3-day target", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ procedureDurationDays: 6, topic: "GRADUATION_DOSSIER_REVIEW" }),
      CommunityIntelligenceModel.createCommunityPost({ procedureDurationDays: 7, topic: "GRADUATION_DOSSIER_REVIEW" }),
      CommunityIntelligenceModel.createCommunityPost({ procedureDurationDays: 8, topic: "GRADUATION_DOSSIER_REVIEW" })
    ];

    const gap = CommunityRealityGapEngine.evaluateRealityGap({
      topic: "GRADUATION_DOSSIER_REVIEW",
      officialTarget: "3 ngày làm việc",
      officialTargetDays: 3,
      posts
    });

    assert.strictEqual(gap.gapStatus, REALITY_GAP_STATE.SIGNIFICANT_OPERATIONAL_GAP);
    assert.strictEqual(gap.officialTarget, "3 ngày làm việc");
    assert.ok(gap.communityObserved.includes("6–8"));
    assert.ok(gap.explanation.includes("SIGNIFICANT_OPERATIONAL_GAP"));
  });

  it("should evaluate ALIGNED when community turnaround matches official benchmark", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ procedureDurationDays: 2, topic: "TRANSCRIPT_REQUEST" }),
      CommunityIntelligenceModel.createCommunityPost({ procedureDurationDays: 2, topic: "TRANSCRIPT_REQUEST" }),
      CommunityIntelligenceModel.createCommunityPost({ procedureDurationDays: 3, topic: "TRANSCRIPT_REQUEST" })
    ];

    const gap = CommunityRealityGapEngine.evaluateRealityGap({
      topic: "TRANSCRIPT_REQUEST",
      officialTargetDays: 3,
      posts
    });

    assert.strictEqual(gap.gapStatus, REALITY_GAP_STATE.ALIGNED);
  });

  it("should return NO_COMMUNITY_EVIDENCE when zero student posts exist", () => {
    const gap = CommunityRealityGapEngine.evaluateRealityGap({
      topic: "NEW_PROCEDURE_2026",
      posts: []
    });

    assert.strictEqual(gap.gapStatus, REALITY_GAP_STATE.NO_COMMUNITY_EVIDENCE);
    assert.strictEqual(gap.sampleSize, 0);
  });
});
