import assert from "node:assert/strict";
import test from "node:test";
import { AcademicTimetableService } from "../../src/lib/server/academic/AcademicTimetableService.js";

test("timetable mutations publish an owner-scoped event after the repository result", async () => {
  const events = [];
  const service = new AcademicTimetableService({
    timetableRepository: {
      async createTimetable(input) { return { idempotent: false, timetable: { id: "55555555-5555-4555-8555-555555555555", entries: input.entries, updatedAt: new Date().toISOString() } }; },
    },
    taskRepository: {},
    notificationRepository: {},
    publisher: async (event) => { events.push(event); return { status: "PERSISTED", authoritative: true }; },
  });
  await service.createManual("66666666-6666-4666-8666-666666666666", { entries: [{ courseName: "Mạng", dayOfWeek: 1 }] }, { idempotencyKey: "manual-realtime" });
  assert.equal(events[0].channel, "academic");
  assert.equal(events[0].eventType, "academic:timetable.updated");
  assert.equal(events[0].subjectId, "66666666-6666-4666-8666-666666666666");
  assert.equal(events[0].data.authoritative, true);
});

