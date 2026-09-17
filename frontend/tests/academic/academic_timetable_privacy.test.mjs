import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { normalizeTimetableOwnerId } from "../../src/lib/server/database/AcademicTimetableRepository.js";

const FRONTEND_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

test("privacy boundary rejects non-canonical owners and does not retain import bytes", () => {
  assert.throws(() => normalizeTimetableOwnerId("24110001"), /canonical authenticated/);
  const route = fs.readFileSync(path.join(FRONTEND_ROOT, "src/app/api/academic/timetable/import/route.js"), "utf8");
  assert.match(route, /retained: false/);
  assert.doesNotMatch(route, /writeFile|putObject|upload/i);
  const extractor = fs.readFileSync(path.join(FRONTEND_ROOT, "src/lib/server/academic/TimetableVisionExtractor.js"), "utf8");
  assert.doesNotMatch(extractor, /DATABASE_URL|insert into|user_timetables/i);
});
