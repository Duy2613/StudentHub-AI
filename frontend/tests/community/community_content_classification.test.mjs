import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CommunityIntelligenceModel,
  CONTENT_TYPE
} from "../../src/lib/intelligence/community/communityIntelligenceModel.js";

describe("CommunityContentClassification", () => {
  it("should classify direct student experience as FIRST_HAND_EXPERIENCE", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({
      content: "Kinh nghiệm của mình: Nộp đơn xin cấp bảng điểm tại phòng A1 mất 3 ngày."
    });
    assert.strictEqual(post.contentType, CONTENT_TYPE.FIRST_HAND_EXPERIENCE);
  });

  it("should classify hearsay as SECOND_HAND_REPORT", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({
      content: "Nghe nói học kỳ hè này thầy X sẽ không dạy môn Nhập môn lập trình."
    });
    assert.strictEqual(post.contentType, CONTENT_TYPE.SECOND_HAND_REPORT);
  });

  it("should classify question text as QUESTION", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({
      content: "Cho mình hỏi điều kiện nhận học bổng khuyến khích học tập là gì vậy?"
    });
    assert.strictEqual(post.contentType, CONTENT_TYPE.QUESTION);
  });

  it("should classify step-by-step guide as GUIDE", () => {
    const post = CommunityIntelligenceModel.createCommunityPost({
      content: "Hướng dẫn các bước: Bước 1 nộp đơn, Bước 2 thanh toán lệ phí."
    });
    assert.strictEqual(post.contentType, CONTENT_TYPE.GUIDE);
  });
});
