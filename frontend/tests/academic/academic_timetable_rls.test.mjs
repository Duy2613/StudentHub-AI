import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const migration = fs.readFileSync(path.join(repositoryRoot, "database/migrations/202609170004_academic_timetables.sql"), "utf8");

test("timetable migration is owner-only and does not modify the realtime schema", () => {
  for (const table of ["user_timetables", "timetable_entries", "timetable_reminders"]) {
    assert.match(migration, new RegExp(`alter table public\\.${table} enable row level security`));
    assert.match(migration, new RegExp(`create policy [^\\n]+ on public\\.${table}`));
  }
  assert.match(migration, /auth\.uid\(\)\) = user_id/);
  assert.match(migration, /revoke all on public\.user_timetables, public\.timetable_entries, public\.timetable_reminders/);
  assert.doesNotMatch(migration, /create table[^;]+realtime\./is);
  assert.doesNotMatch(migration, /alter table\s+realtime\./i);
});

