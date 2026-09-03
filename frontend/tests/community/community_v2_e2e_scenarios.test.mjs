import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { CommunityStore } from "../../src/lib/intelligence/community/communityStore.js";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import { CommunityRealityGapEngine } from "../../src/lib/intelligence/community/communityRealityGapEngine.js";
import { CommunityQueryEngine } from "../../src/lib/intelligence/community/communityQueryEngine.js";
import {
  CommunityIntelligenceModel,
  REALITY_GAP_STATE,
  COORDINATION_RISK
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityV2GoldenScenariosE2E", () => {
  beforeEach(() => {
    CommunityStore.clear();
  });

  it("Scenario A: K24 students reporting graduation delays produce verified experience cluster and friction signal", () => {
    const res = CommunityQueryEngine.query({ topic: "GRADUATION_DOSSIER_REVIEW" });

    assert.strictEqual(res.topic, "GRADUATION_DOSSIER_REVIEW");
    assert.ok(res.communityReality.firstHandReportCount >= 27);
    assert.strictEqual(res.officialComparison.gapStatus, REALITY_GAP_STATE.SIGNIFICANT_OPERATIONAL_GAP);
    assert.ok(res.firstHandEvidence.length > 0);
  });

  it("Scenario B: 20 posts repeating exact same wording collapse into 1 provenance cluster", () => {
    const identical = Array(20).fill(null).map((_, i) => CommunityIntelligenceModel.createCommunityPost({
      authorId: `U_${i}`,
      body: "Chắc chắn tuần sau sẽ có thông báo nghỉ học toàn trường."
    }));

    const evalRes = CommunityExperienceEngine.evaluateConsensus("RUMOR", identical);
    assert.strictEqual(evalRes.provenanceClustersCount, 1);
    assert.strictEqual(evalRes.consensusState, "APPARENT_CONSENSUS");
  });

  it("Scenario C: Official 3-day target vs Community 27 reports (6-8 days) triggers SIGNIFICANT_OPERATIONAL_GAP", () => {
    const posts = CommunityStore.getPostsByTopic("GRADUATION_DOSSIER_REVIEW", { redactPrivate: false });
    const gap = CommunityRealityGapEngine.evaluateRealityGap({
      topic: "GRADUATION_DOSSIER_REVIEW",
      officialTarget: "3 ngày làm việc",
      officialTargetDays: 3,
      posts
    });

    assert.strictEqual(gap.gapStatus, REALITY_GAP_STATE.SIGNIFICANT_OPERATIONAL_GAP);
    assert.strictEqual(gap.sampleSize, 27);
    assert.ok(gap.communityObserved.includes("6–8"));
  });

  it("Scenario D: Community deadline rumor vs Official notice preserves Official as authoritative truth", () => {
    const query = CommunityQueryEngine.query({ topic: "TOEIC_SUBMISSION_TIME" });
    assert.strictEqual(query.officialComparison.officialTarget, "3–5 ngày làm việc");
    assert.ok(query.limitations.some(l => l.includes("Không thay thế hoặc phủ quyết quy chế đào tạo chính thức")));
  });

  it("Scenario E: Single rare report of blurry QR scan rejection is marked as RARE_EDGE_CASE", () => {
    const query = CommunityQueryEngine.query({ topic: "TOEIC_SUBMISSION_TIME" });
    assert.ok(query.edgeCases.some(e => e.classification === "RARE_EDGE_CASE"));
  });

  it("Scenario F: Context segmentation separates Faculty A from Faculty B without false contradiction", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ context: { faculty: "KHOA_CNTT" }, procedureDurationDays: 3 }),
      CommunityIntelligenceModel.createCommunityPost({ context: { faculty: "KHOA_CO_KHI" }, procedureDurationDays: 9 })
    ];

    const evalRes = CommunityExperienceEngine.evaluateConsensus("INTERNSHIP_REVIEW", posts);
    assert.strictEqual(evalRes.contradictionAnalysis.isContextSplit, true);
    assert.strictEqual(evalRes.contradictionAnalysis.segments.length, 2);
  });

  it("Scenario G: Commercial vendor post is flagged with POTENTIAL_COMMERCIAL_INTEREST", () => {
    const promoPosts = [
      CommunityIntelligenceModel.createCommunityPost({ externalLinks: ["https://zalo.me/g/khoahoconline"] }),
      CommunityIntelligenceModel.createCommunityPost({ externalLinks: ["https://zalo.me/g/khoahoconline"] }),
      CommunityIntelligenceModel.createCommunityPost({ externalLinks: ["https://zalo.me/g/khoahoconline"] })
    ];

    const evalRes = CommunityExperienceEngine.evaluateConsensus("COURSE_PROMO", promoPosts);
    assert.strictEqual(evalRes.manipulationRisk, COORDINATION_RISK.POTENTIAL_COMMERCIAL_INTEREST);
  });

  it("Scenario H: Account cluster sharing same device fingerprint is flagged as SUSPECTED_SOCKPUPPET", () => {
    const sockpuppets = [
      CommunityIntelligenceModel.createCommunityPost({ authorId: "A1", deviceFingerprint: "FARM_IP_99" }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "A2", deviceFingerprint: "FARM_IP_99" }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "A3", deviceFingerprint: "FARM_IP_99" })
    ];

    const evalRes = CommunityExperienceEngine.evaluateConsensus("SOCKPUPPET_TOPIC", sockpuppets);
    assert.strictEqual(evalRes.manipulationRisk, COORDINATION_RISK.SUSPECTED_SOCKPUPPET);
  });
});
