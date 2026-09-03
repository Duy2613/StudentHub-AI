/**
 * StudentHub AI — Canonical Academic Insight Model Engine
 * 
 * Enforces Single Source of Truth for Academic Insights:
 * - Fuses Document, Change, Rule, and Student Impact into a clean AcademicInsight entity.
 * - Decouples domain intelligence from presentation adapters (Notifications, Timeline, Dashboard).
 * - Implements deterministic insight deduplication.
 */

import { AcademicDocumentNormalizer } from "./academicDocumentNormalizer.js";

export const INSIGHT_TYPES = {
  DEADLINE_ALERT: "DEADLINE_ALERT",
  REQUIREMENT_CHANGE: "REQUIREMENT_CHANGE",
  FEE_REMINDER: "FEE_REMINDER",
  POLICY_UPDATE: "POLICY_UPDATE",
  GENERAL_ANNOUNCEMENT: "GENERAL_ANNOUNCEMENT"
};

export const USER_ACTION_TYPES = {
  VIEW_DOCUMENT: "VIEW_DOCUMENT",
  REGISTER: "REGISTER",
  PAY: "PAY",
  CHECK_STATUS: "CHECK_STATUS",
  CONTACT_OFFICE: "CONTACT_OFFICE"
};

export class AcademicInsightEngine {
  /**
   * Generates a canonical AcademicInsight entity
   * @param {object} params - { document, change, rule, studentImpact, source }
   * @returns {object} AcademicInsight
   */
  static generateInsight(params = {}) {
    const {
      document = {},
      change = {},
      rule = {},
      studentImpact = {},
      source = {}
    } = params;

    const changeType = change.category || change.field || rule.type || "GENERAL";
    let insightType = INSIGHT_TYPES.GENERAL_ANNOUNCEMENT;

    if (changeType.includes("DEADLINE") || rule.type === "DEADLINE") {
      insightType = INSIGHT_TYPES.DEADLINE_ALERT;
    } else if (changeType.includes("FEE") || rule.type === "TUITION_FEE") {
      insightType = INSIGHT_TYPES.FEE_REMINDER;
    } else if (changeType.includes("REQUIREMENT") || changeType.includes("ELIGIBILITY") || rule.type === "ENGLISH_STANDARD") {
      insightType = INSIGHT_TYPES.REQUIREMENT_CHANGE;
    } else if (changeType.includes("POLICY")) {
      insightType = INSIGHT_TYPES.POLICY_UPDATE;
    }

    const title = document.title || rule.subject || "Thông Báo Học Vụ Quan Trọng";
    const whatChanged = change.description || rule.requiredActions?.[0] || "Có sự điều chỉnh trong quy định học vụ.";
    const whyItMatters = studentImpact.reasons?.join(" ") || "Quy định áp dụng cho tiến độ học tập của bạn.";
    const impactLevel = studentImpact.impactLevel || "MEDIUM";
    const deadline = studentImpact.deadline || rule.deadline || null;

    const rawIdSeed = `${document.documentId || "DOC"}_${document.versionId || "v1"}_${rule.ruleId || "RULE"}_${studentImpact.studentId || "ALL"}`;
    const insightId = `INSIGHT_${AcademicDocumentNormalizer.computeSha256(rawIdSeed).slice(0, 12)}`;

    // Build Action Buttons
    const actions = [];
    if (document.sourceUrl || source.canonicalUrl) {
      actions.push({
        type: USER_ACTION_TYPES.VIEW_DOCUMENT,
        label: "Xem Văn Bản Gốc",
        targetUrl: document.sourceUrl || source.canonicalUrl
      });
    }

    if (insightType === INSIGHT_TYPES.DEADLINE_ALERT) {
      actions.push({
        type: USER_ACTION_TYPES.REGISTER,
        label: "Thực Hiện Đăng Ký",
        targetUrl: "https://online.hcmute.edu.vn"
      });
    } else if (insightType === INSIGHT_TYPES.FEE_REMINDER) {
      actions.push({
        type: USER_ACTION_TYPES.PAY,
        label: "Thanh Toán Học Phí",
        targetUrl: "https://daotao.hcmute.edu.vn/thanh-toan"
      });
    } else {
      actions.push({
        type: USER_ACTION_TYPES.CHECK_STATUS,
        label: "Kiểm Tra Lộ Trình",
        targetUrl: "/dashboard/trajectory"
      });
    }

    return {
      insightId,
      type: insightType,
      title,
      summary: `${title} — ${whatChanged}`,
      whatChanged,
      whyItMatters,
      impact: impactLevel,
      urgency: studentImpact.urgency || "MEDIUM",
      deadline,
      actions,
      evidence: rule.evidence || { textSpan: whatChanged },
      provenance: {
        sourceId: source.sourceId || document.sourceId || "SRC_UNKNOWN",
        sourceTier: source.sourceTier || document.sourceTier || "TIER_1_OFFICIAL",
        contentHash: document.contentHash || "",
        verificationStatus: rule.verificationStatus || "VERIFIED"
      },
      source: {
        sourceId: source.sourceId || "SRC_UNKNOWN",
        canonicalUrl: source.canonicalUrl || document.sourceUrl || "",
        isOfficialAuthority: source.isOfficialAuthority !== false
      },
      createdAt: new Date().toISOString(),
      effectiveAt: rule.effectiveFrom || document.effectiveFrom || new Date().toISOString().slice(0, 10)
    };
  }
}
