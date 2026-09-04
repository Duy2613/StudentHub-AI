import test, { after } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";

import { assertStagingEnvironment, STAGING_SUPABASE_PROJECT_REF } from "../../src/lib/security/environment/stagingEnvironment.js";
import { closePostgresPoolForTests, getPostgresPool } from "../../src/lib/server/database/PostgresPool.js";
import { POST as syncAuth } from "../../src/app/api/auth/sync/route.js";
import { GET as readSession } from "../../src/app/api/auth/session/route.js";
import { GET as readProfile, PUT as writeProfile } from "../../src/app/api/users/profile/route.js";
import { POST as verifyEducation } from "../../src/app/api/users/verify-edu/route.js";
import { GET as readLiveHealth } from "../../src/app/api/health/live/route.js";
import { GET as readReadyHealth } from "../../src/app/api/health/ready/route.js";

const GATE_ORIGIN = "https://staging-onboarding-gate.invalid";
const stagingConfigured = Boolean(process.env.DATABASE_URL);

if (stagingConfigured) {
  assertStagingEnvironment({
    databaseEnvNames: ["DATABASE_URL"],
    requireDatabase: true,
    requireLiveOptIn: true,
    command: "live staging onboarding gate",
  });
}

after(async () => {
  if (stagingConfigured) await closePostgresPoolForTests();
});

function jsonRequest(method, path, { cookie, bearer, body } = {}) {
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);
  if (bearer) headers.set("authorization", `Bearer ${bearer}`);
  if (body !== undefined) {
    headers.set("content-type", "application/json");
  }
  if (method !== "GET") headers.set("origin", GATE_ORIGIN);
  return new Request(`${GATE_ORIGIN}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function readJson(response) {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    throw new Error(`Expected JSON response, received HTTP ${response.status}.`);
  }
}

function assertStatus(response, expected, label) {
  assert.equal(response.status, expected, `${label} returned an unexpected HTTP status.`);
}

function extractApplicationCookie(response) {
  const setCookie = response.headers.get("set-cookie") || "";
  const match = setCookie.match(/^studenthub_session=([^;]+)/);
  assert.ok(match, "auth sync must return an application session cookie.");
  return `studenthub_session=${match[1]}`;
}

function stagingAdminHeaders() {
  const adminKey = process.env.SUPABASE_SECRET_KEY;
  assert.ok(adminKey, "staging Supabase secret key is required for temporary fixtures.");
  return {
    apikey: adminKey,
    authorization: `Bearer ${adminKey}`,
  };
}

function stagingStorageUrl(objectPath) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return `${baseUrl}/storage/v1/object/trust-screenshots-private/${objectPath.split("/").map(encodeURIComponent).join("/")}`;
}

async function storageRequest(method, identity, objectPath, body) {
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const headers = { apikey: publishableKey };
  if (identity?.accessToken) headers.authorization = `Bearer ${identity.accessToken}`;
  if (body) headers["content-type"] = "image/png";
  return fetch(stagingStorageUrl(objectPath), {
    method,
    headers,
    body,
  });
}

async function createTemporaryIdentity(label) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
    || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.ok(baseUrl, "staging Supabase URL is required for temporary fixtures.");
  assert.ok(publishableKey, "staging Supabase publishable key is required for temporary fixtures.");

  const suffix = crypto.randomUUID().replaceAll("-", "");
  const email = `codex-${label}-${suffix}@gmail.com`;
  const password = `Cdx-${suffix}-Aa9!`;
  const created = await fetch(`${baseUrl}/auth/v1/admin/users`, {
    method: "POST",
    headers: { ...stagingAdminHeaders(), "content-type": "application/json" },
    body: JSON.stringify({ email, password, email_confirm: true }),
  });
  if (!created.ok) {
    await created.body?.cancel();
    throw new Error(`temporary staging identity creation failed with HTTP ${created.status}.`);
  }
  const createdPayload = await created.json();
  const userId = typeof createdPayload?.id === "string" ? createdPayload.id : null;
  assert.ok(userId, "temporary staging identity must return a user id.");

  const login = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: publishableKey, "content-type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!login.ok) {
    await login.body?.cancel();
    try {
      const cleanup = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: stagingAdminHeaders(),
      });
      await cleanup.body?.cancel();
    } catch {
      // Preserve the original login failure; the outer fixture cleanup can
      // still remove identities that were registered before this helper threw.
    }
    throw new Error(`temporary staging identity login failed with HTTP ${login.status}.`);
  }
  const loginPayload = await login.json();
  assert.equal(typeof loginPayload?.access_token, "string", "temporary staging login must return an access token.");
  return { userId, email, accessToken: loginPayload.access_token };
}

async function deleteTemporaryIdentity(userId) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const deleted = await fetch(`${baseUrl}/auth/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: "DELETE",
    headers: stagingAdminHeaders(),
  });
  const status = deleted.status;
  await deleted.body?.cancel();
  assert.ok(status >= 200 && status < 300, "temporary staging identity cleanup must succeed.");
}

async function syncAndReadSession(identity, { expectedRole = "student" } = {}) {
  const syncResponse = await syncAuth(jsonRequest("POST", "/api/auth/sync", {
    bearer: identity.accessToken,
    body: {
      id: "client-supplied-id-must-be-ignored",
      email: "spoofed@example.invalid",
      role: "ADMIN",
      fullName: identity.email.split("@")[0],
    },
  }));
  assertStatus(syncResponse, 200, "auth sync");
  const syncPayload = await readJson(syncResponse);
  assert.equal(syncPayload.user.userId, identity.userId, "auth sync must bind the server session to the Supabase subject.");
  assert.equal(syncPayload.user.email, identity.email, "auth sync must use the verified upstream email.");
  assert.equal(syncPayload.user.role, expectedRole, "auth sync must preserve the database-derived primary role.");
  const cookie = extractApplicationCookie(syncResponse);

  const sessionResponse = await readSession(jsonRequest("GET", "/api/auth/session", { cookie }));
  assertStatus(sessionResponse, 200, "durable session read");
  const sessionPayload = await readJson(sessionResponse);
  assert.equal(sessionPayload.user.id, identity.userId, "durable session must preserve the Supabase subject.");
  assert.equal(sessionPayload.user.email, identity.email, "durable session must hydrate canonical email.");
  assert.equal(sessionPayload.user.role, expectedRole, "durable session must preserve the server-derived role.");
  assert.equal(sessionPayload.user.emailVerified, true, "durable session must hydrate mailbox verification from auth.users.");
  return { cookie, sessionPayload };
}

test("PHASE 14–16 LIVE GATE: durable onboarding persistence, BOLA denial, and role boundary", async (t) => {
  if (!stagingConfigured) {
    t.skip("DATABASE_URL not configured; live staging gate is opt-in.");
    return;
  }

  const identities = [];
  const pool = getPostgresPool();
  let uploadedStoragePath = null;
  let storageOwner = null;
  try {
    const liveHealthResponse = await readLiveHealth(jsonRequest("GET", "/api/health/live"));
    assertStatus(liveHealthResponse, 200, "health/live");
    const liveHealthPayload = await readJson(liveHealthResponse);
    assert.equal(liveHealthPayload.status, "LIVE", "health/live must report the staging app as live.");

    const readyHealthResponse = await readReadyHealth(jsonRequest("GET", "/api/health/ready"));
    assertStatus(readyHealthResponse, 200, "health/ready");
    const readyHealthPayload = await readJson(readyHealthResponse);
    assert.equal(readyHealthPayload.status, "READY", "health/ready must report the staging dependencies as ready.");

    const userA = await createTemporaryIdentity("owner-a");
    identities.push(userA);
    const userASession = await syncAndReadSession(userA);

    const initialProfileResponse = await readProfile(jsonRequest("GET", "/api/users/profile", { cookie: userASession.cookie }));
    assertStatus(initialProfileResponse, 200, "initial own profile read");
    const initialProfile = await readJson(initialProfileResponse);
    assert.equal(initialProfile.profile.supabaseUserId, userA.userId, "initial profile must be keyed by the authenticated subject.");
    assert.equal(initialProfile.profile.role, "student", "initial profile role must be server-derived.");
    assert.equal(initialProfile.profile.universityEmailVerified, false, "mailbox verification must not imply institutional verification.");

    const verificationResponse = await verifyEducation(jsonRequest("POST", "/api/users/verify-edu", {
      cookie: userASession.cookie,
      body: {
        email: userA.email,
        email_verified: false,
        role: "ADMIN",
        universityEmailVerified: true,
      },
    }));
    assertStatus(verificationResponse, 422, "ordinary mailbox education verification");
    const verificationPayload = await readJson(verificationResponse);
    assert.equal(verificationPayload.verificationStatus, "NOT_INSTITUTIONAL_DOMAIN", "Gmail must remain non-institutional.");

    const writeResponse = await writeProfile(jsonRequest("PUT", "/api/users/profile", {
      cookie: userASession.cookie,
      body: {
        fullName: "Live Onboarding Owner A",
        avatarId: "student-tech",
        university: "Staging University",
        major: "Computer Science",
        academicYear: "2026",
        bio: "Durable onboarding gate fixture.",
        onboardingCompleted: true,
        ownerId: "foreign-owner-must-be-ignored",
        role: "ADMIN",
        trustScore: 100,
        reputationScore: 100,
        universityEmailVerified: true,
        verifiedExpert: true,
        expertField: "security",
      },
    }));
    assertStatus(writeResponse, 200, "own profile write");
    const writePayload = await readJson(writeResponse);
    assert.equal(writePayload.profile.supabaseUserId, userA.userId, "profile write must use the authenticated subject.");
    assert.equal(writePayload.profile.role, "student", "profile write must ignore client role claims.");
    assert.equal(writePayload.profile.universityEmailVerified, false, "profile write must not grant institutional verification.");
    assert.equal(writePayload.profile.onboardingCompleted, true, "safe onboarding state must persist.");
    assert.equal(writePayload.profile.fullName, "Live Onboarding Owner A", "safe display fields must persist.");
    assert.equal(writePayload.profile.expertField, undefined, "expert authority fields must not be returned or persisted.");

    const persistedResponse = await readProfile(jsonRequest("GET", "/api/users/profile", { cookie: userASession.cookie }));
    assertStatus(persistedResponse, 200, "persisted own profile read");
    const persistedPayload = await readJson(persistedResponse);
    assert.equal(persistedPayload.profile.major, "Computer Science", "profile data must survive a fresh durable read.");
    assert.equal(persistedPayload.profile.onboardingCompleted, true, "onboarding completion must survive a fresh durable read.");
    assert.equal(persistedPayload.profile.role, "student", "fresh profile role must remain server-derived.");

    const anonymousResponse = await readProfile(jsonRequest("GET", "/api/users/profile"));
    assertStatus(anonymousResponse, 401, "anonymous profile read");
    await readJson(anonymousResponse);

    const userB = await createTemporaryIdentity("owner-b");
    identities.push(userB);
    const userBSession = await syncAndReadSession(userB);

    const storagePath = `${userA.userId}/${crypto.randomUUID()}.png`;
    const uploadResponse = await storageRequest(
      "POST",
      userA,
      storagePath,
      Buffer.from("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c63606060000000050001a5a2dd400000000049454e44ae426082", "hex"),
    );
    assert.ok([200, 201].includes(uploadResponse.status), "owner upload to the private staging bucket must succeed.");
    await uploadResponse.body?.cancel();
    uploadedStoragePath = storagePath;
    storageOwner = userA;

    const ownerStorageRead = await storageRequest("GET", userA, storagePath);
    assert.equal(ownerStorageRead.status, 200, "owner must read its private staging object.");
    await ownerStorageRead.arrayBuffer();

    const foreignStorageRead = await storageRequest("GET", userB, storagePath);
    assert.ok([400, 401, 403, 404].includes(foreignStorageRead.status), "a foreign user must not read the private staging object.");
    await foreignStorageRead.body?.cancel();

    const anonymousStorageRead = await storageRequest("GET", null, storagePath);
    assert.ok([400, 401, 403, 404].includes(anonymousStorageRead.status), "anonymous callers must not read the private staging object.");
    await anonymousStorageRead.body?.cancel();

    const ownerStorageDelete = await storageRequest("DELETE", userA, storagePath);
    assert.ok([200, 204].includes(ownerStorageDelete.status), "owner must be able to delete its private staging object.");
    await ownerStorageDelete.body?.cancel();
    uploadedStoragePath = null;

    const foreignReadResponse = await readProfile(jsonRequest("GET", `/api/users/profile?email=${encodeURIComponent(userA.email)}`, { cookie: userBSession.cookie }));
    assertStatus(foreignReadResponse, 403, "foreign profile read");
    await readJson(foreignReadResponse);

    const foreignWriteResponse = await writeProfile(jsonRequest("PUT", "/api/users/profile", {
      cookie: userBSession.cookie,
      body: { email: userA.email, fullName: "BOLA attempt" },
    }));
    assertStatus(foreignWriteResponse, 403, "foreign profile write");
    await readJson(foreignWriteResponse);

    const admin = await createTemporaryIdentity("admin");
    identities.push(admin);
    await pool.query(`
      insert into private.user_roles (user_id, role_id)
      select $1, id from private.roles where code = 'ADMIN'
      on conflict do nothing
    `, [admin.userId]);
    const adminSession = await syncAndReadSession(admin, { expectedRole: "admin" });
    assert.ok(adminSession.sessionPayload.user.roles.includes("ADMIN"), "database-assigned ADMIN role must survive auth sync.");
    assert.equal(adminSession.sessionPayload.user.role, "admin", "database-assigned ADMIN must control the primary role.");

    const adminProfileResponse = await readProfile(jsonRequest("GET", "/api/users/profile", { cookie: adminSession.cookie }));
    assertStatus(adminProfileResponse, 200, "admin own profile read");
    const adminProfilePayload = await readJson(adminProfileResponse);
    assert.equal(adminProfilePayload.profile.role, "admin", "profile role must reflect the authoritative database role.");
  } finally {
    if (uploadedStoragePath && storageOwner) {
      const cleanupStorage = await storageRequest("DELETE", storageOwner, uploadedStoragePath);
      await cleanupStorage.body?.cancel();
    }
    const ids = identities.map(({ userId }) => userId);
    if (ids.length) {
      await pool.query("delete from private.server_sessions where user_id = any($1::uuid[])", [ids]);
      await pool.query("delete from private.user_roles where user_id = any($1::uuid[])", [ids]);
      await pool.query("delete from private.audit_events where actor_id = any($1::uuid[])", [ids]);
      await pool.query("delete from public.profiles where id = any($1::uuid[])", [ids]);
      for (const userId of ids) await deleteTemporaryIdentity(userId);
    }
  }
});

assert.equal(STAGING_SUPABASE_PROJECT_REF, "bniwtkjtramqaozrrtrk");
