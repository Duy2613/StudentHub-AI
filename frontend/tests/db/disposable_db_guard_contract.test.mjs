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
  "frontend/tests/expert/blind_expert_16_pair_matrix.test.mjs",
  "frontend/tests/expert/blind_expert_ai_hidden.test.mjs",
  "frontend/tests/expert/blind_expert_authorization.test.mjs",
  "frontend/tests/expert/blind_expert_concurrency.test.mjs",
  "frontend/tests/expert/blind_expert_evidence.test.mjs",
  "frontend/tests/expert/blind_expert_idempotency.test.mjs",
  "frontend/tests/expert/blind_expert_l1_dispatch.test.mjs",
  "frontend/tests/expert/blind_expert_l5_reveal_gate.test.mjs",
  "frontend/tests/expert/blind_expert_offline_recovery.test.mjs",
  "frontend/tests/expert/blind_expert_other_votes_hidden.test.mjs",
  "frontend/tests/expert/blind_expert_privacy.test.mjs",
  "frontend/tests/expert/blind_expert_realtime.test.mjs",
  "frontend/tests/expert/blind_expert_reputation_calibration.test.mjs",
  "frontend/tests/expert/blind_expert_submission_lock.test.mjs",
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
    if (path.includes("/expert/")) assert.match(source, /liveExpertTest as test/, path);
    else assert.match(source, /disposableDbGuard/, path);
    assert.doesNotMatch(source, /skip:\s*!process\.env\.DATABASE_URL\b/, path);
  }
});

test("the disposable guard cannot accept DATABASE_URL as an implicit target", () => {
  const source = read("frontend/tests/helpers/disposableDbGuard.mjs");
  assert.match(source, /STUDENTHUB_DISPOSABLE_DB_ACK/);
  assert.match(source, /candidate === MAIN_DATABASE_URL/);
  assert.match(source, /DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV/);
});

test("blind Expert database tests skip unless the disposable guard configures the pool", () => {
  const helper = read("frontend/tests/expert/test_helpers.mjs");
  assert.match(helper, /configureDisposableDatabase/);
  assert.match(helper, /DISPOSABLE_DB_BLOCKED/);
  assert.match(helper, /liveExpertTest/);
  for (const path of mutationGates.filter((path) => path.includes("/expert/"))) {
    assert.match(read(path), /liveExpertTest as test/);
  }
});
