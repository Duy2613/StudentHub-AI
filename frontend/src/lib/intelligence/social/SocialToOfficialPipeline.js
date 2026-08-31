/**
 * StudentHub AI — SocialToOfficialPipeline V1
 * 
 * Bridges emerging community/social signals to official statutory search and expert validation.
 * Fuses statutory policy truth with operational ground-truth signals.
 */

import { EarlyWarningEngine, WARNING_CATEGORY } from "./EarlyWarningEngine.js";
import { ContradictionEngine } from "../fusion/ContradictionEngine.js";
import { ExpertDiscoveryEngine } from "../expert/ExpertDiscoveryEngine.js";
import { createSecureId } from "../../security/secureId.js";

export class SocialToOfficialPipeline {
  /**
   * Evaluates a social/community claim against official statutory data and expert knowledge
   * @param {object} socialSignal
   * @param {string} socialSignal.topic
   * @param {string} socialSignal.claimText
   * @param {string} [socialSignal.category]
   * @returns {object} DualLayerAdvisory
   */
  static evaluateSignalAgainstOfficial(socialSignal = {}) {
    const {
      topic = "academic.registration",
      claimText = "",
      category = WARNING_CATEGORY.COURSE_REGISTRATION_BUG
    } = socialSignal;

    // 1. Check/Create Early Warning
    const earlyWarning = EarlyWarningEngine.recordSignal({
      category,
      title: `Báo cáo thực tế: ${claimText.slice(0, 80)}...`,
      summary: claimText,
      affectedEntity: topic,
      authorId: socialSignal.authorId || "student_user"
    });

    // 2. Query Official Statutory Benchmark (Mock authoritative university rule)
    const officialPolicy = {
      source: "Quy định Đào tạo Đại học Chính quy HCMUTE (QĐ 2024)",
      officialRule: "Thời hạn đăng ký học phần đợt 2 kết thúc vào 23:59 Chủ Nhật ngày 15/03/2026.",
      isOfficialValid: true,
      lastPromulgated: "2024-09-01T00:00:00Z"
    };

    // 3. Query Expert in the topic
    const expertMatch = ExpertDiscoveryEngine.discoverExperts({
      topic,
      minimumVerification: "INSTITUTION_VERIFIED",
      limit: 1
    })?.[0] || null;

    // 4. Check for Contradiction / Nuance
    const contradictionCheck = ContradictionEngine.detectContradiction(
      { claimId: "claim_official", statement: officialPolicy.officialRule, validUntil: null },
      { claimId: "claim_social", statement: claimText, validUntil: null }
    ) || {
      contradictionType: "APPARENT_CONFLICT",
      explanation: "Quy chế chính thức quy định mốc thời gian pháp lý, trong khi phản ánh cộng đồng nhấn mạnh nguy cơ nghẽn mạng kỹ thuật."
    };

    // 5. Dual-Layered Advisory Output
    return Object.freeze({
      pipelineId: createSecureId("pipe"),
      topic,
      officialPolicy: {
        rule: officialPolicy.officialRule,
        source: officialPolicy.source,
        confidence: 0.98,
        status: "STATUTORY_AUTHORITY"
      },
      operationalSignal: {
        communityFinding: claimText,
        earlyWarningStatus: earlyWarning.status,
        reporterCount: earlyWarning.distinctReporterCount,
        confidence: earlyWarning.confidence,
        status: "OPERATIONAL_REALITY"
      },
      expertValidation: expertMatch ? {
        expertName: expertMatch.fullName,
        verificationStatus: expertMatch.verificationStatus,
        comment: "Khuyến nghị sinh viên nên hoàn tất đăng ký trước 18h00 để tránh nghẽn băng thông hệ thống."
      } : null,
      contradictionAnalysis: contradictionCheck,
      recommendedStudentAction: "Tuân thủ hạn chót chính thức nhưng chủ động hoàn tất sớm trước các khung giờ cao điểm để phòng ngừa rủi ro kỹ thuật.",
      evaluatedAt: new Date().toISOString()
    });
  }
}
