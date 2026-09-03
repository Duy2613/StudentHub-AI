import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicTaskStore } from "../../src/lib/intelligence/academic/academicTaskStore.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationOrchestrator } from "../../src/lib/intelligence/academic/academicNotificationOrchestrator.js";
import { AcademicWorkflowService } from "../../src/lib/intelligence/academic/academicWorkflowService.js";

describe("Academic Notification & Workflow End-to-End Golden Lifecycle V1", () => {
  beforeEach(() => {
    AcademicTaskStore.resetStore();
    AcademicNotificationStore.clear();
  });

  it("should execute the complete golden loop: Insight -> Task -> Reminders -> Snooze -> Reconcile -> Complete -> Auto-Stop -> Restart", () => {
    const studentProfile = {
      studentId: "24110001",
      fullName: "Nguyễn Văn Duy",
      cohort: 2024,
      programCode: "7480103"
    };

    const mockInsight = {
      insightId: "INS_E2E_01",
      title: "Hạn chót đăng ký học phần K24",
      deadline: "05/09/2026",
      impact: "HIGH",
      whatChanged: "Thời hạn đăng ký học lại chính thức mở đến 05/09/2026.",
      whyItMatters: "Sinh viên cần đăng ký để kịp tiến độ chương trình đào tạo."
    };

    // 1. Generate Action Plan & Task
    const { tasks } = AcademicWorkflowService.generateActionPlansForStudent(
      studentProfile,
      [mockInsight],
      []
    );
    assert.strictEqual(tasks.length, 1);
    const task = tasks[0];

    // 2. Schedule Reminders via Notification Orchestrator
    const scheduledReminders = AcademicNotificationOrchestrator.scheduleTaskReminders({
      task,
      insight: mockInsight
    });
    assert.ok(scheduledReminders.length >= 3);

    // 3. Student opens notification, marks READ and SNOOZES for 4h
    const firstNotif = scheduledReminders[0];
    const readNotif = AcademicNotificationOrchestrator.markAsRead(firstNotif.notificationId, studentProfile.studentId);
    assert.strictEqual(readNotif.status, "READ");

    const snoozedNotif = AcademicNotificationOrchestrator.snooze(firstNotif.notificationId, studentProfile.studentId, 4);
    assert.strictEqual(snoozedNotif.status, "SCHEDULED");

    // 4. University extends deadline to 12/09/2026
    const reconcileRes = AcademicNotificationOrchestrator.onDeadlineChanged({
      task,
      oldDeadline: "05/09/2026",
      newDeadline: "12/09/2026",
      newDeadlineVersion: 2
    });
    assert.ok(reconcileRes.cancelled.length > 0);
    assert.ok(reconcileRes.newlyScheduled.length > 0);

    // 5. Student completes all task steps
    for (const step of task.steps) {
      AcademicWorkflowService.completeStep(task.taskId, step.stepId, studentProfile.studentId);
    }

    // Verify task is now COMPLETED
    const finalTask = AcademicTaskStore.getTask(task.taskId);
    assert.strictEqual(finalTask.status, "COMPLETED");

    // 6. Verify all pending reminders are now CANCELLED (Auto-Stop)
    const activeReminders = AcademicNotificationStore.getNotificationsByTask(task.taskId)
      .filter(n => n.status === "SCHEDULED" || n.status === "QUEUED");
    assert.strictEqual(activeReminders.length, 0);

    // 7. Verify Process Restart Rehydration
    AcademicTaskStore.rehydrate();
    AcademicNotificationStore.rehydrate();

    const rehydratedTask = AcademicTaskStore.getTask(task.taskId);
    assert.strictEqual(rehydratedTask.status, "COMPLETED");
    assert.strictEqual(rehydratedTask.progress.percentage, 100);

    const rehydratedNotifs = AcademicNotificationStore.getNotificationsByTask(task.taskId);
    assert.ok(rehydratedNotifs.length > 0);
  });
});
