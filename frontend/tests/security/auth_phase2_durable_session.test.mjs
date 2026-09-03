import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, it } from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { clearSessionCookie, DurableSessionService } from "../../src/lib/security/identity/DurableSessionService.js";
import { OidcTokenVerifier } from "../../src/lib/security/identity/OidcTokenVerifier.js";
import { SessionExchangeService } from "../../src/lib/security/identity/SessionExchangeService.js";
import { CsrfGuard } from "../../src/lib/security/hardening/CsrfGuard.js";
import { DurableJsonSessionTestRepository, DurableJsonForumTestRepository } from "../support/DurableJsonTestRepositories.mjs";

const issuer = "https://studenthub-test.supabase.co/auth/v1";
const audience = "authenticated";

async function signingFixture(kid = "key-1") {
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey); jwk.kid = kid; jwk.alg = "ES256"; jwk.use = "sig";
  return { privateKey, jwk, kid };
}

async function token(fixture, overrides = {}) {
  const now = Math.floor(Date.now() / 1000);
  const claims = { sub: "11111111-1111-4111-8111-111111111111", email: "student@example.edu", email_verified: true, jti: `jti-${Math.random()}`, ...overrides };
  let builder = new SignJWT(claims).setProtectedHeader({ alg: "ES256", kid: fixture.kid }).setIssuedAt(now);
  if (!Object.hasOwn(overrides, "iss")) builder = builder.setIssuer(issuer);
  if (!Object.hasOwn(overrides, "aud")) builder = builder.setAudience(audience);
  if (!Object.hasOwn(overrides, "exp")) builder = builder.setExpirationTime(now + 300);
  return builder.sign(fixture.privateKey);
}

describe("PHASE 2 — OIDC/JWKS verification", () => {
  it("accepts a correctly signed token and rejects forged, expired, issuer, audience and subject failures", async () => {
    const good = await signingFixture();
    const forged = await signingFixture("forged");
    const verifier = new OidcTokenVerifier({ issuer, audience, jwks: { keys: [good.jwk] } });
    assert.equal((await verifier.verify(await token(good))).userId, "11111111-1111-4111-8111-111111111111");
    await assert.rejects(verifier.verify(await token(forged)));
    await assert.rejects(verifier.verify(await token(good, { exp: Math.floor(Date.now() / 1000) - 1 })));
    await assert.rejects(verifier.verify(await token(good, { iss: "https://evil.invalid" })));
    await assert.rejects(verifier.verify(await token(good, { aud: "wrong-audience" })));
    await assert.rejects(verifier.verify(await token(good, { sub: undefined })));
  });

  it("accepts both old and rotated signing keys present in the refreshed JWKS", async () => {
    const oldKey = await signingFixture("old");
    const newKey = await signingFixture("new");
    const verifier = new OidcTokenVerifier({ issuer, audience, jwks: { keys: [oldKey.jwk, newKey.jwk] } });
    assert.equal((await verifier.verify(await token(oldKey))).algorithm, "ES256");
    assert.equal((await verifier.verify(await token(newKey))).algorithm, "ES256");
  });
});

describe("PHASE 2 — durable opaque sessions", () => {
  it("survives service/repository reconstruction, rejects revocation, and never stores the raw secret", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "studenthub-session-")), "sessions.json");
    const pepper = "test-pepper-that-is-longer-than-thirty-two-characters";
    const first = new DurableSessionService({ repository: new DurableJsonSessionTestRepository(path), pepper });
    const created = await first.createSession({ userId: "11111111-1111-4111-8111-111111111111", jti: "proof-1" });
    const rawFile = await import("node:fs").then(({ readFileSync }) => readFileSync(path, "utf8"));
    assert.equal(rawFile.includes(created.secret), false);

    const afterRestart = new DurableSessionService({ repository: new DurableJsonSessionTestRepository(path), pepper });
    assert.equal((await afterRestart.validateSession(created.secret)).user_id, "11111111-1111-4111-8111-111111111111");
    await afterRestart.revokeSession(created.secret, "LOGOUT");
    await assert.rejects(afterRestart.validateSession(created.secret), /invalid, expired, or revoked/i);
  });

  it("does not let possession of session A revoke session B", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "studenthub-session-")), "sessions.json");
    const service = new DurableSessionService({ repository: new DurableJsonSessionTestRepository(path), pepper: "another-test-pepper-longer-than-thirty-two-characters" });
    const a = await service.createSession({ userId: "11111111-1111-4111-8111-111111111111", jti: "a" });
    const b = await service.createSession({ userId: "22222222-2222-4222-8222-222222222222", jti: "b" });
    await service.revokeSession(a.secret, "LOGOUT");
    assert.equal((await service.validateSession(b.secret)).user_id, "22222222-2222-4222-8222-222222222222");
  });

  it("sets an opaque HttpOnly SameSite cookie without returning it as metadata", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "studenthub-session-")), "sessions.json");
    const service = new DurableSessionService({ repository: new DurableJsonSessionTestRepository(path), pepper: "cookie-test-pepper-longer-than-thirty-two-characters" });
    const created = await service.createSession({ userId: "11111111-1111-4111-8111-111111111111", jti: "cookie" });
    const cookie = service.serializeCookie(created.secret, created.expiresAt, { secure: true });
    assert.match(cookie, /HttpOnly/); assert.match(cookie, /SameSite=Lax/); assert.match(cookie, /Secure/);
    assert.equal(JSON.stringify({ userId: created.userId, expiresAt: created.expiresAt }).includes(created.secret), false);
  });

  it("rejects an expired application session", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "studenthub-session-")), "sessions.json");
    let clock = new Date("2026-08-27T00:00:00.000Z");
    const service = new DurableSessionService({
      repository: new DurableJsonSessionTestRepository(path),
      pepper: "expiry-test-pepper-longer-than-thirty-two-characters",
      now: () => clock,
      idleMs: 60_000,
      absoluteMs: 120_000,
    });
    const created = await service.createSession({ userId: "11111111-1111-4111-8111-111111111111", jti: "expiry" });
    clock = new Date("2026-08-27T00:02:01.000Z");
    await assert.rejects(service.validateSession(created.secret), /invalid, expired, or revoked/i);
  });

  it("provides a safe cookie clear response independently of persistence availability", () => {
    const cookie = clearSessionCookie({ secure: true });
    assert.match(cookie, /^studenthub_session=;/);
    assert.match(cookie, /HttpOnly/);
    assert.match(cookie, /SameSite=Lax/);
    assert.match(cookie, /Max-Age=0/);
    assert.match(cookie, /Secure/);
  });

  it("rejects replay of the same verified upstream proof even without jti", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "studenthub-session-")), "sessions.json");
    const sessions = new DurableSessionService({ repository: new DurableJsonSessionTestRepository(path), pepper: "replay-test-pepper-longer-than-thirty-two-characters" });
    const exchange = new SessionExchangeService({
      verifier: { verify: async () => ({ userId: "11111111-1111-4111-8111-111111111111", authProvider: "supabase" }) },
      sessions,
    });
    await exchange.exchange("same-verified-upstream-token");
    await assert.rejects(exchange.exchange("same-verified-upstream-token"), (error) => error?.code === "23505");
  });
});

describe("PHASE 2 — CSRF and persistence contracts", () => {
  it("allows same-origin and rejects cross-origin cookie mutations", () => {
    assert.doesNotThrow(() => CsrfGuard.assertRequestAllowed(new Request("https://studenthub.test/api/forum/posts", { method: "POST", headers: { origin: "https://studenthub.test" } }), { cookieAuthenticated: true }));
    assert.throws(() => CsrfGuard.assertRequestAllowed(new Request("https://studenthub.test/api/forum/posts", { method: "POST", headers: { origin: "https://evil.test" } }), { cookieAuthenticated: true }), /Cross-origin/);
  });

  it("forum repository contract survives reconstruction", async () => {
    const path = join(mkdtempSync(join(tmpdir(), "studenthub-forum-")), "forum.json");
    await new DurableJsonForumTestRepository(path).create({ authorId: "user-a", title: "Durable forum post", content: "This post must survive a reconstructed server repository." });
    const afterRestart = await new DurableJsonForumTestRepository(path).list();
    assert.equal(afterRestart.length, 1); assert.equal(afterRestart[0].authorId, "user-a");
  });
});
