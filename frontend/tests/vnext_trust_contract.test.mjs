import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");
}

test("VNext Trust composition keeps runtime authority and puts reading hierarchy first", () => {
  const shell = read("src/components/trust/TrustWorkspaceClient.jsx");
  const runtime = read("src/components/trust/AiTrustStudioView.jsx");
  const css = read("src/app/globals.css");

  assert.match(shell, /vnext-trust-hero/);
  assert.match(shell, /STATIC FIRST/);
  assert.match(shell, /Không có verdict nếu chưa đủ bằng chứng/);
  assert.doesNotMatch(shell, /CinematicTaskBackdrop|FILM 02|24FPS LOOP/);
  assert.match(runtime, /hideHero = false/);
  assert.match(runtime, /onSourceProvenanceChange/);
  assert.match(runtime, /vnext-trust-result-stack/);
  assert.match(css, /\.vnext-trust-workspace/);
  assert.match(css, /\.vnext-trust-result-stack > \.safety-actions/);
  assert.match(css, /prefers-reduced-motion: reduce/);
});
