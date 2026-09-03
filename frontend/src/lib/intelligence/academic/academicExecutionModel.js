/**
 * StudentHub AI — Canonical Academic Execution & Plan Drift Domain Model V1
 * 
 * Defines immutable data contracts for:
 * - Execution Records & Lifecycle States
 * - Plan vs Actual comparative items
 * - Plan Drift categories, severity levels, and explainable reasons
 * - Replanning recommendation policies
 */

export const EXECUTION_STATUS = Object.freeze({
  NOT_STARTED: "NOT_STARTED",
  ACTIVE: "ACTIVE",
  AT_RISK: "AT_RISK",
  BLOCKED: "BLOCKED",
  COMPLETED: "COMPLETED",
  STALE: "STALE",
  SUPERSEDED: "SUPERSEDED"
});

export const ITEM_EXECUTION_STATUS = Object.freeze({
  PLANNED: "PLANNED",
  ENROLLED: "ENROLLED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  FAILED: "FAILED",
  WITHDRAWN: "WITHDRAWN",
  NOT_OFFERED: "NOT_OFFERED"
});

export const ITEM_TYPE = Object.freeze({
  COURSE: "COURSE",
  CERTIFICATE: "CERTIFICATE",
  REQUIREMENT: "REQUIREMENT",
  WORKFLOW_STEP: "WORKFLOW_STEP",
  ACTION: "ACTION"
});

export const DRIFT_SEVERITY = Object.freeze({
  NONE: "NONE",
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  CRITICAL: "CRITICAL"
});

export const DRIFT_CATEGORY = Object.freeze({
  COURSE_DELAYED: "COURSE_DELAYED",
  COURSE_FAILED: "COURSE_FAILED",
  COURSE_NOT_OFFERED: "COURSE_NOT_OFFERED",
  CREDENTIAL_MISSING: "CREDENTIAL_MISSING",
  REQUIREMENT_CHANGED: "REQUIREMENT_CHANGED",
  DEADLINE_CHANGED: "DEADLINE_CHANGED",
  PROFILE_CHANGED: "PROFILE_CHANGED",
  CURRICULUM_CHANGED: "CURRICULUM_CHANGED",
  DATA_CONFLICT: "DATA_CONFLICT",
  WORKFLOW_BLOCKED: "WORKFLOW_BLOCKED"
});

export const REPLAN_RECOMMENDATION = Object.freeze({
  NO_ACTION: "NO_ACTION",
  CONTINUE: "CONTINUE",
  ADJUST: "ADJUST",
  REPLAN: "REPLAN",
  REVIEW_REQUIRED: "REVIEW_REQUIRED"
});

export class AcademicExecutionModel {
  /**
   * Constructs an immutable Execution Record
   * @param {object} params
   * @returns {object} Immutable Execution Record
   */
  static createExecutionRecord({
    executionId,
    adoptedPlanId,
    studentId,
    targetTerm = "2026-HK1",
    planType = "RECOMMENDED",
    planTitle = "",
    status = EXECUTION_STATUS.NOT_STARTED,
    baseRevisions = {},
    plannedItems = [],
    actualItems = [],
    progress = {},
    drift = {},
    blockers = [],
    nextActions = [],
    createdAt,
    updatedAt
  }) {
    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      throw new Error("[EXECUTION_MODEL_ERROR] studentId is required to construct an execution record.");
    }
    if (!adoptedPlanId || typeof adoptedPlanId !== "string" || !adoptedPlanId.trim()) {
      throw new Error("[EXECUTION_MODEL_ERROR] adoptedPlanId is required to construct an execution record.");
    }

    const cleanStudent = String(studentId).trim();
    const cleanAdoptedId = String(adoptedPlanId).trim();
    const cleanTerm = String(targetTerm).trim().toUpperCase();
    const cleanId = executionId || `EXEC_${cleanStudent}_${cleanTerm}_${Date.now()}`;
    const nowIso = new Date().toISOString();

    return Object.freeze({
      executionId: cleanId,
      adoptedPlanId: cleanAdoptedId,
      studentId: cleanStudent,
      targetTerm: cleanTerm,
      planType,
      planTitle: planTitle.trim(),
      status,
      baseRevisions: Object.freeze({
        planRevision: baseRevisions?.planRevision || 1,
        profileRevision: baseRevisions?.profileRevision || 1,
        twinRevision: baseRevisions?.twinRevision || 1,
        curriculumVersion: baseRevisions?.curriculumVersion || "2024-v1",
        catalogRevision: baseRevisions?.catalogRevision || 1
      }),
      plannedItems: Object.freeze(plannedItems.map(item => Object.freeze({ ...item }))),
      actualItems: Object.freeze(actualItems.map(item => Object.freeze({ ...item }))),
      progress: Object.freeze({
        plannedTotalCredits: Number(progress.plannedTotalCredits) || 0,
        actualCompletedCredits: Number(progress.actualCompletedCredits) || 0,
        completedItemCount: Number(progress.completedItemCount) || 0,
        totalItemCount: Number(progress.totalItemCount) || 0,
        progressPercentage: Number(progress.progressPercentage) || 0
      }),
      drift: Object.freeze({
        driftState: drift.driftState || DRIFT_SEVERITY.NONE,
        driftScore: Number(drift.driftScore) || 0,
        driftReasons: Object.freeze([...(drift.driftReasons || [])]),
        affectedItems: Object.freeze([...(drift.affectedItems || [])]),
        recommendedResponse: drift.recommendedResponse || REPLAN_RECOMMENDATION.NO_ACTION,
        replanRationale: drift.replanRationale || ""
      }),
      blockers: Object.freeze([...blockers]),
      nextActions: Object.freeze([...nextActions]),
      createdAt: createdAt || nowIso,
      updatedAt: updatedAt || nowIso
    });
  }

  /**
   * Constructs an immutable Plan vs Actual comparison item
   */
  static createPlanVsActualItem({
    itemCode,
    itemName,
    itemType = ITEM_TYPE.COURSE,
    credits = 0,
    plannedState = "COMPLETED",
    actualState = "NOT_STARTED",
    status = ITEM_EXECUTION_STATUS.PLANNED,
    isPrerequisiteFor = [],
    driftDetails = null
  }) {
    if (!itemCode || !itemName) {
      throw new Error("[EXECUTION_MODEL_ERROR] itemCode and itemName are required for comparison item.");
    }

    return Object.freeze({
      itemCode: String(itemCode).trim().toUpperCase(),
      itemName: String(itemName).trim(),
      itemType,
      credits: Number(credits) || 0,
      plannedState,
      actualState,
      status,
      isPrerequisiteFor: Object.freeze([...isPrerequisiteFor]),
      driftDetails: driftDetails ? Object.freeze({ ...driftDetails }) : null
    });
  }
}
