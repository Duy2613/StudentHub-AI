import { readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const root = join(process.cwd(), "frontend", "tests");
const classificationManifest = JSON.parse(readFileSync(join(root, "test-scope-classification.json"), "utf8"));

function normalizePath(value) {
  return String(value || "").replaceAll("\\", "/").replace(/^\.\//, "");
}

function collect(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const target = join(dir, entry.name);
    if (entry.isDirectory()) return collect(target);
    return entry.isFile() && entry.name.endsWith(".test.mjs") ? [target] : [];
  });
}

const allTests = collect(root).sort();
const includeRemoved = process.argv.includes("--include-removed");
const requestedPatterns = process.argv.slice(2)
  .filter((argument) => argument !== "--include-removed")
  .filter((argument) => argument && !argument.startsWith("-"))
  .map(normalizePath);

const tests = requestedPatterns.length
  ? allTests.filter((test) => {
      const label = normalizePath(relative(process.cwd(), test));
      return requestedPatterns.some((pattern) =>
        label === pattern || label.endsWith(`/${pattern}`)
      );
    })
  : allTests;

if (!allTests.length) {
  console.error("[QUALITY_GATE] No test files discovered.");
  process.exit(1);
}
if (!tests.length) {
  console.error(`[QUALITY_GATE] No tests matched: ${requestedPatterns.join(", ")}`);
  process.exit(1);
}

function classifyTest(testPath) {
  const relativeTest = normalizePath(relative(root, testPath));
  const explicit = classificationManifest.explicit?.[relativeTest];
  if (explicit) return explicit;
  const rule = classificationManifest.pathRules.find(({ prefix }) => relativeTest.startsWith(prefix));
  return rule || {
    classification: classificationManifest.defaultClassification,
    reason: "No product-scope evidence has been recorded for this file.",
  };
}

function printScopeCounts(label, testFiles) {
  const counts = Object.fromEntries(classificationManifest.categories.map((category) => [category, 0]));
  for (const testFile of testFiles) counts[classifyTest(testFile).classification] += 1;
  console.log(`[QUALITY_GATE] TEST_SCOPE_COUNTS (${label}): ${classificationManifest.categories.map((category) => `${category}=${counts[category]}`).join(" ")}`);
}

printScopeCounts("discovered", allTests);
if (requestedPatterns.length) printScopeCounts("selected", tests);

const removedFeatureTests = tests.filter((testFile) => classifyTest(testFile).classification === "REMOVED_FEATURE_TEST");
if (!includeRemoved) {
  for (const testFile of removedFeatureTests) {
    const classification = classifyTest(testFile);
    console.log(`[QUALITY_GATE] SKIPPED_REMOVED_FEATURE_TEST: ${normalizePath(relative(root, testFile))} feature=${classification.featureId} reason=${classification.reason}`);
  }
}
const runnableTests = includeRemoved
  ? tests
  : tests.filter((testFile) => classifyTest(testFile).classification !== "REMOVED_FEATURE_TEST");
console.log(`[QUALITY_GATE] REMOVED_FEATURE_TESTS_SKIPPED=${includeRemoved ? 0 : removedFeatureTests.length}${includeRemoved ? " (included by --include-removed)" : ""}`);

let passed = 0;
let blockedByExternalGate = 0;
const extensionLoader = pathToFileURL(join(root, "foundation", "ts-extension-loader.mjs")).href;
const childNodeOptions = `--loader ${extensionLoader}`;

// Pass only process/runtime settings. A denylist misses aliases such as
// OPEN_AI_KEY_1, and deleting a credential from process.env is insufficient
// when canonicalEnv can load it again from .env.local in the child.
const RUNTIME_ENV_KEYS = new Set([
  "path", "pathext", "systemroot", "windir", "comspec", "temp", "tmp",
  "tmpdir", "userprofile", "home", "homedrive", "homepath", "appdata",
  "localappdata", "programdata", "lang", "lc_all", "ci", "python",
]);
const childEnv = Object.fromEntries(
  Object.entries(process.env).filter(([key]) => RUNTIME_ENV_KEYS.has(key.toLowerCase()))
);
childEnv.NODE_ENV = "test";
childEnv.NODE_OPTIONS = childNodeOptions;
childEnv.STUDENTHUB_HERMETIC_TEST_MODE = "1";

// These suites intentionally prove live public-web/provider behavior. They
// must not be silently turned into synthetic PASS results when the external
// dependency is offline or quota-blocked. Run them explicitly with
// STUDENTHUB_ALLOW_EXTERNAL_LIVE_TESTS=1 when that external evidence is
// authorized and available; otherwise record them as blocked and continue
// the hermetic regression so unrelated local gates still get a result.
const externalGateTests = new Set([
  "frontend/tests/evidence/live_web_retrieval.test.mjs",
  "frontend/tests/evidence/real_world_live_search_golden_flow.test.mjs",
  "frontend/tests/expert/expert_v5_live_readonly.test.mjs",
]);
const allowExternalLiveTests = process.env.STUDENTHUB_ALLOW_EXTERNAL_LIVE_TESTS === "1";

for (const test of runnableTests) {
  const label = relative(process.cwd(), test);
  if (!allowExternalLiveTests && externalGateTests.has(normalizePath(label))) {
    console.error(`[QUALITY_GATE] BLOCKED_BY_EXTERNAL_GATE: ${label}`);
    blockedByExternalGate += 1;
    continue;
  }
  const result = spawnSync(process.execPath, [test], { stdio: "inherit", env: childEnv });
  if (result.status !== 0) {
    console.error(`\n[QUALITY_GATE] FAILED: ${label}`);
    process.exit(result.status || 1);
  }
  passed += 1;
}

const scope = requestedPatterns.length ? "selected" : "discovered";
console.log(`\n[QUALITY_GATE] PASS: ${passed}/${runnableTests.length} ${scope} test files`);
console.log(`[QUALITY_GATE] BLOCKED_BY_EXTERNAL_GATE: ${blockedByExternalGate} test files`);
