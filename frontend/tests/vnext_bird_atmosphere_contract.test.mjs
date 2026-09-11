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

test("site atmosphere stays registry-driven and reduced-motion safe", () => {
  const registry = read("src/lib/media/vnextMediaRegistry.js");
  const atmosphere = read("src/components/providers/ReferenceAtmosphere.jsx");
  const css = read("src/app/globals.css");
  const assetPath = path.join(frontendRoot, "public/media/studenthub-vnext/imagery/bird-khai-minh-v1.webp");

  assert.equal(fs.existsSync(assetPath), true);
  assert.match(registry, /"IMG-BIRD-01"/);
  assert.match(registry, /imagery\/bird-khai-minh-v1\.webp/);
  assert.match(atmosphere, /data-reference-bird/);
  assert.match(atmosphere, /data-khai-minh-visual/);
  assert.match(atmosphere, /getKhaiMinhRouteVisual\(/);
  assert.match(atmosphere, /<KhaiMinhImage/);
  assert.match(css, /\.reference-atmosphere[\s\S]*pointer-events: none/);
  assert.match(css, /\.reference-atmosphere-khai-image[\s\S]*pointer-events: none/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.reference-atmosphere-khai-image/);
});
