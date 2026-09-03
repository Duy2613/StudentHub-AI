/**
 * StudentHub AI — Canonical Academic Decision Model V1
 * 
 * Defines domain entities, comparison criteria, student preference models,
 * trade-off structures, and plan adoption records.
 * 
 * Absolute Invariant: DECISION_SUPPORT != AUTONOMOUS_ACTION
 * The system helps the student evaluate trade-offs; the student remains the sole decision maker.
 */

export const DECISION_MODE = "DECISION_SUPPORT";

// ─── Student Preferences ───
export const STUDENT_PREFERENCES = Object.freeze({
  BALANCED: "BALANCED",                   // 12-15 TC, optimal blocker reduction, lowest risk
  GRADUATE_ASAP: "GRADUATE_ASAP",         // 16-18 TC, maximum acceleration
  MINIMIZE_WORKLOAD: "MINIMIZE_WORKLOAD", // 6-9 TC, lowest stress & remedial focus
  PROTECT_GPA: "PROTECT_GPA"              // Low course load + focus on high course scores
});

export const PREFERENCE_LABELS = Object.freeze({
  [STUDENT_PREFERENCES.BALANCED]: {
    label: "⚖️ Cân Bằng Tiến Độ",
    desc: "Tối ưu giữa giải tỏa yêu cầu và tải học tập vừa phải (12–15 TC)"
  },
  [STUDENT_PREFERENCES.GRADUATE_ASAP]: {
    label: "⚡ Tốt Nghiệp Sớm",
    desc: "Tăng tốc tối đa số tín chỉ để rút ngắn thời gian hoàn thành (16–18 TC)"
  },
  [STUDENT_PREFERENCES.MINIMIZE_WORKLOAD]: {
    label: "🌱 Giảm Tải Học Kỳ",
    desc: "Khối lượng học nhẹ nhàng để tránh quá tải và áp lực (6–9 TC)"
  },
  [STUDENT_PREFERENCES.PROTECT_GPA]: {
    label: "⭐ Bảo Vệ Điểm Số (GPA)",
    desc: "Hạn chế số môn để tập trung đạt điểm giỏi/xuất sắc cho từng học phần"
  }
});

// ─── Comparison Criteria ───
export const COMPARISON_CRITERIA = Object.freeze({
  CREDIT_LOAD: "CREDIT_LOAD",
  WORKLOAD_RISK: "WORKLOAD_RISK",
  BLOCKER_REDUCTION: "BLOCKER_REDUCTION",
  ROADMAP_PROGRESS_DELTA: "ROADMAP_PROGRESS_DELTA",
  ELIGIBILITY_STATUS: "ELIGIBILITY_STATUS",
  GOAL_ALIGNMENT: "GOAL_ALIGNMENT"
});

// ─── Adoption Status ───
export const ADOPTION_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  ADOPTED: "ADOPTED",
  STALE: "STALE",
  SUPERSEDED: "SUPERSEDED"
});

export class AcademicDecisionModel {
  /**
   * Validates student preference input
   * @param {string} preference 
   * @returns {string} Clean valid preference
   */
  static validatePreference(preference) {
    if (!preference || typeof preference !== "string") {
      return STUDENT_PREFERENCES.BALANCED;
    }
    const clean = preference.trim().toUpperCase();
    return Object.values(STUDENT_PREFERENCES).includes(clean)
      ? clean
      : STUDENT_PREFERENCES.BALANCED;
  }

  /**
   * Constructs an immutable DecisionComparisonResult
   * @param {object} params 
   * @returns {object}
   */
  static createDecisionComparison({
    comparisonId,
    studentId,
    targetTerm,
    termName,
    studentPreference = STUDENT_PREFERENCES.BALANCED,
    baseline,
    plans = [],
    tradeOffs = [],
    recommendation = null,
    baseRevisions = {}
  }) {
    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      throw new Error("[DECISION_ERROR] studentId is required for decision comparison.");
    }

    const cleanStudent = String(studentId).trim();
    const cleanTerm = String(targetTerm || "2026-HK1").trim().toUpperCase();
    const cleanId = comparisonId || `DECISION_${cleanStudent}_${cleanTerm}_${Date.now()}`;

    return Object.freeze({
      comparisonId: cleanId,
      studentId: cleanStudent,
      targetTerm: cleanTerm,
      termName: termName || cleanTerm,
      studentPreference: this.validatePreference(studentPreference),
      mode: DECISION_MODE,
      baseline: Object.freeze({ ...baseline }),
      plans: Object.freeze(plans.map(p => Object.freeze({ ...p }))),
      tradeOffs: Object.freeze(tradeOffs.map(t => Object.freeze({ ...t }))),
      recommendation: recommendation ? Object.freeze({ ...recommendation }) : null,
      baseRevisions: Object.freeze({
        profileRevision: baseRevisions.profileRevision || 1,
        twinRevision: baseRevisions.twinRevision || 1,
        curriculumVersion: baseRevisions.curriculumVersion || "HCMUTE_SE_2024"
      }),
      limitations: Object.freeze([
        "Decision Studio là công cụ hỗ trợ phân tích và so sánh đánh đổi giữa các lựa chọn.",
        "Hệ thống không tự ý áp đặt quyết định; sinh viên là người đưa ra lựa chọn cuối cùng.",
        "Việc chọn kế hoạch (Adopt) chỉ lưu nháp định hướng cá nhân; không tự động đăng ký học phần trên cổng đào tạo."
      ]),
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Constructs an immutable AdoptedPlanRecord
   * @param {object} params
   * @returns {object}
   */
  static createAdoptedPlanRecord({
    adoptionId,
    studentId,
    planId,
    planType,
    planTitle,
    targetTerm,
    totalCredits,
    selectedCourses = [],
    selectedActions = [],
    baseRevisions = {}
  }) {
    if (!studentId || !planId) {
      throw new Error("[DECISION_ERROR] studentId and planId are required to adopt a plan.");
    }

    const cleanStudent = String(studentId).trim();
    const cleanPlan = String(planId).trim();
    const cleanId = adoptionId || `ADOPT_${cleanStudent}_${cleanPlan}_${Date.now()}`;

    return Object.freeze({
      adoptionId: cleanId,
      studentId: cleanStudent,
      planId: cleanPlan,
      planType: planType || "RECOMMENDED",
      planTitle: planTitle || "Kế hoạch Học tập Đã Chọn",
      targetTerm: String(targetTerm).trim().toUpperCase(),
      totalCredits: Number(totalCredits) || 0,
      selectedCourses: Object.freeze(selectedCourses.map(c => Object.freeze({ ...c }))),
      selectedActions: Object.freeze([...(selectedActions || [])]),
      baseRevisions: Object.freeze({
        profileRevision: baseRevisions.profileRevision || 1,
        twinRevision: baseRevisions.twinRevision || 1,
        curriculumVersion: baseRevisions.curriculumVersion || "HCMUTE_SE_2024"
      }),
      status: ADOPTION_STATUS.ADOPTED,
      mode: DECISION_MODE,
      adoptedAt: new Date().toISOString()
    });
  }
}
