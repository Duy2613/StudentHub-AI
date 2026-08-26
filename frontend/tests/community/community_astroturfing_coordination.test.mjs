import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CONSENSUS_SIGNAL,
  MANIPULATION_RISK
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityAstroturfingCoordination", () => {
  it("should flag SUSPECTED_COORDINATION and COORDINATED_COPY_PASTE when multiple accounts post identical wording", () => {
    const identicalText = "Khóa học TOEIC của trung tâm ABC cam kết đầu ra 600+ chỉ sau 1 tháng.";
    const posts = [
      { authorId: "STU_BOT_1", content: identicalText },
      { authorId: "STU_BOT_2", content: identicalText },
      { authorId: "STU_BOT_3", content: identicalText }
    ];

    const result = CommunityExperienceEngine.evaluateConsensus("TOEIC_PROMO", posts);
    assert.strictEqual(result.consensusSignal, CONSENSUS_SIGNAL.SUSPECTED_COORDINATION);
    assert.strictEqual(result.manipulationRisk, MANIPULATION_RISK.COORDINATED_COPY_PASTE);
    assert.strictEqual(result.provenanceClustersCount, 1);
  });

  it("should flag ASTROTURFING_PROMOTION when multiple accounts spam repeated commercial link", () => {
    const posts = [
      { authorId: "STU_BOT_1", content: "Đăng ký tại https://spamsite.xyz/offer1", externalLinks: ["https://spamsite.xyz"] },
      { authorId: "STU_BOT_2", content: "Nhận voucher tại https://spamsite.xyz/offer2", externalLinks: ["https://spamsite.xyz"] },
      { authorId: "STU_BOT_3", content: "Link khuyến mãi: https://spamsite.xyz/offer3", externalLinks: ["https://spamsite.xyz"] }
    ];

    const result = CommunityExperienceEngine.evaluateConsensus("PROMO_SPAM", posts);
    assert.strictEqual(result.consensusSignal, CONSENSUS_SIGNAL.SUSPECTED_COORDINATION);
    assert.strictEqual(result.manipulationRisk, MANIPULATION_RISK.ASTROTURFING_PROMOTION);
  });
});
