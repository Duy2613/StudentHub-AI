import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CONTENT_TYPE,
  CONSENSUS_SIGNAL
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityExperienceConsensus", () => {
  it("should detect STRONG_EXPERIENCE_CONSENSUS when >= 3 independent students corroborate the same duration", () => {
    const posts = [
      {
        authorId: "STU_1",
        content: "Kinh nghiệm của mình: Nộp chứng chỉ mất đúng 7 ngày.",
        contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
        procedureDurationDays: 7
      },
      {
        authorId: "STU_2",
        content: "Hôm qua mình lên phòng đào tạo nộp, mất khoảng 7 ngày là có kết quả.",
        contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
        procedureDurationDays: 7
      },
      {
        authorId: "STU_3",
        content: "Mình vừa làm xong thủ tục, thời gian là 8 ngày.",
        contentType: CONTENT_TYPE.FIRST_HAND_EXPERIENCE,
        procedureDurationDays: 8
      }
    ];

    const result = CommunityExperienceEngine.evaluateConsensus("TOEIC_SUBMISSION", posts);
    assert.strictEqual(result.consensusSignal, CONSENSUS_SIGNAL.STRONG_EXPERIENCE_CONSENSUS);
    assert.strictEqual(result.independentAccountsCount, 3);
    assert.strictEqual(result.medianProcedureDays, 7);
  });
});
