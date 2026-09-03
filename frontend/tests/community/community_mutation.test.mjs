import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CommunityIntelligenceModel,
  CLAIM_TYPE,
  CONSENSUS_STATE,
  COORDINATION_RISK,
  EVIDENCE_STATUS
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityIntelligenceMutationGuard", () => {
  it("Mutant 1: Forum statement must NEVER become official academic truth or policy", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({
      body: "Phòng Đào Tạo quyết định hủy môn học này."
    });
    assert.notStrictEqual(post.contentType, "OFFICIAL_POLICY");
    assert.strictEqual(post.contentType, CLAIM_TYPE.FACTUAL_CLAIM);
  });

  it("Mutant 2: 100,000 Upvotes on a single speculative post must NEVER create strong consensus", () => {
    const viralPost = [
      { authorId: "BOT_VIRAL", body: "Tin hot: Sẽ miễn thi tốt nghiệp!", upvotes: 100000, contentType: CLAIM_TYPE.SPECULATION }
    ];

    const evalResult = CommunityExperienceEngine.evaluateConsensus("VIRAL", viralPost);
    assert.notStrictEqual(evalResult.consensusState, CONSENSUS_STATE.STRONG_COMMUNITY_SIGNAL);
    assert.strictEqual(evalResult.consensusState, CONSENSUS_STATE.UNVERIFIED_RUMOR);
  });

  it("Mutant 3: Duplicate copied posts across 20 accounts must NEVER be counted as 20 independent provenance clusters", () => {
    const copiedText = "Dịch vụ hỗ trợ tốt nghiệp giá rẻ liên hệ ngay";
    const posts = Array.from({ length: 20 }).map((_, i) => ({
      authorId: `BOT_${i}`,
      body: copiedText
    }));

    const evalResult = CommunityExperienceEngine.evaluateConsensus("SPAM", posts);
    assert.strictEqual(evalResult.provenanceClustersCount, 1);
    assert.strictEqual(evalResult.consensusState, CONSENSUS_STATE.APPARENT_CONSENSUS);
  });

  it("Mutant 4: Historical 2022 experience must NEVER silently become current 2026 process", () => {
    const oldClaim = CommunityIntelligenceModel.createCommunityClaim({
      statement: "Quy trình năm 2022 nộp đơn giấy tại phòng A1.",
      publishedAt: "2022-01-01"
    });

    assert.strictEqual(oldClaim.recency, "HISTORICAL_CONTEXT");
    assert.strictEqual(oldClaim.status, EVIDENCE_STATUS.STALE);
  });

  it("Mutant 5: Unverified guest author must NEVER be marked as VERIFIED_STUDENT without credentials", () => {
    const guest = CommunityIntelligenceModel.createAuthor({
      authorId: "ANON_GUEST_123"
    });

    assert.strictEqual(guest.verifiedIdentity, "UNVERIFIED_GUEST");
  });

  it("Mutant 6: Coordinated syndication must NEVER be ignored as normal organic consensus", () => {
    const syndicatedPosts = [
      { authorId: "A1", body: "Văn bản giống hệt nhau từng chữ số 1." },
      { authorId: "A2", body: "Văn bản giống hệt nhau từng chữ số 1." },
      { authorId: "A3", body: "Văn bản giống hệt nhau từng chữ số 1." }
    ];

    const coord = CommunityExperienceEngine.detectCoordinationRisk(syndicatedPosts);
    assert.strictEqual(coord.risk, COORDINATION_RISK.SUSPECTED_COORDINATION);
  });

  it("Mutant 7: Commercial vendor promotion links must NEVER be treated as independent peer reviews", () => {
    const promoPosts = [
      { authorId: "V1", body: "Khóa học hay", externalLinks: ["https://ads-vendor.vn"] },
      { authorId: "V2", body: "Nên học tại", externalLinks: ["https://ads-vendor.vn"] },
      { authorId: "V3", body: "Link ưu đãi", externalLinks: ["https://ads-vendor.vn"] }
    ];

    const coord = CommunityExperienceEngine.detectCoordinationRisk(promoPosts);
    assert.strictEqual(coord.risk, COORDINATION_RISK.POTENTIAL_COMMERCIAL_INTEREST);
  });

  it("Mutant 8: AI-generated synthetic campaigns must be flagged as SUSPECTED_SYNTHETIC with caution", () => {
    const aiPosts = [
      { body: "Tổng kết lại rằng với tư cách là một sinh viên, việc học môn này rất hữu ích và đáng cân nhắc." },
      { body: "Tổng kết lại rằng trong bối cảnh học thuật số, việc học môn này rất hữu ích và đáng cân nhắc." },
      { body: "Tổng kết lại rằng với tư cách là một sinh viên, tài liệu rất hữu ích và đáng cân nhắc." }
    ];

    const coord = CommunityExperienceEngine.detectCoordinationRisk(aiPosts);
    assert.strictEqual(coord.risk, COORDINATION_RISK.SUSPECTED_SYNTHETIC);
  });
});
