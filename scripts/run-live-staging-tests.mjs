import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  assertStagingEnvironment,
  EnvironmentSafetyError,
} from "../frontend/src/lib/security/environment/stagingEnvironment.js";

const repositoryRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const configuredEnvFile = process.env.STUDENTHUB_STAGING_ENV_FILE || "frontend/.env.staging.local";
const stagingEnvFile = resolve(repositoryRoot, configuredEnvFile);

// Node's dotenv loader does not overwrite an already-defined process.env
// value. Clear connection and authority inputs before loading the explicit
// staging file so an inherited production shell cannot win over staging.
const stagingControlledNames = [
  "DATABASE_URL",
  "STUDENTHUB_RLS_TEST_DATABASE_URL",
  "DATABASE_SSL",
  "DATABASE_SSL_CA",
  "DATABASE_SSL_REJECT_UNAUTHORIZED",
  "DATABASE_POOL_MAX",
  "NEXT_PUBLIC_SUPABASE_URL",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_SECRET_KEY",
  "SUPABASE_JWT_SECRET",
  "SUPABASE_JWT_AUDIENCE",
  "STUDENTHUB_SESSION_PEPPER",
  "STUDENTHUB_BACKEND_URL",
  "NEXT_PUBLIC_API_URL",
  "STUDENTHUB_STAGING_BASE_URL",
  "STUDENTHUB_STAGING_CASES_PATH",
  "STUDENTHUB_STAGING_STORAGE_STATE",
  "STUDENTHUB_SCREENSHOT_STORAGE_BUCKET",
];

if (!existsSync(stagingEnvFile)) {
  console.error("STAGING_LOCAL_SECRETS_REQUIRED: create an untracked frontend/.env.staging.local with approved staging-only credentials.");
  console.error("Required operator inputs: canonical staging Supabase URL/key, staging DATABASE_URL, session pepper, private bucket, and test-user fixtures.");
  console.error("Do not copy values from frontend/.env.local; it is production-bound. Never run this command with production credentials.");
  process.exit(2);
}

if (typeof process.loadEnvFile !== "function") {
  console.error("STAGING_LOCAL_SECRETS_REQUIRED: Node.js process.loadEnvFile is unavailable; use the repository Node 24 toolchain.");
  process.exit(2);
}

try {
  for (const name of stagingControlledNames) delete process.env[name];
  process.loadEnvFile(stagingEnvFile);
  process.env.STUDENTHUB_STAGING_ENV_FILE = stagingEnvFile;
  process.env.STUDENTHUB_LIVE_STAGING_TESTS = "1";
  process.env.STUDENTHUB_TEST_RUNNER = "1";
  process.env.NODE_ENV = "test";

  assertStagingEnvironment({
    databaseEnvNames: ["DATABASE_URL", "STUDENTHUB_RLS_TEST_DATABASE_URL"],
    requireDatabase: true,
    requireLiveOptIn: true,
    command: "live staging test",
  });
} catch (error) {
  if (error instanceof EnvironmentSafetyError) {
    console.error(`[ENV_GUARD] BLOCKED: ${error.code}: ${error.message}`);
  } else {
    console.error("[ENV_GUARD] BLOCKED: staging env file could not be loaded safely.");
  }
  process.exit(2);
}

const forwarded = process.argv.slice(2);
const result = spawnSync(
  process.execPath,
  ["scripts/run-discovered-tests.mjs", ...forwarded],
  { cwd: repositoryRoot, env: process.env, stdio: "inherit" },
);
process.exit(result.status ?? 1);
