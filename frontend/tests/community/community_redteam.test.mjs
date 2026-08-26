import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CommunityIntelligenceModel,
  CONSENSUS_SIGNAL,
  MANIPULATION_RISK
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityRedTeamAdversarialDefense", () => {
  it("Attack 1: Mass copy-paste astroturfing must trigger SUSPECTED_COORDINATION", () => {
    const copyPastePosts = [
      { authorId: "BOT_1", content: "Dịch vụ làm chứng chỉ nhanh liên hệ Zalo 0999." },
      { authorId: "BOT_2", content: "Dịch vụ làm chứng chỉ nhanh liên hệ Zalo 0999." },
      { authorId: "BOT_3", content: "Dịch vụ làm chứng chỉ nhanh liên hệ Zalo 0999." }
    ];

    const evalResult = CommunityExperienceEngine.evaluateConsensus("TOEIC", copyPastePosts);
    assert.strictEqual(evalResult.consensusSignal, CONSENSUS_SIGNAL.SUSPECTED_COORDINATION);
    assert.strictEqual(evalResult.manipulationRisk, MANIPULATION_RISK.COORDINATED_COPY_PASTE);
  });

  it("Attack 2: Sockpuppet cluster sharing identical deviceFingerprint must trigger SUSPECTED_SOCKPUPPET", () => {
    const sockpuppets = [
      { authorId: "PUPPET_1", deviceFingerprint: "DEVICE_SIG_CLUST_99", content: "Review 1 về môn học A" },
      { authorId: "PUPPET_2", deviceFingerprint: "DEVICE_SIG_CLUST_99", content: "Review 2 về môn học A" },
      { authorId: "PUPPET_3", deviceFingerprint: "DEVICE_SIG_CLUST_99", content: "Review 3 về môn học A" }
    ];

    const evalResult = CommunityExperienceEngine.evaluateConsensus("COURSE_REVIEW", sockpuppets);
    assert.strictEqual(evalResult.consensusSignal, CONSENSUS_SIGNAL.SUSPECTED_COORDINATION);
    assert.strictEqual(evalResult.manipulationRisk, MANIPULATION_RISK.SUSPECTED_SOCKPUPPET);
  });

  it("Attack 3: Commercial link flood must trigger ASTROTURFING_PROMOTION", () => {
    const promoPosts = [
      { authorId: "U1", content: "Học tại", externalLinks: ["https://promo-center.com/deal"] },
      { authorId: "U2", content: "Khuyên dùng", externalLinks: ["https://promo-center.com/deal"] },
      { authorId: "U3", content: "Khóa học hay", externalLinks: ["https://promo-center.com/deal"] }
    ];

    const evalResult = CommunityExperienceEngine.evaluateConsensus("COURSE_REVIEW", promoPosts);
    assert.strictEqual(evalResult.consensusSignal, CONSENSUS_SIGNAL.SUSPECTED_COORDINATION);
    assert.strictEqual(evalResult.manipulationRisk, MANIPULATION_RISK.ASTROTURFING_PROMOTION);
  });

  it("Attack 4: Unverified hearsay rumor must be classified as UNVERIFIED_RUMOR", () => {
    const hearsayPost = CommunityIntelligenceModel.createCommunityPost({
      content: "Nghe nói kỳ này trường hủy toàn bộ lớp hè."
    });

    const classification = CommunityExperienceEngine.classifyRumorVsFact(hearsayPost);
    assert.strictEqual(classification.isRumor, true);
    assert.strictEqual(classification.category, "UNVERIFIED_RUMOR");
  });
});
