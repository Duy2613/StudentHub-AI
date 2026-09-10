import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdir, writeFile } from "node:fs/promises";
import { canonicalEnv } from "../frontend/src/lib/server/env/canonicalEnv.js";

const LOCAL_API = "http://127.0.0.1:56021";
const CONTAINER = "supabase_storage_studenthub-local-supabase";
const BUCKET = "trust-screenshots-private";
const ACK = "I_UNDERSTAND_DISPOSABLE_DB_ONLY";

if (process.env.STUDENTHUB_DISPOSABLE_DB_ACK !== ACK) {
  throw new Error("DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV");
}

const testUrl = new URL(canonicalEnv.RLS_TEST_DATABASE_URL);
const host = testUrl.hostname.toLowerCase();
if (!["127.0.0.1", "localhost", "::1"].includes(host)) {
  throw new Error("DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV: test database is not loopback");
}
if (canonicalEnv.DATABASE_URL === canonicalEnv.RLS_TEST_DATABASE_URL) {
  throw new Error("DISPOSABLE_DB_BLOCKED_BY_LOCAL_ENV: test database equals main database");
}

function dockerEnv(container) {
  const raw = execFileSync("docker", ["inspect", "--format", "{{json .Config.Env}}", container], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trim();
  const entries = JSON.parse(raw);
  return Object.fromEntries(entries.map((entry) => {
    const index = entry.indexOf("=");
    return [entry.slice(0, index), entry.slice(index + 1)];
  }));
}

const localEnv = dockerEnv(CONTAINER);
const anonKey = localEnv.ANON_KEY;
const serviceKey = localEnv.SERVICE_KEY;
if (!anonKey || !serviceKey) {
  throw new Error("LOCAL_SUPABASE_STORAGE_KEYS_UNAVAILABLE");
}

const results = [];
const users = [];
let objectPath = null;
const bytes = Buffer.from("studenthub-local-private-storage-assurance-v1\n", "utf8");
const sha256 = crypto.createHash("sha256").update(bytes).digest("hex");

function authHeaders(key, token = null) {
  return {
    apikey: key,
    Authorization: `Bearer ${token ?? key}`
  };
}

async function request(path, options = {}) {
  const response = await fetch(`${LOCAL_API}${path}`, options);
  const body = await response.text();
  let parsed = body;
  try {
    parsed = body ? JSON.parse(body) : null;
  } catch {
    // Keep binary/text responses as-is; only status is asserted below.
  }
  return { response, body: parsed };
}

async function createUser(index) {
  const email = `studenthub-local-storage-${Date.now()}-${index}@studenthub.local`;
  const password = `LocalStorage-${crypto.randomUUID()}-Aa1!`;
  const created = await request("/auth/v1/admin/users", {
    method: "POST",
    headers: { ...authHeaders(serviceKey), "content-type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true })
  });
  if (!created.response.ok || !created.body?.id) {
    throw new Error(`LOCAL_AUTH_USER_CREATE_FAILED:${created.response.status}`);
  }
  users.push({ id: created.body.id, email, password });
  const signedIn = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anonKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  if (!signedIn.response.ok || !signedIn.body?.access_token) {
    throw new Error(`LOCAL_AUTH_SIGN_IN_FAILED:${signedIn.response.status}`);
  }
  return { id: created.body.id, token: signedIn.body.access_token };
}

try {
  const owner = await createUser(1);
  const other = await createUser(2);
  objectPath = `${owner.id}/${crypto.randomUUID()}.png`;
  const upload = await request(`/storage/v1/object/${BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      ...authHeaders(anonKey, owner.token),
      "content-type": "image/png",
      "x-upsert": "false"
    },
    body: bytes
  });
  results.push({ check: "authenticated_upload", status: upload.response.status, pass: upload.response.ok });
  if (!upload.response.ok) throw new Error(`LOCAL_STORAGE_UPLOAD_FAILED:${upload.response.status}:${JSON.stringify(upload.body)}`);

  const ownerRead = await request(`/storage/v1/object/authenticated/${BUCKET}/${objectPath}`, {
    headers: authHeaders(anonKey, owner.token)
  });
  results.push({ check: "owner_download", status: ownerRead.response.status, pass: ownerRead.response.ok && ownerRead.body === bytes.toString("utf8") });
  if (!ownerRead.response.ok) throw new Error(`LOCAL_STORAGE_OWNER_READ_FAILED:${ownerRead.response.status}:${JSON.stringify(ownerRead.body)}`);

  const otherRead = await request(`/storage/v1/object/authenticated/${BUCKET}/${objectPath}`, {
    headers: authHeaders(anonKey, other.token)
  });
  const otherDenied = [400, 401, 403, 404].includes(otherRead.response.status);
  results.push({ check: "non_owner_denied", status: otherRead.response.status, pass: otherDenied });
  if (!otherDenied) throw new Error(`LOCAL_STORAGE_NON_OWNER_ALLOWED:${otherRead.response.status}`);

  const anonymousRead = await request(`/storage/v1/object/${BUCKET}/${objectPath}`);
  const anonymousDenied = [400, 401, 403, 404].includes(anonymousRead.response.status);
  results.push({ check: "anonymous_denied", status: anonymousRead.response.status, pass: anonymousDenied });
  if (!anonymousDenied) throw new Error(`LOCAL_STORAGE_ANONYMOUS_ALLOWED:${anonymousRead.response.status}`);

  const metadata = await request(`/rest/v1/screenshot_objects`, {
    method: "POST",
    headers: { ...authHeaders(serviceKey), "content-type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify({
      owner_id: owner.id,
      bucket_id: BUCKET,
      object_key: objectPath,
      mime_type: "image/png",
      byte_size: bytes.length,
      sha256: `\\x${sha256}`
    })
  });
  results.push({ check: "server_metadata_insert", status: metadata.response.status, pass: metadata.response.ok });
  if (!metadata.response.ok) throw new Error(`LOCAL_STORAGE_METADATA_FAILED:${metadata.response.status}:${JSON.stringify(metadata.body)}`);

  const out = {
    target: "LOCAL_DISPOSABLE_SUPABASE",
    apiBase: LOCAL_API,
    bucket: BUCKET,
    bucketPublic: false,
    objectPath,
    bytes: bytes.length,
    sha256,
    results
  };
  await mkdir("artifacts", { recursive: true });
  await writeFile("artifacts/local-storage-assurance-2026-09-10.json", `${JSON.stringify(out, null, 2)}\n`, "utf8");
  console.log(JSON.stringify({ ...out, userCount: users.length }, null, 2));
} finally {
  // All cleanup is scoped to the local Kong endpoint and disposable users.
  if (users[0] && objectPath) {
    await request(`/storage/v1/object/${BUCKET}/${objectPath}`, {
      method: "DELETE",
      headers: authHeaders(anonKey, users[0].token)
    }).catch(() => {});
  }
  await request(`/rest/v1/screenshot_objects?object_key=eq.${encodeURIComponent(objectPath)}`, {
    method: "DELETE",
    headers: authHeaders(serviceKey)
  }).catch(() => {});
  for (const user of users.reverse()) {
    await request(`/auth/v1/admin/users/${user.id}`, {
      method: "DELETE",
      headers: authHeaders(serviceKey)
    }).catch(() => {});
  }
}
