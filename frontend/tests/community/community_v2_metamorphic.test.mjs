import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CommunityIntelligenceModel
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityV2MetamorphicTests", () => {
  it("Metamorphic 1: Post array reordering has zero effect on consensus state and cluster counts", () => {
    const p1 = CommunityIntelligenceModel.createCommunityPost({ authorId: "A1", body: "Kinh nghiệm nhóm 1" });
    const p2 = CommunityIntelligenceModel.createCommunityPost({ authorId: "A2", body: "Kinh nghiệm nhóm 2" });
    const p3 = CommunityIntelligenceModel.createCommunityPost({ authorId: "A3", body: "Kinh nghiệm nhóm 3" });

    const evalOrder1 = CommunityExperienceEngine.evaluateConsensus("TOPIC_X", [p1, p2, p3]);
    const evalOrder2 = CommunityExperienceEngine.evaluateConsensus("TOPIC_X", [p3, p1, p2]);

    assert.strictEqual(evalOrder1.consensusState, evalOrder2.consensusState);
    assert.strictEqual(evalOrder1.provenanceClustersCount, evalOrder2.provenanceClustersCount);
    assert.strictEqual(evalOrder1.independentAuthorsCount, evalOrder2.independentAuthorsCount);
  });

  it("Metamorphic 2: JSON serialization roundtrip preserves entity semantics", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({
      postId: "POST_JSON_TEST",
      authorId: "SV2411001",
      body: "Nộp hồ sơ trực tuyến mất 5 ngày.",
      procedureDurationDays: 5
    });

    const str = JSON.stringify(post);
    const deserialized = CommunityIntelligenceModel.createCommunityPost(JSON.parse(str));

    assert.strictEqual(deserialized.postId, post.postId);
    assert.strictEqual(deserialized.procedureDurationDays, 5);
    assert.strictEqual(deserialized.context.institution, "HCMUTE");
  });
});
