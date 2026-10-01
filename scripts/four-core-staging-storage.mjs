import assert from "node:assert/strict";
import { createHash, randomBytes } from "node:crypto";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { parseEnv } from "node:util";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const root = resolve(import.meta.dirname, "..");
const require = createRequire(resolve(root, "frontend/package.json"));
const { createClient } = require("@supabase/supabase-js");
const { Pool } = require("pg");
const expectedProjectRef = "bniwtkjtramqaozrrtrk";
const candidateSourceSha = "eea55564ebaef4dc2edc7af14586fe8f04324114";
const operatorRoot = process.env.STUDENTHUB_OPERATOR_ROOT;
const envPath = process.env.STUDENTHUB_STAGING_ENV_PATH || (operatorRoot && resolve(operatorRoot, "frontend/.env.staging.local"));
if (!envPath || process.env.STUDENTHUB_STAGING_STORAGE_ACK !== "STAGING_SYNTHETIC_STORAGE_ONLY") throw new Error("STAGING_STORAGE_OPERATOR_ACK_REQUIRED");

const env = parseEnv(readFileSync(envPath, "utf8"));
const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const projectRef = supabaseUrl ? new URL(supabaseUrl).hostname.split(".")[0] : "";
const publicKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY || env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const serviceKey = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;
if (projectRef !== expectedProjectRef || !publicKey || !serviceKey) throw new Error("STAGING_STORAGE_IDENTITY_OR_KEYS_INVALID");
if (!env.DATABASE_URL) throw new Error("STAGING_STORAGE_DATABASE_READBACK_UNAVAILABLE");
const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: env.DATABASE_SSL_REJECT_UNAUTHORIZED !== "false", ...(env.DATABASE_SSL_CA ? { ca: env.DATABASE_SSL_CA.replace(/\\n/g, "\n") } : {}) },
  max: 2,
});

const bucket = "trust-screenshots-private";
const runTag = `storage-${Date.now()}-${randomBytes(3).toString("hex")}`;
const admin = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const unauthenticated = createClient(supabaseUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
const mediaFixtures = [
  { kind: "trust-image", fileName: "screenshot-text.png" },
  { kind: "trust-qr", fileName: "01-https.png" },
].map((fixture) => ({
  ...fixture,
  bytes: readFileSync(resolve(root, "fixtures/trust-multimodal", fixture.fileName)),
}));
const report = {
  recordedAt: new Date().toISOString(),
  candidateSourceSha,
  harnessSha: execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim(),
  harnessWorkingTreeModified: true,
  target: "STAGING_SUPABASE_STORAGE",
  projectRef,
  bucket,
  bucketPublic: false,
  bucketInventory: ["trust-screenshots-private"],
  unsupportedBuckets: ["AVATAR_MEDIA_NOT_CONFIGURED", "EXPERT_ROOM_MEDIA_NOT_CONFIGURED"],
  providerMode: "OFF",
  syntheticOnly: true,
  fixtureUsers: [],
  objects: [],
  unsupportedBuckets: [],
  cleanup: [],
};
const users = [];
const createdPaths = [];
const writeReport = () => {
  const dir = resolve(root, "docs/reports/four-core-repair-2026-10-01");
  mkdirSync(dir, { recursive: true });
  writeFileSync(resolve(dir, "staging-storage.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
};

async function createUser(label) {
  const email = `${runTag}-${label}@studenthub.local.test`;
  const password = `Storage!${randomBytes(28).toString("hex")}aA1`;
  const { data, error } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { full_name: `Synthetic ${label}`, repair_fixture: runTag } });
  if (error || !data?.user?.id) throw new Error(`STAGING_STORAGE_USER_CREATE_${error?.status || "FAILED"}`);
  const client = createClient(supabaseUrl, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const user = { id: data.user.id, email, client };
  users.push(user);
  report.fixtureUsers.push({ id: user.id, identity: "SYNTHETIC", cleanup: "PENDING" });
  writeReport();
  const signedIn = await client.auth.signInWithPassword({ email, password });
  if (signedIn.error || signedIn.data.user?.id !== data.user.id) throw new Error("STAGING_STORAGE_USER_LOGIN_FAILED");
  return user;
}

try {
  const owner = await createUser("owner");
  const other = await createUser("other");
  for (const fixture of mediaFixtures) {
    const { kind, bytes } = fixture;
    const sha256 = createHash("sha256").update(bytes).digest("hex");
    const objectPath = `${owner.id}/${runTag}/${fixture.fileName}`;
    const upload = await owner.client.storage.from(bucket).upload(objectPath, Uint8Array.from(bytes).buffer, { contentType: "image/png", upsert: false });
    assert.equal(upload.error, null, `UPLOAD_FAILED_${kind}`);
    createdPaths.push(objectPath);
    const ownerRead = await owner.client.storage.from(bucket).download(objectPath);
    assert.equal(ownerRead.error, null, `OWNER_READ_FAILED_${kind}`);
    assert.equal(createHash("sha256").update(Buffer.from(await ownerRead.data.arrayBuffer())).digest("hex"), sha256, `OWNER_READ_HASH_MISMATCH_${kind}`);
    const otherRead = await other.client.storage.from(bucket).download(objectPath);
    assert.ok(otherRead.error, `NON_OWNER_READ_ALLOWED_${kind}`);
    const anonymousRead = await unauthenticated.storage.from(bucket).download(objectPath);
    assert.ok(anonymousRead.error, `ANONYMOUS_READ_ALLOWED_${kind}`);
    const signed = await owner.client.storage.from(bucket).createSignedUrl(objectPath, 60);
    assert.equal(signed.error, null, `SIGNED_URL_CREATE_FAILED_${kind}`);
    const signedUrl = new URL(signed.data.signedUrl, supabaseUrl).toString();
    const signedRead = await fetch(signedUrl);
    assert.equal(signedRead.status, 200, `SIGNED_URL_READ_FAILED_${kind}`);
    assert.equal(createHash("sha256").update(Buffer.from(await signedRead.arrayBuffer())).digest("hex"), sha256, `SIGNED_URL_HASH_MISMATCH_${kind}`);
    report.objects.push({ kind, fixture: fixture.fileName, path: objectPath, sha256, bytes: bytes.length, upload: "PASS", ownerRead: "PASS", signedUrl: "PASS", nonOwnerDenied: "PASS", anonymousDenied: "PASS", cleanup: "PENDING" });
    writeReport();
    const removed = await owner.client.storage.from(bucket).remove([objectPath]);
    assert.equal(removed.error, null, `EXACT_OWNER_CLEANUP_FAILED_${kind}`);
    const afterCleanup = await pool.query("SELECT count(*)::int AS count FROM storage.objects WHERE bucket_id=$1 AND name=$2", [bucket, objectPath]);
    assert.equal(afterCleanup.rows[0]?.count, 0, `EXACT_OWNER_CLEANUP_NOT_CONFIRMED_${kind}`);
    report.objects.at(-1).cleanup = "PASS_EXACT_OWNER_PATH";
    writeReport();
  }
  report.result = "PASS";
} catch (error) {
  report.result = "FAIL";
  report.failureCode = /^[A-Z0-9_:-]{1,120}$/.test(error?.message) ? error.message : error?.name || "UNKNOWN";
} finally {
  const owner = users[0];
  if (owner && createdPaths.length) {
    try {
      const removed = await owner.client.storage.from(bucket).remove(createdPaths);
      if (removed.error) throw new Error("STAGING_STORAGE_EXACT_OWNER_CLEANUP_FAILED");
      for (const item of report.objects) {
        if (!createdPaths.includes(item.path)) continue;
        const readback = await pool.query("SELECT count(*)::int AS count FROM storage.objects WHERE bucket_id=$1 AND name=$2", [bucket, item.path]);
        if (readback.rows[0]?.count === 0) item.cleanup = "PASS_EXACT_OWNER_PATH";
      }
      report.cleanup.push({ status: "PASS_EXACT_OWNER_PATHS_REMOVED", objectCount: createdPaths.length });
    } catch (error) {
      report.cleanup.push({ status: "FAIL", code: /^[A-Z0-9_:-]{1,120}$/.test(error?.message) ? error.message : error?.name || "UNKNOWN" });
      report.result = "FAIL";
    }
  }
  for (const user of users) {
    try {
      await user.client.auth.signOut({ scope: "global" });
      const disabled = await admin.auth.admin.updateUserById(user.id, { ban_duration: "876000h" });
      if (disabled.error) throw new Error("STAGING_STORAGE_FIXTURE_DISABLE_FAILED");
      const item = report.fixtureUsers.find((entry) => entry.id === user.id);
      if (item) item.cleanup = "PASS_SESSION_REVOKED_IDENTITY_DISABLED";
      report.cleanup.push({ userId: user.id, status: "PASS_SESSION_REVOKED_IDENTITY_DISABLED" });
    } catch (error) {
      report.cleanup.push({ userId: user.id, status: "FAIL", code: /^[A-Z0-9_:-]{1,120}$/.test(error?.message) ? error.message : error?.name || "UNKNOWN" });
      report.result = "FAIL";
    }
  }
  await pool.end();
  report.finishedAt = new Date().toISOString();
  writeReport();
  console.log(JSON.stringify({ artifact: "staging-storage.json", target: report.target, projectRef, bucket, result: report.result, objects: report.objects.map(({ kind, upload, ownerRead, signedUrl, nonOwnerDenied, anonymousDenied, cleanup }) => ({ kind, upload, ownerRead, signedUrl, nonOwnerDenied, anonymousDenied, cleanup })), cleanup: report.cleanup.map(({ status }) => status) }));
  if (report.result !== "PASS" || report.cleanup.some((item) => item.status === "FAIL") || report.objects.some((item) => item.cleanup !== "PASS_EXACT_OWNER_PATH")) process.exitCode = 1;
}
