/**
 * StudentHub AI — Academic What-If & Graduation Path Engine
 * 
 * Enforces Constitution Articles 21–25:
 * Simulates downstream course cascades, prerequisite bottleneck chains,
 * credit adjustments, summer term acceleration, and graduation timeline projections.
 */

import { HCMUTE_UNIVERSITY_PROFILE } from "./hcmuteKnowledgeGraph.js";

export class WhatIfEngine {
  /**
   * Simulates the cascade impact of failing or delaying a specific course
   * @param {string} courseCode - e.g. "PROG130103"
   * @param {string[]} currentCompletedCourses - List of currently passed courses
   * @returns {object} Cascade Impact Report
   */
  static simulateCourseFailure(courseCode, currentCompletedCourses = []) {
    const allCourses = HCMUTE_UNIVERSITY_PROFILE.courses;
    const targetCourse = allCourses.find(c => c.code === courseCode);

    if (!targetCourse) {
      return {
        found: false,
        scenario: `FAIL_${courseCode}`,
        message: `Mã học phần ${courseCode} không tồn tại trong chương trình đào tạo.`
      };
    }

    // Direct dependents
    const directBlocked = allCourses.filter(c => (c.prerequisites || []).includes(courseCode));

    // Full downstream transitive closure via BFS
    const allBlockedSet = new Set();
    const queue = [...directBlocked.map(c => c.code)];

    while (queue.length > 0) {
      const currentCode = queue.shift();
      if (!allBlockedSet.has(currentCode)) {
        allBlockedSet.add(currentCode);
        const dependents = allCourses.filter(c => (c.prerequisites || []).includes(currentCode));
        for (const dep of dependents) {
          if (!allBlockedSet.has(dep.code)) {
            queue.push(dep.code);
          }
        }
      }
    }

    const blockedCourses = allCourses.filter(c => allBlockedSet.has(c.code));
    const totalCreditsBlocked = blockedCourses.reduce((sum, c) => sum + c.credits, 0);

    const blocksThesis = blockedCourses.some(c => c.code === "GRAP440103");
    const blocksInternship = blockedCourses.some(c => c.code === "INTR430103");

    let bottleneckLevel = "LOW";
    let graduationDelaySemesters = 0;
    let riskSummary = "Học phần độc lập, không ảnh hưởng lớn đến tiến độ chung.";

    if (blocksThesis || blockedCourses.length >= 3 || totalCreditsBlocked >= 10) {
      bottleneckLevel = "CRITICAL_BOTTLENECK";
      graduationDelaySemesters = 1;
      riskSummary = `Học phần ${targetCourse.name} là NÚT THẮT QUAN TRỌNG: Làm tắc nghẽn ${blockedCourses.length} môn học tiếp theo (${totalCreditsBlocked} tín chỉ) và chuỗi Khóa luận tốt nghiệp. Có nguy cơ làm chậm tiến độ tốt nghiệp ít nhất 1 học kỳ.`;
    } else if (blockedCourses.length >= 1) {
      bottleneckLevel = "MODERATE_BOTTLENECK";
      graduationDelaySemesters = 0;
      riskSummary = `Sẽ tạm thời chưa thể đăng ký ${blockedCourses.length} môn ở học kỳ kế tiếp [${blockedCourses.map(b => b.name).join(", ")}]. Cần học lại ngay ở học kỳ hè để bắt kịp tiến độ.`;
    }

    return {
      found: true,
      scenario: `FAIL_${courseCode}`,
      targetCourse: {
        code: targetCourse.code,
        name: targetCourse.name,
        credits: targetCourse.credits
      },
      directBlockedCount: directBlocked.length,
      directBlockedCourses: directBlocked.map(c => ({ code: c.code, name: c.name, credits: c.credits })),
      totalDownstreamBlockedCount: blockedCourses.length,
      totalCreditsBlocked,
      blocksThesis,
      blocksInternship,
      bottleneckLevel,
      graduationDelaySemesters,
      recommendedRecoveryAction: `Đăng ký học lại ${targetCourse.name} vào học kỳ phụ (hè) gần nhất để mở khóa cho ${directBlocked.map(c => c.code).join(", ")}.`,
      riskSummary
    };
  }

  /**
   * Simulates the benefit of taking summer semester credits
   * @param {number} currentEarnedCredits - Current completed credits
   * @param {number} summerCreditsToTake - e.g. 6 or 9 credits
   * @param {number} totalCreditsRequired - e.g. 150
   * @returns {object} Summer Acceleration Projection
   */
  static simulateSummerSemesterAcceleration(currentEarnedCredits = 60, summerCreditsToTake = 6, totalCreditsRequired = 150) {
    const remainingBefore = Math.max(0, totalCreditsRequired - currentEarnedCredits);
    const remainingAfter = Math.max(0, remainingBefore - summerCreditsToTake);

    const normalSemestersRemainingBefore = Math.ceil(remainingBefore / 18);
    const normalSemestersRemainingAfter = Math.ceil(remainingAfter / 18);

    const isGraduationAdvanced = normalSemestersRemainingAfter < normalSemestersRemainingBefore;

    return {
      scenario: "SUMMER_SEMESTER_ACCELERATION",
      summerCreditsAdded: summerCreditsToTake,
      creditsRemainingBefore: remainingBefore,
      creditsRemainingAfter: remainingAfter,
      normalSemestersRemainingBefore,
      normalSemestersRemainingAfter,
      isGraduationAdvanced,
      benefitSummary: isGraduationAdvanced
        ? `Việc học ${summerCreditsToTake} tín chỉ hè giúp bạn rút ngắn thời gian đào tạo 1 học kỳ chính.`
        : `Việc học ${summerCreditsToTake} tín chỉ hè giúp giảm tải áp lực tín chỉ ở các học kỳ tiếp theo (từ 18 tín chỉ xuống ~${Math.round(remainingAfter / normalSemestersRemainingBefore)} tín chỉ/kỳ).`
    };
  }

  /**
   * Scans the whole curriculum graph to rank all bottleneck courses by criticality
   * @returns {object[]} Sorted list of bottleneck courses
   */
  static identifyAllCurriculumBottlenecks() {
    const allCourses = HCMUTE_UNIVERSITY_PROFILE.courses;
    const bottlenecks = [];

    for (const course of allCourses) {
      const impact = this.simulateCourseFailure(course.code);
      if (impact.found && impact.totalDownstreamBlockedCount > 0) {
        bottlenecks.push({
          courseCode: course.code,
          courseName: course.name,
          credits: course.credits,
          downstreamCount: impact.totalDownstreamBlockedCount,
          totalCreditsBlocked: impact.totalCreditsBlocked,
          bottleneckLevel: impact.bottleneckLevel,
          blocksThesis: impact.blocksThesis
        });
      }
    }

    // Sort descending by downstream dependency count then total blocked credits
    bottlenecks.sort((a, b) => b.downstreamCount - a.downstreamCount || b.totalCreditsBlocked - a.totalCreditsBlocked);

    return bottlenecks;
  }
}
