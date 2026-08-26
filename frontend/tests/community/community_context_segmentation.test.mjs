import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import { CommunityIntelligenceModel } from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityContextSegmentation", () => {
  it("should segment experiences by department and cohort rather than conflating distinct programs", () => {
    const posts = [
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S1", body: "K21 CNTT nộp mất 3 ngày.", context: { department: "FIT", cohort: "K21" } }),
      CommunityIntelligenceModel.createCommunityPost({ authorId: "S2", body: "K21 Điện nộp mất 7 ngày.", context: { department: "FEE", cohort: "K21" } })
    ];

    const segments = CommunityExperienceEngine.segmentByContext(posts);
    assert.strictEqual(segments.size, 2);
    assert.ok(segments.has("FIT::K21::ALL"));
    assert.ok(segments.has("FEE::K21::ALL"));
  });
});
