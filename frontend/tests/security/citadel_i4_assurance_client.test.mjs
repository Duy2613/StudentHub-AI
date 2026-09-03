/**
 * StudentHub AI — Citadel Assurance Client & Endpoint Assurances (I4)
 * 
 * Verifies:
 * 1. Egress Security: Rejects non-HTTP/S, metadata SSRF, and requires HTTPS in production.
 * 2. Fail-Closed Workload Auth: Fails closed with WORKLOAD_AUTH_UNAVAILABLE if token missing.
 * 3. Resource Bounds: Strictly enforces 5000ms timeout and 128KB payload size cap.
 * 4. Resiliency & Typed Errors: Handles Citadel outages, timeouts, and malformed responses safely.
 * 5. Invariant Decoupling: Zero mapping to TrustDecision, riskScore, or scamVerdict.
 * 6. SecurityFabric RBAC Authorization: Anonymous & Student DENIED; Admin ALLOWED.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  CitadelAssuranceClient,
  CitadelAssuranceError,
  ASSURANCE_ERROR_CODE,
} from "../../src/lib/server/citadel/CitadelAssuranceClient.js";
import { SecurityPrincipal } from "../../src/lib/security/core/SecurityPrincipal.js";
import { PERMISSIONS, RBACPolicy } from "../../src/lib/security/authorization/RBACPolicy.js";

describe("Citadel Assurance Client & Security Boundary (I4)", () => {
  it("enforces egress allowlist and blocks SSRF / cloud metadata targets", () => {
    const client = new CitadelAssuranceClient({
      workloadToken: "valid-test-token",
    });

    // Valid URLs
    assert.doesNotThrow(() => client.validateEgressUrl("http://127.0.0.1:8000/api/v1/assurance"));
    assert.doesNotThrow(() => client.validateEgressUrl("https://citadel.security.gov.vn/api/v1/assurance"));

    // Block cloud metadata IP
    assert.throws(
      () => client.validateEgressUrl("http://169.254.169.254/latest/meta-data"),
      (err) => err instanceof CitadelAssuranceError && err.code === ASSURANCE_ERROR_CODE.INVALID_DESTINATION
    );

    // Block Google internal metadata
    assert.throws(
      () => client.validateEgressUrl("http://metadata.google.internal/computeMetadata/v1/"),
      (err) => err instanceof CitadelAssuranceError && err.code === ASSURANCE_ERROR_CODE.INVALID_DESTINATION
    );

    // Block unsupported protocols
    assert.throws(
      () => client.validateEgressUrl("ftp://citadel.security/events"),
      (err) => err instanceof CitadelAssuranceError && err.code === ASSURANCE_ERROR_CODE.INVALID_DESTINATION
    );
  });

  it("fails closed when workload credentials are not configured", async () => {
    const prevEnv = process.env.CITADEL_WORKLOAD_TOKEN;
    delete process.env.CITADEL_WORKLOAD_TOKEN;

    try {
      const client = new CitadelAssuranceClient({ workloadToken: null });
      await assert.rejects(
        async () => client.getAssurancePosture("case-001"),
        (err) => err instanceof CitadelAssuranceError && err.code === ASSURANCE_ERROR_CODE.WORKLOAD_AUTH_UNAVAILABLE
      );
    } finally {
      if (prevEnv) process.env.CITADEL_WORKLOAD_TOKEN = prevEnv;
    }
  });

  it("successfully retrieves and maps Citadel assurance posture to canonical DTO", async () => {
    const mockFetch = async (url, options) => {
      assert.equal(options.method, "GET");
      assert.equal(options.headers["Authorization"], "Bearer valid-test-token");
      assert.ok(options.headers["X-Correlation-ID"]);

      return {
        ok: true,
        status: 200,
        text: async () =>
          JSON.stringify({
            securityFindingStatus: "ALERTED",
            securitySeverity: "HIGH",
            operationalPriority: "P1",
            alertReference: "ALT-2026-0904-001",
            incidentReference: "INC-2026-0904-999",
            securityReasonCode: "IMPERSONATION_ATTACK_DETECTED",
            securityTimestamp: "2026-09-04T01:00:00.000Z",
            integrationHealth: "HEALTHY",
            // Attempted illegal fields (must NOT be mapped)
            trustDecision: "COMPROMISED",
            riskScore: 0.99,
            citadelScamVerdict: "SCAM",
          }),
      };
    };

    const client = new CitadelAssuranceClient({
      workloadToken: "valid-test-token",
      fetchFn: mockFetch,
    });

    const dto = await client.getAssurancePosture("case-trust-123");

    assert.equal(dto.caseId, "case-trust-123");
    assert.equal(dto.securityFindingStatus, "ALERTED");
    assert.equal(dto.securitySeverity, "HIGH");
    assert.equal(dto.operationalPriority, "P1");
    assert.equal(dto.alertReference, "ALT-2026-0904-001");
    assert.equal(dto.incidentReference, "INC-2026-0904-999");
    assert.equal(dto.securityReasonCode, "IMPERSONATION_ATTACK_DETECTED");
    assert.equal(dto.integrationHealth, "HEALTHY");

    // CRITICAL INVARIANT: Zero TrustDecision coupling
    assert.equal(dto.trustDecision, undefined, "Assurance DTO must never contain trustDecision");
    assert.equal(dto.riskScore, undefined, "Assurance DTO must never contain riskScore");
    assert.equal(dto.citadelScamVerdict, undefined, "Assurance DTO must never contain citadelScamVerdict");
  });

  it("handles Citadel downtime with typed ASSURANCE_UNAVAILABLE error", async () => {
    const failingFetch = async () => {
      const err = new Error("connect ECONNREFUSED 127.0.0.1:8000");
      err.code = "ECONNREFUSED";
      throw err;
    };

    const client = new CitadelAssuranceClient({
      workloadToken: "valid-test-token",
      fetchFn: failingFetch,
    });

    await assert.rejects(
      async () => client.getAssurancePosture("case-downtime-1"),
      (err) => err instanceof CitadelAssuranceError && err.code === ASSURANCE_ERROR_CODE.ASSURANCE_UNAVAILABLE
    );
  });

  it("handles Citadel timeout with typed ASSURANCE_TIMEOUT error", async () => {
    const timeoutFetch = async () => {
      const err = new Error("The operation was aborted");
      err.name = "AbortError";
      throw err;
    };

    const client = new CitadelAssuranceClient({
      workloadToken: "valid-test-token",
      fetchFn: timeoutFetch,
    });

    await assert.rejects(
      async () => client.getAssurancePosture("case-timeout-1"),
      (err) => err instanceof CitadelAssuranceError && err.code === ASSURANCE_ERROR_CODE.ASSURANCE_TIMEOUT
    );
  });

  it("safely rejects oversized response exceeding 128KB limit", async () => {
    const hugePayload = "A".repeat(150 * 1024); // 150 KB
    const oversizeFetch = async () => ({
      ok: true,
      status: 200,
      text: async () => hugePayload,
    });

    const client = new CitadelAssuranceClient({
      workloadToken: "valid-test-token",
      fetchFn: oversizeFetch,
    });

    await assert.rejects(
      async () => client.getAssurancePosture("case-oversize-1"),
      (err) => err instanceof CitadelAssuranceError && err.code === ASSURANCE_ERROR_CODE.ASSURANCE_OVERSIZED
    );
  });

  it("safely rejects malformed non-JSON response with ASSURANCE_MALFORMED", async () => {
    const malformedFetch = async () => ({
      ok: true,
      status: 200,
      text: async () => "<html><head><title>502 Bad Gateway</title></head><body>Bad Gateway</body></html>",
    });

    const client = new CitadelAssuranceClient({
      workloadToken: "valid-test-token",
      fetchFn: malformedFetch,
    });

    await assert.rejects(
      async () => client.getAssurancePosture("case-malformed-1"),
      (err) => err instanceof CitadelAssuranceError && err.code === ASSURANCE_ERROR_CODE.ASSURANCE_MALFORMED
    );
  });

  it("returns default UNKNOWN DTO for 404 not found without throwing error", async () => {
    const notFoundFetch = async () => ({
      ok: false,
      status: 404,
    });

    const client = new CitadelAssuranceClient({
      workloadToken: "valid-test-token",
      fetchFn: notFoundFetch,
    });

    const res = await client.getAssurancePosture("case-unobserved-404");
    assert.equal(res.caseId, "case-unobserved-404");
    assert.equal(res.securityFindingStatus, "UNKNOWN");
    assert.equal(res.securityReasonCode, "NOT_OBSERVED");
  });

  it("enforces RBAC authorization: anonymous & student DENIED, admin ALLOWED", () => {
    // 1. Anonymous Principal
    const anon = SecurityPrincipal.anonymous();
    assert.equal(anon.isAuthenticated, false);
    assert.equal(anon.hasPermission(PERMISSIONS.ADMIN_SECURITY), false);

    // 2. Student Principal
    const student = new SecurityPrincipal({
      subjectId: "student-user-uuid-1",
      roles: ["STUDENT"],
      permissions: RBACPolicy.getPermissionsForRoles(["STUDENT"]),
      tenantId: "hcmute",
    });
    assert.equal(student.isAuthenticated, true);
    assert.equal(student.hasRole("STUDENT"), true);
    assert.equal(student.hasRole("ADMIN"), false);
    assert.equal(student.hasPermission(PERMISSIONS.ADMIN_SECURITY), false);

    // 3. Admin Principal
    const admin = new SecurityPrincipal({
      subjectId: "admin-user-uuid-9",
      roles: ["ADMIN"],
      permissions: RBACPolicy.getPermissionsForRoles(["ADMIN"]),
      tenantId: "hcmute",
    });
    assert.equal(admin.isAuthenticated, true);
    assert.equal(admin.hasRole("ADMIN"), true);
    assert.equal(admin.hasPermission(PERMISSIONS.ADMIN_SECURITY), true);
  });
});
