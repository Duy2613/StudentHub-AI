import test from "node:test";
import assert from "node:assert/strict";
import { runTrustContinuation } from "../../src/app/api/v1/trust/continue/route.js";

test("Client Anti-Tamper — Continuation endpoint rejects client-supplied layer2 or layer3 payloads", async () => {
  const fakePrincipal = {
    subjectId: "user:11111111-1111-4111-8111-111111111111",
    isAuthenticated: true,
  };

  const fakeRequest = {
    json: async () => ({
      caseId: "case_123",
      runId: "run_456",
      // Tampering payload: client trying to force clean layer2
      layer2: {
        threatIntel: "SAFE",
        mediaForensics: { isReal: true },
      },
    }),
  };

  const response = await runTrustContinuation(fakeRequest, {}, fakePrincipal, {});
  assert.equal(response.status, 400);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.error.code, "CLIENT_SUPPLIED_STAGE_REJECTED");
  assert.match(data.error.message, /server-owned/i);
});

test("Client Anti-Tamper — Continuation endpoint rejects unauthenticated requests", async () => {
  const anonPrincipal = null;
  const fakeRequest = {
    json: async () => ({
      caseId: "case_123",
      runId: "run_456",
    }),
  };

  const response = await runTrustContinuation(fakeRequest, {}, anonPrincipal, {});
  assert.equal(response.status, 401);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.error.code, "UNAUTHORIZED");
});

test("Client Anti-Tamper — Missing caseId or runId is rejected", async () => {
  const fakePrincipal = {
    subjectId: "user:11111111-1111-4111-8111-111111111111",
    isAuthenticated: true,
  };

  const fakeRequest = {
    json: async () => ({
      caseId: "case_123",
      // runId is missing
    }),
  };

  const response = await runTrustContinuation(fakeRequest, {}, fakePrincipal, {});
  assert.equal(response.status, 400);

  const data = await response.json();
  assert.equal(data.success, false);
  assert.equal(data.error.code, "CASE_AND_RUN_REQUIRED");
});
