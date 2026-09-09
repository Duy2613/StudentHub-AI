import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const repoRoot = path.resolve(frontendRoot, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");
}

test("generated bird atmosphere stays registry-driven and reduced-motion safe", () => {
  const registry = read("src/lib/media/vnextMediaRegistry.js");
  const atmosphere = read("src/components/providers/ReferenceAtmosphere.jsx");
  const css = read("src/app/globals.css");
  const ledgerPath = path.join(repoRoot, "artifacts/manifests/GENERATED-ART-LEDGER.json");
  const assetPath = path.join(frontendRoot, "public/media/studenthub-vnext/imagery/bird-khai-minh-v1.webp");

  assert.equal(fs.existsSync(assetPath), true);
  assert.equal(fs.existsSync(ledgerPath), true);
  assert.match(registry, /"IMG-BIRD-01"/);
  assert.match(registry, /imagery\/bird-khai-minh-v1\.webp/);
  assert.match(atmosphere, /data-reference-bird/);
  assert.match(atmosphere, /getMediaAsset\("IMG-BIRD-01"\)/);
  assert.match(css, /\.reference-atmosphere-bird[\s\S]*pointer-events/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.reference-atmosphere-bird/);
});
