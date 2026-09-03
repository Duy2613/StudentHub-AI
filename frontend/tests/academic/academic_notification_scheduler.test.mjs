import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicNotificationModel, NOTIFICATION_TYPES, NOTIFICATION_STATUSES } from "../../src/lib/intelligence/academic/academicNotificationModel.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationScheduler } from "../../src/lib/intelligence/academic/academicNotificationScheduler.js";

describe("Academic Notification Scheduler V1", () => {
  beforeEach(() => {
    AcademicNotificationStore.clear();
    AcademicNotificationScheduler.resetMetrics();
  });

  it("should dispatch due scheduled notifications and leave future notifications intact", async () => {
    const fixedNow = new Date("2026-08-26T12:00:00.000Z").getTime();
    const clock = { now: () => fixedNow };

    // 1. Due notification (scheduled at 10:00)
    const dueNotif = AcademicNotificationModel.createNotification({
      studentId: "24110001",
      taskId: "task_due",
      type: NOTIFICATION_TYPES.DEADLINE_SOON,
      reminderWindow: "WINDOW_3_DAYS",
      title: "Thông báo đến hạn",
      body: "Nội dung",
      scheduledAt: "2026-08-26T10:00:00.000Z",
      status: NOTIFICATION_STATUSES.SCHEDULED
    });

    // 2. Future notification (scheduled at 16:00)
    const futureNotif = AcademicNotificationModel.createNotification({
      studentId: "24110001",
      taskId: "task_future",
      type: NOTIFICATION_TYPES.DEADLINE_SOON,
      reminderWindow: "WINDOW_7_DAYS",
      title: "Thông báo tương lai",
      body: "Nội dung",
      scheduledAt: "2026-08-26T16:00:00.000Z",
      status: NOTIFICATION_STATUSES.SCHEDULED
    });

    AcademicNotificationStore.saveNotification(dueNotif);
    AcademicNotificationStore.saveNotification(futureNotif);

    // Run dispatch cycle
    const summary = await AcademicNotificationScheduler.runDispatchCycle(clock);

    assert.strictEqual(summary.processedCount, 1);
    assert.strictEqual(summary.deliveredCount, 1);

    // Verify due notification is now SENT
    const updatedDue = AcademicNotificationStore.getNotificationById(dueNotif.notificationId);
    assert.strictEqual(updatedDue.status, NOTIFICATION_STATUSES.SENT);
    assert.ok(updatedDue.sentAt);

    // Verify future notification remains SCHEDULED
    const updatedFuture = AcademicNotificationStore.getNotificationById(futureNotif.notificationId);
    assert.strictEqual(updatedFuture.status, NOTIFICATION_STATUSES.SCHEDULED);
  });

  it("should provide healthy telemetry status", () => {
    const health = AcademicNotificationScheduler.getHealthStatus();
    assert.strictEqual(health.status, "HEALTHY");
    assert.ok(typeof health.metrics.totalProcessed === "number");
  });
});
