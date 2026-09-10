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
  const khaiMinhRegistry = read("src/lib/media/khaiMinhVisualRegistry.js");

  assert.doesNotMatch(landing, /\/media\/studenthub-vnext\/landing-human/);
  assert.doesNotMatch(trust, /\/media\/studenthub-vnext\/(?:trust-inspection|trust-refraction-inspection)/);
  assert.match(landing, /VNextMediaFrame[\s\S]*assetId="VID-HUMAN-01"/);
  assert.match(hero, /KhaiMinhImage[\s\S]*assetId="KH-LANDING-HERO-01"/);
  assert.match(trust, /VerifiedPoster[\s\S]*assetId="VID-OPTIC-01"/);

  for (const relativePath of [
    "public/media/home/home-campus-atlas.webm",
    "public/media/home/home-campus-atlas-mobile.webm",
    "public/media/home/home-campus-atlas-poster.avif",
    "public/media/khai-minh/landing-hero-desktop.avif",
    "public/media/khai-minh/landing-hero-mobile.avif",
    "public/media/studenthub-vnext/posters/landing-human-evidence-desktop.webp",
    "public/media/trust/trust-evidence-specimen.avif",
    "public/media/trust/trust-evidence-specimen-mobile.avif",
  ]) {
    assert.equal(fs.existsSync(path.join(frontendRoot, relativePath)), true, relativePath);
  }

  assert.match(registry, /\/media\/home\/home-campus-atlas\.webm/);
  assert.match(registry, /\/video\/landing-human-evidence-desktop\.mp4/);
  assert.match(registry, /\/media\/trust\/trust-evidence-specimen\.avif/);
  assert.match(khaiMinhRegistry, /const ROOT = "\/media\/khai-minh"/);
  assert.match(khaiMinhRegistry, /id: "KH-LANDING-HERO-01"[\s\S]*stem: "landing-hero"/);
});
