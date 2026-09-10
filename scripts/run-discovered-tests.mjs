import { readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { createRequire } from "node:module";

const frontendDir = join(process.cwd(), "frontend");
const frontendRequire = createRequire(join(frontendDir, "package.json"));
try {
  const { loadEnvConfig } = frontendRequire("@next/env");
  loadEnvConfig(frontendDir);
} catch {}

const root = join(process.cwd(), "frontend", "tests");

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
const requestedPatterns = process.argv.slice(2)
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

let passed = 0;
let blockedByExternalGate = 0;
const extensionLoader = pathToFileURL(join(root, "foundation", "ts-extension-loader.mjs")).href;
const inheritedNodeOptions = process.env.NODE_OPTIONS || "";
const childNodeOptions = inheritedNodeOptions.includes("ts-extension-loader.mjs")
  ? inheritedNodeOptions
  : `${inheritedNodeOptions} --loader ${extensionLoader}`.trim();

// The discovered suite is a hermetic software/validation gate. It may load
// `.env` to exercise local configuration parsing, but it must never inherit
// live provider/database/remote-service credentials. Otherwise a synthetic
// benchmark can turn into hundreds of external LLM requests, or a DB gate can
// mutate a non-disposable environment. Provider behavior is covered by
// injected fakes; explicitly-scoped live evidence uses a separate command and
// report.
const childEnv = { ...process.env, NODE_OPTIONS: childNodeOptions };
for (const key of [
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "GEMINI_API_KEY",
  "GOOGLE_GENERATIVE_AI_API_KEY",
  "DATABASE_URL",
  "STUDENTHUB_RLS_TEST_DATABASE_URL",
  "STUDENTHUB_LABBE_TEST_DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "STUDENTHUB_LABBE_BASE_URL",
  "STUDENTHUB_LABBE_TOKEN",
  "STUDENTHUB_LABBE_SCOPE",
]) {
  delete childEnv[key];
}

// These suites intentionally prove live public-web/provider behavior. They
// must not be silently turned into synthetic PASS results when the external
// dependency is offline or quota-blocked. Run them explicitly with
// STUDENTHUB_ALLOW_EXTERNAL_LIVE_TESTS=1 when that external evidence is
// authorized and available; otherwise record them as blocked and continue
// the hermetic regression so unrelated local gates still get a result.
const externalGateTests = new Set([
  "frontend/tests/evidence/live_web_retrieval.test.mjs",
  "frontend/tests/evidence/real_world_live_search_golden_flow.test.mjs",
]);
const allowExternalLiveTests = process.env.STUDENTHUB_ALLOW_EXTERNAL_LIVE_TESTS === "1";

for (const test of tests) {
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
console.log(`\n[QUALITY_GATE] PASS: ${passed}/${tests.length} ${scope} test files`);
console.log(`[QUALITY_GATE] BLOCKED_BY_EXTERNAL_GATE: ${blockedByExternalGate} test files`);
