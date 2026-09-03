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

  /**
   * Reconciles active student tasks when authoritative Student Digital Twin state updates
   * (e.g. TOEIC score updated 480 -> 560, credits increased, tuition cleared)
   * @param {string} studentId 
   * @param {object} digitalTwin 
   * @returns {{ reconciledTasks: Array, reconciledCount: number }}
   */
  static reconcileWithDigitalTwin(studentId, digitalTwin) {
    if (!studentId || !digitalTwin) {
      return { reconciledTasks: [], reconciledCount: 0 };
    }

    const currentTasks = AcademicTaskStore.getTasksByStudent(studentId);
    let reconciledCount = 0;
    const reconciledTasks = [];

    for (const task of currentTasks) {
      // Do not mutate already terminal completed tasks
      if (task.status === WORKFLOW_STATES.COMPLETED || task.status === WORKFLOW_STATES.CANCELLED) {
        reconciledTasks.push(task);
        continue;
      }

      let updatedTask = { ...task, steps: [...(task.steps || []).map(s => ({ ...s }))] };
      let hasMutated = false;

      // Check each step's action intent preconditions or requirements against new digital twin
      for (const step of updatedTask.steps) {
        if (step.status === WORKFLOW_STATES.COMPLETED) continue;

        // 1. Check TOEIC requirement
        const stepTitleUpper = (step.title || "").toUpperCase();
        if (stepTitleUpper.includes("TOEIC") || stepTitleUpper.includes("NGOẠI NGỮ") || stepTitleUpper.includes("CHỨNG CHỈ")) {
          const toeicCert = (digitalTwin.certificates || []).find(c => c.type === "TOEIC");
          if (toeicCert && toeicCert.score >= 550) {
            step.status = WORKFLOW_STATES.COMPLETED;
            step.completedAt = new Date().toISOString();
            step.evidence = {
              type: "DIGITAL_TWIN_VERIFIED_CERTIFICATE",
              certType: "TOEIC",
              score: toeicCert.score,
              sourceAuthority: digitalTwin.sourceAuthority || "HCMUTE_DAOTAO_PORTAL"
            };
            hasMutated = true;
          }
        }

        // 2. Check Credits requirement
        if (stepTitleUpper.includes("TÍN CHỈ") || stepTitleUpper.includes("ĐIỀU KIỆN ĐĂNG KÝ")) {
          if (digitalTwin.earnedCredits >= 110) {
            step.status = WORKFLOW_STATES.COMPLETED;
            step.completedAt = new Date().toISOString();
            hasMutated = true;
          }
        }
      }

      if (hasMutated) {
        // Recompute progress
        const totalSteps = updatedTask.steps.length;
        const completedSteps = updatedTask.steps.filter(s => s.status === WORKFLOW_STATES.COMPLETED).length;
        const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        updatedTask.progress = {
          completedSteps,
          totalSteps,
          percentage
        };

        if (completedSteps === totalSteps) {
          updatedTask.status = WORKFLOW_STATES.COMPLETED;
          updatedTask.completedAt = new Date().toISOString();
        }

        const reconEvent = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_RECONCILED, {
          taskId: task.taskId,
          fromState: task.status,
          toState: updatedTask.status,
          actor: "DIGITAL_TWIN_RECONCILIATION",
          reason: "Tự động dung hòa tiến độ quy trình theo dữ liệu hồ sơ số (Digital Twin) mới nhất của sinh viên.",
          metadata: {
            twinRevision: digitalTwin.revision,
            completedSteps,
            totalSteps,
            percentage
          }
        });

        AcademicTaskStore.recordEvent(task.taskId, reconEvent);
        updatedTask.history = [...(updatedTask.history || []), reconEvent];
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
