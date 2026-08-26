/**
 * StudentHub AI — Deterministic Academic Rule Engine
 * 
 * Enforces Source-to-Rule Verification Constitution:
 * Evaluates academic regulations, prerequisites, credit boundaries,
 * academic warning criteria, thesis eligibility, and graduation readiness
 * through 100% deterministic structural rules wired to the Academic Truth Engine.
 * 
 * Every decision includes exact clause citations, document IDs, and verification statuses.
 */

import { HCMUTE_UNIVERSITY_PROFILE } from "./hcmuteKnowledgeGraph.js";
import { getCurriculumForStudent } from "./versionedCurricula.js";
import { AcademicTruthEngine, RULE_VERIFICATION_STATUSES, HCMUTE_OFFICIAL_DOCUMENTS } from "./academicTruthEngine.js";

export class AcademicRuleEngine {
  /**
   * Validates if a student satisfies all prerequisites for a target course
   * @param {string} targetCourseCode - e.g. "DSAA230203"
   * @param {string[]} completedCourseCodes - Array of passed course codes
   * @returns {object} Prerequisite Evaluation Report
   */
  static evaluatePrerequisites(targetCourseCode, completedCourseCodes = []) {
    const course = HCMUTE_UNIVERSITY_PROFILE.courses.find(c => c.code === targetCourseCode);
    if (!course) {
      return {
        rule_id: "RULE_PREREQ_NOT_FOUND",
        eligible: false,
        reasons: [`Mã học phần ${targetCourseCode} không tồn tại trong danh mục đào tạo.`],
        missingPrerequisites: [],
        source_document: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FIT_CURRICULUM_2024.title,
        source_url: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FIT_CURRICULUM_2024.primaryUrl,
        page_clause: "Danh mục học phần chính thức Khoa CNTT",
        verification_status: RULE_VERIFICATION_STATUSES.UNVERIFIED
      };
    }

    const prerequisites = course.prerequisites || [];
    const missingPrerequisites = prerequisites.filter(req => !completedCourseCodes.includes(req));
    const eligible = missingPrerequisites.length === 0;

    const reasons = eligible
      ? [`Đủ điều kiện tiên quyết để đăng ký học phần ${course.name} (${course.code}).`]
      : missingPrerequisites.map(m => {
          const mCourse = HCMUTE_UNIVERSITY_PROFILE.courses.find(c => c.code === m);
          const mName = mCourse ? mCourse.name : m;
          return `Chưa hoàn thành học phần tiên quyết bắt buộc: ${mName} (${m}).`;
        });

    return {
      rule_id: `RULE_PREREQ_${targetCourseCode}`,
      courseCode: targetCourseCode,
      courseName: course.name,
      eligible,
      requiredPrerequisites: prerequisites,
      missingPrerequisites,
      reasons,
      source_document: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FIT_CURRICULUM_2024.title,
      source_url: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FIT_CURRICULUM_2024.primaryUrl,
      page_clause: `Khung CTĐT ngành ${course.facultyId.toUpperCase()} - Mục Tiên Quyết môn ${targetCourseCode}`,
      verification_status: RULE_VERIFICATION_STATUSES.VERIFIED
    };
  }

  /**
   * Validates semester credit load boundaries under HCMUTE regulations (QĐ 3116/2025)
   * @param {number} creditsToEnroll - Desired credits to register in semester
   * @param {number} studentCumulativeGpa - Current cumulative GPA
   * @param {boolean} isGraduatingSemester - If student is in their final graduating semester
   * @returns {object} Credit Load Assessment
   */
  static evaluateSemesterCreditBounds(creditsToEnroll, studentCumulativeGpa = 2.50, isGraduatingSemester = false) {
    const limits = HCMUTE_UNIVERSITY_PROFILE.regulations.semesterCreditLimits;
    const errors = [];
    const warnings = [];

    const normalRule = AcademicTruthEngine.getRuleWithProof("RULE_CREDIT_SEM_NORMAL");
    const overloadRule = AcademicTruthEngine.getRuleWithProof("RULE_CREDIT_SEM_OVERLOAD");
    const probationRule = AcademicTruthEngine.getRuleWithProof("RULE_CREDIT_SEM_PROBATION");

    // Min credit check
    if (!isGraduatingSemester && creditsToEnroll < limits.minimumNormal) {
      errors.push(`Số tín chỉ đăng ký (${creditsToEnroll}) thấp hơn mức tối thiểu quy định (${limits.minimumNormal} tín chỉ/học kỳ chính).`);
    }

    // Max credit check
    let allowedMax = limits.maximumNormal;
    if (studentCumulativeGpa >= 3.20) {
      allowedMax = limits.maximumOverload;
    } else if (studentCumulativeGpa < 2.00) {
      allowedMax = 16; // Academic probation limit
      warnings.push("Sinh viên đang có GPA < 2.00 bị khống chế tối đa 16 tín chỉ để cải thiện kết quả.");
    }

    if (creditsToEnroll > allowedMax) {
      errors.push(`Số tín chỉ đăng ký (${creditsToEnroll}) vượt quá giới hạn tối đa cho phép (${allowedMax} tín chỉ dựa trên GPA ${studentCumulativeGpa.toFixed(2)}).`);
    }

    const eligible = errors.length === 0;

    return {
      rule_id: "RULE_CREDIT_LIMIT_SEM",
      eligible,
      creditsToEnroll,
      allowedMin: isGraduatingSemester ? 1 : limits.minimumNormal,
      allowedMax,
      errors,
      warnings,
      reasons: eligible ? ["Số lượng tín chỉ đăng ký hợp lệ theo quy chế đào tạo."] : errors,
      source_document: normalRule?.sourceDocument || HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.title,
      source_url: normalRule?.sourceUrl || HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.primaryUrl,
      page_clause: "Điều 14, Khoản 2 & 3 (Quyết định số 3116/QĐ-ĐHSPKT ngày 22/08/2025)",
      verification_status: RULE_VERIFICATION_STATUSES.VERIFIED
    };
  }

  /**
   * Evaluates student standing and Academic Warning risk under QĐ 3116/2025
   * @param {object} studentRecord - { semesterIndex, semesterGpa, cumulativeGpa, debtCredits, previousWarningsCount }
   * @returns {object} Academic Warning Assessment
   */
  static evaluateAcademicWarning(studentRecord) {
    const {
      semesterIndex = 1,
      semesterGpa = 2.0,
      cumulativeGpa = 2.0,
      debtCredits = 0,
      previousWarningsCount = 0
    } = studentRecord;

    const triggeredRules = [];

    // 1. Semester GPA Thresholds under QĐ 3116
    if (semesterIndex === 1 && semesterGpa < 0.80) {
      triggeredRules.push({
        id: "WARN_SEM_1",
        description: `Điểm trung bình học kỳ 1 (${semesterGpa.toFixed(2)}) < 0.80`
      });
    } else if (semesterIndex > 1 && semesterGpa < 1.00) {
      triggeredRules.push({
        id: "WARN_SEM_N",
        description: `Điểm trung bình học kỳ ${semesterIndex} (${semesterGpa.toFixed(2)}) < 1.00`
      });
    }

    // 2. Cumulative GPA Thresholds
    if (semesterIndex === 2 && cumulativeGpa < 1.40) {
      triggeredRules.push({
        id: "WARN_CUM_2",
        description: `Điểm trung bình tích lũy sau 2 học kỳ (${cumulativeGpa.toFixed(2)}) < 1.40`
      });
    } else if (semesterIndex === 3 && cumulativeGpa < 1.60) {
      triggeredRules.push({
        id: "WARN_CUM_3",
        description: `Điểm trung bình tích lũy sau 3 học kỳ (${cumulativeGpa.toFixed(2)}) < 1.60`
      });
    } else if (semesterIndex >= 4 && cumulativeGpa < 1.80) {
      triggeredRules.push({
        id: "WARN_CUM_4",
        description: `Điểm trung bình tích lũy sau ${semesterIndex} học kỳ (${cumulativeGpa.toFixed(2)}) < 1.80`
      });
    }

    // 3. Debt Credits Threshold
    if (debtCredits > 24) {
      triggeredRules.push({
        id: "WARN_DEBT",
        description: `Tổng số tín chỉ nợ điểm F (${debtCredits} tín chỉ) vượt quá ngưỡng 24 tín chỉ`
      });
    }

    const isWarningTriggered = triggeredRules.length > 0;
    const newWarningCount = isWarningTriggered ? previousWarningsCount + 1 : 0;
    const isForcedDrop = newWarningCount >= 3;

    let status = "NORMAL";
    if (isForcedDrop) {
      status = "FORCED_ACADEMIC_DROP";
    } else if (isWarningTriggered) {
      status = "ACADEMIC_WARNING";
    }

    return {
      rule_id: "RULE_ACADEMIC_WARNING_HCMUTE",
      status,
      isWarningTriggered,
      isForcedDrop,
      warningCount: newWarningCount,
      triggeredRules,
      reasons: isWarningTriggered
        ? triggeredRules.map(r => r.description)
        : ["Kết quả học tập đạt chuẩn an toàn, không vi phạm quy chế cảnh báo học vụ."],
      source_document: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.title,
      source_url: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.primaryUrl,
      page_clause: "Điều 16, Khoản 1 & 2 (Quyết định số 3116/QĐ-ĐHSPKT ngày 22/08/2025)",
      verification_status: RULE_VERIFICATION_STATUSES.VERIFIED
    };
  }

  /**
   * Evaluates Graduation Thesis Eligibility
   * @param {object} studentState - { earnedCredits, cumulativeGpa, completedCourses }
   * @returns {object} Thesis Eligibility Report
   */
  static evaluateThesisEligibility(studentState) {
    const { earnedCredits = 0, cumulativeGpa = 0.0, completedCourses = [] } = studentState;
    const req = HCMUTE_UNIVERSITY_PROFILE.regulations.thesisEligibility;
    const checks = [];

    // Check 1: Earned Credits >= 110
    const creditsPassed = earnedCredits >= req.minEarnedCredits;
    checks.push({
      criterion: "MIN_EARNED_CREDITS",
      required: req.minEarnedCredits,
      actual: earnedCredits,
      passed: creditsPassed,
      message: creditsPassed
        ? `Tích lũy ${earnedCredits}/${req.minEarnedCredits} tín chỉ (Đạt).`
        : `Chưa đủ số tín chỉ tích lũy (Có ${earnedCredits}/${req.minEarnedCredits} tín chỉ, thiếu ${req.minEarnedCredits - earnedCredits} tín chỉ).`
    });

    // Check 2: Cumulative GPA >= 2.50
    const gpaPassed = cumulativeGpa >= req.minCumulativeGpa;
    checks.push({
      criterion: "MIN_CUMULATIVE_GPA",
      required: req.minCumulativeGpa,
      actual: Number(cumulativeGpa.toFixed(2)),
      passed: gpaPassed,
      message: gpaPassed
        ? `GPA tích lũy ${cumulativeGpa.toFixed(2)} >= ${req.minCumulativeGpa} (Đạt).`
        : `GPA tích lũy ${cumulativeGpa.toFixed(2)} chưa đạt yêu cầu tối thiểu ${req.minCumulativeGpa}.`
    });

    // Check 3: Required Prerequisites completed
    const missingPrereqs = req.requiredPrerequisites.filter(c => !completedCourses.includes(c));
    const prereqPassed = missingPrereqs.length === 0;
    checks.push({
      criterion: "REQUIRED_PREREQUISITES",
      required: req.requiredPrerequisites,
      missing: missingPrereqs,
      passed: prereqPassed,
      message: prereqPassed
        ? "Đã hoàn thành đầy đủ các học phần tiên quyết cho Khóa luận (Đạt)."
        : `Chưa hoàn thành các môn tiên quyết bắt buộc: ${missingPrereqs.join(", ")}.`
    });

    const eligible = checks.every(c => c.passed);

    return {
      rule_id: "RULE_THESIS_ELIGIBILITY_FIT",
      eligible,
      checks,
      reasons: eligible
        ? ["Đủ điều kiện đăng ký làm Khóa luận Tốt nghiệp cử nhân/kỹ sư CNTT."]
        : checks.filter(c => !c.passed).map(c => c.message),
      source_document: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FIT_CURRICULUM_2024.title,
      source_url: HCMUTE_OFFICIAL_DOCUMENTS.DOC_FIT_CURRICULUM_2024.primaryUrl,
      page_clause: "Quy định Khóa luận Tốt nghiệp Khoa CNTT - Mục 4.2",
      verification_status: RULE_VERIFICATION_STATUSES.VERIFIED
    };
  }

  /**
   * Evaluates overall graduation readiness
   * @param {object} studentState - { earnedCredits, cumulativeGpa, englishLevel, hasPhysicalEd, hasNationalDefense }
   * @param {string} cohort - e.g. "2024"
   * @returns {object} Graduation Readiness Report
   */
  static evaluateGraduationReadiness(studentState, cohort = "2024") {
    const curriculum = getCurriculumForStudent("7480103", cohort);
    const totalRequired = curriculum?.totalCredits || 150;

    const {
      earnedCredits = 0,
      cumulativeGpa = 0.0,
      hasEnglishB1 = false,
      hasPhysicalEd = false,
      hasNationalDefense = false
    } = studentState;

    const checks = [
      {
        criterion: "TOTAL_CREDITS",
        required: totalRequired,
        actual: earnedCredits,
        passed: earnedCredits >= totalRequired,
        message: earnedCredits >= totalRequired ? `Đã hoàn thành ${earnedCredits}/${totalRequired} tín chỉ.` : `Còn thiếu ${totalRequired - earnedCredits} tín chỉ.`
      },
      {
        criterion: "CUMULATIVE_GPA",
        required: 2.00,
        actual: Number(cumulativeGpa.toFixed(2)),
        passed: cumulativeGpa >= 2.00,
        message: cumulativeGpa >= 2.00 ? `GPA tích lũy ${cumulativeGpa.toFixed(2)} >= 2.00.` : `GPA tích lũy ${cumulativeGpa.toFixed(2)} < 2.00 (Chưa đủ điều kiện tốt nghiệp).`
      },
      {
        criterion: "ENGLISH_EXIT_STANDARD",
        required: curriculum?.version?.graduationConditions?.englishLevel || "TOEIC 500",
        passed: Boolean(hasEnglishB1),
        message: hasEnglishB1 ? "Đạt chuẩn đầu ra Ngoại ngữ theo khóa tuyển sinh." : "Chưa nộp chứng chỉ Ngoại ngữ chuẩn đầu ra."
      },
      {
        criterion: "PHYSICAL_EDUCATION",
        required: "Chứng chỉ GDTC",
        passed: Boolean(hasPhysicalEd),
        message: hasPhysicalEd ? "Đạt chứng chỉ Giáo dục Thể chất." : "Chưa hoàn thành Giáo dục Thể chất."
      },
      {
        criterion: "NATIONAL_DEFENSE",
        required: "Chứng chỉ GDQP-AN",
        passed: Boolean(hasNationalDefense),
        message: hasNationalDefense ? "Đạt chứng chỉ Giáo dục Quốc phòng - An ninh." : "Chưa hoàn thành Giáo dục Quốc phòng."
      }
    ];

    const eligible = checks.every(c => c.passed);

    return {
      rule_id: "RULE_GRADUATION_CONDITIONS",
      eligible,
      totalCreditsRequired: totalRequired,
      creditsEarned: earnedCredits,
      creditsRemaining: Math.max(0, totalRequired - earnedCredits),
      checks,
      reasons: eligible
        ? ["Đủ tất cả các điều kiện để được công nhận tốt nghiệp và cấp bằng Kỹ sư/Cử nhân."]
        : checks.filter(c => !c.passed).map(c => c.message),
      source_document: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.title,
      source_url: HCMUTE_OFFICIAL_DOCUMENTS.DOC_QD_3116_2025.primaryUrl,
      page_clause: "Điều 28: Điều kiện xét và công nhận tốt nghiệp (QĐ 3116/QĐ-ĐHSPKT)",
      verification_status: RULE_VERIFICATION_STATUSES.VERIFIED
    };
  }
}
