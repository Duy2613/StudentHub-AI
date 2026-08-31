/**
 * StudentHub AI — Security Fabric End-to-End Gateway Integration Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { SecurityFabric } from "../../src/lib/security/SecurityFabric.js";
import { TokenValidator } from "../../src/lib/security/identity/TokenValidator.js";
import { RateLimiter } from "../../src/lib/security/hardening/RateLimiter.js";
import { SecurityAuditLogger, SECURITY_EVENT_TYPE } from "../../src/lib/security/audit/SecurityAuditLogger.js";
import { AUTH_ASSURANCE_LEVEL } from "../../src/lib/security/core/SecurityPrincipal.js";

describe("Security Fabric — Master Gateway Integration", () => {
  const tokenValidator = new TokenValidator();

  beforeEach(() => {
    RateLimiter.clear();
    SecurityAuditLogger.clear();
  });

  it("should authorize valid authenticated request and inject security headers & correlation ID", async () => {
    const validToken = tokenValidator.signToken({
      sub: "student:24110001",
      email: "24110001@student.hcmute.edu.vn",
      roles: ["student"],
      scopes: ["academic:read"]
    });

    const handler = SecurityFabric.wrapHandler(
      {
        action: "READ_TRANSCRIPT",
        requiredPermission: "ACADEMIC.READ_OWN",
        requiredScopes: ["academic:read"]
      },
      async (req, params, principal, secContext) => {
        return Response.json({
          success: true,
          studentId: principal.subjectId,
          correlationId: secContext.correlationId
        });
      }
    );

    const mockRequest = new Request("https://studenthub.ai/api/academic/me/transcript", {
      headers: {
        Authorization: `Bearer ${validToken}`,
        "x-security-purpose": "ACADEMIC_PLANNING"
      }
    });

    const response = await handler(mockRequest, {});
    assert.strictEqual(response.status, 200);

    const body = await response.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.studentId, "student:24110001");

    // Check Headers
    assert.ok(response.headers.get("x-correlation-id"));
    assert.strictEqual(response.headers.get("X-Content-Type-Options"), "nosniff");
    assert.strictEqual(response.headers.get("X-Frame-Options"), "DENY");

    // Check Audit Telemetry
    const allowEvents = SecurityAuditLogger.getEvents({ eventType: SECURITY_EVENT_TYPE.AUTHZ_ALLOW });
    assert.strictEqual(allowEvents.length, 1);
    assert.strictEqual(allowEvents[0].subject, "student:24110001");
  });

  it("should reject unauthenticated request when anonymous access is disabled", async () => {
    const handler = SecurityFabric.wrapHandler(
      {
        action: "READ_TRANSCRIPT",
        requiredPermission: "ACADEMIC.READ_OWN",
        allowAnonymous: false
      },
      async () => Response.json({ success: true })
    );

    const mockRequest = new Request("https://studenthub.ai/api/academic/me/transcript");
    const response = await handler(mockRequest, {});

    assert.strictEqual(response.status, 401);
    const body = await response.json();
    assert.strictEqual(body.error.code, "UNAUTHORIZED");
  });

  it("should execute the compatibility handler embedded in policy config", async () => {
    const handler = SecurityFabric.wrapHandler({
      action: "READ_PUBLIC_SIGNAL",
      allowAnonymous: true,
      handler: async ({ request, principal, correlationId, securityContext }) => Response.json({
        path: new URL(request.url).pathname,
        subject: principal.subjectId,
        correlationId,
        sameContext: correlationId === securityContext.correlationId
      })
    });

    const response = await handler(new Request("https://studenthub.ai/api/public-signal"), {});
    assert.strictEqual(response.status, 200);
    assert.deepEqual(await response.json(), {
      path: "/api/public-signal",
      subject: "anonymous",
      correlationId: response.headers.get("x-correlation-id"),
      sameContext: true
    });
  });

  it("should fail fast when a route is configured without a handler", () => {
    assert.throws(
      () => SecurityFabric.wrapHandler({ action: "BROKEN_ROUTE" }),
      /requires a route handler function/
    );
  });

  it("should trigger rate limiting 429 when max request quota is exceeded", async () => {
    const handler = SecurityFabric.wrapHandler(
      {
        action: "GENERAL_OPERATION",
        allowAnonymous: true,
        maxRequests: 3
      },
      async () => Response.json({ ok: true })
    );

    const mockRequest = new Request("https://studenthub.ai/api/test", {
      headers: { "x-forwarded-for": "10.0.0.99" }
    });

    // 3 requests allowed
    await handler(mockRequest, {});
    await handler(mockRequest, {});
    await handler(mockRequest, {});

    // 4th request must be rejected with 429
    const response = await handler(mockRequest, {});
    assert.strictEqual(response.status, 429);
    const body = await response.json();
    assert.strictEqual(body.error.code, "RATE_LIMIT_EXCEEDED");
  });

  it("should isolate rate-limit quotas between different route actions", async () => {
    const firstAction = SecurityFabric.wrapHandler(
      { action: "ACTION_A", allowAnonymous: true, maxRequests: 1 },
      async () => Response.json({ ok: true })
    );
    const secondAction = SecurityFabric.wrapHandler(
      { action: "ACTION_B", allowAnonymous: true, maxRequests: 1 },
      async () => Response.json({ ok: true })
    );
    const request = new Request("https://studenthub.ai/api/test", {
      headers: { "x-forwarded-for": "10.0.0.100" }
    });

    assert.strictEqual((await firstAction(request, {})).status, 200);
    assert.strictEqual((await firstAction(request, {})).status, 429);
    assert.strictEqual((await secondAction(request, {})).status, 200);
  });

  it("should reject an oversized declared request before executing the handler", async () => {
    let executed = false;
    const handler = SecurityFabric.wrapHandler(
      { action: "SMALL_BODY_ONLY", allowAnonymous: true, maxBodyBytes: 16 },
      async () => {
        executed = true;
        return Response.json({ ok: true });
      }
    );
    const response = await handler(new Request("https://studenthub.ai/api/test", {
      method: "POST",
      headers: { "content-length": "17" },
      body: "12345678901234567"
    }), {});

    assert.strictEqual(response.status, 413);
    assert.strictEqual((await response.json()).error.code, "REQUEST_TOO_LARGE");
    assert.strictEqual(executed, false);
  });

  it("should return step-up challenge when high-assurance operation lacks AAL2", async () => {
    // Normal AAL1 Token attempting transcript export
    const aal1Token = tokenValidator.signToken({
      sub: "student:24110001",
      roles: ["student"],
      scopes: ["academic:read", "academic:export"],
      aal: AUTH_ASSURANCE_LEVEL.AAL1_NORMAL
    });

    const handler = SecurityFabric.wrapHandler(
      {
        action: "EXPORT_TRANSCRIPT",
        requiredPermission: "ACADEMIC.EXPORT_OWN"
      },
      async () => Response.json({ exported: true })
    );

    const mockRequest = new Request("https://studenthub.ai/api/academic/me/export", {
      headers: {
        Authorization: `Bearer ${aal1Token}`,
        "x-security-purpose": "EXPORT_REQUEST"
      }
    });

    const response = await handler(mockRequest, {});
    assert.strictEqual(response.status, 403);

    const body = await response.json();
    assert.strictEqual(body.error.code, "STEP_UP_REQUIRED");
    assert.strictEqual(body.error.stepUpChallenge.type, "STEP_UP_AUTHENTICATION");
  });
});
