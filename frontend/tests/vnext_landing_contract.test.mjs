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

test("canonical landing composes the V3 evidence world and verified media", () => {
  const page = read("src/app/page.jsx");
  const landing = read("src/components/landing/EvidenceWorldLanding.jsx");
  const hero = read("src/components/cinematic/HeroCinematicPorch.jsx");
  const registry = read("src/lib/media/v3MediaRegistry.js");

  assert.match(page, /EvidenceWorldLanding/);
  assert.doesNotMatch(page, /VNextLanding/);
  assert.match(hero, /V3_MEDIA\.landing\.hero\.video/);
  assert.match(hero, /V3_MEDIA\.landing\.hero\.poster/);
  assert.match(hero, /EvidencePrism3D/);
  assert.match(hero, /href="\/trust"/);
  for (const section of [
    "NoiseToSignalSection",
    "CinematicReelStage",
    "TrustCinematicJourney",
    "WhyZeroManifestoSection",
    "KnowledgeAtlasSection",
    "VerifiedHumanAiSection",
    "CollectiveCommunitySection",
    "ExpertAuthoritySection",
    "FinalClaritySection",
  ]) {
    assert.match(landing, new RegExp(section));
  }
  assert.match(registry, /landing:\s*Object\.freeze/);
  assert.match(registry, /hero-main\.mp4/);
  assert.match(registry, /trust-transform\.mp4/);
});
