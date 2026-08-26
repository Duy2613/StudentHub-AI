/**
 * StudentHub AI — Academic Digital Twin & Student Impact Engine
 * 
 * Enforces Digital Twin Constitution:
 * Recomputes personalized student academic trajectories, graduation readiness,
 * and What-If projections with complete cohort and version awareness.
 * 
 * Emits zero-spam, strictly targeted radar notifications only to affected cohorts.
 */

import { getCurriculumForStudent } from "./versionedCurricula.js";
import { AcademicRuleEngine } from "./academicRuleEngine.js";
import { WhatIfEngine } from "./whatIfEngine.js";

export class AcademicDigitalTwin {
  /**
   * Evaluates how a university rule or curriculum mutation impacts a specific student
   * @param {object} studentProfile - { studentId, cohort, programCode, earnedCredits, cgpa, completedCourses }
   * @param {object} ruleChange - { changeId, affectedProgram, affectedCohort, field, oldValue, newValue, effectiveDate }
   * @returns {object} Student Impact Assessment
   */
  static evaluateStudentImpact(studentProfile, ruleChange) {
    const { cohort, programCode } = studentProfile;

    const programMatch = ruleChange.affectedProgram === "ALL" || ruleChange.affectedProgram.includes(programCode);
    const cohortMatch = ruleChange.affectedCohort === "ALL" || ruleChange.affectedCohort.includes(String(cohort));

    const isAffected = programMatch && cohortMatch;

    if (!isAffected) {
      return {
        studentId: studentProfile.studentId,
        cohort,
        programCode,
        isAffected: false,
        impactType: "UNAFFECTED",
        reason: `Quy định mới áp dụng cho khóa [${ruleChange.affectedCohort}] / ngành [${ruleChange.affectedProgram}], không ảnh hưởng tới khóa K${String(cohort).slice(-2)} ngành ${programCode}.`,
        radarAlert: null
      };
    }

    let impactType = "REQUIREMENT_MODIFIED";
    let requiredAction = "Kiểm tra lộ trình học tập để đáp ứng quy định mới.";

    if (ruleChange.field === "ENGLISH_EXIT_STANDARD") {
      impactType = "LANGUAGE_STANDARD_MODIFIED";
      requiredAction = `Chuẩn đầu ra Ngoại ngữ điều chỉnh thành [${ruleChange.newValue}]. Cần hoàn thành nộp chứng chỉ trước học kỳ 8.`;
    } else if (ruleChange.field === "DEADLINE_DATE") {
      impactType = "DEADLINE_EXTENDED";
      requiredAction = `Hạn chót học vụ được điều chỉnh thành [${ruleChange.newValue}].`;
    }

    const radarAlert = {
      alertId: `ALERT_IMPACT_${ruleChange.changeId}_${studentProfile.studentId}`,
      severity: "HIGH",
      title: `Cập Nhật Học Vụ Dành Riêng Cho Khóa K${String(cohort).slice(-2)}`,
      message: requiredAction,
      effectiveDate: ruleChange.effectiveDate,
      sourceProvenance: "AcademicLiveSyncEngine"
    };

    return {
      studentId: studentProfile.studentId,
      cohort,
      programCode,
      isAffected: true,
      impactType,
      field: ruleChange.field,
      oldRequirement: ruleChange.oldValue,
      newRequirement: ruleChange.newValue,
      requiredAction,
      radarAlert
    };
  }

  /**
   * Recomputes full student digital twin state
   * @param {object} studentProfile 
   * @returns {object} Recomputed Digital Twin State
   */
  static recomputeTwinState(studentProfile) {
    const { programCode = "7480103", cohort = 2024, earnedCredits = 0, cgpa = 2.50, completedCourses = [] } = studentProfile;

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

    return {
      studentId: studentProfile.studentId,
      cohort,
      programName: curriculum?.programName || "Kỹ thuật Phần mềm",
      curriculumVersion: curriculum?.version?.versionId || "HCMUTE_SE_2024",
      totalCreditsRequired: curriculum?.totalCredits || 150,
      earnedCredits,
      remainingCredits,
      cgpa,
      isThesisEligible: thesisEval.eligible,
      thesisCheckReasons: thesisEval.reasons,
      isGraduationReady: gradEval.eligible,
      topBottleneckToComplete: bottlenecks.find(b => !completedCourses.includes(b.courseCode)) || null
    };
  }
}
