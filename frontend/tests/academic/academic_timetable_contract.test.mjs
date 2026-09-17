import assert from "node:assert/strict";
import test from "node:test";
import {
  deriveCourses,
  normalizePersistedEntries,
  projectNextClass,
  projectToday,
  projectWeek,
} from "../../src/lib/intelligence/academic/academicTimetableModel.js";

const entry = {
  courseName: "Lập trình Web",
  courseCode: "WEB101",
  dayOfWeek: 4,
  startTime: "07:30",
  endTime: "09:30",
  periodStart: 1,
  periodEnd: 3,
  room: "A2-301",
};

test("timetable DTO exposes the canonical owner fields and deterministic projections", () => {
  const normalized = normalizePersistedEntries([entry]);
  assert.equal(normalized[0].courseName, "Lập trình Web");
  assert.equal(normalized[0].dayOfWeek, 4);
  assert.equal(normalized[0].startTime, "07:30");
  assert.deepEqual(Object.keys(projectWeek(normalized)), ["1", "2", "3", "4", "5", "6", "7"]);
  assert.equal(deriveCourses(normalized)[0].identity, "CODE:WEB101");
  const today = projectToday(normalized, { now: new Date("2026-09-17T01:00:00.000Z") });
  assert.equal(today.dayOfWeek, 4);
  assert.equal(today.currentClass.courseCode, "WEB101");
  const tomorrow = normalizePersistedEntries([{ ...entry, courseName: "Hệ điều hành", courseCode: "OS201", dayOfWeek: 5, startTime: "08:00", endTime: "09:30" }]);
  assert.equal(projectNextClass([...normalized, ...tomorrow], { now: new Date("2026-09-17T08:00:00.000Z") }).courseCode, "OS201");
});
