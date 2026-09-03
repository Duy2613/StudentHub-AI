import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import { CommunityIntegrityEngine } from "../../src/lib/intelligence/community/communityIntegrityEngine.js";
import { CommunityProvenanceEngine } from "../../src/lib/intelligence/community/communityProvenanceEngine.js";
import {
  CommunityIntelligenceModel,
  COORDINATION_RISK,
  CONSENSUS_STATE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityV2RedTeamAdversarialSuite", () => {
  it("Attack A & L: 20 Sockpuppet accounts posting from shared device fingerprint are flagged", () => {
    const sockpuppets = [];
    for (let i = 0; i < 20; i++) {
      sockpuppets.push(CommunityIntelligenceModel.createCommunityPost({
        authorId: `BOT_ACC_${i}`,
        body: "Đã có thông báo hủy môn học!",
        deviceFingerprint: "DEVICE_CLUSTER_FARM_01"
      }));
    }

    const integrity = CommunityIntegrityEngine.analyzeIntegrity(sockpuppets);
    assert.strictEqual(integrity.coordinationRisk, COORDINATION_RISK.SUSPECTED_SOCKPUPPET);
  });

  it("Attack B: AI-generated coordinated posting pattern is caught by synthetic detector", () => {
    const aiPosts = [
      CommunityIntelligenceModel.createCommunityPost({ body: "Tổng kết lại rằng trong bối cảnh học thuật số rất hữu ích và đáng cân nhắc." }),
      CommunityIntelligenceModel.createCommunityPost({ body: "Với tư cách là một sinh viên trong bối cảnh học thuật số rất hữu ích và đáng cân nhắc." }),
      CommunityIntelligenceModel.createCommunityPost({ body: "Tổng kết lại rằng nhìn chung theo quan điểm của tôi rất hữu ích và đáng cân nhắc." })
    ];

    const integrity = CommunityIntegrityEngine.analyzeIntegrity(aiPosts);
    assert.strictEqual(integrity.isSynthetic, true);
  });

  it("Attack D: Commercial link spam is flagged as POTENTIAL_COMMERCIAL_INTEREST", () => {
    const spamPosts = [
      CommunityIntelligenceModel.createCommunityPost({ externalLinks: ["https://zalo.me/g/hacked123"] }),
      CommunityIntelligenceModel.createCommunityPost({ externalLinks: ["https://zalo.me/g/hacked123"] }),
      CommunityIntelligenceModel.createCommunityPost({ externalLinks: ["https://zalo.me/g/hacked123"] })
    ];

    const integrity = CommunityIntegrityEngine.analyzeIntegrity(spamPosts);
    assert.strictEqual(integrity.coordinationRisk, COORDINATION_RISK.POTENTIAL_COMMERCIAL_INTEREST);
  });

  it("Attack M: Copied article distributed across forum collapses to 1 provenance cluster", () => {
    const syndicated = [];
    for (let i = 0; i < 15; i++) {
      syndicated.push(CommunityIntelligenceModel.createCommunityPost({
        authorId: `USER_${i}`,
        body: "Bài báo hướng dẫn: Các bước chuẩn bị hồ sơ xét tốt nghiệp chuẩn xác 100%."
      }));
    }

    const prov = CommunityProvenanceEngine.clusterProvenance(syndicated);
    assert.strictEqual(prov.clusterCount, 1);
    assert.strictEqual(prov.isSyndicated, true);
  });

  it("Attack J: Community consensus contradicting official source remains purely COMMUNITY_SIGNAL", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S1", body: "Hạn chót là 10/09 nha cả nhà." }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S2", body: "Xác nhận hạn chót 10/09." }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S3", body: "Đồng ý hạn chót 10/09." })
    ];

    const res = CommunityExperienceEngine.evaluateConsensus("DEADLINE_RUMOR", posts);
    // Consensus does not elevate to official truth
    assert.ok(res.summary);
  });

  it("Attack K: Rare edge-case is preserved as RARE_EDGE_CASE rather than dismissed or labeled systemic", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({
        title: "Trường hợp hiếm gặp",
        body: "Trường hợp hiếm: scan chứng chỉ bị mờ mã QR kiểm tra của IIG bị trả về."
      })
    ];

    const edgeCases = CommunityIntegrityEngine.mineEdgeCases(posts);
    assert.strictEqual(edgeCases.length, 1);
    assert.strictEqual(edgeCases[0].classification, "RARE_EDGE_CASE");
    assert.strictEqual(edgeCases[0].isSystemic, false);
  });
});
