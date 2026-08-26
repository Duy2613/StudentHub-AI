import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CommunityIntelligenceModel,
  CONTENT_TYPE,
  CONSENSUS_SIGNAL
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityProcedureDuration", () => {
  it("should calculate exact median procedure turnaround duration across independent reports", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S1", content: "Kinh nghiệm của mình mất 5 ngày.", procedureDurationDays: 5, contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S2", content: "Mình nộp trực tiếp thì mất 7 ngày.", procedureDurationDays: 7, contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S3", content: "Xác nhận đợt vừa rồi mất 9 ngày.", procedureDurationDays: 9, contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE })
    ];

    const evaluation = CommunityExperienceEngine.evaluateConsensus("TOEIC_SUBMISSION", posts);
    assert.strictEqual(evaluation.medianProcedureDays, 7);
    assert.strictEqual(evaluation.consensusSignal, "STRONG_COMMUNITY_SIGNAL");
  });
});
