import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityQueryEngine } from "../../src/lib/intelligence/community/communityQueryEngine.js";

describe("CommunityPolicyBoundary", () => {
  it("should enforce invariant that community experience NEVER equals official academic policy", () => {
    const result = CommunityQueryEngine.queryTopicExperience("TOEIC_SUBMISSION_TIME");
    assert.strictEqual(result.invariants.isOfficialPolicy, false);
    assert.ok(result.invariants.disclaimer.includes("kinh nghiệm thực tế của sinh viên"));
  });
});
