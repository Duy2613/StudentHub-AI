/**
 * StudentHub AI — Social Normalization & Claim Extraction Test Suite
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { ContentItemNormalizer } from "../../src/lib/intelligence/social/ContentItemNormalizer.js";
import { EntityResolutionEngine, ENTITY_TYPE } from "../../src/lib/intelligence/social/EntityResolutionEngine.js";
import { SocialClaimExtractor, SOCIAL_SIGNAL_TYPE } from "../../src/lib/intelligence/social/SocialClaimExtractor.js";
import { SocialSignalQualityEngine } from "../../src/lib/intelligence/social/SocialSignalQualityEngine.js";

describe("Social Normalization & Signal Extraction Engine", () => {
  it("should normalize Vietnamese academic slang while preserving verbatim raw text", () => {
    const rawPayload = {
      content: "sv khoa cntt chú ý lịch đkhp học kỳ 2 môn Giải tích 1 do thầy Triết dạy.",
      author: "Nguyễn Văn A"
    };

    const item = ContentItemNormalizer.normalize(rawPayload);

    assert.ok(item.contentId);
    assert.strictEqual(item.rawText, "sv khoa cntt chú ý lịch đkhp học kỳ 2 môn Giải tích 1 do thầy Triết dạy.");
    assert.ok(item.normalizedText.includes("sinh viên"));
    assert.ok(item.normalizedText.includes("công nghệ thông tin"));
    assert.ok(item.normalizedText.includes("đăng ký học phần"));
    assert.strictEqual(item.language, "vi");
  });

  it("should resolve canonical entities (courses, faculty, professors, regulations)", () => {
    const text = "Thầy Triết vừa công bố đề cương môn Giải tích 1 và quy chế ĐKHP đợt 2 cho Khoa CNTT.";
    const entities = EntityResolutionEngine.resolveEntities(text);

    assert.ok(entities.length >= 3);
    assert.ok(entities.some(e => e.entityId === "EXPERT:prof_triet" && e.type === ENTITY_TYPE.EXPERT));
    assert.ok(entities.some(e => e.entityId === "COURSE:MATH1401" && e.type === ENTITY_TYPE.COURSE));
    assert.ok(entities.some(e => e.entityId === "FACULTY:fit_hcmute" && e.type === ENTITY_TYPE.FACULTY));
  });

  it("should classify 11 social signal categories and assign initial evidentiary weights", () => {
    const qItem = ContentItemNormalizer.normalize({ content: "Mọi người ơi cho hỏi môn Giải tích 1 thầy nào dạy dễ hiểu ạ?" });
    const claimCandidateQ = SocialClaimExtractor.extractClaimCandidate(qItem);
    assert.strictEqual(claimCandidateQ.signalType, SOCIAL_SIGNAL_TYPE.QUESTION);
    assert.strictEqual(claimCandidateQ.evidentialWeight, 0.15);

    const warnItem = ContentItemNormalizer.normalize({ content: "Cảnh báo sập web cổng online.hcmute.edu.vn rồi mọi người ơi!" });
    const claimCandidateW = SocialClaimExtractor.extractClaimCandidate(warnItem);
    assert.strictEqual(claimCandidateW.signalType, SOCIAL_SIGNAL_TYPE.WARNING);
    assert.strictEqual(claimCandidateW.evidentialWeight, 0.60);

    const officialItem = ContentItemNormalizer.normalize({
      content: "Quyết định số 102/QĐ-ĐHSPKT ban hành quy chế đào tạo đại học chính quy 2024.",
      sourceClassification: "OFFICIAL"
    });
    const claimCandidateO = SocialClaimExtractor.extractClaimCandidate(officialItem);
    assert.strictEqual(claimCandidateO.signalType, SOCIAL_SIGNAL_TYPE.OFFICIAL_STATEMENT);
    assert.strictEqual(claimCandidateO.evidentialWeight, 0.95);
  });

  it("should evaluate multi-dimensional signal quality scores", () => {
    const detailedItem = ContentItemNormalizer.normalize({
      content: "Lớp học phần Giải tích 1 (MATH1401) ngày 15/03/2026 đổi sang phòng A1-204 lúc 09:00.",
      mediaUrls: ["https://pdt.hcmute.edu.vn/tb.png"],
      sourceClassification: "COMMUNITY"
    });
    const candidate = SocialClaimExtractor.extractClaimCandidate(detailedItem);
    const quality = SocialSignalQualityEngine.evaluateQuality(detailedItem, candidate);

    assert.ok(quality.compositeScore >= 0.70);
    assert.strictEqual(quality.qualityTier, "HIGH");
    assert.ok(quality.breakdown.specificity >= 0.70);
  });
});
