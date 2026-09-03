import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicReminderPolicy, REMINDER_WINDOWS } from "../../src/lib/intelligence/academic/academicReminderPolicy.js";

describe("Academic Reminder Policy V1", () => {
  const fixedNow = new Date("2026-08-20T00:00:00.000Z").getTime();
  const mockClock = { now: () => fixedNow };
  const deadline = "2026-09-05T16:59:59.999Z"; // 05/09/2026

  it("should compute standard schedules for all default windows (7d, 3d, 1d, day-of, overdue)", () => {
    const schedules = AcademicReminderPolicy.computeSchedules(deadline, undefined, mockClock);
    assert.strictEqual(schedules.length, 5);

    const windowNames = schedules.map(s => s.window);
    assert.ok(windowNames.includes(REMINDER_WINDOWS.WINDOW_7_DAYS));
    assert.ok(windowNames.includes(REMINDER_WINDOWS.WINDOW_3_DAYS));
    assert.ok(windowNames.includes(REMINDER_WINDOWS.WINDOW_1_DAY));
    assert.ok(windowNames.includes(REMINDER_WINDOWS.WINDOW_DAY_OF));
    assert.ok(windowNames.includes(REMINDER_WINDOWS.WINDOW_OVERDUE));

    // Verify priorities
    const schedule7d = schedules.find(s => s.window === REMINDER_WINDOWS.WINDOW_7_DAYS);
    assert.strictEqual(schedule7d.priority, "MEDIUM");

    const scheduleDayOf = schedules.find(s => s.window === REMINDER_WINDOWS.WINDOW_DAY_OF);
    assert.strictEqual(scheduleDayOf.priority, "CRITICAL");
  });

  it("should order schedules chronologically by scheduled timestamp", () => {
    const schedules = AcademicReminderPolicy.computeSchedules(deadline, undefined, mockClock);
    for (let i = 0; i < schedules.length - 1; i++) {
      assert.ok(schedules[i].scheduledTimestamp < schedules[i + 1].scheduledTimestamp);
    }
  });

  it("should return empty array if policy is disabled or deadline is invalid", () => {
    const disabledSchedules = AcademicReminderPolicy.computeSchedules(deadline, { enabled: false }, mockClock);
    assert.strictEqual(disabledSchedules.length, 0);

    const invalidSchedules = AcademicReminderPolicy.computeSchedules("not-a-date", undefined, mockClock);
    assert.strictEqual(invalidSchedules.length, 0);
  });
});
