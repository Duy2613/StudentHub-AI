/**
 * StudentHub AI — Canonical Academic Decision & Trade-Off Engine V1
 * 
 * Compares candidate semester plans side-by-side, computes preference-aware rankings,
 * evaluates pairwise trade-offs, and provides revision-guarded plan adoption.
 * 
 * Absolute Invariant: DECISION_SUPPORT != AUTONOMOUS_ACTION
 * Zero real-state mutation; adoption records user intent, workflow execution handles reality.
 */

import { AcademicSemesterPlannerEngine } from "./academicSemesterPlannerEngine.js";
import { AcademicDecisionModel, STUDENT_PREFERENCES, PREFERENCE_LABELS } from "./academicDecisionModel.js";
import { AcademicDecisionStore } from "./academicDecisionStore.js";
import { AcademicClock } from "./academicClock.js";

export class AcademicDecisionEngine {
  /**
   * Generates normalized plan comparisons, trade-off matrix, and preference-aware recommendation
   * @param {object} params
   * @returns {object} Canonical DecisionComparisonResult
   */
  static evaluateDecisionStudio({
    studentId,
    targetTerm = "2026-HK1",
    studentPreference = STUDENT_PREFERENCES.BALANCED,
    profile360 = null,
    digitalTwin = null,
    clock = AcademicClock
  }) {
    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      throw new Error("[DECISION_ERROR] studentId is required to evaluate Decision Studio.");
    }

    const cleanStudentId = String(studentId).trim();
    const validPref = AcademicDecisionModel.validatePreference(studentPreference);

    // 1. Generate Authoritative Candidate Semester Plans
    const plannerResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: cleanStudentId,
      targetTerm,
      profile360,
      digitalTwin,
      clock
    });

    const rawPlans = plannerResult.candidatePlans || [];

    // 2. Normalize and Score Plans based on Student Preference
    const normalizedPlans = rawPlans.map(plan => {
      const decisionScore = this.#calculatePreferenceScore(plan, validPref);
      const goalAlignment = this.#determineGoalAlignment(plan, validPref);

      return Object.freeze({
        planId: plan.planId,
        planType: plan.planType,
        title: plan.title,
        subtitle: plan.subtitle,
        totalCredits: plan.totalCredits,
        courseCount: plan.selectedCourses.length,
        selectedCourses: plan.selectedCourses,
        selectedActions: plan.selectedActions,
        riskLevel: plan.riskLevel,
        plannerScore: plan.score,
        decisionScore,
        goalAlignment,
        projectedCredits: plan.projectedOutcome?.projectedCredits ?? (plannerResult.baseline.earnedCredits + plan.totalCredits),
        projectedRoadmapPercentage: plan.projectedOutcome?.projectedRoadmapProgress?.percentage ?? 50,
        resolvedBlockerCount: plan.projectedOutcome?.resolvedBlockerCount ?? 0,
        explanation: plan.explanation,
        baseRevisions: plan.baseRevisions
      });
    });

    // 3. Sort Deterministically by decisionScore descending (tie-break by planId)
    const rankedPlans = [...normalizedPlans].sort((a, b) => {
      if (b.decisionScore !== a.decisionScore) {
        return b.decisionScore - a.decisionScore;
      }
      return a.planId.localeCompare(b.planId);
    });

    // 4. Generate Pairwise Trade-Off Matrix
    const tradeOffs = this.#generateTradeOffMatrix(normalizedPlans);

    // 5. Formulate Active Recommendation
    const topPlan = rankedPlans[0] || null;
    const recommendation = topPlan ? {
      recommendedPlanId: topPlan.planId,
      recommendedPlanType: topPlan.planType,
      title: topPlan.title,
      prefApplied: validPref,
      prefDesc: PREFERENCE_LABELS[validPref]?.desc || "",
      rationale: this.#generateRecommendationRationale(topPlan, validPref)
    } : null;

    // 6. Check Active Adoption
    const activeAdoption = AcademicDecisionStore.getActiveAdoption(cleanStudentId, targetTerm);

    return AcademicDecisionModel.createDecisionComparison({
      studentId: cleanStudentId,
      targetTerm,
      termName: plannerResult.termName,
      studentPreference: validPref,
      baseline: Object.freeze({
        ...plannerResult.baseline,
        activeAdoption: activeAdoption ? Object.freeze(activeAdoption) : null
      }),
      plans: rankedPlans,
      tradeOffs,
      recommendation,
      baseRevisions: plannerResult.baseRevisions
    });
  }

  /**
   * Adopts a candidate plan for a student with revision revalidation
   * @param {object} params
   * @returns {{ success: boolean, adoptedPlan: object, actionBridge: object }}
   */
  static adoptPlan({
    studentId,
    planId,
    targetTerm = "2026-HK1",
    expectedBaseRevisions = null,
    profile360 = null,
    digitalTwin = null
  }) {
    if (!studentId || !planId) {
      throw new Error("[DECISION_ERROR] studentId and planId are required to adopt a plan.");
    }

    const cleanStudentId = String(studentId).trim();
    const cleanPlanId = String(planId).trim();

    const currentProfRev = profile360?.profileRevision || 1;
    const currentTwinRev = digitalTwin?.revision || 1;

    // Check if plan base revisions match live state
    if (expectedBaseRevisions) {
      if (expectedBaseRevisions.profileRevision && expectedBaseRevisions.profileRevision !== currentProfRev) {
        throw new Error(`[STALE_PLAN_ERROR] Hồ sơ học vụ đã thay đổi phiên bản (Profile r${expectedBaseRevisions.profileRevision} ➔ r${currentProfRev}). Vui lòng tải lại trang để xem kế hoạch mới.`);
      }
      if (expectedBaseRevisions.twinRevision && expectedBaseRevisions.twinRevision !== currentTwinRev) {
        throw new Error(`[STALE_PLAN_ERROR] Bản sao số đã thay đổi phiên bản (Twin r${expectedBaseRevisions.twinRevision} ➔ r${currentTwinRev}). Vui lòng tải lại trang để xem kế hoạch mới.`);
      }
    }

    // 1. Fetch fresh candidate plans to verify existence and freshness
    const plannerResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: cleanStudentId,
      targetTerm,
      profile360,
      digitalTwin
    });

    const targetPlan = (plannerResult.candidatePlans || []).find(p => p.planId === cleanPlanId);
    if (!targetPlan) {
      throw new Error(`[DECISION_ERROR] Kế hoạch [${cleanPlanId}] không tồn tại trong danh mục phương án học kỳ.`);
    }

    // 2. Create and store adoption record
    const adoptionRecord = AcademicDecisionModel.createAdoptedPlanRecord({
      studentId: cleanStudentId,
      planId: targetPlan.planId,
      planType: targetPlan.planType,
      planTitle: targetPlan.title,
      targetTerm,
      totalCredits: targetPlan.totalCredits,
      selectedCourses: targetPlan.selectedCourses,
      selectedActions: targetPlan.selectedActions,
      baseRevisions: targetPlan.baseRevisions
    });

    const saved = AcademicDecisionStore.saveAdoption(adoptionRecord);

    return Object.freeze({
      success: true,
      adoptedPlan: saved,
      actionBridge: Object.freeze({
        message: "Kế hoạch học tập đã được lưu nháp thành công vào hồ sơ định hướng cá nhân.",
        workflowUrl: "/academic",
        roadmapUrl: "/academic/roadmap"
      })
    });
  }

  // ─── Private Scoring & Trade-Off Helpers ───

  static #calculatePreferenceScore(plan, preference) {
    const type = plan.planType;
    switch (preference) {
      case STUDENT_PREFERENCES.GRADUATE_ASAP:
        if (type === "FAST_TRACK") return 96;
        if (type === "RECOMMENDED") return 88;
        return 65; // LIGHT_LOAD

      case STUDENT_PREFERENCES.MINIMIZE_WORKLOAD:
        if (type === "LIGHT_LOAD") return 96;
        if (type === "RECOMMENDED") return 84;
        return 55; // FAST_TRACK

      case STUDENT_PREFERENCES.PROTECT_GPA:
        if (type === "LIGHT_LOAD") return 94;
        if (type === "RECOMMENDED") return 90;
        return 65; // FAST_TRACK

      case STUDENT_PREFERENCES.BALANCED:
      default:
        if (type === "RECOMMENDED") return 95;
        if (type === "FAST_TRACK") return 85;
        return 75; // LIGHT_LOAD
    }
  }

  static #determineGoalAlignment(plan, preference) {
    const type = plan.planType;
    if (type === "FAST_TRACK") {
      return "ACCELERATED (Rút ngắn thời gian tốt nghiệp, tích lũy tối đa tín chỉ)";
    }
    if (type === "RECOMMENDED") {
      return "ON_TRACK (Đúng tiến độ chuẩn, cân bằng hoàn hảo giữa học phần và chuẩn ra)";
    }
    return "CAUTION (Tải học nhẹ, có thể kéo dài thêm 1 kỳ nếu không học bù học kỳ Hè)";
  }

  static #generateRecommendationRationale(plan, preference) {
    switch (preference) {
      case STUDENT_PREFERENCES.GRADUATE_ASAP:
        return `Kế hoạch [${plan.title}] được đề xuất cao nhất vì bạn đang chọn ưu tiên Tốt Nghiệp Sớm — khai thác tối đa ${plan.totalCredits} TC để giải phóng nhanh nhất các khối kiến thức chuyên ngành.`;
      case STUDENT_PREFERENCES.MINIMIZE_WORKLOAD:
        return `Kế hoạch [${plan.title}] được đề xuất cao nhất vì bạn ưu tiên Giảm Tải — chỉ đăng ký ${plan.totalCredits} TC trọng tâm để tránh quá tải và giảm stress học tập.`;
      case STUDENT_PREFERENCES.PROTECT_GPA:
        return `Kế hoạch [${plan.title}] được đề xuất cao nhất vì bạn ưu tiên Bảo Vệ GPA — tập trung vào ít môn để đạt điểm số cao nhất trong từng bài thi.`;
      case STUDENT_PREFERENCES.BALANCED:
      default:
        return `Kế hoạch [${plan.title}] là lựa chọn toàn diện nhất — phân bổ hợp lý ${plan.totalCredits} TC, giải tỏa các nút thắt tiên quyết chủ chốt với mức rủi ro THẤP.`;
    }
  }

  static #generateTradeOffMatrix(plans = []) {
    const pairs = [];
    const planA = plans.find(p => p.planType === "RECOMMENDED");
    const planB = plans.find(p => p.planType === "FAST_TRACK");
    const planC = plans.find(p => p.planType === "LIGHT_LOAD");

    if (planA && planB) {
      pairs.push({
        comparisonPair: "Plan A (Cân Bằng) vs Plan B (Tăng Tốc)",
        plan1Id: planA.planId,
        plan2Id: planB.planId,
        advantageOfPlan2: `Tích lũy nhiều hơn ${planB.totalCredits - planA.totalCredits} tín chỉ, đẩy nhanh lộ trình tiến độ (${planB.projectedRoadmapPercentage}% vs ${planA.projectedRoadmapPercentage}%).`,
        disadvantageOfPlan2: `Tải học tập cao hơn đáng kể (${planB.totalCredits} TC), rủi ro chuyển sang mức MEDIUM.`,
        tradeOffVerdict: `Chọn Plan B nếu muốn hoàn thành sớm và tự tin về học lực; chọn Plan A nếu muốn an toàn và cân bằng sinh hoạt.`
      });
    }

    if (planA && planC) {
      pairs.push({
        comparisonPair: "Plan A (Cân Bằng) vs Plan C (Giảm Tải)",
        plan1Id: planA.planId,
        plan2Id: planC.planId,
        advantageOfPlan2: `Giảm tải ${planA.totalCredits - planC.totalCredits} tín chỉ, ít áp lực môn học, tập trung nâng cao điểm thi từng môn.`,
        disadvantageOfPlan2: `Tiến độ lộ trình tăng chậm hơn (${planC.projectedRoadmapPercentage}% vs ${planA.projectedRoadmapPercentage}%), có thể cần học kỳ phụ.`,
        tradeOffVerdict: `Chọn Plan C nếu cần thời gian ôn thi chứng chỉ hoặc làm thêm; chọn Plan A để đảm bảo tiến độ tốt nghiệp chuẩn.`
      });
    }

    return pairs;
  }
}
