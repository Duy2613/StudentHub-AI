import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { AcademicClock, VN_TIMEZONE, VN_OFFSET_HOURS } from "../../src/lib/intelligence/academic/academicClock.js";

describe("Academic Clock & Asia/Ho_Chi_Minh Timezone Engine V1", () => {
  it("should enforce Vietnam timezone constants", () => {
    assert.strictEqual(VN_TIMEZONE, "Asia/Ho_Chi_Minh");
    assert.strictEqual(VN_OFFSET_HOURS, 7);
  });

  it("should create deterministic mock clocks for testing", () => {
    const fixedTimestamp = new Date("2026-08-26T10:00:00.000Z").getTime();
    const mockClock = AcademicClock.createMockClock(fixedTimestamp);

    assert.strictEqual(mockClock.now(), fixedTimestamp);
    assert.strictEqual(mockClock.nowIso(), "2026-08-26T10:00:00.000Z");
  });

  it("should parse various date formats into end-of-day Vietnam time (23:59:59.999 UTC+7)", () => {
    // 05/09/2026 => 2026-09-05T16:59:59.999Z
    const d1 = AcademicClock.parseVnDeadline("05/09/2026");
    assert.ok(d1 instanceof Date);
    assert.strictEqual(d1.toISOString(), "2026-09-05T16:59:59.999Z");

    // 2026-09-05 => 2026-09-05T16:59:59.999Z
    const d2 = AcademicClock.parseVnDeadline("2026-09-05");
    assert.ok(d2 instanceof Date);
    assert.strictEqual(d2.toISOString(), "2026-09-05T16:59:59.999Z");

    // Invalid string
    const d3 = AcademicClock.parseVnDeadline("not-a-valid-date");
    assert.strictEqual(d3, null);
  });

  it("should compute accurate calendar day differences in UTC+7", () => {
    // Now: 26/08/2026 10:00 UTC+7 => UTC 03:00
    const mockClock = AcademicClock.createMockClock("2026-08-26T03:00:00.000Z");

    // Same day: 26/08/2026 => 0 days
    const diffToday = AcademicClock.computeCalendarDayDiff("26/08/2026", mockClock);
    assert.strictEqual(diffToday, 0);

    // Tomorrow: 27/08/2026 => 1 day
    const diffTomorrow = AcademicClock.computeCalendarDayDiff("27/08/2026", mockClock);
    assert.strictEqual(diffTomorrow, 1);

    // 10 days later: 05/09/2026 => 10 days
    const diff10 = AcademicClock.computeCalendarDayDiff("05/09/2026", mockClock);
    assert.strictEqual(diff10, 10);

    // Past deadline: 20/08/2026 => -6 days
    const diffPast = AcademicClock.computeCalendarDayDiff("20/08/2026", mockClock);
    assert.strictEqual(diffPast, -6);
  });
});
