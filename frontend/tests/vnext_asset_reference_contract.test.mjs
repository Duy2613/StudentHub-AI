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

test("VNext product surfaces use verified registry media references", () => {
  const landing = read("src/components/landing/VNextLanding.jsx");
  const hero = read("src/components/landing/VNextLandingHero.jsx");
  const trust = read("src/components/trust/TrustWorkspaceClient.jsx");
  const registry = read("src/lib/media/vnextMediaRegistry.js");
  const khaiMinhRuntimeRegistry = read("src/lib/visual/khaiMinhRegistry.ts");
  const khaiMinhRegistry = read("src/lib/media/khaiMinhVisualRegistry.js");

  assert.doesNotMatch(landing, /\/media\/studenthub-vnext\/landing-human/);
  assert.doesNotMatch(trust, /\/media\/studenthub-vnext\/(?:trust-inspection|trust-refraction-inspection)/);
  assert.match(landing, /KhaiMinhMedia[\s\S]*assetId="KM-PRISM-002"/);
  assert.match(hero, /KhaiMinhMedia[\s\S]*assetId="KM-PRISM-001"/);
  assert.match(hero, /assetId="KM-EDITORIAL-001"/);
  assert.match(trust, /KhaiMinhMedia[\s\S]*assetId="KM-PRISM-002"/);

  for (const relativePath of [
    "public/media/khai-minh/landing/km-prism-001-desktop.webp",
    "public/media/khai-minh/landing/km-prism-001-tablet.webp",
    "public/media/khai-minh/landing/km-prism-001-mobile.webp",
    "public/media/khai-minh/landing/km-prism-001-og.webp",
    "public/media/khai-minh/landing/km-editorial-001-desktop.webp",
    "public/media/khai-minh/trust/km-prism-002-desktop.webp",
  ]) {
    assert.equal(fs.existsSync(path.join(frontendRoot, relativePath)), true, relativePath);
  }

  assert.match(registry, /VID-HUMAN-01/);
  assert.match(registry, /\/video\/landing-human-evidence-desktop\.mp4/);
  assert.match(khaiMinhRuntimeRegistry, /KM-PRISM-001/);
  assert.match(khaiMinhRuntimeRegistry, /\.webp/);
  assert.match(khaiMinhRegistry, /const ROOT = "\/media\/khai-minh"/);
  assert.match(khaiMinhRegistry, /id: "KH-LANDING-HERO-01"[\s\S]*stem: "landing\/km-prism-001"/);
});
