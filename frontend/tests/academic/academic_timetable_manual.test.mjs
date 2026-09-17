import assert from "node:assert/strict";
import test from "node:test";
import { normalizePersistedEntries, TimetableValidationError } from "../../src/lib/intelligence/academic/academicTimetableModel.js";

test("manual timetable accepts explicit fields and rejects incomplete canonical rows", () => {
  const [row] = normalizePersistedEntries([{ courseName: "Cơ sở dữ liệu", dayOfWeek: "2", startTime: "8:00", endTime: "09:30" }]);
  assert.equal(row.dayOfWeek, 2);
  assert.equal(row.startTime, "08:00");
  assert.equal(row.endTime, "09:30");
  assert.throws(() => normalizePersistedEntries([{ courseName: "Thiếu ngày" }]), (error) => error instanceof TimetableValidationError && error.code === "DAY_OF_WEEK_REQUIRED");
});

