import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityIntelligenceModel, CLAIM_TYPE } from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityFirstHandExperience", () => {
  it("should classify direct student experience and enforce invariant that it NEVER becomes official policy", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({
      body: "Tôi đã nộp hồ sơ ngày 12/08 và mất 3 ngày.",
      procedureDurationDays: 3
    });

    assert.strictEqual(post.contentType, CLAIM_TYPE.FIRST_HAND_EXPERIENCE);
    assert.strictEqual(post.procedureDurationDays, 3);
    // Invariant check: Community post is NOT official policy
    assert.notStrictEqual(post.contentType, "OFFICIAL_POLICY");
  });
});
