import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  COORDINATION_RISK,
  CONSENSUS_STATE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityAstroturfDefense", () => {
  it("should classify commercial promotional spam links as POTENTIAL_COMMERCIAL_INTEREST", () => {
    const promoPosts = [
      { authorId: "SPAM_1", body: "Tham gia khóa học tại", externalLinks: ["https://promo-vendor.edu/buy"] },
      { authorId: "SPAM_2", body: "Khóa học rất tốt tại", externalLinks: ["https://promo-vendor.edu/buy"] },
      { authorId: "SPAM_3", body: "Ưu đãi tại link", externalLinks: ["https://promo-vendor.edu/buy"] }
    ];

    const coord = CommunityExperienceEngine.detectCoordinationRisk(promoPosts);
    assert.strictEqual(coord.risk, COORDINATION_RISK.POTENTIAL_COMMERCIAL_INTEREST);

    const consensus = CommunityExperienceEngine.evaluateConsensus("COURSE_REVIEW", promoPosts);
    assert.strictEqual(consensus.consensusState, CONSENSUS_STATE.APPARENT_CONSENSUS);
  });
});
