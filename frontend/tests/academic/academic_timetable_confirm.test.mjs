import assert from "node:assert/strict";
import test from "node:test";
import { AcademicTimetableService } from "../../src/lib/server/academic/AcademicTimetableService.js";

const owner = "11111111-1111-4111-8111-111111111111";

function dependencies(repository, publisher = async () => ({ status: "PERSISTED", authoritative: true })) {
  return {
    timetableRepository: repository,
    taskRepository: { getTasksByStudent: async () => [] },
    notificationRepository: { getNotificationsByStudent: async () => [], countUnreadByStudent: async () => 0 },
    publisher,
  };
}

test("confirm persists only after a complete editable draft validates", async () => {
  const calls = [];
  const repository = {
    async createTimetable(input) {
      calls.push(input);
      return { idempotent: false, timetable: { id: "22222222-2222-4222-8222-222222222222", entries: input.entries, updatedAt: new Date().toISOString() } };
    },
  };
  const service = new AcademicTimetableService(dependencies(repository));
  const result = await service.confirmDraft(owner, { entries: [{ courseName: "Hệ điều hành", dayOfWeek: 5, startTime: "07:00" }] }, { idempotencyKey: "confirm-a" });
  assert.equal(calls.length, 1);
  assert.equal(calls[0].sourceType, "IMAGE");
  assert.equal(result.timetable.entries[0].courseName, "Hệ điều hành");
  await assert.rejects(() => service.confirmDraft(owner, { entries: [{ courseName: "Thiếu ngày" }] }), /ngày học/);
  assert.equal(calls.length, 1);
});

