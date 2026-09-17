import assert from "node:assert/strict";
import test from "node:test";
import { AcademicTimetableService } from "../../src/lib/server/academic/AcademicTimetableService.js";

const owner = "33333333-3333-4333-8333-333333333333";

test("the same confirmation key and payload remain idempotent", async () => {
  const records = new Map();
  const repository = {
    async createTimetable(input) {
      if (records.has(input.idempotencyKey)) return { idempotent: true, timetable: records.get(input.idempotencyKey) };
      const timetable = { id: "44444444-4444-4444-8444-444444444444", entries: input.entries, updatedAt: new Date().toISOString() };
      records.set(input.idempotencyKey, timetable);
      return { idempotent: false, timetable };
    },
  };
  const service = new AcademicTimetableService({
    timetableRepository: repository,
    taskRepository: {},
    notificationRepository: {},
    publisher: async () => ({ status: "DEDUPLICATED", authoritative: true }),
  });
  const draft = { entries: [{ courseName: "Toán rời rạc", dayOfWeek: 2 }] };
  const first = await service.confirmDraft(owner, draft, { idempotencyKey: "same-confirmation" });
  const second = await service.confirmDraft(owner, draft, { idempotencyKey: "same-confirmation" });
  assert.equal(first.idempotent, false);
  assert.equal(second.idempotent, true);
  assert.equal(first.timetable.id, second.timetable.id);
});

