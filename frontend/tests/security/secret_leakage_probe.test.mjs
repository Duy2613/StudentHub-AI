import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { describe, it } from "node:test";

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const scannerPath = path.join(repositoryRoot, "scripts", "check-secret-leakage.mjs");

function runScanner({ bundle, envFile = "" }) {
  const fixture = mkdtempSync(path.join(os.tmpdir(), "studenthub-secret-scan-"));
  try {
    const staticDir = path.join(fixture, "frontend", ".next", "static", "chunks");
    mkdirSync(staticDir, { recursive: true });
    writeFileSync(path.join(staticDir, "fixture.js"), bundle);
    if (envFile) writeFileSync(path.join(fixture, "frontend", ".env.local"), envFile);
    return spawnSync(process.execPath, [scannerPath], {
      cwd: fixture,
      encoding: "utf8",
      env: { PATH: process.env.PATH, SYSTEMROOT: process.env.SYSTEMROOT, PATHEXT: process.env.PATHEXT },
    });
  } finally {
    rmSync(fixture, { recursive: true, force: true });
  }
}

describe("client secret leakage scanner", () => {
  it("detects server-only identifiers even when no secret value is configured", () => {
    const result = runScanner({ bundle: "window.configuration = 'OPENALEX_API_KEY';" });
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Variable name OPENALEX_API_KEY/);
  });

  it("detects configured secret values without printing the value", () => {
    const secret = "synthetic-scanner-fixture-secret-value";
    const result = runScanner({ bundle: `window.configuration = '${secret}';`, envFile: `OPENALEX_API_KEY=${secret}\n` });
    const report = `${result.stdout}\n${result.stderr}`;
    assert.equal(result.status, 1);
    assert.match(report, /OPENALEX_API_KEY VALUE FOUND/);
    assert.equal(report.includes(secret), false);
  });
});
