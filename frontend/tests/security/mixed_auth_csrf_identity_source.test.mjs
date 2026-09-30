import assert from "node:assert/strict";
import { test } from "node:test";

import { SecurityError } from "../../src/lib/security/core/SecurityErrorEnvelope.js";
import { SecurityPrincipal } from "../../src/lib/security/core/SecurityPrincipal.js";
import { SecurityFabric } from "../../src/lib/security/SecurityFabric.js";
import { IdentityResolver } from "../../src/lib/security/identity/IdentityResolver.js";

async function invokeMutation(headers) {
  let handlerInvoked = false;
  const route = SecurityFabric.wrapHandler(
    { action: "CSRF_SOURCE_REGRESSION", allowAnonymous: true, rateLimit: false },
    async () => {
      handlerInvoked = true;
      return Response.json({ ok: true });
    },
  );

  const response = await route(new Request("https://studenthub.test/api/csrf-fixture", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: "{}",
  }));

  return { response, handlerInvoked };
}

test("cookie identity source controls CSRF for cookie-only and mixed-auth mutations", async () => {
  const originalResolvePrincipal = IdentityResolver.resolvePrincipal;
  IdentityResolver.resolvePrincipal = async () => SecurityPrincipal.anonymous();

  try {
    const mixedCrossOrigin = await invokeMutation({
      cookie: "studenthub_session=synthetic-session-fixture",
      authorization: "Bearer synthetic-bearer-fixture",
      origin: "https://attacker.test",
    });
    assert.equal(mixedCrossOrigin.response.status, 403);
    assert.equal(mixedCrossOrigin.handlerInvoked, false);

    const cookieSameOrigin = await invokeMutation({
      cookie: "studenthub_session=synthetic-session-fixture",
      origin: "https://studenthub.test",
    });
    assert.equal(cookieSameOrigin.response.status, 200);
    assert.equal(cookieSameOrigin.handlerInvoked, true);

    const cookieCrossOrigin = await invokeMutation({
      cookie: "sb-access-token=synthetic-provider-cookie-fixture",
      origin: "https://attacker.test",
    });
    assert.equal(cookieCrossOrigin.response.status, 403);
    assert.equal(cookieCrossOrigin.handlerInvoked, false);

    const bearerCrossOrigin = await invokeMutation({
      authorization: "Bearer synthetic-bearer-fixture",
      origin: "https://attacker.test",
    });
    assert.equal(bearerCrossOrigin.response.status, 200);
    assert.equal(bearerCrossOrigin.handlerInvoked, true);
  } finally {
    IdentityResolver.resolvePrincipal = originalResolvePrincipal;
  }
});

test("an invalid cookie remains authoritative and cannot fall back to Bearer", async () => {
  const originalResolveFromDurableSession = IdentityResolver.resolveFromDurableSession;
  const originalResolveFromToken = IdentityResolver.resolveFromToken;
  let bearerResolutionCalled = false;

  IdentityResolver.resolveFromDurableSession = async () => {
    throw SecurityError.unauthorized("Synthetic invalid-session fixture.");
  };
  IdentityResolver.resolveFromToken = () => {
    bearerResolutionCalled = true;
    throw new Error("Bearer fallback must not run when a cookie is present.");
  };

  try {
    await assert.rejects(
      IdentityResolver.resolvePrincipal(new Request("https://studenthub.test/api/csrf-fixture", {
        method: "POST",
        headers: {
          cookie: "studenthub_session=synthetic-invalid-session-fixture",
          authorization: "Bearer synthetic-bearer-fixture",
        },
      })),
      (error) => error.statusCode === 401,
    );
    assert.equal(bearerResolutionCalled, false);
  } finally {
    IdentityResolver.resolveFromDurableSession = originalResolveFromDurableSession;
    IdentityResolver.resolveFromToken = originalResolveFromToken;
  }
});
