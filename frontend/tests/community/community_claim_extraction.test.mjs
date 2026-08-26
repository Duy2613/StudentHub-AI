import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { CommunityExperienceEngine } from "../../src/lib/intelligence/community/communityExperienceEngine.js";
import {
  CLAIM_TYPE,
  EVIDENCE_STATUS
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityClaimExtraction", () => {
  it("should extract 8 claim types with appropriate initial evidence statuses", () => {
    const rawPosts = [
      { body: "Tôi đã nộp hồ sơ ngày 12/08 và mất 3 ngày." },
      { body: "Bạn tôi mất 3 ngày." },
      { body: "Tôi nghĩ phòng này xử lý rất chậm." },
      { body: "Có lẽ trường sẽ đổi quy định." },
      { body: "Hướng dẫn các bước: 1. Nộp đơn, 2. Chờ duyệt." },
      { body: "Lưu ý: Bị trừ điểm nếu nộp muộn sau 17h." },
      { body: "Cho mình hỏi nộp TOEIC ở đâu?" },
      { body: "Quy định áp dụng cho khóa K24." }
    ];

    const claims = CommunityExperienceEngine.extractClaims(rawPosts);
    assert.strictEqual(claims.length, 8);
    assert.strictEqual(claims[0].claimType, CLAIM_TYPE.FIRST_HAND_EXPERIENCE);
    assert.strictEqual(claims[0].status, EVIDENCE_STATUS.HIGH_VALUE_EXPERIENCE);

    assert.strictEqual(claims[1].claimType, CLAIM_TYPE.SECOND_HAND_REPORT);
    assert.strictEqual(claims[1].status, EVIDENCE_STATUS.UNVERIFIED);

    assert.strictEqual(claims[2].claimType, CLAIM_TYPE.OPINION);
    assert.strictEqual(claims[3].claimType, CLAIM_TYPE.SPECULATION);
    assert.strictEqual(claims[4].claimType, CLAIM_TYPE.GUIDE);
    assert.strictEqual(claims[5].claimType, CLAIM_TYPE.WARNING);
    assert.strictEqual(claims[6].claimType, CLAIM_TYPE.QUESTION);
    assert.strictEqual(claims[7].claimType, CLAIM_TYPE.FACTUAL_CLAIM);
  });
});
