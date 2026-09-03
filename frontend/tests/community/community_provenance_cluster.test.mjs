import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import { CommunityIntelligenceModel } from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityProvenanceClusters", () => {
  it("should collapse 10 identical copy-paste syndicated posts into 1 single provenance cluster", () => {
    const posts = Array.from({ length: 10 }).map((_, idx) =>
      CommunityIntelligenceModel.createCommunityPost({
        authorId: `BOT_ACC_${idx}`,
        body: "Dịch vụ hỗ trợ học vụ nhanh nhất HCMUTE liên hệ ngay."
      })
    );

    const { clusterCount, isSyndicated } = CommunityExperienceEngine.clusterProvenance(posts);
    assert.strictEqual(clusterCount, 1);
    assert.strictEqual(isSyndicated, true);
  });
});
