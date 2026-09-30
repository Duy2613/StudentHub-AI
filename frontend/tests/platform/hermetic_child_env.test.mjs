import assert from "node:assert/strict";
import test from "node:test";

test("discovered test process cannot recover local database or provider credentials", async (context) => {
  if (process.env.STUDENTHUB_HERMETIC_TEST_MODE !== "1") {
    context.skip("This guard is exercised by the discovered hermetic runner.");
    return;
  }

  for (const key of [
    "DATABASE_URL",
    "STUDENTHUB_RLS_TEST_DATABASE_URL",
    "STUDENTHUB_EXPERT_STAGING_DATABASE_URL",
    "STUDENTHUB_EXPERT_STAGING_WRITE_ACK",
    "OPEN_AI_KEY_1",
    "OPENAI_API_KEY",
    "GEMINI_API_KEY",
    "SUPABASE_SERVICE_ROLE_KEY",
    "SUPABASE_SECRET_KEY",
  ]) {
    assert.equal(process.env[key], undefined, `${key} must not reach a hermetic child`);
  }

  const { canonicalEnv } = await import("../../src/lib/server/env/canonicalEnv.js");
  assert.equal(canonicalEnv.DATABASE_URL, "", "canonicalEnv must not reload .env.local");
  assert.equal(canonicalEnv.OPENAI_API_KEY, "", "canonicalEnv must not reload provider keys");
});
