/**
 * StudentHub AI — Academic Reasoning & Prerequisite Graph Engine (AI-02 & AI-03)
 * 
 * Deterministic graph reasoning and constraint solver for student academic planning,
 * prerequisite dependency tracing, GPA scenarios, and graduation bottleneck forecasting.
 */

import { HCMUTE_UNIVERSITY_PROFILE } from "./hcmuteKnowledgeGraph.js";

/**
 * Evaluates the cascade impact of failing or delaying a course
 */
export function evaluatePrerequisiteCascade(courseCode, completedCourses = []) {
  const allCourses = HCMUTE_UNIVERSITY_PROFILE.courses;
  const targetCourse = allCourses.find((c) => c.code === courseCode);

  if (!targetCourse) {
    return {
      found: false,
      message: `Không tìm thấy mã học phần ${courseCode} trong cơ sở dữ liệu chương trình đào tạo.`,
    };
  }

  // Find all direct downstream dependents
  const directBlocked = allCourses.filter((c) => c.prerequisites.includes(courseCode));
  
  // Find indirect downstream dependents (BFS/DFS)
  const allBlocked = new Set();
  const queue = [...directBlocked.map((c) => c.code)];

  while (queue.length > 0) {
    const currentCode = queue.shift();
    if (!allBlocked.has(currentCode)) {
      allBlocked.add(currentCode);
      const downstream = allCourses.filter((c) => c.prerequisites.includes(currentCode));
      for (const d of downstream) {
        if (!allBlocked.has(d.code)) {
          queue.push(d.code);
        }
      }
    }
  }

  const blockedList = allCourses.filter((c) => allBlocked.has(c.code));
  const totalCreditsBlocked = blockedList.reduce((sum, c) => sum + c.credits, 0);

  let graduationDelayRisk = "LOW";
  let riskExplanation = "Học phần này không làm trễ chuỗi môn tiên quyết quan trọng.";

  if (blockedList.length >= 3 || totalCreditsBlocked >= 10) {
    graduationDelayRisk = "CRITICAL";
    riskExplanation = `Học phần ${targetCourse.name} là nút thắt (bottleneck) chuỗi ${blockedList.length} môn tiếp theo (${totalCreditsBlocked} tín chỉ). Nếu rớt môn này sẽ làm trễ tiến độ tốt nghiệp ít nhất 1 học kỳ.`;
  } else if (blockedList.length >= 1) {
    graduationDelayRisk = "MODERATE";
    riskExplanation = `Sẽ khóa học phần [${blockedList.map((b) => b.name).join(", ")}] ở học kỳ kế tiếp.`;
  }

  return {
    found: true,
    targetCourse,
    directBlocked,
    allBlocked: blockedList,
    totalCreditsBlocked,
    graduationDelayRisk,
    riskExplanation,
  };
}

/**
 * Calculates GPA trajectory and Academic Warning risk
 */
export function calculateGpaTrajectory(currentGpa, currentCredits, targetGpa, expectedCreditsNextSemester = 18) {
  const currentWeighted = currentGpa * currentCredits;
  const newTotalCredits = currentCredits + expectedCreditsNextSemester;

  // Formula: (currentWeighted + requiredGpa * expectedCreditsNextSemester) / newTotalCredits = targetGpa
  // requiredGpa = (targetGpa * newTotalCredits - currentWeighted) / expectedCreditsNextSemester
  const requiredNextGpa = (targetGpa * newTotalCredits - currentWeighted) / expectedCreditsNextSemester;

  let feasibility = "FEASIBLE";
  let advice = `Để đạt GPA tích lũy ${targetGpa.toFixed(2)}, bạn cần đạt GPA trung bình ${requiredNextGpa.toFixed(2)} trong ${expectedCreditsNextSemester} tín chỉ học kỳ tới.`;

  if (requiredNextGpa > 4.0) {
    feasibility = "MATHEMATICALLY_IMPOSSIBLE_IN_ONE_SEMESTER";
    advice = `Không thể đạt mục tiêu ${targetGpa.toFixed(2)} chỉ trong 1 học kỳ (cần GPA ${requiredNextGpa.toFixed(2)} > 4.0). Cần phân bổ đều qua ít nhất 2-3 học kỳ tiếp theo.`;
  } else if (requiredNextGpa > 3.6) {
    feasibility = "CHALLENGING";
    advice = `Mục tiêu khá thách thức (yêu cầu GPA ${requiredNextGpa.toFixed(2)} xếp loại Xuất sắc). Khuyến nghị không đăng ký vượt quá 15-16 tín chỉ để đảm bảo chất lượng.`;
  }

  // Academic Warning Check
  let academicWarningRisk = "SAFE";
  if (currentGpa < 2.0) {
    academicWarningRisk = "HIGH_RISK";
  } else if (currentGpa < 2.5) {
    academicWarningRisk = "MODERATE_ATTENTION";
  }

  return {
    currentGpa,
    currentCredits,
    targetGpa,
    expectedCreditsNextSemester,
    requiredNextGpa: Number(requiredNextGpa.toFixed(2)),
    feasibility,
    academicWarningRisk,
    advice,
  };
}
