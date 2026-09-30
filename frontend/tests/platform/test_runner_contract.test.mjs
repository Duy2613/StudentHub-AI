import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));
const runnerSource = readFileSync(new URL("../../../scripts/run-discovered-tests.mjs", import.meta.url), "utf8");

describe("Repository test runner contract", () => {
  it("isolates nested Next servers from a developer's active .next lock", () => {
    assert.match(runnerSource, /childEnv\.STUDENTHUB_NEXT_DIST_DIR\s*=\s*`\.next-hermetic-\$\{process\.pid\}`/);
  });

  it("allows full-web browser artifacts to use a dedicated volume", () => {
    const fullWebRunner = readFileSync(new URL("../../scripts/run-v4-three-core-e2e.mjs", import.meta.url), "utf8");
    assert.match(fullWebRunner, /process\.env\.STUDENTHUB_FULL_WEB_V4_ARTIFACT_ROOT/);
    assert.match(fullWebRunner, /process\.env\.STUDENTHUB_FULL_WEB_V4_WORK_ROOT/);
    assert.match(fullWebRunner, /resolve\(artifactBase, runId\)/);
  });

  it("does not forward credential aliases or reload .env.local in a child", () => {
    const result = spawnSync(process.execPath, [
      "scripts/run-discovered-tests.mjs",
      "tests/platform/hermetic_child_env.test.mjs",
    ], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: {
        ...process.env,
        DATABASE_URL: "postgresql://sentinel.invalid/main",
        OPEN_AI_KEY_1: "sentinel-provider-key",
        SUPABASE_SECRET_KEY: "sentinel-service-key",
        STUDENTHUB_EXPERT_STAGING_WRITE_ACK: "sentinel-write-ack",
      },
    });

    const output = `${result.stdout || ""}${result.stderr || ""}`;
    assert.equal(result.status, 0, output);
    assert.match(output, /\[QUALITY_GATE\] PASS: 1\/1 selected test files/);
  });

  it("honors an npm-style relative test path and reports an exact selected count", () => {
    const result = spawnSync(process.execPath, [
      "scripts/run-discovered-tests.mjs",
      "tests/security/secure_id_contracts.test.mjs",
    ], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: process.env,
    });

    const output = `${result.stdout || ""}${result.stderr || ""}`;
    assert.equal(result.status, 0, output);
    assert.match(output, /\[QUALITY_GATE\] PASS: 1\/1 selected test files/);
  });

  it("fails explicitly when a requested test path does not exist", () => {
    const result = spawnSync(process.execPath, [
      "scripts/run-discovered-tests.mjs",
      "tests/not-present/not-present.test.mjs",
    ], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: process.env,
    });

    const output = `${result.stdout || ""}${result.stderr || ""}`;
    assert.notEqual(result.status, 0);
    assert.match(output, /No tests matched/);
  });

  it("reports and skips only an explicitly classified removed-feature test", () => {
    const result = spawnSync(process.execPath, [
      "scripts/run-discovered-tests.mjs",
      "tests/academic/academic_course_records.test.mjs",
    ], {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: process.env,
    });

    const output = `${result.stdout || ""}${result.stderr || ""}`;
    assert.equal(result.status, 0, output);
    assert.match(output, /SKIPPED_REMOVED_FEATURE_TEST: academic\/academic_course_records\.test\.mjs feature=learning/);
    assert.match(output, /REMOVED_FEATURE_TESTS_SKIPPED=1/);
    assert.match(output, /PASS: 0\/0 selected test files/);
  });
});
