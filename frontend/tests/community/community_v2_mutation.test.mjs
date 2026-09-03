import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import { CommunityProvenanceEngine } from "../../src/lib/intelligence/community/communityProvenanceEngine.js";
import { CommunityContextEngine } from "../../src/lib/intelligence/community/communityContextEngine.js";
import { CommunityIntegrityEngine } from "../../src/lib/intelligence/community/communityIntegrityEngine.js";
import {
  CommunityIntelligenceModel,
  COORDINATION_RISK,
  TEMPORAL_STATE,
  CONSENSUS_STATE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityV2MutationTestSuite", () => {
  it("Mutant 1: Forum post must NEVER directly create verified official regulation", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({ body: "Quy định mới bỏ TOEIC." });
    const claim = CommunityIntelligenceModel.createCommunityClaim({ body: post.body });
    assert.notStrictEqual(claim.status, "VERIFIED_OFFICIAL");
  });

  it("Mutant 2: High upvote count must NEVER elevate rumor to STRONG_COMMUNITY_SIGNAL", () => {
    const viralRumor = CommunityIntelligenceModel.createCommunityPost({
      body: "Nghe nói bỏ chuẩn đầu ra.",
      upvotes: 99999
    });
    const evalRes = CommunityExperienceEngine.evaluateConsensus("RUMOR", [viralRumor]);
    assert.notStrictEqual(evalRes.consensusState, CONSENSUS_STATE.STRONG_COMMUNITY_SIGNAL);
  });

  it("Mutant 3: Duplicate posts must NEVER produce independent cluster units", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({ body: "Bản sao A" });
    const prov = CommunityProvenanceEngine.clusterProvenance([post, post, post]);
    assert.strictEqual(prov.independentObservationUnits, 1);
  });

  it("Mutant 4: 3-year old post must NEVER evaluate to CURRENT_EXPERIENCE", () => {
    const oldDate = new Date(Date.now() - 3 * 365 * 24 * 60 * 60 * 1000).toISOString();
    const tempState = CommunityContextEngine.evaluateTemporalState(oldDate);
    assert.strictEqual(tempState, TEMPORAL_STATE.HISTORICAL);
  });

  it("Mutant 5: A single severe report must NEVER be labeled as systemic incident", () => {
    const edgeCases = CommunityIntegrityEngine.mineEdgeCases([
      CommunityIntelligenceModel.createCommunityPost({ body: "Trường hợp hiếm: bị từ chối do quét mã QR mờ." })
    ]);
    assert.strictEqual(edgeCases[0].isSystemic, false);
  });

  it("Mutant 6: Commercial link spam must NEVER evaluate to COORDINATION_RISK.NONE", () => {
    const integrity = CommunityIntegrityEngine.analyzeIntegrity([
      CommunityIntelligenceModel.createCommunityPost({ externalLinks: ["https://zalo.me/g/sales"] }),
      CommunityIntelligenceModel.createCommunityPost({ externalLinks: ["https://zalo.me/g/sales"] }),
      CommunityIntelligenceModel.createCommunityPost({ externalLinks: ["https://zalo.me/g/sales"] })
    ]);
    assert.notStrictEqual(integrity.coordinationRisk, COORDINATION_RISK.NONE);
  });

  it("Mutant 7: Sockpuppet cluster must NEVER be counted as independent users", () => {
    const integrity = CommunityIntegrityEngine.analyzeIntegrity([
      CommunityIntelligenceModel.createCommunityPost({ authorId: "B1", deviceFingerprint: "DEV_SAME" }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "B2", deviceFingerprint: "DEV_SAME" }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "B3", deviceFingerprint: "DEV_SAME" })
    ]);
    assert.strictEqual(integrity.sockpuppetClusters.length, 1);
    assert.strictEqual(integrity.coordinationRisk, COORDINATION_RISK.SUSPECTED_SOCKPUPPET);
  });

  it("Mutant 8: Faculty context difference must NOT be flattened into a single global average", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ context: { faculty: "KHOA_CNTT" }, procedureDurationDays: 3 }),
      CommunityIntelligenceModel.createCommunityPost({ context: { faculty: "KHOA_DIEN" }, procedureDurationDays: 10 })
    ];
    const res = CommunityContextEngine.analyzeVarianceAndContradiction(posts);
    assert.strictEqual(res.isContextSplit, true);
    assert.strictEqual(res.segments.length, 2);
  });

  it("Mutant 9: Client cannot inject verified official status into post badge", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({
      authorId: "ANON_USER",
      badge: "OFFICIAL_REGISTRAR"
    });
    assert.strictEqual(post.badge, "UNVERIFIED_GUEST");
  });

  it("Mutant 10: Syndication ratio >= 0.5 must trigger COORDINATED_COPY_PASTE risk", () => {
    const identical = Array(5).fill(null).map((_, i) => CommunityIntelligenceModel.createCommunityPost({
      authorId: `U_${i}`,
      body: "Thông điệp sao chép nguyên văn trên mạng xã hội."
    }));
    const prov = CommunityProvenanceEngine.clusterProvenance(identical);
    assert.strictEqual(prov.coordinationRisk, COORDINATION_RISK.COORDINATED_COPY_PASTE);
  });
});
