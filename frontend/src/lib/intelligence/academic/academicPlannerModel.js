/**
 * StudentHub AI — Canonical Academic Semester Planner Model V1
 * 
 * Defines domain entities, term structures, credit constraints, plan types,
 * and validation rules for Semester Planning.
 * 
 * Absolute Invariant: PLAN != REALITY
 * Planner generates candidate recommendations; execution requires explicit student initiation.
 */

export const PLANNING_MODE = "PLANNING";

// ─── Plan Types & Archetypes ───
export const PLAN_TYPES = Object.freeze({
  RECOMMENDED: "RECOMMENDED",   // 12-15 credits, optimal balance of blocker reduction and workload
  FAST_TRACK: "FAST_TRACK",     // 16-18 credits, maximum prerequisite and graduation acceleration
  LIGHT_LOAD: "LIGHT_LOAD"      // 6-9 credits, focused repair, remedial and lowest risk
});

// ─── Plan Status ───
export const PLAN_STATUS = Object.freeze({
  DRAFT: "DRAFT",
  ADOPTED: "ADOPTED",
  STALE: "STALE",
  REVALIDATED: "REVALIDATED"
});

// ─── Institutional Credit Boundaries ───
export const CREDIT_BOUNDS = Object.freeze({
  MIN_CREDITS_PER_SEMESTER: 6,
  MAX_CREDITS_PER_SEMESTER: 20,
  RECOMMENDED_MIN_CREDITS: 12,
  RECOMMENDED_MAX_CREDITS: 16,
  MAX_SUMMER_CREDITS: 9
});

// ─── Standard Term Catalog ───
export const STANDARD_TERMS = Object.freeze([
  {
    termId: "2026-HK1",
    name: "Học kỳ 1 (2026–2027)",
    academicYear: "2026-2027",
    semester: 1,
    isRegistrationOpen: true,
    startDate: "2026-09-01",
    endDate: "2027-01-15"
  },
  {
    termId: "2026-HK2",
    name: "Học kỳ 2 (2026–2027)",
    academicYear: "2026-2027",
    semester: 2,
    isRegistrationOpen: false,
    startDate: "2027-02-15",
    endDate: "2027-06-30"
  },
  {
    termId: "2026-HK3",
    name: "Học kỳ Hè (2025–2026)",
    academicYear: "2025-2026",
    semester: 3,
    isRegistrationOpen: true,
    startDate: "2026-07-01",
    endDate: "2026-08-20"
  }
]);

export class AcademicPlannerModel {
  /**
   * Resolves a term definition by its ID
   * @param {string} termId 
   * @returns {object}
   */
  static resolveTerm(termId = "2026-HK1") {
    const clean = String(termId).trim().toUpperCase();
    const found = STANDARD_TERMS.find(t => t.termId.toUpperCase() === clean);
    return found || STANDARD_TERMS[0];
  }

  /**
   * Validates target term and constraint inputs
   * @param {object} input
   * @returns {{ valid: boolean, errors: string[] }}
   */
  static validatePlanningInput(input = {}) {
    const errors = [];

    if (input.targetTerm) {
      const clean = String(input.targetTerm).trim().toUpperCase();
      const termExists = STANDARD_TERMS.some(t => t.termId.toUpperCase() === clean);
      if (!termExists) {
        errors.push(`Học kỳ mục tiêu [${input.targetTerm}] không nằm trong danh mục học kỳ khả dụng.`);
      }
    }

    if (input.creditTarget !== undefined && input.creditTarget !== null) {
      const val = Number(input.creditTarget);
      if (Number.isNaN(val) || val < CREDIT_BOUNDS.MIN_CREDITS_PER_SEMESTER || val > CREDIT_BOUNDS.MAX_CREDITS_PER_SEMESTER) {
        errors.push(`Số tín chỉ mục tiêu phải nằm trong khoảng từ ${CREDIT_BOUNDS.MIN_CREDITS_PER_SEMESTER} đến ${CREDIT_BOUNDS.MAX_CREDITS_PER_SEMESTER} tín chỉ.`);
      }
    }

    return Object.freeze({
      valid: errors.length === 0,
      errors: Object.freeze(errors)
    });
  }

  /**
   * Constructs an immutable CandidatePlan entity
   * @param {object} params
   * @returns {object} Immutable CandidatePlan
   */
  static createPlan({
    planId,
    studentId,
    planType = PLAN_TYPES.RECOMMENDED,
    title,
    subtitle = "",
    targetTerm = "2026-HK1",
    selectedCourses = [],
    selectedActions = [],
    projectedOutcome = null,
    riskLevel = "LOW",
    score = 100,
    explanation = "",
    baseRevisions = {}
  }) {
    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      throw new Error("[PLANNER_ERROR] studentId is required to construct a plan.");
    }
    if (!title || typeof title !== "string" || !title.trim()) {
      throw new Error("[PLANNER_ERROR] Plan title is required.");
    }

    const cleanStudent = String(studentId).trim();
    const cleanTerm = String(targetTerm).trim().toUpperCase();
    const cleanId = planId || `PLAN_${cleanStudent}_${cleanTerm}_${planType}_${Date.now()}`;

    const totalCredits = selectedCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);

    return Object.freeze({
      planId: cleanId,
      studentId: cleanStudent,
      planType,
      title: title.trim(),
      subtitle: subtitle.trim(),
      targetTerm: cleanTerm,
      totalCredits,
      selectedCourses: Object.freeze(selectedCourses.map(c => Object.freeze({ ...c }))),
      selectedActions: Object.freeze([...(selectedActions || [])]),
      projectedOutcome: projectedOutcome ? Object.freeze({ ...projectedOutcome }) : null,
      riskLevel: ["LOW", "MEDIUM", "HIGH"].includes(riskLevel) ? riskLevel : "LOW",
      score: Number(score) || 0,
      explanation: explanation.trim(),
      baseRevisions: Object.freeze({
        profileRevision: baseRevisions.profileRevision || 1,
        twinRevision: baseRevisions.twinRevision || 1,
        curriculumVersion: baseRevisions.curriculumVersion || "HCMUTE_SE_2024"
      }),
      status: PLAN_STATUS.DRAFT,
      mode: PLANNING_MODE,
      createdAt: new Date().toISOString()
    });
  }
}
