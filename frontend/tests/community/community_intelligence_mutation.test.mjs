import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CONTENT_TYPE,
  CONSENSUS_SIGNAL,
  MANIPULATION_RISK
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityIntelligenceMutationGuard", () => {
  it("Mutant 1: Upvote count (1000 upvotes) on a single bot post must NEVER create strong consensus without independent accounts", () => {
    const singleViralPost = [
      {
        authorId: "BOT_VIRAL",
        content: "Trường sẽ miễn thi môn Triết cho tất cả sinh viên!",
        upvotes: 9999,
        contentType: CONTENT_TYPE.SPECULATION
      }
    ];

    const result = CommunityExperienceEngine.evaluateConsensus("VIRAL_RUMOR", singleViralPost);
    assert.notStrictEqual(result.consensusSignal, CONSENSUS_SIGNAL.STRONG_EXPERIENCE_CONSENSUS);
    assert.strictEqual(result.consensusSignal, CONSENSUS_SIGNAL.UNVERIFIED_RUMOR);
  });

  it("Mutant 2: Copied texts across 10 accounts must NEVER be counted as 10 independent provenance clusters", () => {
    const copiedText = "Nhận gia sư kèm 1-1 đồ án tốt nghiệp liên hệ 0909xxxxxx";
    const botPosts = Array.from({ length: 10 }).map((_, i) => ({
      authorId: `BOT_${i}`,
      content: copiedText
    }));

    const result = CommunityExperienceEngine.evaluateConsensus("SPAM_CLUSTER", botPosts);
    assert.strictEqual(result.provenanceClustersCount, 1);
    assert.strictEqual(result.consensusSignal, CONSENSUS_SIGNAL.SUSPECTED_COORDINATION);
  });

  it("Mutant 3: Community rumor must NEVER be classified as official institutional policy", () => {
    const rumorPosts = [
      { authorId: "STU_1", content: "Nghe bảo năm sau học phí tăng gấp đôi.", contentType: CONTENT_TYPE.SECOND_HAND_REPORT },
      { authorId: "STU_2", content: "Chắc là học phí tăng thật rồi.", contentType: CONTENT_TYPE.SPECULATION }
    ];

    const result = CommunityExperienceEngine.evaluateConsensus("TUITION_RUMOR", rumorPosts);
    assert.strictEqual(result.consensusSignal, CONSENSUS_SIGNAL.UNVERIFIED_RUMOR);
    assert.strictEqual(result.manipulationRisk, MANIPULATION_RISK.NONE);
  });

  it("Mutant 4: Commercial spam link promotion must trigger ASTROTURFING_PROMOTION", () => {
    const promoPosts = [
      { authorId: "ACC_1", content: "Khóa học toeic https://ads.com", externalLinks: ["https://ads.com"] },
      { authorId: "ACC_2", content: "Đăng ký tại https://ads.com", externalLinks: ["https://ads.com"] },
      { authorId: "ACC_3", content: "Vào xem https://ads.com", externalLinks: ["https://ads.com"] }
    ];

    const result = CommunityExperienceEngine.evaluateConsensus("COMMERCIAL_SPAM", promoPosts);
    assert.strictEqual(result.manipulationRisk, MANIPULATION_RISK.ASTROTURFING_PROMOTION);
    assert.strictEqual(result.consensusSignal, CONSENSUS_SIGNAL.SUSPECTED_COORDINATION);
  });
});
