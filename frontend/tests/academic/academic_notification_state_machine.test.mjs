import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicNotificationModel, NOTIFICATION_TYPES, NOTIFICATION_STATUSES } from "../../src/lib/intelligence/academic/academicNotificationModel.js";
import { AcademicNotificationStateMachine, NOTIFICATION_COMMANDS } from "../../src/lib/intelligence/academic/academicNotificationStateMachine.js";

describe("Academic Notification State Machine V1", () => {
  const sampleNotification = AcademicNotificationModel.createNotification({
    studentId: "24110001",
    type: NOTIFICATION_TYPES.DEADLINE_SOON,
    title: "Nhắc nhở học vụ",
    body: "Hạn chót còn 3 ngày",
    status: NOTIFICATION_STATUSES.SCHEDULED
  });

  it("should advance through legal lifecycle: SCHEDULED -> QUEUED -> SENT -> READ -> ACKNOWLEDGED", () => {
    // 1. SCHEDULED -> QUEUED
    const queued = AcademicNotificationStateMachine.transition(sampleNotification, NOTIFICATION_COMMANDS.QUEUE);
    assert.strictEqual(queued.status, NOTIFICATION_STATUSES.QUEUED);
    assert.strictEqual(queued.revision, 2);

    // 2. QUEUED -> SENT
    const sent = AcademicNotificationStateMachine.transition(queued, NOTIFICATION_COMMANDS.SEND);
    assert.strictEqual(sent.status, NOTIFICATION_STATUSES.SENT);
    assert.ok(sent.sentAt);
    assert.strictEqual(sent.revision, 3);

    // 3. SENT -> READ
    const read = AcademicNotificationStateMachine.transition(sent, NOTIFICATION_COMMANDS.MARK_READ);
    assert.strictEqual(read.status, NOTIFICATION_STATUSES.READ);
    assert.ok(read.readAt);
    assert.strictEqual(read.revision, 4);

    // 4. READ -> ACKNOWLEDGED
    const ack = AcademicNotificationStateMachine.transition(read, NOTIFICATION_COMMANDS.ACKNOWLEDGE);
    assert.strictEqual(ack.status, NOTIFICATION_STATUSES.ACKNOWLEDGED);
    assert.ok(ack.acknowledgedAt);
    assert.strictEqual(ack.revision, 5);
  });

  it("should reject illegal state transitions (e.g. ACKNOWLEDGED -> QUEUED)", () => {
    const ackNotification = {
      ...sampleNotification,
      status: NOTIFICATION_STATUSES.ACKNOWLEDGED
    };

    assert.throws(
      () => AcademicNotificationStateMachine.transition(ackNotification, NOTIFICATION_COMMANDS.QUEUE),
      /Illegal notification transition/
    );
  });

  it("should support SNOOZE by rescheduling without altering task deadline", () => {
    const fixedNow = new Date("2026-08-26T10:00:00.000Z").getTime();
    const clock = { now: () => fixedNow };

    const sentNotification = {
      ...sampleNotification,
      status: NOTIFICATION_STATUSES.SENT
    };

    const snoozed = AcademicNotificationStateMachine.transition(
      sentNotification,
      NOTIFICATION_COMMANDS.SNOOZE,
      { clock, snoozeHours: 4 }
    );

    assert.strictEqual(snoozed.status, NOTIFICATION_STATUSES.SCHEDULED);
    assert.strictEqual(snoozed.scheduledAt, "2026-08-26T14:00:00.000Z"); // +4 hours
  });
});
