import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { fileURLToPath } from "node:url";

const EXPECTED_PROJECT_REF = "bniwtkjtramqaozrrtrk";
const FRONTEND_ROOT = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const STAGING_ENV_PATH = resolve(FRONTEND_ROOT, ".env.staging.local");
const require = createRequire(import.meta.url);

function stop(code) {
  console.error(`LOCAL_STAGING_BLOCKED: ${code}`);
  process.exit(2);
}

function projectRefFromSupabaseUrl(value) {
  try {
    const url = new URL(value);
    return url.hostname.match(/^([a-z0-9]{20})\.supabase\.co$/i)?.[1] || null;
  } catch {
    return null;
  }
}

function databaseTargetsProject(value, projectRef) {
  try {
    const url = new URL(value);
    const username = decodeURIComponent(url.username);
    return url.hostname.toLowerCase() === `db.${projectRef}.supabase.co`
      || (url.hostname.toLowerCase().endsWith(".pooler.supabase.com")
        && username.split(".").includes(projectRef));
  } catch {
    return false;
  }
}

async function reserveLocalPort() {
  for (const port of [3000, 3001, 3002, 3003, 3004, 3005]) {
    const available = await new Promise((resolveResult) => {
      const server = createServer();
      server.once("error", () => resolveResult(false));
      server.listen(port, "127.0.0.1", () => server.close(() => resolveResult(true)));
    });
    if (available) return port;
  }

  return await new Promise((resolvePort, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const port = server.address().port;
      server.close((error) => error ? reject(error) : resolvePort(port));
    });
  });
}

if (!existsSync(STAGING_ENV_PATH)) stop("STAGING_ENV_FILE_MISSING");

const stagingEnv = parseEnv(readFileSync(STAGING_ENV_PATH, "utf8"));
const stageIdentityKeys = Object.keys(stagingEnv).filter((name) =>
  /^(NEXT_PUBLIC_SUPABASE_URL|SUPABASE_URL|DATABASE_URL|NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY|SUPABASE_SECRET_KEY|STUDENTHUB_SESSION_PEPPER|DATABASE_SSL_CA|DATABASE_SSL_REJECT_UNAUTHORIZED)$/.test(name)
);

for (const name of stageIdentityKeys) {
  const inherited = process.env[name];
  if (inherited && inherited !== stagingEnv[name]) stop("AMBIENT_BACKEND_ENV_CONFLICT");
}

for (const [name, value] of Object.entries(stagingEnv)) {
  process.env[name] = value;
}

const stagePublicUrl = stagingEnv.NEXT_PUBLIC_SUPABASE_URL;
if (projectRefFromSupabaseUrl(stagePublicUrl) !== EXPECTED_PROJECT_REF) {
  stop("PUBLIC_SUPABASE_REF_MISMATCH");
}
if (process.env.SUPABASE_URL && projectRefFromSupabaseUrl(process.env.SUPABASE_URL) !== EXPECTED_PROJECT_REF) {
  stop("SERVER_SUPABASE_REF_MISMATCH");
}
if (!databaseTargetsProject(process.env.DATABASE_URL, EXPECTED_PROJECT_REF)) {
  stop("DATABASE_REF_MISMATCH");
}
if (!process.env.STUDENTHUB_SESSION_PEPPER || process.env.STUDENTHUB_SESSION_PEPPER.length < 32) {
  stop("STAGING_SESSION_PEPPER_MISSING");
}

process.env.SUPABASE_URL = stagePublicUrl;
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "";
process.env.SUPABASE_SERVICE_ROLE_KEY = "";
process.env.STUDENTHUB_RLS_TEST_DATABASE_URL = "";
process.env.SUPABASE_ACCESS_TOKEN = "";
process.env.SUPABASE_SECRET_KEY = "";
process.env.TAVILY_API_KEY = "";
process.env.TAVILY_MODE = "OFF";
process.env.TAVILY_MAX_CALLS_PER_RUN = "0";
process.env.STUDENTHUB_STAGING_STORAGE_STATE = "";
process.env.NEXT_PUBLIC_SUPABASE_EMAIL_PASSWORD_AUTH = "";
process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH = "";
process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_VERIFIED = "";
process.env.NEXT_PUBLIC_SUPABASE_GITHUB_AUTH = "";
process.env.NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL = "";
process.env.FRIEND_BACKEND_API_URL = "";
process.env.STUDENTHUB_LAYER2_BASE_URL = "";
process.env.STUDENTHUB_LEGACY_VERIFICATION_BASE_URL = "";
process.env.LEGACY_VERIFICATION_BASE_URL = "";
process.env.NEXT_PUBLIC_API_URL = "";
process.env.STUDENTHUB_BACKEND_URL = "http://127.0.0.1:1";
process.env.NEXT_TELEMETRY_DISABLED = "1";

const port = await reserveLocalPort();
const localOrigin = `http://localhost:${port}`;
process.env.NEXT_PUBLIC_APP_URL = localOrigin;
process.env.NEXT_PUBLIC_API_URL = "";
process.env.STUDENTHUB_STAGING_BASE_URL = localOrigin;

const { loadEnvConfig } = require("@next/env");
loadEnvConfig(FRONTEND_ROOT, true);

if (projectRefFromSupabaseUrl(process.env.NEXT_PUBLIC_SUPABASE_URL) !== EXPECTED_PROJECT_REF) {
  stop("NEXT_EFFECTIVE_PUBLIC_REF_MISMATCH");
}
if (projectRefFromSupabaseUrl(process.env.SUPABASE_URL) !== EXPECTED_PROJECT_REF) {
  stop("NEXT_EFFECTIVE_SERVER_REF_MISMATCH");
}
if (!databaseTargetsProject(process.env.DATABASE_URL, EXPECTED_PROJECT_REF)) {
  stop("NEXT_EFFECTIVE_DATABASE_REF_MISMATCH");
}
if (process.env.TAVILY_MODE !== "OFF"
  || process.env.TAVILY_MAX_CALLS_PER_RUN !== "0"
  || process.env.TAVILY_API_KEY) {
  stop("TAVILY_NOT_DISABLED");
}

const packageJson = JSON.parse(readFileSync(resolve(FRONTEND_ROOT, "package.json"), "utf8"));
if (packageJson.scripts?.dev !== "next dev") stop("UNEXPECTED_DEV_SCRIPT");

let authCapabilities;
try {
  ({ getAuthCapabilities: authCapabilities } = await import("../../src/lib/auth/authCapabilities.js"));
} catch {
  stop("AUTH_CAPABILITY_PREFLIGHT_FAILED");
}
const authState = authCapabilities();

console.log(`LOCAL_STAGING_PREFLIGHT=PASS`);
console.log(`SUPABASE_PROJECT_REF=${EXPECTED_PROJECT_REF}`);
console.log(`SERVER_DATABASE_REF=${EXPECTED_PROJECT_REF}`);
console.log(`SESSION_REPOSITORY=PostgresSessionRepository via staging DATABASE_URL`);
console.log(`LEGACY_API_PROXY=DISABLED`);
console.log(`TAVILY_MODE=OFF TAVILY_MAX_CALLS_PER_RUN=0`);
console.log(`EMAIL_LOGIN_CAPABILITY=${authState.emailPassword}`);
console.log(`GOOGLE_LOGIN_CAPABILITY=${authState.google}`);
console.log(`LOCAL_STUDENTHUB_URL=${localOrigin}`);

const nextBin = require.resolve("next/dist/bin/next");
const child = spawn(process.execPath, [nextBin, "dev", "--hostname", "127.0.0.1", "--port", String(port)], {
  cwd: FRONTEND_ROOT,
  env: process.env,
  stdio: "inherit",
  windowsHide: true,
});

process.on("SIGINT", () => child.kill("SIGINT"));
process.on("SIGTERM", () => child.kill("SIGTERM"));
child.on("error", () => stop("NEXT_DEV_START_FAILED"));
child.on("exit", (code) => process.exit(code ?? 1));
