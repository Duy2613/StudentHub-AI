import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { assertCommunityDemoModeAllowed, isCommunityDemoMode } from "../../src/lib/intelligence/community/communityDemoMode.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const gateScript = path.resolve(here, "../../../scripts/check-community-demo-gate.mjs");

test("production configuration rejects the Community demo flag", () => {
  assert.throws(
    () => assertCommunityDemoModeAllowed({ nodeEnv: "production", demoFlag: "true", persistenceAdapter: "postgres" }),
    /DEMO_GATE_CHECK/,
  );
});

test("production configuration rejects the memory persistence adapter", () => {
  assert.throws(
    () => assertCommunityDemoModeAllowed({ nodeEnv: "production", demoFlag: "false", persistenceAdapter: "memory" }),
    /DEMO_GATE_CHECK/,
  );
});

test("canonical demo-mode source keeps test fixtures test-only and production data durable", () => {
  assert.equal(assertCommunityDemoModeAllowed({ nodeEnv: "test", demoFlag: "false", persistenceAdapter: "postgres" }), false);
  assert.equal(isCommunityDemoMode(), process.env.NODE_ENV === "test");
});

test("production build script exits non-zero when demo fixtures are enabled", () => {
  const env = { ...process.env, NODE_ENV: "development", STUDENTHUB_COMMUNITY_DEMO: "true" };
  delete env.STUDENTHUB_PERSISTENCE_ADAPTER;
  const result = spawnSync(process.execPath, [gateScript, "--production-build"], { encoding: "utf8", env });
  assert.equal(result.status, 1);
  assert.match(result.stderr, /DEMO_GATE_CHECK/);
});

test("release gate passes when demo fixtures are disabled", () => {
  const env = { ...process.env, NODE_ENV: "development", STUDENTHUB_COMMUNITY_DEMO: "false", STUDENTHUB_PERSISTENCE_ADAPTER: "postgres" };
  const result = spawnSync(process.execPath, [gateScript, "--production-build"], { encoding: "utf8", env });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /DEMO_GATE_CHECK.*PASS/);
});
