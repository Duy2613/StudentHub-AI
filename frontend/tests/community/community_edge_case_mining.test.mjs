import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CONTENT_TYPE,
  CONSENSUS_SIGNAL
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityEdgeCaseMining", () => {
  it("should extract median procedure duration from verified first-hand guide experiences", () => {
    const posts = [
      {
        authorId: "STU_E1",
        content: "Kinh nghiệm của mình: Chuẩn bị 3 cuốn báo cáo đồ án nộp trước 5 ngày.",
        contentType: CONTENT_TYPE.GUIDE,
        procedureDurationDays: 5
      },
      {
        authorId: "STU_E2",
        content: "Hướng dẫn bảo vệ: Cần nộp báo cáo trước hội đồng 5 ngày.",
        contentType: CONTENT_TYPE.GUIDE,
        procedureDurationDays: 5
      }
    ];

    const result = CommunityExperienceEngine.evaluateConsensus("DEFENSE_PREP", posts);
    assert.strictEqual(result.medianProcedureDays, 5);
    assert.strictEqual(result.consensusSignal, CONSENSUS_SIGNAL.MODERATE_COMMUNITY_SIGNAL);
  });
});
