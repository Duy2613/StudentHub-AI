import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicNotificationModel, NOTIFICATION_TYPES, NOTIFICATION_STATUSES } from "../../src/lib/intelligence/academic/academicNotificationModel.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";

describe("Academic Notification Durable Store V1", () => {
  beforeEach(() => {
    AcademicNotificationStore.clear();
  });

  it("should save and rehydrate notifications correctly across simulated restart", () => {
    const notif = AcademicNotificationModel.createNotification({
      studentId: "24110001",
      type: NOTIFICATION_TYPES.DEADLINE_SOON,
      title: "Hạn chót học phần",
      body: "Còn 3 ngày để đóng học phí",
      status: NOTIFICATION_STATUSES.SENT
    });

    AcademicNotificationStore.saveNotification(notif);

    // Simulate server process restart by rehydrating fresh in-memory state from disk
    AcademicNotificationStore.rehydrate();

    const retrieved = AcademicNotificationStore.getNotificationById(notif.notificationId);
    assert.ok(retrieved);
    assert.strictEqual(retrieved.notificationId, notif.notificationId);
    assert.strictEqual(retrieved.title, "Hạn chót học phần");
    assert.strictEqual(retrieved.status, NOTIFICATION_STATUSES.SENT);
  });

  it("should prevent stale writes via optimistic revision checks", () => {
    const notif = AcademicNotificationModel.createNotification({
      studentId: "24110001",
      type: NOTIFICATION_TYPES.DEADLINE_SOON,
      title: "Hạn xét tốt nghiệp",
      body: "Chi tiết",
      status: NOTIFICATION_STATUSES.SENT
    });

    AcademicNotificationStore.saveNotification(notif);

    // Stale update with revision 0
    const staleUpdate = {
      ...notif,
      revision: 0,
      title: "Tiêu đề cũ"
    };

    assert.throws(
      () => AcademicNotificationStore.saveNotification(staleUpdate),
      /STALE_NOTIFICATION_REVISION/
    );
  });

  it("should isolate notification queries by student identity", () => {
    const notifA = AcademicNotificationModel.createNotification({
      studentId: "24110001",
      type: NOTIFICATION_TYPES.DEADLINE_SOON,
      title: "Thông báo sinh viên A",
      body: "Nội dung"
    });

    const notifB = AcademicNotificationModel.createNotification({
      studentId: "24110002",
      type: NOTIFICATION_TYPES.DEADLINE_SOON,
      title: "Thông báo sinh viên B",
      body: "Nội dung"
    });

    AcademicNotificationStore.saveNotification(notifA);
    AcademicNotificationStore.saveNotification(notifB);

    const listA = AcademicNotificationStore.getNotificationsByStudent("24110001");
    const listB = AcademicNotificationStore.getNotificationsByStudent("24110002");

    assert.strictEqual(listA.length, 1);
    assert.strictEqual(listA[0].studentId, "24110001");

    assert.strictEqual(listB.length, 1);
    assert.strictEqual(listB[0].studentId, "24110002");
  });
});
