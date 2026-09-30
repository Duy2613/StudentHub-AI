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

test("CUT-2 applies each retired learning route's explicit not-found or replacement disposition", () => {
  const retiredRoutes = [
    ["src/app/learn/page.jsx", "notFound"],
    ["src/app/learn/[courseId]/[lessonId]/page.jsx", "notFound"],
    ["src/app/practice/page.jsx", "notFound"],
    ["src/app/projects/page.jsx", "redirect"],
    ["src/app/quests/page.jsx", "notFound"],
    ["src/app/roadmap/page.jsx", "notFound"],
  ];

  for (const [route, disposition] of retiredRoutes) {
    const source = read(route);
    assert.match(source, /from ["']next\/navigation["']/);
    if (disposition === "redirect") {
      assert.match(source, /\bredirect\(["'][^"']+["']\)/);
    } else {
      assert.match(source, /\bnotFound\(\)/);
    }
    assert.doesNotMatch(source, /delete|drop|truncate|remove.*course|lesson.*delete/i);
  }
});
