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

  assert.doesNotMatch(landing, /\/media\/studenthub-vnext\/landing-human/);
  assert.doesNotMatch(trust, /\/media\/studenthub-vnext\/(?:trust-inspection|trust-refraction-inspection)/);
  assert.match(landing, /VNextMediaFrame[\s\S]*assetId="VID-HUMAN-01"/);
  assert.match(hero, /VerifiedPoster[\s\S]*assetId="VID-PRISM-01"/);
  assert.match(trust, /VerifiedPoster[\s\S]*assetId="VID-OPTIC-01"/);

  for (const relativePath of [
    "public/media/studenthub-vnext/posters/landing-prism-atmosphere-desktop.webp",
    "public/media/studenthub-vnext/posters/landing-human-evidence-desktop.webp",
    "public/media/studenthub-vnext/posters/trust-refraction-inspection-desktop.webp",
  ]) {
    assert.equal(fs.existsSync(path.join(frontendRoot, relativePath)), true, relativePath);
  }

  assert.match(registry, /\/video\/landing-human-evidence-desktop\.mp4/);
  assert.match(registry, /\/video\/trust-refraction-inspection-desktop\.mp4/);
});
