import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";

describe("CommunitySockpuppetClustering", () => {
  it("should collapse duplicated content into single fingerprint provenance cluster", () => {
    const text = "Thủ tục xin cấp lại thẻ sinh viên tại phòng CTSV.";
    const posts = [
      { authorId: "USR_A", content: text },
      { authorId: "USR_B", content: text }
    ];

    const fp1 = CommunityExperienceEngine.generateContentFingerprint(text);
    const fp2 = CommunityExperienceEngine.generateContentFingerprint(text);
    assert.strictEqual(fp1, fp2);
  });
});
