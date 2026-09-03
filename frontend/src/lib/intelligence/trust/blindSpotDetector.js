/**
 * StudentHub AI — Blind-Spot & Knowledge Gap Detector V2
 * 
 * Analyzes candidate answers and evidentiary graphs to systematically discover
 * missing evidentiary scopes (cohort, timeframe, authority, jurisdiction),
 * converting ungrounded assumptions into explicit Knowledge Gap Reports.
 */

import {
  AiTrustModel,
  BLIND_SPOT_TYPE,
  AUTHORITY_TIER
} from "./aiTrustModel.js";

export class BlindSpotDetector {
  /**
   * Systematically detects blind spots in an answer and its supporting evidence
   */
  static detectBlindSpots(claim, evidenceSpans = [], context = {}) {
    const blindSpots = [];
    const requiredEvidenceRequests = [];

    // 1. Check Missing Source
    if (!evidenceSpans || evidenceSpans.length === 0) {
      blindSpots.push({
        type: BLIND_SPOT_TYPE.MISSING_SOURCE,
        description: "Chưa tìm thấy văn bản quy định hoặc thông báo chính thức làm căn cứ."
      });
      requiredEvidenceRequests.push({
        requestedDocumentType: "OFFICIAL_DECISION_OR_NOTICE",
        urgency: "CRITICAL",
        targetOffice: "Phòng Đào Tạo HCMUTE"
      });
    }

    // 2. Check Missing Cohort Scope
    const targetCohort = context.cohort || claim?.scope || "ALL";
    const cohortEvidence = evidenceSpans.some(e => e.passage.toLowerCase().includes(targetCohort.toLowerCase()));
    if (targetCohort !== "ALL" && !cohortEvidence) {
      blindSpots.push({
        type: BLIND_SPOT_TYPE.MISSING_COHORT_SCOPE,
        description: `Thông tin có căn cứ chung nhưng chưa xác minh độc lập khả năng áp dụng riêng cho khóa ${targetCohort}.`
      });
      requiredEvidenceRequests.push({
        requestedDocumentType: "CURRICULUM_FRAMEWORK_OR_COHORT_REGULATION",
        targetCohort,
        targetOffice: "Khoa Quản Lý Ngành"
      });
    }

    // 3. Check Missing Time Scope / Effective Dates
    const hasEffectiveDates = evidenceSpans.some(e => Boolean(e.validFrom));
    if (!hasEffectiveDates) {
      blindSpots.push({
        type: BLIND_SPOT_TYPE.MISSING_TIME_SCOPE,
        description: "Văn bản trích dẫn thiếu mốc thời gian bắt đầu có hiệu lực cụ thể."
      });
    }

    // 4. Check Authority Tier Quality
    const hasTier1 = evidenceSpans.some(e => e.authorityTier >= AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR);
    if (!hasTier1 && evidenceSpans.length > 0) {
      blindSpots.push({
        type: BLIND_SPOT_TYPE.MISSING_EVIDENCE,
        description: "Toàn bộ bằng chứng hiện tại thuộc nguồn thứ cấp/kinh nghiệm cộng đồng, chưa có xác nhận từ cơ quan chức năng."
      });
      requiredEvidenceRequests.push({
        requestedDocumentType: "OFFICIAL_REGISTRAR_POLICY",
        urgency: "HIGH",
        targetOffice: "Phòng Đào Tạo"
      });
    }

    return AiTrustModel.createKnowledgeGapReport({
      blindSpots,
      requiredEvidenceRequests,
      actionableGuidance: blindSpots.length > 0
        ? `Hệ thống ghi nhận ${blindSpots.length} vùng mù thông tin cần làm rõ trước khi khẳng định mức tối đa.`
        : "Không phát hiện vùng mù thông tin trọng yếu."
    });
  }
}
