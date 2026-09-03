import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CONTENT_TYPE,
  CONSENSUS_SIGNAL
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityRumorVsFact", () => {
  it("should classify speculative posts as UNVERIFIED_RUMOR without direct experience", () => {
    const posts = [
      {
        authorId: "STU_R1",
        content: "Hình như năm sau trường sẽ bỏ chuẩn đầu ra TOEIC.",
        contentType: CONTENT_TYPE.SPECULATION
      },
      {
        authorId: "STU_R2",
        content: "Chắc là sẽ đổi sang chứng chỉ khác.",
        contentType: CONTENT_TYPE.SPECULATION
      }
    ];

    const result = CommunityExperienceEngine.evaluateConsensus("RUMOR_TOPIC", posts);
    assert.strictEqual(result.consensusSignal, CONSENSUS_SIGNAL.UNVERIFIED_RUMOR);
  });
});
