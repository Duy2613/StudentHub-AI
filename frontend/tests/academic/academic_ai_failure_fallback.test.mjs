import assert from "node:assert/strict";
import test from "node:test";
import { TimetableVisionExtractor } from "../../src/lib/server/academic/TimetableVisionExtractor.js";

test("AI unavailability fails closed to a manual editable draft", async () => {
  const result = await new TimetableVisionExtractor({ gateway: { generateStructured: async () => ({ ok: false, errorType: "NOT_CONFIGURED", providerStatus: "NOT_CONFIGURED" }) } }).extract({ bytes: Buffer.from("image"), mimeType: "image/png" });
  assert.equal(result.importState, "MANUAL_FALLBACK");
  assert.equal(result.sourcePersisted, false);
  assert.equal(result.failureCode, "AI_EXTRACTION_UNAVAILABLE");
  assert.deepEqual(result.draft.entries, []);
  assert.match(result.draft.warnings[0], /thủ công/);
});

