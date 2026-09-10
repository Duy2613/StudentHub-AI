import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const read = (path) => readFileSync(join(root, path), "utf8");
const mutationGates = [
  "frontend/tests/community_expert/phase8_live_gate.test.mjs",
  "frontend/tests/db/beta_user_database_proof.test.mjs",
  "frontend/tests/db/durable_trust_persistence.test.mjs",
  "frontend/tests/db/phase2_live_gate.test.mjs",
  "frontend/tests/db/phase3_live_postgres_rls.test.mjs",
  "frontend/tests/db/report_live_gate.test.mjs",
  "frontend/tests/integrations/labbe_staging_live_gate.test.mjs",
  "frontend/tests/passport/phase5_live_gate.test.mjs",
  "frontend/tests/passport/trust_case_passport_binding.test.mjs",
  "frontend/tests/resilience/phase7_live_gate.test.mjs",
  "frontend/tests/security/phase6_live_gate.test.mjs",
  "frontend/tests/security/postgres_session_repository.test.mjs",
];

test("all database mutation gates require the explicit disposable-db guard", () => {
  for (const path of mutationGates) {
    const source = read(path);
    assert.match(source, /disposableDbGuard/, path);
    assert.doesNotMatch(source, /skip:\s*!process\.env\.DATABASE_URL\b/, path);
  }
});

test("the disposable guard cannot accept DATABASE_URL as an implicit target", () => {
  const source = read("frontend/tests/helpers/disposableDbGuard.mjs");
  assert.match(source, /STUDENTHUB_DISPOSABLE_DB_ACK/);
  assert.match(source, /candidate === process\.env\.DATABASE_URL/);
  assert.match(source, /DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV/);
});
