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

test("VNext media is registry-driven, verified-pack-only and poster-first", () => {
  const registry = read("src/lib/media/vnextMediaRegistry.js");
  const background = read("src/components/providers/BackgroundContext.jsx");
  const runtime = read("src/components/providers/UniversalCinematicBackground.jsx");
  const css = read("src/app/globals.css");

  for (const id of ["VID-PRISM-01", "VID-HUMAN-01", "VID-OPTIC-01", "VID-OPTIC-02", "VID-HUMAN-02", "VID-PRISM-02", "HDRI-01"]) {
    assert.match(registry, new RegExp(`"${id}"`));
  }
  assert.match(registry, /mobileVideoDefault: false/);
  assert.match(registry, /reducedMotionDefault: "poster"/);
  assert.match(registry, /offscreenDefault: "suspend"/);
  assert.doesNotMatch(background, /videos\/academic|images\/academic/);
  assert.doesNotMatch(runtime, /videos\/academic|images\/academic/);
  assert.match(runtime, /max-width: 768px/);
  assert.match(runtime, /prefers-reduced-motion: reduce/);
  assert.match(runtime, /preload="none"/);
  assert.match(runtime, /document\.hidden/);
  assert.match(css, /\.vnext-media-atmosphere[\s\S]*pointer-events: none/);
  assert.match(registry, /id: "trust"[\s\S]*?videoEligible: true[\s\S]*?idleAssetId: "VID-OPTIC-01"[\s\S]*?resultAssetId: "VID-OPTIC-02"/);
  assert.match(registry, /id: "community"[\s\S]*?videoEligible: true[\s\S]*?maxConcurrentVideos: 1/);
  assert.match(registry, /id: "expert"[\s\S]*?videoEligible: false/);
  assert.match(runtime, /preload="none"/);
});
