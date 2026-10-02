import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import test from "node:test";
import { exportJWK, generateKeyPair, SignJWT } from "jose";
import { DEMO_ACCOUNT_SPECS } from "../../src/lib/server/auth/demoAccountPolicy.js";
import { getDemoAcceptanceRateLimitKey, isDemoAcceptanceModeEnabled } from "../../src/lib/server/auth/demoAcceptanceMode.js";
import { AuthRouteGuard } from "../../src/lib/security/hardening/AuthRouteGuard.js";
import { RateLimiter } from "../../src/lib/security/hardening/RateLimiter.js";
import { OidcTokenVerifier } from "../../src/lib/security/identity/OidcTokenVerifier.js";
import { SessionExchangeService, setSessionExchangeServiceForTests } from "../../src/lib/security/identity/SessionExchangeService.js";

const preview = { NODE_ENV: "production", VERCEL_ENV: "preview", STUDENTHUB_ACCEPTANCE_MODE: "true" };
const demoEmail = [...DEMO_ACCOUNT_SPECS.keys()][0];

async function withEnvironment(environment, fn) {
  const keys = ["NODE_ENV", "VERCEL_ENV", "STUDENTHUB_DEPLOYMENT_ENV", "STUDENTHUB_ACCEPTANCE_MODE"];
  const previous = Object.fromEntries(keys.map((key) => [key, process.env[key]]));
  for (const key of keys) {
    if (environment[key] === undefined) delete process.env[key];
    else process.env[key] = environment[key];
  }
  RateLimiter.clear();
  try { return await fn(); }
  finally {
    RateLimiter.clear();
    setSessionExchangeServiceForTests(undefined);
    for (const key of keys) {
      if (previous[key] === undefined) delete process.env[key];
      else process.env[key] = previous[key];
    }
  }
}

function request(token = "synthetic-upstream-proof", headers = {}) {
  return new Request("https://studenthub.test/api/auth/session/exchange", {
    method: "POST",
    headers: { origin: "https://studenthub.test", authorization: `Bearer ${token}`, ...headers },
  });
}

async function exchangeRoute() {
  const src = new URL("../../src/", import.meta.url).href;
  const server = new URL("../../node_modules/next/server.js", import.meta.url).href;
  const source = readFileSync(new URL("../../src/app/api/auth/session/exchange/route.js", import.meta.url), "utf8")
    .replaceAll('"@/', `"${src}`)
    .replace('"next/server"', JSON.stringify(server));
  return import(`data:text/javascript;base64,${Buffer.from(source).toString("base64")}`);
}

async function verifiedFixture() {
  const issuer = "https://studenthub-acceptance-test.supabase.co/auth/v1";
  const { publicKey, privateKey } = await generateKeyPair("ES256");
  const jwk = await exportJWK(publicKey);
  jwk.kid = "acceptance-fixture";
  const verifier = new OidcTokenVerifier({ issuer, audience: "authenticated", jwks: { keys: [jwk] } });
  const proofs = new Set();
  let sessionCount = 0;
  const sessions = {
    async createSession(identity) {
      if (proofs.has(identity.exchangeProofId)) throw Object.assign(new Error("Synthetic replay"), { code: "23505" });
      proofs.add(identity.exchangeProofId);
      sessionCount += 1;
      return { secret: "synthetic-session-secret", expiresAt: new Date(Date.now() + 60_000) };
    },
    serializeCookie() { return "studenthub_session=synthetic-session-secret; HttpOnly; SameSite=Lax"; },
  };
  async function sign(overrides = {}, key = privateKey) {
    return new SignJWT({ sub: randomUUID(), email: demoEmail, email_verified: true, ...overrides })
      .setProtectedHeader({ alg: "ES256", kid: jwk.kid }).setIssuer(issuer)
      .setAudience("authenticated").setIssuedAt().setExpirationTime("5m").sign(key);
  }
  return { service: new SessionExchangeService({ verifier, sessions }), sign, sessionCount: () => sessionCount };
}

test("acceptance mode is opt-in and every production or unknown environment fails closed", () => {
  for (const environment of [
    {}, { NODE_ENV: "test" }, { STUDENTHUB_ACCEPTANCE_MODE: "true" },
    { ...preview, VERCEL_ENV: "production" },
    { ...preview, STUDENTHUB_DEPLOYMENT_ENV: "production" },
    { ...preview, VERCEL_ENV: "unknown" },
    { ...preview, STUDENTHUB_DEPLOYMENT_ENV: "unknown" },
    { NODE_ENV: "production", STUDENTHUB_ACCEPTANCE_MODE: "true" },
    { NODE_ENV: "unknown", STUDENTHUB_ACCEPTANCE_MODE: "true" },
    { ...preview, STUDENTHUB_ACCEPTANCE_MODE: "false" },
  ]) assert.equal(isDemoAcceptanceModeEnabled(environment), false);
  for (const environment of [preview,
    { NODE_ENV: "test", STUDENTHUB_ACCEPTANCE_MODE: "true" },
    { NODE_ENV: "development", STUDENTHUB_ACCEPTANCE_MODE: "true" },
    { NODE_ENV: "production", STUDENTHUB_DEPLOYMENT_ENV: "staging", STUDENTHUB_ACCEPTANCE_MODE: "true" },
  ]) assert.equal(isDemoAcceptanceModeEnabled(environment), true);
});

test("only verified allowlisted UUID identities receive bounded isolated buckets", async () => {
  await withEnvironment(preview, async () => {
    const identities = [...DEMO_ACCOUNT_SPECS.keys()].map((email) => ({ userId: randomUUID(), email, emailVerified: true }));
    assert.equal(identities.length, 8);
    for (const identity of identities) {
      for (let i = 0; i < 20; i++) AuthRouteGuard.assertRequest(request(), { action: "UPSTREAM_OIDC_EXCHANGE", maxRequests: 20, verifiedIdentity: identity });
      assert.throws(() => AuthRouteGuard.assertRequest(request(), { action: "UPSTREAM_OIDC_EXCHANGE", maxRequests: 20, verifiedIdentity: identity }), (error) => error.statusCode === 429);
    }
    for (const identity of [null, { ...identities[0], userId: "invalid" },
      { ...identities[0], emailVerified: false }, { ...identities[0], email: "ordinary@example.edu" },
    ]) assert.equal(getDemoAcceptanceRateLimitKey(identity, "UPSTREAM_OIDC_EXCHANGE", preview), null);
    assert.equal(getDemoAcceptanceRateLimitKey(identities[0], "unbounded action\n", preview), null);
  });
});

test("ordinary and unverified identities retain the shared IP throttle in preview", async () => {
  await withEnvironment(preview, async () => {
    for (let i = 0; i < 20; i++) AuthRouteGuard.assertRequest(request(), {
      action: "UPSTREAM_OIDC_EXCHANGE", maxRequests: 20,
      verifiedIdentity: { userId: randomUUID(), email: i % 2 ? demoEmail : "ordinary@example.edu", emailVerified: false },
    });
    assert.throws(() => AuthRouteGuard.assertRequest(request(), { action: "UPSTREAM_OIDC_EXCHANGE", maxRequests: 20 }), (error) => error.statusCode === 429);
  });
});

test("preverified proofs are immutable, service-bound, token-bound and preserve one-time exchange", async () => {
  const fixture = await verifiedFixture();
  const token = await fixture.sign();
  const proof = await fixture.service.verifyProof(token);
  assert.equal(Object.isFrozen(proof), true);
  assert.equal(Object.isFrozen(proof.identity), true);
  assert.deepEqual(Object.getOwnPropertySymbols(proof), []);
  await fixture.service.exchange(token, {}, proof);
  await assert.rejects(fixture.service.exchange(token, {}, proof), (error) => error.code === "23505");
  const other = await verifiedFixture();
  await assert.rejects(other.service.exchange(token, {}, proof));
  await assert.rejects(fixture.service.exchange("forged-token", {}, proof));
  await assert.rejects(fixture.service.exchange("forged-token", {}, { identity: proof.identity }));
  assert.equal(fixture.sessionCount(), 1);
});

test("actual exchange route keeps production's preverification IP limit even when opted in", async () => {
  await withEnvironment({ ...preview, VERCEL_ENV: "production" }, async () => {
    let exchanges = 0;
    setSessionExchangeServiceForTests({
      verifyProof() { throw new Error("Production must use the normal verification path"); },
      async exchange() { exchanges++; return { cookie: "fixture=1", safeMetadata: { userId: randomUUID() } }; },
    });
    const { POST } = await exchangeRoute();
    for (let i = 0; i < 20; i++) assert.equal((await POST(request())).status, 200);
    assert.equal((await POST(request())).status, 429);
    assert.equal(exchanges, 20);
  });
});

test("actual preview exchange verifies signed identity and never returns session secrets in JSON", async () => {
  await withEnvironment(preview, async () => {
    const fixture = await verifiedFixture();
    setSessionExchangeServiceForTests(fixture.service);
    const { POST } = await exchangeRoute();
    const token = await fixture.sign();
    const response = await POST(request(token));
    assert.equal(response.status, 200);
    assert.match(response.headers.get("set-cookie"), /HttpOnly/);
    const body = await response.json();
    assert.equal(body.session.email, demoEmail);
    assert.equal(JSON.stringify(body).includes("synthetic-session-secret"), false);
    assert.equal((await POST(request(token))).status, 409);
    const forgedKey = await generateKeyPair("ES256");
    assert.equal((await POST(request(await fixture.sign({}, forgedKey.privateKey)))).status, 401);
    assert.equal(fixture.sessionCount(), 1);
  });
});

test("preview rejects cross-origin and oversized requests before verification and bounds invalid proofs", async () => {
  await withEnvironment(preview, async () => {
    let verifications = 0;
    setSessionExchangeServiceForTests({ async verifyProof() { verifications++; throw new Error("Invalid synthetic proof"); } });
    const { POST } = await exchangeRoute();
    assert.equal((await POST(request(undefined, { origin: "https://attacker.test" }))).status, 403);
    assert.equal((await POST(request(undefined, { "content-length": "65537" }))).status, 413);
    assert.equal(verifications, 0);
    RateLimiter.clear();
    for (let i = 0; i < 160; i++) assert.equal((await POST(request())).status, 401);
    assert.equal((await POST(request())).status, 429);
    assert.equal(verifications, 160);
  });
});
