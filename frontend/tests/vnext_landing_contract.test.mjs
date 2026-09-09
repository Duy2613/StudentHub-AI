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

test("VNext landing is static-first, chapter-complete and route-aware", () => {
  const page = read("src/app/page.jsx");
  const landing = read("src/components/landing/VNextLanding.jsx");
  const hero = read("src/components/landing/VNextLandingHero.jsx");
  const registry = read("src/lib/media/vnextMediaRegistry.js");

  assert.match(page, /VNextLanding/);
  assert.doesNotMatch(page, /ContinueLearningBar|InteractiveKnowledgeAtlas|\/learn/);
  assert.match(hero, /Hiểu đúng\.[\s\S]*Đi xa\./);
  assert.match(hero, /VID-PRISM-01/);
  assert.doesNotMatch(hero, /<video/);
  assert.match(landing, /trust-chapter/);
  assert.match(landing, /evidence-chapter/);
  assert.match(landing, /ai-chapter/);
  assert.match(landing, /community-expert-chapter/);
  assert.match(landing, /safe-action-chapter/);
  assert.match(landing, /VID-HUMAN-01/);
  assert.match(registry, /id: "landing"[\s\S]*?videoEligible: true/);
  assert.match(registry, /transitionAssetId: "VID-PRISM-03"[\s\S]*?transitionMaxPlays: 2/);
  assert.match(registry, /transitionVideoEligible: false/);
});
