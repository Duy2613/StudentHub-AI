/**
 * StudentHub AI — Canonical Academic Workflow Service
 * 
 * Master domain orchestrator connecting:
 * Academic Insights ➔ Action Plans ➔ Tasks ➔ State Machine ➔ Step Progress ➔ Verification ➔ Store
 */

import { WORKFLOW_STATES, WORKFLOW_EVENTS, AcademicWorkflowStateMachine } from "./academicWorkflowStateMachine.js";
import { AcademicTaskModel } from "./academicTaskModel.js";
import { AcademicTaskStore } from "./academicTaskStore.js";
import { AcademicTaskAuthorization } from "./academicTaskAuthorization.js";
import { AcademicWorkflowReconciliationEngine } from "./academicWorkflowReconciliationEngine.js";
import { ACTION_TYPES, AcademicActionIntent } from "./academicActionIntent.js";

export class AcademicWorkflowService {
  /**
   * Generates or reconciles action plans and tasks for a student based on insights
   * @param {object} studentProfile 
   * @param {Array} insights 
   * @param {Array} changes 
   * @returns {{ plans: Array, tasks: Array }}
   */
  static generateActionPlansForStudent(studentProfile, insights = [], changes = []) {
    if (!studentProfile || !studentProfile.studentId) {
      return { plans: [], tasks: [] };
    }

    const studentId = studentProfile.studentId;
    const generatedPlans = [];
    const generatedTasks = [];

    // Filter actionable insights (must have real impact)
    const actionableInsights = insights.filter(i => i.impact && i.impact !== "NONE");

    for (const insight of actionableInsights) {
      const planId = AcademicTaskModel.derivePlanId(studentId, insight.insightId, "1.0");

      // Check if plan already exists in store (Idempotent retrieval)
      let plan = AcademicTaskStore.getPlan(planId);

      if (!plan) {
        // Construct canonical multi-step task for this insight
        const taskSteps = this.#buildStepsForInsight(insight, studentProfile);
        const taskId = AcademicTaskModel.deriveTaskId(planId, insight.type || "ACTION");

        // Check if task already exists
        let task = AcademicTaskStore.getTask(taskId);
        if (!task) {
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

          // Record creation event
          const createEvent = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_CREATED, {
            taskId,
            fromState: null,
            toState: WORKFLOW_STATES.READY,
            actor: "SYSTEM",
            reason: "Nhiệm vụ học vụ được tạo tự động từ phân tích tác động cá nhân hóa."
          });

          task.history = [createEvent];
          AcademicTaskStore.recordEvent(taskId, createEvent);
          AcademicTaskStore.saveTask(task);
        }

        plan = AcademicTaskModel.createActionPlan({
          planId,
          studentId,
          insightId: insight.insightId,
          title: `Kế hoạch: ${insight.title}`,
          description: insight.whyItMatters || insight.whatChanged,
          priority: insight.impact,
          deadline: insight.deadline || null,
          tasks: [task],
          source: insight.source
        });

        AcademicTaskStore.savePlan(plan);
      }

      generatedPlans.push(plan);
      const studentTasks = AcademicTaskStore.getTasksByStudent(studentId);
      const matchingTask = studentTasks.find(t => t.planId === plan.planId);
      if (matchingTask) {
        generatedTasks.push(matchingTask);
      }
    }

    // Reconcile tasks against latest changes if needed
    if (changes.length > 0) {
      const { reconciledTasks } = AcademicWorkflowReconciliationEngine.reconcileStudentTasks(
        studentId,
        generatedTasks,
        changes
      );
      return {
        plans: generatedPlans,
        tasks: reconciledTasks
      };
    }

    return {
      plans: generatedPlans,
      tasks: generatedTasks
    };
  }

  /**
   * Builds structured, multi-step tasks tailored to insight type
   */
  static #buildStepsForInsight(insight, studentProfile) {
    const titleUpper = (insight.title || "").toUpperCase();
    const typeUpper = (insight.type || "").toUpperCase();

    if (typeUpper.includes("DEADLINE") || titleUpper.includes("HẠN") || titleUpper.includes("TỐT NGHIỆP")) {
      return [
        AcademicTaskModel.createStep({
          index: 0,
          title: "Kiểm tra điều kiện xét tốt nghiệp / học vụ",
          description: "Đối soát số tín chỉ tích lũy (yêu cầu 110+) và điểm GPA trung bình.",
          status: (studentProfile.earnedCredits || 0) >= 110 ? WORKFLOW_STATES.COMPLETED : WORKFLOW_STATES.NOT_STARTED,
          actionIntent: AcademicActionIntent.createIntent({
            type: ACTION_TYPES.CHECK_ELIGIBILITY,
            label: "Kiểm tra điều kiện"
          })
        }),
        AcademicTaskModel.createStep({
          index: 1,
          title: "Chuẩn bị hồ sơ & minh chứng",
          description: "Chuẩn bị bản scan chứng chỉ ngoại ngữ và đơn đăng ký theo mẫu.",
          status: WORKFLOW_STATES.NOT_STARTED,
          actionIntent: AcademicActionIntent.createIntent({
            type: ACTION_TYPES.UPLOAD_DOCUMENT,
            label: "Tải lên hồ sơ"
          })
        }),
        AcademicTaskModel.createStep({
          index: 2,
          title: "Nộp hồ sơ trực tuyến",
          description: "Gửi hồ sơ đăng ký qua cổng thông tin đào tạo trước hạn chót.",
          status: WORKFLOW_STATES.NOT_STARTED,
          actionIntent: AcademicActionIntent.createIntent({
            type: ACTION_TYPES.SUBMIT_APPLICATION,
            label: "Nộp hồ sơ"
          })
        }),
        AcademicTaskModel.createStep({
          index: 3,
          title: "Theo dõi phản hồi & xác nhận",
          description: "Kiểm tra kết quả duyệt hồ sơ từ Phòng Đào Tạo.",
          status: WORKFLOW_STATES.NOT_STARTED,
          actionIntent: AcademicActionIntent.createIntent({
            type: ACTION_TYPES.CHECK_STATUS,
            label: "Xem trạng thái"
          })
        })
      ];
    }

    if (typeUpper.includes("REQUIREMENT") || titleUpper.includes("NGOẠI NGỮ") || titleUpper.includes("TOEIC")) {
      return [
        AcademicTaskModel.createStep({
          index: 0,
          title: "Kiểm tra điểm chuẩn đầu ra Ngoại ngữ",
          description: "Đối chiếu điểm chứng chỉ cá nhân với chuẩn TOEIC 550 điểm.",
          status: WORKFLOW_STATES.COMPLETED,
          actionIntent: AcademicActionIntent.createIntent({
            type: ACTION_TYPES.CHECK_ELIGIBILITY,
            label: "Xem chuẩn"
          })
        }),
        AcademicTaskModel.createStep({
          index: 1,
          title: "Nộp chứng chỉ quốc tế hoặc đăng ký thi chuẩn đầu ra",
          description: "Gửi chứng chỉ TOEIC đạt chuẩn để công nhận tốt nghiệp.",
          status: WORKFLOW_STATES.NOT_STARTED,
          actionIntent: AcademicActionIntent.createIntent({
            type: ACTION_TYPES.UPLOAD_DOCUMENT,
            label: "Nộp chứng chỉ"
          })
        }),
        AcademicTaskModel.createStep({
          index: 2,
          title: "Xác thực đối soát hồ sơ học vụ",
          description: "Chờ Phòng Đào Tạo cập nhật chứng chỉ vào bản sao số học vụ.",
          status: WORKFLOW_STATES.NOT_STARTED,
          actionIntent: AcademicActionIntent.createIntent({
            type: ACTION_TYPES.CHECK_STATUS,
            label: "Kiểm tra xác thực"
          })
        })
      ];
    }

    // Default 2-step workflow for fee or general announcements
    return [
      AcademicTaskModel.createStep({
        index: 0,
        title: "Kiểm tra thông tin chi tiết",
        description: "Xem văn bản quy định và thời hạn áp dụng.",
        status: WORKFLOW_STATES.COMPLETED,
        actionIntent: AcademicActionIntent.createIntent({
          type: ACTION_TYPES.VIEW_DOCUMENT,
          label: "Xem văn bản"
        })
      }),
      AcademicTaskModel.createStep({
        index: 1,
        title: "Thực hiện xử lý học vụ",
        description: "Hoàn tất các thủ tục theo đúng hướng dẫn của Nhà trường.",
        status: WORKFLOW_STATES.NOT_STARTED,
        actionIntent: AcademicActionIntent.createIntent({
          type: ACTION_TYPES.REGISTER,
          label: "Thực hiện ngay"
        })
      })
    ];
  }

  /**
   * Starts a task (Transitions READY/NOT_STARTED -> IN_PROGRESS)
   */
  static startTask(taskId, studentId) {
    const task = AcademicTaskStore.getTask(taskId);
    AcademicTaskAuthorization.assertTaskOwnership(task, studentId);

    AcademicWorkflowStateMachine.validateTransition(task.status, WORKFLOW_STATES.IN_PROGRESS);

    const oldState = task.status;
    task.status = WORKFLOW_STATES.IN_PROGRESS;
    task.updatedAt = new Date().toISOString();

    const event = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_STARTED, {
      taskId,
      fromState: oldState,
      toState: WORKFLOW_STATES.IN_PROGRESS,
      actor: studentId,
      reason: "Sinh viên bắt đầu thực hiện quy trình học vụ."
    });

    AcademicTaskStore.recordEvent(taskId, event);
    return AcademicTaskStore.saveTask(task);
  }

  /**
   * Completes a specific step in a task
   */
  static completeStep(taskId, stepId, studentId, evidence = null) {
    const task = AcademicTaskStore.getTask(taskId);
    AcademicTaskAuthorization.assertTaskOwnership(task, studentId);
    AcademicTaskAuthorization.assertStepDependenciesMet(task, stepId);

    const stepIndex = task.steps.findIndex(s => s.stepId === stepId);
    if (stepIndex < 0) {
      throw new Error(`[INVALID_STEP] Bước học vụ '${stepId}' không tồn tại.`);
    }

    // Mark step completed
    task.steps[stepIndex].status = WORKFLOW_STATES.COMPLETED;
    task.steps[stepIndex].completedAt = new Date().toISOString();
    if (evidence) {
      task.steps[stepIndex].evidence = { ...evidence };
    }

    // Recalculate progress & next action
    task.progress = AcademicTaskModel.calculateProgress(task.steps);
    task.nextAction = AcademicTaskModel.resolveNextAction(task.steps);

    // If all steps completed, advance task state
    if (task.progress.percentage === 100) {
      const targetState = WORKFLOW_STATES.COMPLETED;
      if (AcademicWorkflowStateMachine.canTransition(task.status, targetState)) {
        task.status = targetState;
        task.completedAt = new Date().toISOString();
      }
    } else if (task.status === WORKFLOW_STATES.READY || task.status === WORKFLOW_STATES.NOT_STARTED) {
      task.status = WORKFLOW_STATES.IN_PROGRESS;
    }

    task.updatedAt = new Date().toISOString();

    const event = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_STEP_COMPLETED, {
      taskId,
      fromState: task.status,
      toState: task.status,
      actor: studentId,
      reason: `Hoàn tất bước: ${task.steps[stepIndex].title}`,
      evidence
    });

    AcademicTaskStore.recordEvent(taskId, event);
    return AcademicTaskStore.saveTask(task);
  }

  /**
   * Verifies task completion
   */
  static verifyTaskCompletion(taskId, studentId, verificationEvidence = null) {
    const task = AcademicTaskStore.getTask(taskId);
    AcademicTaskAuthorization.assertTaskOwnership(task, studentId);

    AcademicWorkflowStateMachine.validateTransition(task.status, WORKFLOW_STATES.COMPLETED);

    task.status = WORKFLOW_STATES.COMPLETED;
    task.completedAt = new Date().toISOString();
    task.updatedAt = new Date().toISOString();

    if (verificationEvidence) {
      task.evidence = [...(task.evidence || []), { ...verificationEvidence, verifiedAt: new Date().toISOString() }];
    }

    const event = AcademicWorkflowStateMachine.createEvent(WORKFLOW_EVENTS.TASK_VERIFIED, {
      taskId,
      fromState: WORKFLOW_STATES.PENDING_VERIFICATION,
      toState: WORKFLOW_STATES.COMPLETED,
      actor: "SYSTEM_VERIFIER",
      reason: "Xác thực hoàn tất quy trình học vụ thành công.",
      evidence: verificationEvidence
    });

    AcademicTaskStore.recordEvent(taskId, event);
    return AcademicTaskStore.saveTask(task);
  }
}
