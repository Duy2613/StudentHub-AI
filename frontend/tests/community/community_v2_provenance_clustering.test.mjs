import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityProvenanceEngine } from "../../src/lib/intelligence/community/communityProvenanceEngine.js";
import {
  CommunityIntelligenceModel,
  COORDINATION_RISK
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityV2ProvenanceClustering", () => {
  it("should collapse 20 identical copy-pasted posts into exactly 1 provenance cluster", () => {
    const identicalPosts = [];
    for (let i = 0; i < 20; i++) {
      identicalPosts.push(CommunityIntelligenceModel.createCommunityPost({
        postId: `POST_COPY_${i}`,
        authorId: `SV_USER_${i}`,
        body: "Nghe nói trường sắp bỏ điều kiện TOEIC 550 cho sinh viên K24!",
        topic: "TOEIC_RUMOR"
      }));
    }

    const res = CommunityProvenanceEngine.clusterProvenance(identicalPosts);

    assert.strictEqual(res.clusterCount, 1);
    assert.strictEqual(res.independentObservationUnits, 1);
    assert.strictEqual(res.isSyndicated, true);
    assert.strictEqual(res.coordinationRisk, COORDINATION_RISK.COORDINATED_COPY_PASTE);
    assert.ok(res.explanation.includes("Syndication"));
  });

  it("should recognize genuine independent clusters when distinct students write distinct reports", () => {
    const independentPosts = [
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S1", body: "Mình nộp ngày 1/8 mất 7 ngày." }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S2", body: "Kinh nghiệm nộp trực tiếp tại tầng 1 nhà A1 mất 8 ngày." }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S3", body: "Hôm qua mình lên nhận kết quả sau đúng 6 ngày làm việc." })
    ];

    const res = CommunityProvenanceEngine.clusterProvenance(independentPosts);

    assert.strictEqual(res.clusterCount, 3);
    assert.strictEqual(res.independentObservationUnits, 3);
    assert.strictEqual(res.isSyndicated, false);
  });
});
