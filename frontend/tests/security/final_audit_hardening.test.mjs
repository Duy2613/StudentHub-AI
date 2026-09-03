/**
 * Final audit regression coverage for the boundaries that are easy to regress
 * while adding routes or swapping providers.
 */

import { describe, it, after } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  isPrivateAddress,
  isRedirectStatus,
  validateRemoteUrlSync
} from "../../src/lib/security/hardening/SafeRemoteUrl.js";
import {
  SECURITY_ERROR_CODE,
  SecurityError
} from "../../src/lib/security/core/SecurityErrorEnvelope.js";
import { SecurityPrincipal, PRINCIPAL_TYPE } from "../../src/lib/security/core/SecurityPrincipal.js";
import { IdentityResolver } from "../../src/lib/security/identity/IdentityResolver.js";
import { setDurableSessionServiceForTests } from "../../src/lib/security/identity/DurableSessionService.js";
import { AiTrustStore } from "../../src/lib/intelligence/trust/aiTrustStore.js";
import { AiTrustModel, EPISTEMIC_STATE } from "../../src/lib/intelligence/trust/aiTrustModel.js";
import { AIObservatoryEngine } from "../../src/lib/ai-trust/observatory/AIObservatoryEngine.js";
import { InstitutionalRssConnector } from "../../src/lib/intelligence/social/InstitutionalRssConnector.js";

describe("Final audit hardening boundaries", () => {
  it("rejects SSRF targets and unsafe URL forms before a network request", () => {
    const rejected = [
      "ftp://example.com/file",
      "javascript:alert(1)",
      "https://user:password@example.com/private",
      "http://localhost:3000/health",
      "http://127.0.0.1:8080/admin",
      "http://169.254.169.254/latest/meta-data",
      "http://[::1]/",
      "http://[fc00::1]/",
      "http://[::ffff:127.0.0.1]/"
    ];

    for (const value of rejected) {
      assert.equal(validateRemoteUrlSync(value).ok, false, value);
    }

    const allowed = validateRemoteUrlSync("https://example.com/reference");
    assert.equal(allowed.ok, true);
    assert.equal(allowed.hostname, "example.com");
    assert.equal(isPrivateAddress("10.0.0.1"), true);
    assert.equal(isPrivateAddress("2001:db8::1"), false);
    assert.equal(isRedirectStatus(307), true);
    assert.equal(isRedirectStatus(200), false);
  });

  it("returns a generic, correlated error contract without internal exception text", () => {
    const error = new SecurityError({
      code: SECURITY_ERROR_CODE.INTERNAL_SECURITY_ERROR,
      message: "password=super-secret database stack trace",
      statusCode: 500,
      correlationId: "audit-request-1",
      details: { retryable: true }
    });
    const payload = error.toResponsePayload();

    assert.equal(payload.error.code, "INTERNAL_SECURITY_ERROR");
    assert.equal(payload.error.requestId, "audit-request-1");
    assert.equal(payload.error.retryable, true);
    assert.equal(payload.error.message.includes("super-secret"), false);
    assert.equal(payload.error.userMessage.includes("database"), false);

    const rateLimited = SecurityError.rateLimited("raw limiter details", "audit-request-2");
    assert.equal(rateLimited.toResponsePayload().error.retryable, true);
  });

  it("fails closed on malformed credential cookies", async () => {
    const request = new Request("https://studenthub.ai/api/session", {
      headers: {
        cookie: "studenthub_session=%ZZ",
        authorization: "Bearer a-valid-looking-compatibility-token"
      }
    });
    await assert.rejects(
      IdentityResolver.resolvePrincipal(request),
      error => error?.code === SECURITY_ERROR_CODE.UNAUTHORIZED
    );
  });

  it("treats the server-owned cookie as authoritative over a conflicting bearer", async () => {
    setDurableSessionServiceForTests({
      validateSession: async () => ({ user_id: "cookie-authority-user", roles: ["STUDENT"] })
    });

    try {
      const request = new Request("https://studenthub.ai/api/session", {
        headers: {
          cookie: "studenthub_session=opaque-cookie",
          authorization: "Bearer this-conflicting-token-must-not-win"
        }
      });
      const principal = await IdentityResolver.resolvePrincipal(request);
      assert.equal(principal.subjectId, "cookie-authority-user");
    } finally {
      setDurableSessionServiceForTests(undefined);
    }
  });

  it("enforces owner isolation for persisted Trust evaluations", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "studenthub-audit-trust-"));
    const storagePath = path.join(tempDir, "evaluations.json");
    AiTrustStore.setStoragePath(storagePath);
    AiTrustStore.clear();

    const evaluation = AiTrustModel.createEpistemicEvaluation({
      evaluationId: "EVAL_AUDIT_OWNER_A",
      ownerId: "student:owner-a",
      query: "owner isolated query",
      epistemicState: EPISTEMIC_STATE.SUPPORTED,
      claims: [{ claimId: "CLAIM_AUDIT_OWNER_A", text: "owned claim" }],
      evidenceSpans: [{ evidenceId: "EVID_AUDIT_OWNER_A", sourceId: "SRC_AUDIT", passage: "owned evidence" }]
    });
    AiTrustStore.saveEvaluation(evaluation);

    const owner = new SecurityPrincipal({
      subjectId: "student:owner-a",
      principalType: PRINCIPAL_TYPE.STUDENT,
      scopes: ["trust:read"]
    });
    const otherStudent = new SecurityPrincipal({
      subjectId: "student:owner-b",
      principalType: PRINCIPAL_TYPE.STUDENT,
      scopes: ["trust:read"]
    });

    assert.ok(AiTrustStore.getEvaluationForPrincipal("EVAL_AUDIT_OWNER_A", owner));
    assert.equal(AiTrustStore.getEvaluationForPrincipal("EVAL_AUDIT_OWNER_A", otherStudent), null);
    assert.ok(AiTrustStore.getClaimForPrincipal("CLAIM_AUDIT_OWNER_A", owner));
    assert.equal(AiTrustStore.getEvidenceForPrincipal("EVID_AUDIT_OWNER_A", otherStudent), null);
    assert.equal(AiTrustStore.getEvaluationForPrincipal("EVAL_TOEIC_K24_GOLD", otherStudent), null);

    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("labels observability telemetry as synthetic and non-authoritative", () => {
    const snapshot = AIObservatoryEngine.getObservatorySnapshot();
    assert.equal(snapshot.environment, "LOCAL_SYNTHETIC_BENCHMARK");
    assert.equal(snapshot.sourceState, "SYNTHETIC_FIXTURE");
    assert.equal(snapshot.isAuthoritative, false);
    assert.equal(snapshot.constitution_compliance.fixture_backed, true);
    assert.equal(snapshot.models.champion.cost_state, "NOT_MEASURED");
    assert.equal(snapshot.models.champion.cost_per_query, null);
  });

  it("keeps configured RSS connectors inside the outbound URL and body limits", async () => {
    const previousMode = process.env.DATA_MODE;
    const previousFetch = globalThis.fetch;
    let calls = 0;
    process.env.DATA_MODE = "REAL";
    globalThis.fetch = async () => {
      calls += 1;
      return new Response("x".repeat((1024 * 1024) + 1), { status: 200 });
    };

    try {
      const blocked = new InstitutionalRssConnector({ feedUrls: ["http://127.0.0.1:8080/internal"] });
      await blocked.syncIncremental();
      assert.equal(calls, 0);

      const bounded = new InstitutionalRssConnector({ feedUrls: ["https://example.com/feed.xml"] });
      const result = await bounded.syncIncremental();
      assert.equal(calls, 1);
      assert.deepEqual(result.items, []);
    } finally {
      globalThis.fetch = previousFetch;
      if (previousMode === undefined) delete process.env.DATA_MODE;
      else process.env.DATA_MODE = previousMode;
    }
  });
});

after(() => {
  // Avoid leaking fixture state into another test file when this suite is
  // embedded in a larger Node process.
  AiTrustStore.clear();
});
