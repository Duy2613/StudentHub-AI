import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicDeadlineEngine, DEADLINE_STATES, DEADLINE_URGENCY } from "../../src/lib/intelligence/academic/academicDeadlineEngine.js";

describe("Academic Deadline Engine V1", () => {
  const fixedNow = new Date("2026-08-26T00:00:00.000Z").getTime();
  const mockClock = { now: () => fixedNow };

  it("should correctly parse various date formats into UTC+7 end-of-day ISO string", () => {
    const d1 = AcademicDeadlineEngine.parseDeadline("05/09/2026");
    assert.ok(d1 instanceof Date);
    assert.strictEqual(d1.toISOString(), "2026-09-05T16:59:59.999Z"); // 23:59:59.999 UTC+7

    const d2 = AcademicDeadlineEngine.parseDeadline("2026-09-05");
    assert.ok(d2 instanceof Date);
    assert.strictEqual(d2.toISOString(), "2026-09-05T16:59:59.999Z");

    const d3 = AcademicDeadlineEngine.parseDeadline("invalid-date-format");
    assert.strictEqual(d3, null);

    const d4 = AcademicDeadlineEngine.parseDeadline(null);
    assert.strictEqual(d4, null);
  });

  it("should compute accurate time remaining and human-readable Vietnamese text for future deadlines", () => {
    // 10 days in future: 05/09/2026 relative to 26/08/2026
    const res = AcademicDeadlineEngine.computeTimeRemaining("05/09/2026", mockClock);
    assert.strictEqual(res.hasDeadline, true);
    assert.strictEqual(res.isOverdue, false);
    assert.strictEqual(res.days, 10);
    assert.ok(res.humanText.includes("Còn 10 ngày"));
  });

  it("should identify tomorrow deadline and today deadline correctly", () => {
    // Tomorrow: now is 26/08/2026 10:00 UTC+7, deadline is 27/08/2026
    const clockTomorrow = { now: () => new Date("2026-08-26T03:00:00.000Z").getTime() }; // 26/08 10:00 UTC+7
    const evalTomorrow = AcademicDeadlineEngine.evaluateDeadline({
      deadline: "27/08/2026",
      clock: clockTomorrow
    });
    assert.strictEqual(evalTomorrow.state, DEADLINE_STATES.DUE_TOMORROW);
    assert.strictEqual(evalTomorrow.urgency, DEADLINE_URGENCY.CRITICAL);

    // Today: now is 26/08/2026 14:00 UTC+7, deadline is 26/08/2026
    const clockToday = { now: () => new Date("2026-08-26T07:00:00.000Z").getTime() };
    const evalToday = AcademicDeadlineEngine.evaluateDeadline({
      deadline: "26/08/2026",
      clock: clockToday
    });
    assert.strictEqual(evalToday.state, DEADLINE_STATES.DUE_TODAY);
    assert.strictEqual(evalToday.urgency, DEADLINE_URGENCY.CRITICAL);
  });

  it("should categorize overdue deadlines accurately", () => {
    // Past deadline: 20/08/2026 relative to 26/08/2026
    const evalOverdue = AcademicDeadlineEngine.evaluateDeadline({
      deadline: "20/08/2026",
      taskStatus: "IN_PROGRESS",
      clock: mockClock
    });
    assert.strictEqual(evalOverdue.state, DEADLINE_STATES.OVERDUE);
    assert.strictEqual(evalOverdue.urgency, DEADLINE_URGENCY.CRITICAL);
    assert.strictEqual(evalOverdue.isActionRequired, true);
    assert.ok(evalOverdue.timeRemaining.humanText.includes("Đã quá hạn"));
  });

  it("should return COMPLETED_BEFORE_DEADLINE when task is already completed", () => {
    const evalCompleted = AcademicDeadlineEngine.evaluateDeadline({
      deadline: "05/09/2026",
      taskStatus: "COMPLETED",
      clock: mockClock
    });
    assert.strictEqual(evalCompleted.state, DEADLINE_STATES.COMPLETED_BEFORE_DEADLINE);
    assert.strictEqual(evalCompleted.urgency, DEADLINE_URGENCY.LOW);
    assert.strictEqual(evalCompleted.isActionRequired, false);
  });
});
