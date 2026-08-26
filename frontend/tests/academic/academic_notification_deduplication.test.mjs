import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { AcademicNotificationModel, NOTIFICATION_TYPES } from "../../src/lib/intelligence/academic/academicNotificationModel.js";
import { AcademicNotificationStore } from "../../src/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationOrchestrator } from "../../src/lib/intelligence/academic/academicNotificationOrchestrator.js";

describe("Academic Notification Deterministic Deduplication V1", () => {
  beforeEach(() => {
    AcademicNotificationStore.clear();
  });

  it("should derive identical dedupe keys for same logical parameters", () => {
    const key1 = AcademicNotificationModel.deriveDedupeKey({
      studentId: "24110001",
      taskId: "task_re_exam_reg_2026",
      type: NOTIFICATION_TYPES.DEADLINE_SOON,
      deadlineVersion: 1,
      reminderWindow: "WINDOW_3_DAYS"
    });

    const key2 = AcademicNotificationModel.deriveDedupeKey({
      studentId: "24110001",
      taskId: "task_re_exam_reg_2026",
      type: NOTIFICATION_TYPES.DEADLINE_SOON,
      deadlineVersion: 1,
      reminderWindow: "WINDOW_3_DAYS"
    });

    assert.strictEqual(key1, key2);
  });

  it("should produce different dedupe keys for different students or deadline versions", () => {
    const keyStudentA = AcademicNotificationModel.deriveDedupeKey({
      studentId: "24110001",
      taskId: "task_1",
      type: NOTIFICATION_TYPES.DEADLINE_SOON
    });

    const keyStudentB = AcademicNotificationModel.deriveDedupeKey({
      studentId: "24110002",
      taskId: "task_1",
      type: NOTIFICATION_TYPES.DEADLINE_SOON
    });

    const keyV2 = AcademicNotificationModel.deriveDedupeKey({
      studentId: "24110001",
      taskId: "task_1",
      type: NOTIFICATION_TYPES.DEADLINE_SOON,
      deadlineVersion: 2
    });

    assert.notStrictEqual(keyStudentA, keyStudentB);
    assert.notStrictEqual(keyStudentA, keyV2);
  });

  it("should enforce idempotency when scheduling duplicate events", () => {
    const mockTask = {
      taskId: "task_test_dedupe",
      studentId: "24110001",
      title: "Đăng ký học lại",
      deadline: "2026-09-05T16:59:59.999Z",
      status: "READY"
    };

    // First scheduling pass
    const pass1 = AcademicNotificationOrchestrator.scheduleTaskReminders({ task: mockTask });
    const countAfterPass1 = AcademicNotificationStore.getNotificationsByStudent("24110001").length;

    // Second scheduling pass with exact same task
    const pass2 = AcademicNotificationOrchestrator.scheduleTaskReminders({ task: mockTask });
    const countAfterPass2 = AcademicNotificationStore.getNotificationsByStudent("24110001").length;

    // Ensure zero duplicate notification records created
    assert.strictEqual(countAfterPass1, countAfterPass2);
    assert.strictEqual(pass1.length, pass2.length);
  });
});
