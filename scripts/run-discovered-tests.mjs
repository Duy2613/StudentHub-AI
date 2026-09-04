import { existsSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { assertStagingEnvironment, EnvironmentSafetyError } from "../frontend/src/lib/security/environment/stagingEnvironment.js";

const liveStagingMode = process.env.STUDENTHUB_LIVE_STAGING_TESTS === "1";
if (liveStagingMode) {
  const stagingEnvFile = process.env.STUDENTHUB_STAGING_ENV_FILE;
  if (!stagingEnvFile || !existsSync(stagingEnvFile)) {
    console.error("STAGING_LOCAL_SECRETS_REQUIRED: live tests require STUDENTHUB_STAGING_ENV_FILE pointing to an existing explicit staging env file.");
    process.exit(2);
  }
  try {
    assertStagingEnvironment({
      databaseEnvNames: ["DATABASE_URL", "STUDENTHUB_RLS_TEST_DATABASE_URL"],
      requireDatabase: true,
      requireLiveOptIn: true,
      command: "discovered live staging tests",
    });
  } catch (error) {
    if (error instanceof EnvironmentSafetyError) {
      console.error(`[ENV_GUARD] BLOCKED: ${error.code}: ${error.message}`);
    } else {
      console.error("[ENV_GUARD] BLOCKED: live test environment inspection failed closed.");
    }
    process.exit(2);
  }
}

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
const extensionLoader = pathToFileURL(join(root, "foundation", "ts-extension-loader.mjs")).href;
const inheritedNodeOptions = process.env.NODE_OPTIONS || "";
const childNodeOptions = inheritedNodeOptions.includes("ts-extension-loader.mjs")
  ? inheritedNodeOptions
  : `${inheritedNodeOptions} --loader ${extensionLoader}`.trim();
const childEnv = { ...process.env, NODE_OPTIONS: childNodeOptions, NODE_ENV: "test", STUDENTHUB_TEST_RUNNER: "1" };

if (!liveStagingMode) {
  // Pure tests must not inherit a developer's local database, Supabase,
  // service-role, session, or external-provider configuration. Live gates then
  // see the variables as absent and remain offline by default.
  for (const name of [
    "DATABASE_URL",
    "STUDENTHUB_RLS_TEST_DATABASE_URL",
    "DATABASE_SSL_CA",
    "SUPABASE_SERVICE_ROLE_KEY",
    "STUDENTHUB_SESSION_PEPPER",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_ANON_KEY",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
    "NEXT_PUBLIC_API_URL",
    "STUDENTHUB_BACKEND_URL",
    "STUDENTHUB_LAYER2_BASE_URL",
    "STUDENTHUB_LEGACY_VERIFICATION_BASE_URL",
    "LEGACY_VERIFICATION_BASE_URL",
    "OPENAI_API_KEY",
    "OPENAI_BASE_URL",
    "GEMINI_API_KEY",
    "GENSPARK_TOKEN",
    "GENSPARK_BASE_URL",
    "STUDENTHUB_STAGING_BASE_URL",
    "STUDENTHUB_STAGING_CASES_PATH",
    "STUDENTHUB_STAGING_STORAGE_STATE",
    "STUDENTHUB_STAGING_ENV_FILE",
    "STUDENTHUB_LIVE_STAGING_TESTS",
  ]) {
    delete childEnv[name];
  }
}

for (const test of tests) {
  const label = relative(process.cwd(), test);
  const result = spawnSync(process.execPath, [test], { stdio: "inherit", env: childEnv });
  if (result.status !== 0) {
    console.error(`\n[QUALITY_GATE] FAILED: ${label}`);
    process.exit(result.status || 1);
  }
  passed += 1;
}

const scope = requestedPatterns.length ? "selected" : "discovered";
console.log(`\n[QUALITY_GATE] PASS: ${passed}/${tests.length} ${scope} test files`);
