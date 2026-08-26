import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CommunityIntelligenceModel,
  CLAIM_TYPE,
  CONSENSUS_STATE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityConsensusModel", () => {
  it("should evaluate STRONG_COMMUNITY_SIGNAL when >= 3 independent authors corroborate with unique provenance", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S1", body: "Tôi nộp và mất 3 ngày.", procedureDurationDays: 3, contentType: CLAIM_TYPE.FIRST_HAND_EXPERIENCE }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S2", body: "Kinh nghiệm của mình cũng đúng 3 ngày.", procedureDurationDays: 3, contentType: CLAIM_TYPE.FIRST_HAND_EXPERIENCE }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S3", body: "Hôm qua mình lên nhận thì mất 3 ngày làm việc.", procedureDurationDays: 3, contentType: CLAIM_TYPE.FIRST_HAND_EXPERIENCE })
    ];

    const evaluation = CommunityExperienceEngine.evaluateConsensus("REGISTRATION_TIME", posts);
    assert.strictEqual(evaluation.consensusState, CONSENSUS_STATE.STRONG_COMMUNITY_SIGNAL);
    assert.strictEqual(evaluation.medianProcedureDays, 3);
    assert.strictEqual(evaluation.independentAuthorsCount, 3);
  });
});
