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

test("VNext public navigation does not promote the retired learning product", () => {
  const navbar = read("src/components/layout/AcademicNavbar.jsx");
  const canonicalNavigation = read("src/components/layout/navigationConfig.js");
  const searchProviders = read("src/lib/search/searchProviders.js");
  const commandPalette = read("src/components/command/AcademicCommandPalette.jsx");
  const home = read("src/app/page.jsx");

  for (const source of [navbar, canonicalNavigation, searchProviders, commandPalette, home]) {
    assert.doesNotMatch(source, /LEARNING_NAV_ITEMS|category:\s*["'](?:Courses|Lessons|Practice|Projects)["']/);
  }

  assert.doesNotMatch(navbar, /href=["']\/(?:learn|roadmap|practice|projects)/);
  assert.doesNotMatch(searchProviders, /href:\s*["']\/(?:learn|roadmap|practice|projects)/);
  assert.doesNotMatch(home, /ContinueLearningBar|href=["']\/learn/);
});

test("CUT-2 retires legacy learning routes through redirects without deleting shared data", () => {
  const retiredRoutes = [
    "src/app/learn/page.jsx",
    "src/app/learn/[courseId]/[lessonId]/page.jsx",
    "src/app/practice/page.jsx",
    "src/app/projects/page.jsx",
    "src/app/quests/page.jsx",
    "src/app/roadmap/page.jsx",
  ];

  for (const route of retiredRoutes) {
    const source = read(route);
    assert.match(source, /from ["']next\/navigation["']/);
    assert.match(source, /redirect\(["'][^"']+["']\)/);
    assert.doesNotMatch(source, /delete|drop|truncate|remove.*course|lesson.*delete/i);
  }
});
