/**
 * StudentHub AI — Canonical Academic Task & Plan Domain Models
 * 
 * Enforces deterministic ID derivation, progress calculation, and
 * full source-to-task traceability.
 */

import { WORKFLOW_STATES } from "./academicWorkflowStateMachine.js";

export class AcademicTaskModel {
  /**
   * Deterministically derives Action Plan ID
   * @param {string} studentId 
   * @param {string} insightId 
   * @param {string} version 
   * @returns {string}
   */
  static derivePlanId(studentId, insightId, version = "1.0") {
    const cleanStudent = String(studentId || "ANON").trim();
    const cleanInsight = String(insightId || "GENERIC").trim().replace(/[^a-zA-Z0-9_]/g, "_");
    const cleanVersion = String(version || "1.0").trim().replace(/[^a-zA-Z0-9_.]/g, "_");
    return `PLAN_${cleanStudent}_${cleanInsight}_v${cleanVersion}`;
  }

  /**
   * Deterministically derives Task ID
   * @param {string} planId 
   * @param {string} actionType 
   * @returns {string}
   */
  static deriveTaskId(planId, actionType = "ACTION") {
    const cleanPlan = String(planId || "PLAN").trim();
    const cleanAction = String(actionType || "ACTION").trim().toUpperCase();
    return `TASK_${cleanPlan}_${cleanAction}`;
  }

  /**
   * Deterministically derives Step ID
   * @param {string} taskId 
   * @param {number} stepIndex 
   * @returns {string}
   */
  static deriveStepId(taskId, stepIndex = 0) {
    const cleanTask = String(taskId || "TASK").trim();
    const stepPad = String(stepIndex + 1).padStart(2, "0");
    return `${cleanTask}_STEP_${stepPad}`;
  }

  /**
   * Calculates overall task progress from its steps
   * @param {Array} steps 
   * @returns {{ completedSteps: number, totalSteps: number, percentage: number }}
   */
  static calculateProgress(steps = []) {
    if (!Array.isArray(steps) || steps.length === 0) {
      return { completedSteps: 0, totalSteps: 0, percentage: 0 };
    }

    const totalSteps = steps.length;
    const completedSteps = steps.filter(s => s.status === WORKFLOW_STATES.COMPLETED).length;
    const percentage = Math.round((completedSteps / totalSteps) * 100);

    return {
      completedSteps,
      totalSteps,
      percentage
    };
  }

  /**
   * Resolves the next actionable step in a multi-step task
   * @param {Array} steps 
   * @returns {object|null} Next actionable step or null if all done/blocked
   */
  static resolveNextAction(steps = []) {
    if (!Array.isArray(steps) || steps.length === 0) return null;

    for (const step of steps) {
      if (step.status !== WORKFLOW_STATES.COMPLETED) {
        return {
          stepId: step.stepId,
          index: step.index,
          title: step.title,
          status: step.status,
          actionIntent: step.actionIntent || null,
          blockedReasons: step.blockedReasons || []
        };
      }
    }

    return null;
  }

  /**
   * Creates a verified TaskStep
   * @param {object} params 
   * @returns {object} Canonical TaskStep
   */
  static createStep({
    stepId,
    taskId,
    index = 0,
    title,
    description = "",
    status = WORKFLOW_STATES.NOT_STARTED,
    dependencies = [],
    actionIntent = null,
    evidenceRequired = false,
    evidence = null,
    blockedReasons = []
  }) {
    if (!title || typeof title !== "string") {
      throw new Error("[TASK_STEP_ERROR] Step title is required");
    }

    const finalStepId = stepId || this.deriveStepId(taskId, index);

    return {
      stepId: finalStepId,
      index,
      title: title.trim(),
      description: String(description || "").trim(),
      status,
      dependencies: Array.isArray(dependencies) ? [...dependencies] : [],
      actionIntent: actionIntent ? { ...actionIntent } : null,
      evidenceRequired: Boolean(evidenceRequired),
      evidence: evidence ? { ...evidence } : null,
      blockedReasons: Array.isArray(blockedReasons) ? [...blockedReasons] : [],
      completedAt: status === WORKFLOW_STATES.COMPLETED ? new Date().toISOString() : null
    };
  }

  /**
   * Creates a verified AcademicTask
   * @param {object} params 
   * @returns {object} Canonical AcademicTask
   */
  static createTask({
    taskId,
    planId,
    studentId,
    insightId,
    type = "ACADEMIC_WORKFLOW",
    title,
    description = "",
    status = WORKFLOW_STATES.NOT_STARTED,
    priority = "MEDIUM",
    dueAt = null,
    steps = [],
    evidence = [],
    history = [],
    source = null,
    ruleTrace = null,
    metadata = {}
  }) {
    if (!studentId) {
      throw new Error("[ACADEMIC_TASK_ERROR] studentId is required");
    }

    if (!title || typeof title !== "string") {
      throw new Error("[ACADEMIC_TASK_ERROR] Task title is required");
    }

    const finalTaskId = taskId || this.deriveTaskId(planId, type);
    const progress = this.calculateProgress(steps);
    const nextAction = this.resolveNextAction(steps);

    return {
      taskId: finalTaskId,
      planId: planId || `PLAN_${studentId}`,
      studentId: String(studentId).trim(),
      insightId: String(insightId || "").trim(),
      type,
      title: title.trim(),
      description: String(description || "").trim(),
      status,
      priority,
      dueAt,
      steps: steps.map((s, idx) => ({ ...s, index: idx })),
      progress,
      nextAction,
      evidence: Array.isArray(evidence) ? [...evidence] : [],
      history: Array.isArray(history) ? [...history] : [],
      source: source ? { ...source } : null,
      ruleTrace: ruleTrace ? { ...ruleTrace } : null,
      metadata: { ...metadata },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: status === WORKFLOW_STATES.COMPLETED ? new Date().toISOString() : null
    };
  }

  /**
   * Creates a verified ActionPlan
   * @param {object} params 
   * @returns {object} Canonical ActionPlan
   */
  static createActionPlan({
    planId,
    studentId,
    insightId,
    version = "1.0",
    title,
    description = "",
    status = "ACTIVE",
    priority = "HIGH",
    deadline = null,
    tasks = [],
    source = null,
    metadata = {}
  }) {
    if (!studentId) {
      throw new Error("[ACTION_PLAN_ERROR] studentId is required");
    }

    const finalPlanId = planId || this.derivePlanId(studentId, insightId, version);

    return {
      planId: finalPlanId,
      studentId: String(studentId).trim(),
      insightId: String(insightId || "").trim(),
      version: String(version).trim(),
      title: String(title || "Kế hoạch xử lý học vụ").trim(),
      description: String(description || "").trim(),
      status,
      priority,
      deadline,
      tasks: Array.isArray(tasks) ? [...tasks] : [],
      source: source ? { ...source } : null,
      metadata: { ...metadata },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }
}
