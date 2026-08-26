import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationOrchestrator } from "../../src/lib/intelligence/academic/academicNotificationOrchestrator.js";

describe("Academic Notification Deadline Reconciliation V1", () => {
  beforeEach(() => {
    AcademicNotificationStore.clear();
  });

  it("should cleanly reconcile deadline change (30/08 -> 05/09) with zero stale active reminders", () => {
    const task = {
      taskId: "task_re_exam_aug2026",
      studentId: "24110001",
      title: "Đăng ký thi lại học kỳ 2",
      deadline: "30/08/2026",
      deadlineVersion: 1,
      status: "READY"
    };

    // 1. Initial Schedule for 30/08/2026
    const initialNotifications = AcademicNotificationOrchestrator.scheduleTaskReminders({ task });
    assert.ok(initialNotifications.length > 0);

    // Verify all initial reminders reference deadlineVersion 1
    for (const notif of initialNotifications) {
      assert.strictEqual(notif.deadlineVersion, 1);
    }

    // 2. Official Regulation Extends Deadline to 05/09/2026
    const reconciliationResult = AcademicNotificationOrchestrator.onDeadlineChanged({
      task,
      oldDeadline: "30/08/2026",
      newDeadline: "05/09/2026",
      newDeadlineVersion: 2
    });

    // 3. Assertions on Reconciliation
    assert.ok(reconciliationResult.cancelled.length > 0, "Old pending reminders must be cancelled");
    assert.ok(reconciliationResult.newlyScheduled.length > 0, "New reminders must be generated");

    // Check store state: All active (non-cancelled) reminders for this task must be version 2
    const allTaskNotifs = AcademicNotificationStore.getNotificationsByTask(task.taskId);
    const activeNotifs = allTaskNotifs.filter(n => n.status !== "CANCELLED");

    for (const notif of activeNotifs) {
      assert.strictEqual(notif.deadlineVersion, 2, "Active reminders must reference new deadline version 2");
      assert.ok(notif.body.includes("05/09/2026"), "Active notification body must contain updated deadline");
      assert.ok(!notif.body.includes("30/08/2026"), "Active notification body must NOT contain stale deadline");
    }
  });
});
