import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CommunityIntelligenceModel,
  CONSENSUS_STATE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityContradictionResolution", () => {
  it("should output MIXED_EXPERIENCES and segment by department when reports conflict (3 days vs 10 days) without false averaging", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S1", procedureDurationDays: 3, context: { department: "FIT" }, body: "FIT mất 3 ngày." }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S2", procedureDurationDays: 3, context: { department: "FIT" }, body: "FIT đúng 3 ngày." }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S3", procedureDurationDays: 10, context: { department: "FME" }, body: "Cơ khí mất 10 ngày." }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S4", procedureDurationDays: 10, context: { department: "FME" }, body: "Cơ khí đúng 10 ngày." })
    ];

    const evaluation = CommunityExperienceEngine.evaluateConsensus("SUBMISSION_TIME", posts);
    assert.strictEqual(evaluation.consensusState, CONSENSUS_STATE.MIXED_EXPERIENCES);
    assert.strictEqual(evaluation.contradictionAnalysis.hasContradiction, true);
    assert.strictEqual(evaluation.contradictionAnalysis.segments.length, 2);
  });
});
