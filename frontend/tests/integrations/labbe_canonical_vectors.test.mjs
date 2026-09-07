import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import { canonicalJson, hashCanonicalJson } from "../../src/lib/server/integrations/CanonicalJson.js";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const vectorPath = join(repositoryRoot, "docs", "integrations", "labbe-canonical-json-vectors.json");
const vectors = JSON.parse(readFileSync(vectorPath, "utf8"));

test("Node StudentHub canonical JSON matches every golden vector", () => {
  for (const vector of vectors) {
    assert.equal(canonicalJson(vector.value), vector.canonical, vector.name);
    assert.equal(hashCanonicalJson(vector.value), vector.sha256, vector.name);
  }
});

test("different object key ordering has identical canonical bytes and hash", () => {
  const first = vectors.find((vector) => vector.name === "different-key-order-a");
  const second = vectors.find((vector) => vector.name === "different-key-order-b");
  assert.equal(canonicalJson(first.value), canonicalJson(second.value));
  assert.equal(hashCanonicalJson(first.value), hashCanonicalJson(second.value));
});

test("Python Labbe reference verifier matches the same golden vectors", () => {
  const scriptPath = join(repositoryRoot, "scripts", "labbe_reference", "canonical_json.py");
  const candidates = [process.env.LABBE_PYTHON, "python", "python3"].filter(Boolean);
  let result = null;
  for (const command of candidates) {
    result = spawnSync(command, [scriptPath, vectorPath], { encoding: "utf8", windowsHide: true });
    if (!result.error) break;
  }
  assert.ok(result && !result.error, `Python reference unavailable: ${result?.error?.message || "unknown error"}`);
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(result.stdout, /"status":"PASS"/);
  assert.match(result.stdout, /"vectors":8/);
});
