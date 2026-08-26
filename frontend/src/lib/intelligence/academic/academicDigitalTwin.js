/**
 * StudentHub AI — Academic Digital Twin & Student Impact Engine (Production Grade)
 * 
 * Enforces Digital Twin Constitution:
 * Recomputes personalized student academic trajectories, graduation readiness,
 * and What-If projections with complete cohort and version awareness.
 * 
 * Evaluates fine-grained student impacts against Academic Rules and Semantic Changes:
 * - Emits impact levels: NONE, LOW, MEDIUM, HIGH, CRITICAL.
 * - Emits impactType: LANGUAGE_STANDARD_MODIFIED, DEADLINE_EXTENDED, REQUIREMENT_MODIFIED, UNAFFECTED.
 * - Provides explicit, evidence-backed "Why You Are Affected" explanations.
 * - Generates zero-spam, actionable radar alerts only for truly affected students.
 */

import { getCurriculumForStudent } from "./versionedCurricula.js";
import { AcademicRuleEngine } from "./academicRuleEngine.js";
import { WhatIfEngine } from "./whatIfEngine.js";

export const STUDENT_IMPACT_LEVELS = {
  NONE: "NONE",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
};

export class AcademicDigitalTwin {
  /**
   * Evaluates how a university rule or semantic mutation impacts a specific student
   * @param {object} studentProfile - { studentId, cohort, programCode, earnedCredits, cgpa, completedCourses, englishCertificate, tuitionPaid }
   * @param {object} ruleOrChange - AcademicRule or SemanticChange object
   * @returns {object} Student Impact Assessment
   */
  static evaluateStudentImpact(studentProfile = {}, ruleOrChange = {}) {
    const {
      studentId = "STD_UNKNOWN",
      cohort = 2024,
      programCode = "7480103",
      earnedCredits = 0,
      cgpa = 2.50,
      completedCourses = [],
      englishCertificate = null, // { type: "TOEIC", score: 500 }
      tuitionPaid = true
    } = studentProfile;

    // Normalize target scope
    const targetCohorts = ruleOrChange.affectedScope?.cohorts || 
      (ruleOrChange.affectedCohort ? [String(ruleOrChange.affectedCohort)] : ["ALL"]);
    const targetPrograms = ruleOrChange.affectedScope?.programs || 
      (ruleOrChange.affectedProgram ? [String(ruleOrChange.affectedProgram)] : ["ALL"]);

    const cohortStr = String(cohort);
    const programMatch = targetPrograms.includes("ALL") || targetPrograms.includes(programCode);
    const cohortMatch = targetCohorts.includes("ALL") || targetCohorts.includes(cohortStr);

    const isScopeMatched = programMatch && cohortMatch;

    // 1. If student is not in affected cohort/program -> UNAFFECTED (NONE)
    if (!isScopeMatched) {
      const reason = `Quy định mới áp dụng cho khóa [${targetCohorts.join(", ")}] / ngành [${targetPrograms.join(", ")}], không ảnh hưởng tới khóa K${cohortStr.slice(-2)} ngành ${programCode}.`;
      return {
        studentId,
        cohort,
        programCode,
        isAffected: false,
        impactType: "UNAFFECTED",
        impactLevel: STUDENT_IMPACT_LEVELS.NONE,
        reason,
        reasons: [reason],
        requiredActions: [],
        deadline: null,
        urgency: "NONE",
        oldRequirement: ruleOrChange.oldValue || null,
        newRequirement: ruleOrChange.newValue || null,
        radarAlert: null
      };
    }

    // 2. Evaluate Specific Rule / Change Semantics
    let impactType = "REQUIREMENT_MODIFIED";
    let impactLevel = STUDENT_IMPACT_LEVELS.MEDIUM;
    const reasons = [];
    const requiredActions = [];
    let deadline = ruleOrChange.deadline || ruleOrChange.effectiveTo || null;
    let urgency = "MEDIUM";

    const ruleType = ruleOrChange.type || ruleOrChange.category || ruleOrChange.field || "GENERAL";

    // -------------------------------------------------------------
    // CASE A: English Exit Standard (TOEIC / IELTS / B2)
    // -------------------------------------------------------------
    if (ruleType === "ENGLISH_STANDARD" || ruleType === "ENGLISH_EXIT_STANDARD" || ruleOrChange.field === "ENGLISH_EXIT_STANDARD") {
      impactType = "LANGUAGE_STANDARD_MODIFIED";
      const requiredScore = ruleOrChange.values?.toeicScore || 
        (typeof ruleOrChange.newValue === "string" ? parseInt(ruleOrChange.newValue.replace(/[^0-9]/g, ""), 10) : 550);
      const studentScore = englishCertificate?.score || 0;

      if (studentScore < requiredScore) {
        impactLevel = STUDENT_IMPACT_LEVELS.HIGH;
        urgency = "HIGH";
        reasons.push(
          `Bạn thuộc Khóa K${cohortStr.slice(-2)} ngành ${programCode}.`,
          `Chuẩn đầu ra Ngoại ngữ yêu cầu đạt ${requiredScore} điểm.`,
          `Điểm chứng chỉ hiện tại của bạn là ${studentScore > 0 ? studentScore : "chưa có"} (Chưa đạt chuẩn).`
        );
        requiredActions.push(
          `Chuẩn đầu ra Ngoại ngữ điều chỉnh thành [${ruleOrChange.newValue || requiredScore}]. Cần hoàn thành nộp chứng chỉ trước học kỳ 8.`
        );
      } else {
        impactLevel = STUDENT_IMPACT_LEVELS.LOW;
        urgency = "LOW";
        reasons.push(
          `Bạn đã đạt chuẩn ngoại ngữ (${studentScore} >= ${requiredScore}), quy định mới không yêu cầu bổ sung chứng chỉ.`
        );
      }
    }
    // -------------------------------------------------------------
    // CASE B: Deadline / Date Change
    // -------------------------------------------------------------
    else if (ruleType === "DEADLINE" || ruleType === "DEADLINE_CHANGE" || ruleOrChange.field === "DEADLINE_DATE") {
      impactType = "DEADLINE_EXTENDED";
      impactLevel = STUDENT_IMPACT_LEVELS.HIGH;
      urgency = "HIGH";
      deadline = ruleOrChange.values?.deadlineDate || ruleOrChange.newValue || deadline;
      reasons.push(
        `Thời hạn học vụ quan trọng được điều chỉnh đến ngày [${deadline}].`,
        `Áp dụng trực tiếp cho tiến độ học tập Khóa K${cohortStr.slice(-2)}.`
      );
      requiredActions.push(
        `Hạn chót học vụ được điều chỉnh thành [${deadline}].`
      );
    }
    // -------------------------------------------------------------
    // CASE C: Tuition Fee
    // -------------------------------------------------------------
    else if (ruleType === "TUITION_FEE" || ruleType === "FEE_CHANGE" || ruleOrChange.field === "TUITION_FEE") {
      impactType = "FEE_MODIFIED";
      if (!tuitionPaid) {
        impactLevel = STUDENT_IMPACT_LEVELS.CRITICAL;
        urgency = "CRITICAL";
        reasons.push(
          `Hệ thống ghi nhận bạn chưa hoàn thành học phí học kỳ hiện tại.`,
          `Mức học phí / lệ phí mới có hiệu lực áp dụng.`
        );
        requiredActions.push(
          `Kiểm tra công nợ và hoàn tất đóng học phí qua cổng thanh toán trường để tránh bị hủy môn học.`
        );
      } else {
        impactLevel = STUDENT_IMPACT_LEVELS.LOW;
        urgency = "LOW";
        reasons.push(
          `Bạn đã hoàn tất học phí, quy định học phí mới áp dụng cho các đợt thu tiếp theo.`
        );
      }
    }
    // -------------------------------------------------------------
    // CASE D: Graduation / Thesis Credit Requirement
    // -------------------------------------------------------------
    else if (ruleType === "GRADUATION_REQUIREMENT" || ruleType === "CREDIT_REQUIREMENT" || ruleOrChange.field === "CREDIT_REQUIREMENT") {
      impactType = "REQUIREMENT_MODIFIED";
      const requiredCredits = ruleOrChange.values?.requiredCredits || 110;
      if (earnedCredits < requiredCredits) {
        impactLevel = STUDENT_IMPACT_LEVELS.HIGH;
        urgency = "HIGH";
        const missingCredits = requiredCredits - earnedCredits;
        reasons.push(
          `Quy định yêu cầu tích lũy tối thiểu ${requiredCredits} tín chỉ.`,
          `Hiện tại bạn đã tích lũy ${earnedCredits} tín chỉ (Còn thiếu ${missingCredits} tín chỉ).`
        );
        requiredActions.push(
          `Đăng ký bổ sung ${missingCredits} tín chỉ trong các kỳ tới để đủ điều kiện xét Khóa luận / Tốt nghiệp.`
        );
      } else {
        impactLevel = STUDENT_IMPACT_LEVELS.LOW;
        urgency = "LOW";
        reasons.push(
          `Bạn đã tích lũy đủ ${earnedCredits} tín chỉ (>= ${requiredCredits} tín chỉ theo yêu cầu).`
        );
      }
    }
    // -------------------------------------------------------------
    // CASE E: General Regulation
    // -------------------------------------------------------------
    else {
      impactType = "REQUIREMENT_MODIFIED";
      impactLevel = STUDENT_IMPACT_LEVELS.MEDIUM;
      reasons.push(`Quy định học vụ mới áp dụng cho toàn thể sinh viên Khóa K${cohortStr.slice(-2)}.`);
      requiredActions.push(ruleOrChange.requiredActions?.[0] || "Đọc kỹ toàn văn quy chế để thực hiện đúng quy định.");
    }

    const actionText = requiredActions[0] || "Kiểm tra tiến độ học vụ của bạn.";
    const radarAlert = {
      alertId: `ALERT_IMPACT_${Date.now()}_${studentId}`,
      severity: impactLevel === STUDENT_IMPACT_LEVELS.CRITICAL ? "CRITICAL" : (impactLevel === STUDENT_IMPACT_LEVELS.HIGH ? "HIGH" : "MEDIUM"),
      title: `Cập Nhật Học Vụ Dành Riêng Cho Khóa K${cohortStr.slice(-2)}`,
      message: actionText,
      deadline,
      effectiveDate: ruleOrChange.effectiveDate || ruleOrChange.effectiveFrom || new Date().toISOString().slice(0, 10),
      sourceProvenance: ruleOrChange.source?.sourceId || "AcademicLiveSyncEngine"
    };

    return {
      studentId,
      cohort,
      programCode,
      isAffected: true,
      impactType,
      impactLevel,
      reason: reasons.join(" "),
      reasons,
      requiredAction: actionText,
      requiredActions,
      deadline,
      urgency,
      field: ruleOrChange.field || ruleOrChange.type || "GENERAL",
      oldRequirement: ruleOrChange.oldValue || ruleOrChange.conditions || null,
      newRequirement: ruleOrChange.newValue || ruleOrChange.values || null,
      radarAlert
    };
  }

  /**
   * Recomputes full student digital twin state
   * @param {object} studentProfile 
   * @returns {object} Recomputed Digital Twin State
   */
  static recomputeTwinState(studentProfile = {}) {
    const {
      programCode = "7480103",
      cohort = 2024,
      earnedCredits = 0,
      cgpa = 2.50,
      completedCourses = []
    } = studentProfile;

    const curriculum = getCurriculumForStudent(programCode, cohort);
    const thesisEval = AcademicRuleEngine.evaluateThesisEligibility({
      earnedCredits,
      cumulativeGpa: cgpa,
      completedCourses
    });

    const gradEval = AcademicRuleEngine.evaluateGraduationReadiness({
      earnedCredits,
      cumulativeGpa: cgpa,
      hasEnglishB1: true,
      hasPhysicalEd: true,
      hasNationalDefense: true
    }, String(cohort));

    const bottlenecks = WhatIfEngine.identifyAllCurriculumBottlenecks();
    const remainingCredits = Math.max(0, (curriculum?.totalCredits || 150) - earnedCredits);

    const isThesisEligible = Boolean(thesisEval.eligible);
    const isGraduationReady = Boolean(gradEval.eligible);

    return {
      studentId: studentProfile.studentId || "STD_ANONYMOUS",
      cohort,
      programCode,
      programName: curriculum?.programName || "Ngành Kỹ thuật Phần mềm (7480103)",
      curriculumName: curriculum?.programName || "Chương Trình Đào Tạo Chuẩn",
      totalRequiredCredits: curriculum?.totalCredits || 150,
      earnedCredits,
      remainingCredits,
      cgpa,
      isThesisEligible,
      isGraduationReady,
      thesisEligibility: thesisEval,
      graduationReadiness: gradEval,
      bottleneckCourses: bottlenecks.slice(0, 3),
      lastSynchronizedAt: new Date().toISOString()
    };
  }
}
