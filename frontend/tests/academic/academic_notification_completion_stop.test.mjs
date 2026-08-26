import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationOrchestrator } from "../../src/lib/intelligence/academic/academicNotificationOrchestrator.js";

describe("Academic Notification Completion Auto-Stop V1", () => {
  beforeEach(() => {
    AcademicNotificationStore.clear();
  });

  it("should automatically cancel all pending future reminders when task is completed", () => {
    const task = {
      taskId: "task_thesis_submission_2026",
      studentId: "24110001",
      title: "Nộp đề cương khóa luận tốt nghiệp",
      deadline: "2026-09-15T16:59:59.999Z",
      status: "IN_PROGRESS"
    };

    // 1. Schedule reminders for the task
    const scheduled = AcademicNotificationOrchestrator.scheduleTaskReminders({ task });
    assert.ok(scheduled.length > 0);

    const pendingBeforeCompletion = AcademicNotificationStore.getNotificationsByTask(task.taskId)
      .filter(n => n.status === "SCHEDULED" || n.status === "QUEUED");
    assert.ok(pendingBeforeCompletion.length > 0);

    // 2. Student completes task early
    const cancelled = AcademicNotificationOrchestrator.onTaskCompleted(task.taskId, task.studentId);
    assert.strictEqual(cancelled.length, pendingBeforeCompletion.length);

    // 3. Verify zero active scheduled reminders remain
    const pendingAfterCompletion = AcademicNotificationStore.getNotificationsByTask(task.taskId)
      .filter(n => n.status === "SCHEDULED" || n.status === "QUEUED");
    assert.strictEqual(pendingAfterCompletion.length, 0);

    // 4. Verify reason is recorded
    for (const notif of cancelled) {
      assert.strictEqual(notif.status, "CANCELLED");
      const lastHistory = notif.history[notif.history.length - 1];
      assert.ok(lastHistory.reason.includes("completed"));
    }
  });
});
