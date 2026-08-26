/**
 * StudentHub AI — Canonical Academic Workflow Reconciliation Engine
 * 
 * Harmonizes in-progress and active tasks when academic rules, deadlines,
 * or curriculum requirements are officially updated (e.g. 30/08 -> 05/09).
 * 
 * Preserves user progress, prevents task duplication, and produces explicit
 * audit trail events.
 */

import { WORKFLOW_STATES, WORKFLOW_EVENTS, AcademicWorkflowStateMachine } from "./academicWorkflowStateMachine.js";
import { AcademicTaskStore } from "./academicTaskStore.js";

export class AcademicWorkflowReconciliationEngine {
  /**
   * Reconciles a student's active tasks against updated rules and changes
   * @param {string} studentId 
   * @param {Array} currentTasks 
   * @param {Array} newChanges 
   * @param {Array} activeRules 
   * @returns {{ reconciledTasks: Array, reconciledCount: number }}
   */
  static reconcileStudentTasks(studentId, currentTasks = [], newChanges = [], activeRules = []) {
    if (!studentId || !Array.isArray(currentTasks) || currentTasks.length === 0) {
      return { reconciledTasks: currentTasks || [], reconciledCount: 0 };
    }

    let reconciledCount = 0;
    const reconciledTasks = [];

    // Map changes by category & field for quick lookup
    const deadlineChanges = newChanges.filter(c => 
      c.category === "DEADLINE_CHANGE" || c.category === "DATE_CHANGE" || c.field === "DEADLINE_DATE"
    );

    for (const task of currentTasks) {
      let updatedTask = { ...task };
      let hasMutated = false;

      // 1. Check if deadline changed for this task's scope
      for (const change of deadlineChanges) {
        if (change.newValue && change.newValue !== task.dueAt) {
          // If task matches category or is bound to this change's rule
          const isRelated = task.type.includes("DEADLINE") || 
            task.type.includes("REGISTER") || 
            task.type.includes("APPLICATION") ||
            (task.insightId && change.changeId && task.insightId.includes("DEADLINE"));

          if (isRelated) {
            const oldDeadline = task.dueAt;
            const newDeadline = change.newValue;

            // Never mutate completed historical tasks unless rule requires new submission
            if (task.status === WORKFLOW_STATES.COMPLETED) {
              continue;
            }

            updatedTask.dueAt = newDeadline;
            hasMutated = true;

            // If task was expired under old deadline but new deadline is in the future
            if (task.status === WORKFLOW_STATES.EXPIRED) {
              const newDate = new Date(newDeadline.includes("/") ? newDeadline.split("/").reverse().join("-") : newDeadline);
              if (newDate.getTime() > Date.now()) {
                updatedTask.status = WORKFLOW_STATES.IN_PROGRESS;
              }
            }

            // Create explicit audit reconciliation event
            const event = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_RECONCILED, {
              taskId: task.taskId,
              fromState: task.status,
              toState: updatedTask.status,
              actor: "SYSTEM_RECONCILIATION",
              reason: `Điều chỉnh thời hạn học vụ chính thức từ ${oldDeadline || "N/A"} sang ${newDeadline} theo văn bản trường.`,
              metadata: {
                changeId: change.changeId,
                oldDeadline,
                newDeadline
              }
            });

            AcademicTaskStore.recordEvent(task.taskId, event);
            updatedTask.history = [...(updatedTask.history || []), event];
          }
        }
      }

      if (hasMutated) {
        updatedTask.updatedAt = new Date().toISOString();
        AcademicTaskStore.saveTask(updatedTask);
        reconciledCount++;
      }

      reconciledTasks.push(updatedTask);
    }

    return {
      reconciledTasks,
      reconciledCount
    };
  }
}
