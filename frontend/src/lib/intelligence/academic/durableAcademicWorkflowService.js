/**
 * PostgreSQL-backed academic workflow orchestration.
 *
 * The domain models and state machine remain shared with the fixture suite,
 * but production requests use this async adapter so no task or event is read
 * from or written to the file-backed AcademicTaskStore.
 */

import { AcademicTaskRepository } from "../../server/database/AcademicTaskRepository.js";
import { AcademicTaskModel } from "./academicTaskModel.js";
import { AcademicWorkflowService } from "./academicWorkflowService.js";
import { AcademicTaskAuthorization } from "./academicTaskAuthorization.js";
import { WORKFLOW_STATES, WORKFLOW_EVENTS, AcademicWorkflowStateMachine } from "./academicWorkflowStateMachine.js";
import { AcademicActionIntent, ACTION_TYPES } from "./academicActionIntent.js";
import { DurableAcademicNotificationService } from "./durableAcademicNotificationService.js";

function requireStudentId(studentId) {
  const value = String(studentId || "").trim();
  if (!value) {
    const error = new Error("A durable student identity is required.");
    error.code = "DURABLE_IDENTITY_REQUIRED";
    error.statusCode = 422;
    throw error;
  }
  return value;
}

function actionTypeForInsight(insight) {
  return insight?.type || "ACTION";
}

export class DurableAcademicWorkflowService {
  constructor({ taskRepository = new AcademicTaskRepository(), notificationService = null } = {}) {
    this.taskRepository = taskRepository;
    this.notificationService = notificationService || new DurableAcademicNotificationService();
  }

  async generateActionPlansForStudent(studentProfile, insights = [], changes = []) {
    const studentId = requireStudentId(studentProfile?.studentId);
    const generatedPlans = [];
    const generatedTasks = [];
    const actionableInsights = Array.isArray(insights)
      ? insights.filter((insight) => insight?.impact && insight.impact !== "NONE")
      : [];

    for (const insight of actionableInsights) {
      const planId = AcademicTaskModel.derivePlanId(studentId, insight.insightId, "1.0");
      let plan = await this.taskRepository.getPlan(planId, { ownerId: studentId });
      let task = plan
        ? (await this.taskRepository.getTasksByPlan(plan.planId, studentId))[0] || null
        : null;

      if (!task) {
        const taskId = AcademicTaskModel.deriveTaskId(planId, actionTypeForInsight(insight));
        const taskSteps = AcademicWorkflowService.buildStepsForInsight(insight, studentProfile);
        task = AcademicTaskModel.createTask({
          taskId,
          planId,
          studentId,
          insightId: insight.insightId,
          type: insight.type || "ACADEMIC_ACTION",
          title: insight.title,
          description: insight.whatChanged,
          status: WORKFLOW_STATES.READY,
          priority: insight.impact,
          dueAt: insight.deadline || null,
          steps: taskSteps,
          source: insight.source,
          ruleTrace: insight.evidence ? {
            clauseName: insight.evidence.clauseName,
            sourceId: insight.source?.sourceId
          } : null
        });

        const createEvent = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_CREATED, {
          taskId,
          fromState: null,
          toState: WORKFLOW_STATES.READY,
          actor: "SYSTEM",
          reason: "Nhiệm vụ học vụ được tạo tự động từ phân tích tác động cá nhân hóa."
        });
        task.history = [createEvent];
        await this.taskRepository.saveTask(task);
        await this.taskRepository.recordEvent(taskId, createEvent);
        task = await this.taskRepository.getTask(taskId, { ownerId: studentId });

        plan = AcademicTaskModel.createActionPlan({
          planId,
          studentId,
          insightId: insight.insightId,
          title: `Kế hoạch: ${insight.title}`,
          description: insight.whyItMatters || insight.whatChanged,
          priority: insight.impact,
          deadline: insight.deadline || null,
          tasks: task ? [task] : [],
          source: insight.source
        });
        await this.taskRepository.savePlan(plan);
        plan = await this.taskRepository.getPlan(planId, { ownerId: studentId });
      }

      if (task && changes.length > 0) {
        task = await this.#reconcileTask(task, changes);
      }
      if (plan && task) {
        plan = { ...plan, tasks: [task] };
      }
      if (plan) generatedPlans.push(plan);
      if (task) generatedTasks.push(task);
    }

    return { plans: generatedPlans, tasks: generatedTasks };
  }

  async startTask(taskId, studentId) {
    const task = await this.#getOwnedTask(taskId, studentId);
    AcademicWorkflowStateMachine.validateTransition(task.status, WORKFLOW_STATES.IN_PROGRESS);
    const oldState = task.status;
    const updatedTask = {
      ...task,
      status: WORKFLOW_STATES.IN_PROGRESS,
      updatedAt: new Date().toISOString()
    };
    const event = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_STARTED, {
      taskId,
      fromState: oldState,
      toState: WORKFLOW_STATES.IN_PROGRESS,
      actor: studentId,
      reason: "Sinh viên bắt đầu thực hiện quy trình học vụ."
    });
    return this.#saveTaskEvent(updatedTask, event);
  }

  async completeStep(taskId, stepId, studentId, evidence = null) {
    const task = await this.#getOwnedTask(taskId, studentId);
    AcademicTaskAuthorization.assertStepDependenciesMet(task, stepId);
    const stepIndex = task.steps.findIndex((step) => step.stepId === stepId);
    if (stepIndex < 0) {
      const error = new Error(`[INVALID_STEP] Bước học vụ '${stepId}' không tồn tại.`);
      error.code = "INVALID_STEP";
      error.statusCode = 400;
      throw error;
    }
    if (task.steps[stepIndex].status === WORKFLOW_STATES.COMPLETED) return task;

    const oldState = task.status;
    const steps = task.steps.map((step, index) => index === stepIndex
      ? {
          ...step,
          status: WORKFLOW_STATES.COMPLETED,
          completedAt: new Date().toISOString(),
          ...(evidence ? { evidence: { ...evidence } } : {})
        }
      : { ...step });
    const progress = AcademicTaskModel.calculateProgress(steps);
    let nextStatus = oldState;
    let completedAt = task.completedAt || null;
    if (progress.percentage === 100) {
      // A task can have a single-step workflow and still be READY when its
      // only step is completed. Preserve the state-machine path by moving
      // through IN_PROGRESS before recording the terminal transition.
      const completionFromState = [WORKFLOW_STATES.READY, WORKFLOW_STATES.NOT_STARTED].includes(oldState)
        ? WORKFLOW_STATES.IN_PROGRESS
        : oldState;
      if (completionFromState !== oldState) {
        AcademicWorkflowStateMachine.validateTransition(oldState, WORKFLOW_STATES.IN_PROGRESS);
      }
      AcademicWorkflowStateMachine.validateTransition(completionFromState, WORKFLOW_STATES.COMPLETED);
      nextStatus = WORKFLOW_STATES.COMPLETED;
      completedAt = new Date().toISOString();
    } else if ([WORKFLOW_STATES.READY, WORKFLOW_STATES.NOT_STARTED].includes(oldState)) {
      AcademicWorkflowStateMachine.validateTransition(oldState, WORKFLOW_STATES.IN_PROGRESS);
      nextStatus = WORKFLOW_STATES.IN_PROGRESS;
    }

    const updatedTask = {
      ...task,
      steps,
      progress,
      nextAction: AcademicTaskModel.resolveNextAction(steps),
      status: nextStatus,
      completedAt,
      updatedAt: new Date().toISOString()
    };
    const event = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_STEP_COMPLETED, {
      taskId,
      fromState: oldState,
      toState: nextStatus,
      actor: studentId,
      reason: `Hoàn tất bước: ${steps[stepIndex].title}`,
      evidence
    });
    const savedTask = await this.#saveTaskEvent(updatedTask, event);
    if (nextStatus === WORKFLOW_STATES.COMPLETED) {
      await this.notificationService.onTaskCompleted(taskId, studentId);
    }
    return (await this.taskRepository.getTask(taskId, { ownerId: studentId })) || savedTask;
  }

  async verifyTaskCompletion(taskId, studentId, verificationEvidence = null) {
    const task = await this.#getOwnedTask(taskId, studentId);
    AcademicWorkflowStateMachine.validateTransition(task.status, WORKFLOW_STATES.COMPLETED);
    const updatedTask = {
      ...task,
      status: WORKFLOW_STATES.COMPLETED,
      completedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      ...(verificationEvidence ? {
        evidence: [
          ...(task.evidence || []),
          { ...verificationEvidence, verifiedAt: new Date().toISOString() }
        ]
      } : {})
    };
    const event = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_VERIFIED, {
      taskId,
      fromState: task.status,
      toState: WORKFLOW_STATES.COMPLETED,
      actor: "SYSTEM_VERIFIER",
      reason: "Xác thực hoàn tất quy trình học vụ thành công.",
      evidence: verificationEvidence
    });
    await this.#saveTaskEvent(updatedTask, event);
    await this.notificationService.onTaskCompleted(taskId, studentId);
    return this.taskRepository.getTask(taskId, { ownerId: studentId });
  }

  async #getOwnedTask(taskId, studentId) {
    const ownerId = requireStudentId(studentId);
    const task = await this.taskRepository.getTask(taskId, { ownerId });
    if (!task) {
      const error = new Error("[NOT_FOUND] Nhiệm vụ học vụ không tồn tại.");
      error.code = "TASK_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }
    AcademicTaskAuthorization.assertTaskOwnership(task, ownerId);
    return task;
  }

  async #saveTaskEvent(task, event) {
    const withHistory = {
      ...task,
      history: [...(task.history || []), event]
    };
    await this.taskRepository.saveTask(withHistory);
    await this.taskRepository.recordEvent(task.taskId, event);
    return this.taskRepository.getTask(task.taskId, { ownerId: task.studentId });
  }

  async #reconcileTask(task, changes) {
    const deadlineChanges = changes.filter((change) =>
      change?.newValue && (
        change.category === "DEADLINE_CHANGE" ||
        change.category === "DATE_CHANGE" ||
        change.field === "DEADLINE_DATE"
      )
    );
    let updated = task;
    for (const change of deadlineChanges) {
      const type = String(updated.type || "").toUpperCase();
      const insightId = String(updated.insightId || "").toUpperCase();
      const related = type.includes("DEADLINE") || type.includes("REGISTER") ||
        type.includes("APPLICATION") || insightId.includes("DEADLINE");
      if (!related || updated.status === WORKFLOW_STATES.COMPLETED || change.newValue === updated.dueAt) continue;
      const oldDeadline = updated.dueAt || null;
      updated = {
        ...updated,
        dueAt: change.newValue,
        updatedAt: new Date().toISOString()
      };
      const event = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_RECONCILED, {
        taskId: updated.taskId,
        fromState: updated.status,
        toState: updated.status,
        actor: "SYSTEM_RECONCILIATION",
        reason: `Điều chỉnh thời hạn học vụ chính thức từ ${oldDeadline || "N/A"} sang ${change.newValue} theo văn bản trường.`,
        metadata: { changeId: change.changeId, oldDeadline, newDeadline: change.newValue }
      });
      updated = await this.#saveTaskEvent(updated, event);
    }
    return updated;
  }
}

export { ACTION_TYPES, AcademicActionIntent };
