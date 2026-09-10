import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(fileURLToPath(new URL("..", import.meta.url)));
const localProjectRoot = resolve(repoRoot, "..", "studenthub-local-supabase");
const localConfigPath = resolve(localProjectRoot, "supabase", "config.toml");
const localAuthContainer = "supabase_auth_studenthub-local-supabase";
const loopbackHosts = new Set(["127.0.0.1", "localhost", "::1"]);

function readConfigPort(name, fallback) {
  if (!existsSync(localConfigPath)) return fallback;
  const config = readFileSync(localConfigPath, "utf8");
  const section = String(name).split(".")[0];
  const match = config.match(new RegExp(`\\[${section}\\][\\s\\S]*?^\\s*port\\s*=\\s*(\\d+)\\s*$`, "m"));
  return match ? Number(match[1]) : fallback;
}

function dockerEnv() {
  const output = execFileSync("docker", [
    "inspect",
    "--format",
    "{{range .Config.Env}}{{println .}}{{end}}",
    localAuthContainer,
  ], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return Object.fromEntries(output.split(/\r?\n/).filter(Boolean).map((line) => {
    const index = line.indexOf("=");
    return index > 0 ? [line.slice(0, index), line.slice(index + 1)] : [line, ""];
  }));
}

function base64url(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signLocalJwt(payload, secret) {
  const header = base64url({ alg: "HS256", typ: "JWT" });
  const body = base64url(payload);
  const signed = `${header}.${body}`;
  const signature = crypto.createHmac("sha256", secret).update(signed).digest("base64url");
  return `${signed}.${signature}`;
}

function localKey(role, secret, projectId) {
  const now = Math.floor(Date.now() / 1000);
  return signLocalJwt({
    iss: "supabase",
    ref: projectId,
    role,
    aud: "authenticated",
    iat: now,
    exp: now + 3600,
  }, secret);
}

export function assertLoopbackUrl(value, label = "local URL") {
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error(`${label} is not a valid URL.`);
  }
  if (!loopbackHosts.has(parsed.hostname.toLowerCase())) {
    throw new Error(`${label} is not loopback.`);
  }
  return parsed;
}

export function getLocalSupabaseRuntime() {
  const authEnv = dockerEnv();
  const jwtSecret = authEnv.GOTRUE_JWT_SECRET;
  if (!jwtSecret || jwtSecret.length < 32) throw new Error("LOCAL_AUTH_JWT_SECRET_UNAVAILABLE");

  const projectId = authEnv.GOTRUE_SITE_URL?.includes("studenthub-local-supabase")
    ? "studenthub-local-supabase"
    : "studenthub-local-supabase";
  const apiPort = readConfigPort("api.port", 56021);
  const dbPort = readConfigPort("db.port", 55432);
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const fallbackDbUrl = `postgresql://postgres:postgres@127.0.0.1:${dbPort}/postgres`;
  // The canonical process may already contain Main's RLS URL because the
  // repository deliberately keeps frontend/.env.local pointed at Main. Never
  // inherit a non-loopback value into a disposable local run.
  let dbUrl = fallbackDbUrl;
  try {
    const configuredDbUrl = process.env.STUDENTHUB_RLS_TEST_DATABASE_URL;
    if (configuredDbUrl && loopbackHosts.has(new URL(configuredDbUrl).hostname.toLowerCase())) dbUrl = configuredDbUrl;
  } catch {
    dbUrl = fallbackDbUrl;
  }
  assertLoopbackUrl(apiUrl, "LOCAL_API_URL");
  const dbIdentity = new URL(dbUrl);
  if (!loopbackHosts.has(dbIdentity.hostname.toLowerCase())) throw new Error("LOCAL_DB_URL_IS_NOT_LOOPBACK");

  return Object.freeze({
    projectId,
    apiUrl,
    dbUrl,
    dbHost: dbIdentity.hostname,
    dbPort: Number(dbIdentity.port || dbPort),
    jwtIssuer: "supabase",
    jwtAudience: "authenticated",
    jwtSecret,
    anonKey: localKey("anon", jwtSecret, projectId),
    serviceRoleKey: localKey("service_role", jwtSecret, projectId),
  });
}

export async function probeLocalAuth(runtime) {
  assertLoopbackUrl(runtime.apiUrl, "LOCAL_API_URL");
  const target = `${runtime.apiUrl}/auth/v1/settings`;
  const response = await fetch(target, {
    method: "GET",
    redirect: "manual",
    headers: {
      apikey: runtime.anonKey,
      authorization: `Bearer ${runtime.anonKey}`,
    },
  });
  if (!response.url.startsWith(runtime.apiUrl)) throw new Error("LOCAL_AUTH_PROBE_REDIRECTED");
  if (!response.ok) throw new Error(`LOCAL_AUTH_PROBE_FAILED_${response.status}`);
  return { endpointClass: "LOCAL_LOOPBACK", status: response.status };
}

export async function localAuthAdminCreate(runtime, { email, password, userMetadata = {} }) {
  assertLoopbackUrl(runtime.apiUrl, "LOCAL_API_URL");
  const response = await fetch(`${runtime.apiUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      apikey: runtime.serviceRoleKey,
      authorization: `Bearer ${runtime.serviceRoleKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password, email_confirm: true, user_metadata: userMetadata }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(body.msg || body.message || body.error_description || `LOCAL_AUTH_ADMIN_CREATE_FAILED_${response.status}`);
    error.status = response.status;
    error.code = body.code || body.error_code;
    throw error;
  }
  return body;
}

export async function localAuthAdminDelete(runtime, userId) {
  assertLoopbackUrl(runtime.apiUrl, "LOCAL_API_URL");
  const response = await fetch(`${runtime.apiUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: {
      apikey: runtime.serviceRoleKey,
      authorization: `Bearer ${runtime.serviceRoleKey}`,
    },
  });
  if (!response.ok && response.status !== 404) throw new Error(`LOCAL_AUTH_ADMIN_DELETE_FAILED_${response.status}`);
}

export async function localPasswordGrant(runtime, { email, password }) {
  assertLoopbackUrl(runtime.apiUrl, "LOCAL_API_URL");
  const response = await fetch(`${runtime.apiUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      apikey: runtime.anonKey,
      "content-type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.access_token) throw new Error(body.msg || body.error_description || `LOCAL_AUTH_PASSWORD_GRANT_FAILED_${response.status}`);
  return body;
}

export function localRuntimeEnv(runtime, overrides = {}) {
  return {
    ...process.env,
    NODE_ENV: "test",
    STUDENTHUB_LOCAL_E2E: "1",
    STUDENTHUB_LOCAL_E2E_API_ORIGIN: runtime.apiUrl,
    STUDENTHUB_LOCAL_JWT_SECRET: runtime.jwtSecret,
    SUPABASE_JWT_ISSUER: runtime.jwtIssuer,
    SUPABASE_JWT_AUDIENCE: runtime.jwtAudience,
    NEXT_PUBLIC_SUPABASE_URL: runtime.apiUrl,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: runtime.anonKey,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: runtime.anonKey,
    SUPABASE_URL: runtime.apiUrl,
    SUPABASE_SERVICE_ROLE_KEY: runtime.serviceRoleKey,
    DATABASE_URL: runtime.dbUrl,
    STUDENTHUB_RLS_TEST_DATABASE_URL: runtime.dbUrl,
    DATABASE_SSL: "disable",
    DATABASE_SSL_REJECT_UNAUTHORIZED: "false",
    STUDENTHUB_DISPOSABLE_DB_ACK: "I_UNDERSTAND_DISPOSABLE_DB_ONLY",
    ...overrides,
  };
}

export function assertMainAndLocalDistinct({ mainApiUrl, mainDbUrl, runtime }) {
  const localApi = assertLoopbackUrl(runtime.apiUrl, "LOCAL_API_URL");
  const localDb = new URL(runtime.dbUrl);
  if (String(mainApiUrl || "").replace(/\/$/, "") === runtime.apiUrl.replace(/\/$/, "")) throw new Error("MAIN_AND_LOCAL_API_COLLIDE");
  if (String(mainDbUrl || "") === runtime.dbUrl) throw new Error("MAIN_AND_LOCAL_DB_COLLIDE");
  return {
    mainApiHost: mainApiUrl ? new URL(mainApiUrl).hostname : "unknown",
    localApiHost: localApi.hostname,
    localApiPort: Number(localApi.port),
    localDbHost: localDb.hostname,
    localDbPort: Number(localDb.port),
  };
}
