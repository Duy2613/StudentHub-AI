import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it, beforeEach, afterEach } from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { DurableSessionService, setDurableSessionServiceForTests, SESSION_COOKIE_NAME } from "../../src/lib/security/identity/DurableSessionService.js";
import { OidcTokenVerifier, setSupabaseTokenVerifierForTests } from "../../src/lib/security/identity/OidcTokenVerifier.js";
import { DurableJsonSessionTestRepository } from "../support/DurableJsonTestRepositories.mjs";
import { POST } from "../../src/app/api/auth/sync/route.js";

const STAGING_ISSUER = "https://bniwtkitramgaozrrtrk.supabase.co/auth/v1";
const PROD_ISSUER = "https://kytdomflmjytzyaabogi.supabase.co/auth/v1";
const AUDIENCE = "authenticated";

async function createSigningKey(kid = "key-staging-1") {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  jwk.kid = kid;
  jwk.alg = "ES256";
  jwk.use = "sig";
  return { privateKey, jwk, kid };
}

async function mintToken(fixture, {
  issuer = STAGING_ISSUER,
  audience = AUDIENCE,
  sub = "11111111-1111-4111-8111-111111111111",
  email = "staging_user_a@studenthub.edu.vn",
  expSeconds = 300,
  overrides = {}
} = {}) {
  const now = Math.floor(Date.now() / 1000);
  let builder = new SignJWT({
    sub,
    email,
    email_verified: true,
    jti: `jti-${Math.random()}`,
    ...overrides
  })
    .setProtectedHeader({ alg: "ES256", kid: fixture.kid })
    .setIssuedAt(now)
    .setIssuer(issuer)
    .setAudience(audience)
    .setExpirationTime(now + expSeconds);

  return builder.sign(fixture.privateKey);
}

describe("STUDENTHUB AI — STAGING AUTH BOOTSTRAP /api/auth/sync CONTRACTS", () => {
  let stagingKeys;
  let prodKeys;
  let forgedKeys;
  let sessionService;
  let sessionRepo;
  let sessionPath;
  const pepper = "test-pepper-longer-than-thirty-two-characters-staging-sync";

  beforeEach(async () => {
    stagingKeys = await createSigningKey("staging-1");
    prodKeys = await createSigningKey("prod-1");
    forgedKeys = await createSigningKey("forged-1");

    sessionPath = join(mkdtempSync(join(tmpdir(), "studenthub-sync-test-")), "sessions.json");
    sessionRepo = new DurableJsonSessionTestRepository(sessionPath);
    sessionService = new DurableSessionService({ repository: sessionRepo, pepper });
    setDurableSessionServiceForTests(sessionService);

    const stagingVerifier = new OidcTokenVerifier({
      issuer: STAGING_ISSUER,
      audience: AUDIENCE,
      jwks: { keys: [stagingKeys.jwk] }
    });
    setSupabaseTokenVerifierForTests(stagingVerifier);
  });

  afterEach(() => {
    setDurableSessionServiceForTests(null);
    setSupabaseTokenVerifierForTests(null);
  });

  it("valid staging Supabase token → sync success with durable session and HttpOnly cookie", async () => {
    const validToken = await mintToken(stagingKeys, {
      sub: "aaaa1111-2222-3333-4444-555566667777",
      email: "staging_user_a@studenthub.edu.vn"
    });

    const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://preview-auth.studenthub.ai",
        "authorization": `Bearer ${validToken}`
      },
      body: JSON.stringify({
        fullName: "Staging User A",
        avatarUrl: "https://images.studenthub.ai/avatars/user-a.png"
      })
    });

    const response = await POST(request);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.success, true);
    assert.equal(body.authenticated, true);
    assert.equal(body.user.userId, "aaaa1111-2222-3333-4444-555566667777");
    assert.equal(body.user.email, "staging_user_a@studenthub.edu.vn");
    assert.equal(body.user.role, "student");
    assert.ok(body.session.expiresAt);

    // Verify Cookie attributes
    const cookie = response.headers.get("set-cookie");
    assert.ok(cookie, "Set-Cookie header must be present");
    assert.match(cookie, new RegExp(`^${SESSION_COOKIE_NAME}=`));
    assert.match(cookie, /HttpOnly/i);
    assert.match(cookie, /SameSite=Lax/i);
    assert.match(cookie, /Path=\//i);
    assert.match(cookie, /Secure/i);

    // Verify session row exists in durable repository
    const secretMatch = cookie.match(new RegExp(`${SESSION_COOKIE_NAME}=([^;]+)`));
    assert.ok(secretMatch);
    const rawSecret = decodeURIComponent(secretMatch[1]);
    const storedSession = await sessionService.validateSession(rawSecret);
    assert.equal(storedSession.user_id, "aaaa1111-2222-3333-4444-555566667777");
  });

  it("missing token → 401 AUTH_BOOTSTRAP_TOKEN_MISSING", async () => {
    const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://preview-auth.studenthub.ai"
      },
      body: JSON.stringify({ fullName: "Attacker" })
    });

    const response = await POST(request);
    assert.equal(response.status, 401);

    const body = await response.json();
    assert.equal(body.error.code, "AUTH_BOOTSTRAP_TOKEN_MISSING");
  });

  it("forged token → 401 AUTH_BOOTSTRAP_TOKEN_INVALID", async () => {
    const forgedToken = await mintToken(forgedKeys, {
      sub: "attacker-uuid-1234"
    });

    const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://preview-auth.studenthub.ai",
        "authorization": `Bearer ${forgedToken}`
      },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    assert.equal(response.status, 401);

    const body = await response.json();
    assert.equal(body.error.code, "AUTH_BOOTSTRAP_TOKEN_INVALID");
  });

  it("expired token → 401 AUTH_BOOTSTRAP_TOKEN_INVALID", async () => {
    const expiredToken = await mintToken(stagingKeys, {
      sub: "expired-user-uuid",
      expSeconds: -60
    });

    const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://preview-auth.studenthub.ai",
        "authorization": `Bearer ${expiredToken}`
      },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    assert.equal(response.status, 401);

    const body = await response.json();
    assert.equal(body.error.code, "AUTH_BOOTSTRAP_TOKEN_INVALID");
  });

  it("production Supabase token on staging → DENY with AUTH_BOOTSTRAP_ISSUER_INVALID", async () => {
    const prodToken = await mintToken(prodKeys, {
      issuer: PROD_ISSUER,
      sub: "prod-user-uuid"
    });

    const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://preview-auth.studenthub.ai",
        "authorization": `Bearer ${prodToken}`
      },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    assert.equal(response.status, 401);

    const body = await response.json();
    assert.equal(body.error.code, "AUTH_BOOTSTRAP_ISSUER_INVALID");
  });

  it("browser-supplied fake user_id / email → ignored in favor of verified claims", async () => {
    const validToken = await mintToken(stagingKeys, {
      sub: "real-sub-uuid-8888",
      email: "real_email@studenthub.edu.vn"
    });

    const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://preview-auth.studenthub.ai",
        "authorization": `Bearer ${validToken}`
      },
      body: JSON.stringify({
        id: "fake-browser-id-9999",
        userId: "fake-browser-userId",
        email: "spoofed@admin.com",
        fullName: "Honest Student"
      })
    });

    const response = await POST(request);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.user.userId, "real-sub-uuid-8888");
    assert.equal(body.user.email, "real_email@studenthub.edu.vn");
    assert.notEqual(body.user.userId, "fake-browser-id-9999");
    assert.notEqual(body.user.email, "spoofed@admin.com");
  });

  it("browser-supplied ADMIN role → cannot elevate standard user", async () => {
    const validToken = await mintToken(stagingKeys, {
      sub: "standard-student-uuid",
      email: "student@studenthub.edu.vn"
    });

    const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://preview-auth.studenthub.ai",
        "authorization": `Bearer ${validToken}`
      },
      body: JSON.stringify({
        role: "ADMIN",
        roles: ["ADMIN", "STUDENT"]
      })
    });

    const response = await POST(request);
    assert.equal(response.status, 200);

    const body = await response.json();
    assert.equal(body.user.role, "student");
    assert.deepEqual(body.user.roles, ["STUDENT"]);
  });

  it("cross-origin request with mismatched origin → 403 CSRF_ORIGIN_REJECTED", async () => {
    const validToken = await mintToken(stagingKeys);

    const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "origin": "https://malicious-site.attacker.com",
        "authorization": `Bearer ${validToken}`
      },
      body: JSON.stringify({})
    });

    const response = await POST(request);
    assert.equal(response.status, 403);

    const body = await response.json();
    assert.equal(body.error.code, "CSRF_ORIGIN_REJECTED");
  });

  it("valid admin identity → retains DB-assigned ADMIN", async () => {
    const originalDbUrl = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgres://fake-staging-db.internal:5432/studenthub";

    const { setPostgresPoolForTests } = await import("../../src/lib/server/database/PostgresPool.js");
    const mockPool = {
      query: async (sql, params) => {
        if (sql.includes("private.user_roles ur join private.roles r")) {
          return { rows: [{ roles: ["ADMIN", "STUDENT"] }] };
        }
        if (sql.includes("public.profiles")) {
          return { rows: [{ id: params[0], display_name: "Security Admin", avatar_url: null }] };
        }
        return { rows: [] };
      }
    };
    setPostgresPoolForTests(mockPool);

    try {
      const adminToken = await mintToken(stagingKeys, {
        sub: "admin-subject-uuid-0001",
        email: "security_admin@studenthub.edu.vn"
      });

      const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "origin": "https://preview-auth.studenthub.ai",
          "authorization": `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          fullName: "Security Admin"
        })
      });

      const response = await POST(request);
      assert.equal(response.status, 200);

      const body = await response.json();
      assert.equal(body.user.role, "admin");
      assert.ok(body.user.roles.includes("ADMIN"));
      assert.equal(body.user.email, "security_admin@studenthub.edu.vn");
    } finally {
      setPostgresPoolForTests(null);
      if (originalDbUrl === undefined) delete process.env.DATABASE_URL;
      else process.env.DATABASE_URL = originalDbUrl;
    }
  });

  it("Render and Citadel unavailable → no effect, sync succeeds independently", async () => {
    const originalEnv = process.env.STUDENTHUB_BACKEND_URL;
    process.env.STUDENTHUB_BACKEND_URL = "https://unreachable-render-service.invalid";

    try {
      const validToken = await mintToken(stagingKeys, {
        sub: "render-independent-user"
      });

      const request = new Request("https://preview-auth.studenthub.ai/api/auth/sync", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "origin": "https://preview-auth.studenthub.ai",
          "authorization": `Bearer ${validToken}`
        },
        body: JSON.stringify({})
      });

      const response = await POST(request);
      assert.equal(response.status, 200);
      const body = await response.json();
      assert.equal(body.authenticated, true);
    } finally {
      process.env.STUDENTHUB_BACKEND_URL = originalEnv;
    }
  });
});
