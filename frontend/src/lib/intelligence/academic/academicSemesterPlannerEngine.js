/**
 * StudentHub AI — Canonical Academic Semester Planning Engine V1
 * 
 * Generates constraint-valid, personalized, explainable candidate semester plans
 * by composing Prerequisite Graph, Curriculum Requirements, and What-If Simulation.
 * 
 * Absolute Invariant: PLAN != REALITY
 * Zero mutation to real student records, digital twins, tasks, or notifications.
 */

import { AcademicPrerequisiteEngine } from "./academicPrerequisiteEngine.js";
import { AcademicPlannerModel, PLAN_TYPES, PLANNING_MODE } from "./academicPlannerModel.js";
import { AcademicSimulationEngine } from "./academicSimulationEngine.js";
import { SCENARIO_OPERATIONS } from "./academicSimulationModel.js";
import { getCurriculumForStudent } from "./versionedCurricula.js";
import { AcademicClock } from "./academicClock.js";

export class AcademicSemesterPlannerEngine {
  /**
   * Generates candidate semester plans for a target term
   * @param {object} params
   * @returns {object} Canonical PlanningResponse
   */
  static generateSemesterPlans({
    studentId,
    targetTerm = "2026-HK1",
    profile360 = null,
    digitalTwin = null,
    clock = AcademicClock
  }) {
    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      throw new Error("[PLANNER_ERROR] studentId is required to generate semester plans.");
    }

    const cleanStudentId = String(studentId).trim();
    const term = AcademicPlannerModel.resolveTerm(targetTerm);
    const nowIso = clock.nowIso ? clock.nowIso() : new Date().toISOString();

    // 1. Establish Authoritative Baseline
    const cohort = profile360?.identity?.cohort || digitalTwin?.cohort || 2024;
    const programCode = profile360?.identity?.programCode || digitalTwin?.programCode || "7480103";
    const curriculum = getCurriculumForStudent(programCode, cohort);
    const curriculumVersion = curriculum?.version?.versionId || `HCMUTE_SE_${cohort}`;

    const baseProfileRev = profile360?.profileRevision || 1;
    const baseTwinRev = digitalTwin?.revision || 1;

    const completedCourses = digitalTwin?.courses || profile360?.courseRecords || [];
    const completedCodes = completedCourses
      .filter(c => c.isPassed !== false && c.status !== "FAILED")
      .map(c => typeof c === "string" ? c : c.courseCode);

    const baseCredits = digitalTwin?.earnedCredits ?? profile360?.academicSummary?.earnedCredits ?? 0;
    const baseGpa = digitalTwin?.cgpa ?? profile360?.academicSummary?.cgpa ?? 2.85;

    // 2. Fetch Feasible Uncompleted Courses for the Target Semester
    const feasibleCourses = AcademicPrerequisiteEngine.getFeasibleCourses({
      completedCourses: completedCodes,
      targetSemester: term.semester
    });

    // 3. Rank Feasible Courses by Academic Priority & Prerequisite Unlocks
    const rankedCourses = this.#rankCourses(feasibleCourses);

    // 4. Formulate 3 Distinct Candidate Plans
    const planA_Recommended = this.#buildPlanA_Recommended({
      studentId: cleanStudentId,
      term,
      rankedCourses,
      profile360,
      digitalTwin,
      baseRevisions: { profileRevision: baseProfileRev, twinRevision: baseTwinRev, curriculumVersion },
      clock
    });

    const planB_FastTrack = this.#buildPlanB_FastTrack({
      studentId: cleanStudentId,
      term,
      rankedCourses,
      profile360,
      digitalTwin,
      baseRevisions: { profileRevision: baseProfileRev, twinRevision: baseTwinRev, curriculumVersion },
      clock
    });

    const planC_LightLoad = this.#buildPlanC_LightLoad({
      studentId: cleanStudentId,
      term,
      rankedCourses,
      profile360,
      digitalTwin,
      baseRevisions: { profileRevision: baseProfileRev, twinRevision: baseTwinRev, curriculumVersion },
      clock
    });

    const candidatePlans = [planA_Recommended, planB_FastTrack, planC_LightLoad].filter(Boolean);

    // 5. Assemble Immutable Planning Response
    return Object.freeze({
      mode: PLANNING_MODE,
      studentId: cleanStudentId,
      targetTerm: term.termId,
      termName: term.name,
      evaluatedAt: nowIso,
      baseRevisions: Object.freeze({
        profileRevision: baseProfileRev,
        twinRevision: baseTwinRev,
        curriculumVersion
      }),
      baseline: Object.freeze({
        earnedCredits: baseCredits,
        cgpa: baseGpa,
        completedCourseCount: completedCodes.length,
        feasibleCourseCount: feasibleCourses.length
      }),
      candidatePlans: Object.freeze(candidatePlans),
      limitations: Object.freeze([
        "Kế hoạch học tập là đề xuất tối ưu hóa mang tính tham khảo và hướng dẫn cá nhân.",
        "Việc đăng ký môn học chính thức phải thực hiện qua Cổng Đào Tạo HCMUTE theo thời khóa biểu mở lớp thực tế.",
        "Kế hoạch sẽ tự động chuyển sang trạng thái CẦN ĐÁNH GIÁ LẠI nếu hồ sơ hoặc khung CTĐT cập nhật phiên bản mới."
      ])
    });
  }

  /**
   * Revalidates an adopted plan against current authoritative state
   * @param {object} plan
   * @param {object} currentProfile
   * @param {object} currentTwin
   * @returns {{ isValid: boolean, status: string, reason?: string }}
   */
  static revalidatePlan(plan, currentProfile, currentTwin) {
    if (!plan || !plan.baseRevisions) {
      return { isValid: false, status: "INVALID", reason: "Dữ liệu kế hoạch không đầy đủ thông tin phiên bản cơ sở." };
    }

    const currentProfRev = currentProfile?.profileRevision || 1;
    const currentTwinRev = currentTwin?.revision || 1;

    if (plan.baseRevisions.profileRevision !== currentProfRev || 
        plan.baseRevisions.twinRevision !== currentTwinRev) {
      return {
        isValid: false,
        status: "STALE",
        reason: `Hồ sơ học vụ đã thay đổi (Profile r${plan.baseRevisions.profileRevision} ➔ r${currentProfRev}). Kế hoạch cần được tạo lại.`
      };
    }

    return { isValid: true, status: "VALID" };
  }

  // ─── Private Formulation Helpers ───

  static #rankCourses(courses = []) {
    return [...courses].sort((a, b) => {
      // 1. Highest downstream unlock count first
      const unlockDiff = (b.unlockedDownstreamCount || 0) - (a.unlockedDownstreamCount || 0);
      if (unlockDiff !== 0) return unlockDiff;

      // 2. Specialized & Core courses prioritized over General
      const aIsCore = a.code.startsWith("SOFE") || a.code.startsWith("ITEC") || a.code.startsWith("SWEN") || a.code.startsWith("PROG") || a.code.startsWith("OOPL");
      const bIsCore = b.code.startsWith("SOFE") || b.code.startsWith("ITEC") || b.code.startsWith("SWEN") || b.code.startsWith("PROG") || b.code.startsWith("OOPL");
      if (aIsCore && !bIsCore) return -1;
      if (!aIsCore && bIsCore) return 1;

      // 3. Higher credits first
      return (b.credits || 0) - (a.credits || 0);
    });
  }

  static #buildPlanA_Recommended({ studentId, term, rankedCourses, profile360, digitalTwin, baseRevisions, clock }) {
    // Target 12-15 credits
    const selected = [];
    let curCredits = 0;

    for (const c of rankedCourses) {
      if (curCredits + c.credits <= 15) {
        selected.push(c);
        curCredits += c.credits;
      }
    }

    const actions = [];
    const toeicScore = digitalTwin?.certificates?.find(c => c.type === "TOEIC")?.score || 0;
    if (toeicScore < 500) {
      actions.push("🎯 Đăng ký ôn luyện & nộp chứng chỉ TOEIC Quốc tế (mục tiêu 550+)");
    }

    // Run What-If Projection
    const scenario = [
      { type: SCENARIO_OPERATIONS.ADD_CREDITS, value: curCredits },
      ...(toeicScore < 500 ? [{ type: SCENARIO_OPERATIONS.SET_CERTIFICATE_SCORE, certificateType: "TOEIC", score: 550 }] : [])
    ];

    let projection = null;
    try {
      const sim = AcademicSimulationEngine.simulateScenario({
        studentId,
        scenario,
        profile360,
        digitalTwin,
        clock
      });
      projection = {
        projectedCredits: sim.projected.earnedCredits,
        projectedRoadmapProgress: sim.projected.roadmapProgress,
        projectedEligibilityStatus: sim.projected.eligibilityStatus,
        resolvedBlockerCount: Math.max(0, sim.baseline.blockerCount - sim.projected.blockerCount),
        deltas: sim.deltas
      };
    } catch {
      // Fallback
    }

    return AcademicPlannerModel.createPlan({
      studentId,
      planType: PLAN_TYPES.RECOMMENDED,
      title: "Kế hoạch Cân Bằng (Khuyến nghị ⭐)",
      subtitle: `${curCredits} tín chỉ — Tối ưu mở khóa môn chuyên ngành & chuẩn ngoại ngữ`,
      targetTerm: term.termId,
      selectedCourses: selected,
      selectedActions: actions,
      projectedOutcome: projection,
      riskLevel: "LOW",
      score: 95,
      explanation: `Đề xuất đăng ký ${selected.length} học phần then chốt (${curCredits} TC) giúp giải quyết các nút thắt tiên quyết lớn nhất và đưa tiến độ lộ trình tăng trưởng vững chắc mà không quá tải.`,
      baseRevisions
    });
  }

  static #buildPlanB_FastTrack({ studentId, term, rankedCourses, profile360, digitalTwin, baseRevisions, clock }) {
    // Target 16-18 credits
    const selected = [];
    let curCredits = 0;

    for (const c of rankedCourses) {
      if (curCredits + c.credits <= 18) {
        selected.push(c);
        curCredits += c.credits;
      }
    }

    const actions = [
      "⚡ Tăng tốc tối đa số tín chỉ cho phép trong học kỳ",
      "📝 Chuẩn bị đề cương Khóa luận tốt nghiệp sớm"
    ];

    const scenario = [{ type: SCENARIO_OPERATIONS.ADD_CREDITS, value: curCredits }];
    let projection = null;
    try {
      const sim = AcademicSimulationEngine.simulateScenario({
        studentId,
        scenario,
        profile360,
        digitalTwin,
        clock
      });
      projection = {
        projectedCredits: sim.projected.earnedCredits,
        projectedRoadmapProgress: sim.projected.roadmapProgress,
        projectedEligibilityStatus: sim.projected.eligibilityStatus,
        resolvedBlockerCount: Math.max(0, sim.baseline.blockerCount - sim.projected.blockerCount),
        deltas: sim.deltas
      };
    } catch {
      // Fallback
    }

    return AcademicPlannerModel.createPlan({
      studentId,
      planType: PLAN_TYPES.FAST_TRACK,
      title: "Kế hoạch Tăng Tốc (Fast-Track)",
      subtitle: `${curCredits} tín chỉ — Tối đa hóa tín chỉ để rút ngắn thời gian tốt nghiệp`,
      targetTerm: term.termId,
      selectedCourses: selected,
      selectedActions: actions,
      projectedOutcome: projection,
      riskLevel: "MEDIUM",
      score: 85,
      explanation: `Khai thác tối đa khung tín chỉ (${curCredits} TC) để hoàn thành sớm khối lượng chuyên ngành. Phù hợp nếu sinh viên có học lực khá-giỏi và sắp xếp được thời gian học tập chuyên sâu.`,
      baseRevisions
    });
  }

  static #buildPlanC_LightLoad({ studentId, term, rankedCourses, profile360, digitalTwin, baseRevisions, clock }) {
    // Target 6-9 credits
    const selected = [];
    let curCredits = 0;

    for (const c of rankedCourses) {
      if (curCredits + c.credits <= 9) {
        selected.push(c);
        curCredits += c.credits;
      }
    }

    const actions = [
      "🌱 Tập trung cải thiện điểm số GPA và củng cố kiến thức nền tảng",
      "💳 Hoàn tất các khoản công nợ học phí còn tồn đọng"
    ];

    const scenario = [{ type: SCENARIO_OPERATIONS.ADD_CREDITS, value: curCredits }];
    let projection = null;
    try {
      const sim = AcademicSimulationEngine.simulateScenario({
        studentId,
        scenario,
        profile360,
        digitalTwin,
        clock
      });
      projection = {
        projectedCredits: sim.projected.earnedCredits,
        projectedRoadmapProgress: sim.projected.roadmapProgress,
        projectedEligibilityStatus: sim.projected.eligibilityStatus,
        resolvedBlockerCount: Math.max(0, sim.baseline.blockerCount - sim.projected.blockerCount),
        deltas: sim.deltas
      };
    } catch {
      // Fallback
    }

    return AcademicPlannerModel.createPlan({
      studentId,
      planType: PLAN_TYPES.LIGHT_LOAD,
      title: "Kế hoạch Giảm Tải (Light Load)",
      subtitle: `${curCredits} tín chỉ — Giảm áp lực học tập, tập trung chất lượng điểm số`,
      targetTerm: term.termId,
      selectedCourses: selected,
      selectedActions: actions,
      projectedOutcome: projection,
      riskLevel: "LOW",
      score: 75,
      explanation: `Đăng ký khối lượng tối thiểu an toàn (${curCredits} TC) để vừa duy trì tiến độ học tập vừa giảm tối đa nguy cơ quá tải học kỳ.`,
      baseRevisions
    });
  }
}
