import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repositoryRoot = fileURLToPath(new URL("../../../", import.meta.url));

describe("Repository test runner contract", () => {
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
});
