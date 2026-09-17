import assert from "node:assert/strict";
import test from "node:test";
import { AI_CAPABILITY } from "../../src/lib/ai-gateway/types.js";
import { TimetableVisionExtractor } from "../../src/lib/server/academic/TimetableVisionExtractor.js";

test("AI image import uses the multimodal gateway and returns an editable non-persisted draft", async () => {
  let call;
  const gateway = {
    async generateStructured(input) {
      call = input;
      return {
        ok: true,
        provider: "google",
        executedModel: "gemini-test",
        providerStatus: "SUCCESS",
        json: {
          timetableName: "HK1",
          academicTerm: null,
          warnings: [],
          entries: [{
            courseName: "Mạng máy tính",
            courseCode: null,
            dayOfWeek: 3,
            startTime: "10:00",
            endTime: "11:30",
            periodStart: null,
            periodEnd: null,
            room: null,
            building: null,
            lecturer: null,
            classGroup: null,
            weekRange: null,
            notes: null,
            confidence: { courseName: 0.98, dayOfWeek: 0.55, time: 0.9, room: null },
          }],
        },
      };
    },
  };
  const result = await new TimetableVisionExtractor({ gateway }).extract({ bytes: Buffer.from("image"), mimeType: "image/png" });
  assert.equal(call.capability, AI_CAPABILITY.MULTIMODAL);
  assert.equal(call.inputParts[0].type, "image");
  assert.equal(call.inputParts[0].mime_type, "image/png");
  assert.equal(result.importState, "DRAFT_READY");
  assert.equal(result.sourcePersisted, false);
  assert.equal(result.provider, "google");
  assert.equal(result.model, "gemini-test");
  assert.equal(typeof result.durationMs, "number");
  assert.equal(typeof result.attemptCount, "number");
  assert.equal(result.draft.entries[0].courseName, "Mạng máy tính");
  assert.equal(result.draft.entries[0].confidence.dayOfWeek, 0.55);
});

