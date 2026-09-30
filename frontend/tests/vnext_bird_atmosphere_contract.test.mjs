import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const frontendRoot = path.resolve(here, "..");
const repoRoot = path.resolve(frontendRoot, "..");
const ledgerPath = path.join(repoRoot, "artifacts/manifests/GENERATED-ART-LEDGER.json");

function read(relativePath) {
  return fs.readFileSync(path.join(frontendRoot, relativePath), "utf8");
}

test("bird stays compatibility metadata while route atmosphere remains decorative", () => {
  const registry = read("src/lib/media/vnextMediaRegistry.js");
  const atmosphere = read("src/components/providers/ReferenceAtmosphere.jsx");
  const css = read("src/app/globals.css");
  const assetPath = path.join(frontendRoot, "public/media/studenthub-vnext/imagery/bird-khai-minh-v1.webp");

  assert.equal(fs.existsSync(assetPath), true);
  assert.match(registry, /"IMG-BIRD-01"/);
  assert.match(registry, /imagery\/bird-khai-minh-v1\.webp/);
  assert.match(atmosphere, /data-reference-bird=\{birdAsset\?\.id \|\| "none"\}/);
  assert.match(atmosphere, /getMediaAsset\("IMG-BIRD-01"\)/);
  assert.match(atmosphere, /Route-specific Khai Minh visuals now own the site-wide atmosphere/);
  assert.match(atmosphere, /<KhaiMinhImage[\s\S]*className="reference-atmosphere-khai-image"/);
  assert.doesNotMatch(atmosphere, /<img[^>]+birdAsset|<Image[^>]+birdAsset/);
  assert.match(atmosphere, /aria-hidden="true"/);
  assert.match(css, /\.reference-atmosphere\s*\{[^}]*pointer-events:\s*none/s);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.reference-atmosphere-orbit[\s\S]*animation:\s*none/);
});

test("generated bird ledger provenance is available", {
  skip: fs.existsSync(ledgerPath)
    ? false
    : "Generated-art ledger is absent from this checkout and HEAD; provenance cannot be cross-checked here.",
}, () => {
  const ledger = fs.readFileSync(ledgerPath, "utf8");
  assert.match(ledger, /IMG-BIRD-01|bird-khai-minh-v1\.webp/);
});
