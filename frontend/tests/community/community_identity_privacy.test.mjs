import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CommunityIntelligenceModel,
  VERIFICATION_BADGE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityIdentityPrivacy", () => {
  it("should salt and anonymize raw student ID while maintaining cohort badge", () => {
    const rawPost = CommunityIntelligenceModel.createCommunityPost({
      authorId: "SV21110055",
      authorCohort: "K21",
      content: "Kinh nghiệm làm thủ tục tốt nghiệp."
    });

    assert.notStrictEqual(rawPost.authorHash, "SV21110055");
    assert.ok(rawPost.authorHash.startsWith("STUDENT_K21_"));
    assert.strictEqual(rawPost.badge, VERIFICATION_BADGE.VERIFIED_STUDENT);
  });

  it("should redact raw authorId and deviceFingerprint from public payload", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({
      authorId: "SV22110099",
      deviceFingerprint: "DEVICE_FP_12345",
      content: "Lưu ý nộp học phí hè."
    });

    const publicPost = CommunityIntelligenceModel.redactForPublic(post);
    assert.strictEqual(publicPost.authorId, undefined);
    assert.strictEqual(publicPost.deviceFingerprint, undefined);
    assert.ok(publicPost.authorHash);
  });
});
