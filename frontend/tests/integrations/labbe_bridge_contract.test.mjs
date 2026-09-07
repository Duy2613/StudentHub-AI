import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildTrustDecisionEvent,
  deliverLabbeEvent,
  getLabbeReadiness,
  hashCanonicalJson,
  validateLabbeEvent,
} from "../../src/lib/server/integrations/LabbeBridge.js";

const baseEnv = {
  NODE_ENV: "test",
  STUDENTHUB_LABBE_MODE: "STAGING",
  STUDENTHUB_LABBE_BASE_URL: "https://labbe.staging.invalid",
  STUDENTHUB_LABBE_TOKEN: "workload-token-fixture",
  STUDENTHUB_LABBE_SCOPE: "labbe.events.ingest",
  STUDENTHUB_LABBE_CLASSIFICATION: "INTERNAL",
};

function eventFixture(overrides = {}) {
  const payload = {
    case_id: "case-2",
    case_revision: 1,
    run_id: "run-2",
    pipeline_status: "COMPLETED",
    security: "SAFE",
    truth: "SUPPORTED",
    action: "ALLOW",
    ...overrides.payload,
  };
  return {
    event_id: "event-2",
    event_type: "security.studenthub.trust_decision.v1",
    schema_version: "studenthub-security-event-v1",
    occurred_at: "2026-09-06T00:00:00.000Z",
    produced_at: "2026-09-06T00:00:01.000Z",
    producer: "StudentHub-AI",
    environment: "test",
    correlation_id: "corr-2",
    causation_id: "run-2",
    subject: "case:case-2",
    classification: "INTERNAL",
    payload,
    payload_hash: hashCanonicalJson(payload),
    ...overrides,
    ...(overrides.payload ? { payload, payload_hash: hashCanonicalJson(payload) } : {}),
  };
}

test("Labbe bridge emits a canonical minimal hashed Trust signal", () => {
  const event = buildTrustDecisionEvent({
    caseId: "11111111-1111-4111-8111-111111111111",
    caseRevision: 1,
    runId: "run-abc",
    pipelineResult: {
      pipelineStatus: "COMPLETED",
      finalDecision: { security: "SAFE", truth: "SUPPORTED", action: "ALLOW" },
      rawInput: "must never cross the bridge",
      screenshot: "must never cross the bridge",
      ocrText: "must never cross the bridge",
      privateEvidence: [{ secret: true }],
    },
    correlationId: "corr-abc",
    occurredAt: "2026-09-06T00:00:00.000Z",
    env: baseEnv,
  });
  assert.ok(event);
  assert.equal(event.event_type, "security.studenthub.trust_decision.v1");
  assert.match(event.payload_hash, /^[0-9a-f]{64}$/);
  assert.deepEqual(Object.keys(event.payload).sort(), [
    "action",
    "case_id",
    "case_revision",
    "pipeline_status",
    "run_id",
    "security",
    "truth",
  ].sort());
  assert.equal(Object.hasOwn(event.payload, "rawInput"), false);
  assert.equal(Object.hasOwn(event.payload, "ocrText"), false);
  assert.equal(Object.hasOwn(event.payload, "privateEvidence"), false);
  assert.equal(validateLabbeEvent(event).ok, true);
  assert.equal(getLabbeReadiness(baseEnv).delivery, "OUTBOX");
  assert.equal(getLabbeReadiness({ ...baseEnv, STUDENTHUB_LABBE_MODE: "DISABLED" }).delivery, "NONE");
});

test("DISABLED and SHADOW never open a network request; SHADOW remains outbox-backed", async () => {
  let called = false;
  const event = eventFixture();
  const fetchImpl = async () => {
    called = true;
    throw new Error("network must not be called");
  };

  const disabled = await deliverLabbeEvent(event, {
    env: { ...baseEnv, STUDENTHUB_LABBE_MODE: "DISABLED" },
    fetchImpl,
  });
  const shadow = await deliverLabbeEvent(event, {
    env: { ...baseEnv, STUDENTHUB_LABBE_MODE: "SHADOW" },
    fetchImpl,
  });
  assert.equal(disabled.status, "DISABLED");
  assert.equal(shadow.status, "SHADOW");
  assert.equal(getLabbeReadiness({ ...baseEnv, STUDENTHUB_LABBE_MODE: "SHADOW" }).delivery, "OUTBOX");
  assert.equal(called, false);
});

test("CONTROLLED is recognized but disabled for this closure pass", async () => {
  let called = false;
  const result = await deliverLabbeEvent(eventFixture(), {
    env: { ...baseEnv, STUDENTHUB_LABBE_MODE: "CONTROLLED" },
    fetchImpl: async () => { called = true; },
  });
  assert.equal(result.status, "CONTROLLED_DISABLED");
  assert.equal(getLabbeReadiness({ ...baseEnv, STUDENTHUB_LABBE_MODE: "CONTROLLED" }).delivery, "NONE");
  assert.equal(called, false);
});

test("STAGING requires HTTPS, workload scope, and pins auth/classification headers", async () => {
  let request;
  const result = await deliverLabbeEvent(eventFixture(), {
    env: baseEnv,
    fetchImpl: async (url, options) => {
      request = { url, options };
      return new Response("{}", { status: 202 });
    },
  });
  assert.equal(result.status, "DELIVERED");
  assert.match(request.url, /\/api\/v1\/integrations\/studenthub\/events$/);
  assert.equal(request.options.headers.Authorization, "Bearer workload-token-fixture");
  assert.equal(request.options.headers["Idempotency-Key"], "event-2");
  assert.equal(request.options.headers["X-StudentHub-Payload-Hash"], eventFixture().payload_hash);
  assert.equal(request.options.headers["X-StudentHub-Workload-Scope"], "labbe.events.ingest");
  assert.equal(request.options.headers["X-StudentHub-Classification"], "INTERNAL");

  const insecure = await deliverLabbeEvent(eventFixture(), {
    env: { ...baseEnv, STUDENTHUB_LABBE_BASE_URL: "http://labbe.staging.invalid" },
    fetchImpl: async () => { throw new Error("insecure target must not be called"); },
  });
  assert.equal(insecure.status, "NOT_CONFIGURED");

  const noScope = await deliverLabbeEvent(eventFixture(), {
    env: { ...baseEnv, STUDENTHUB_LABBE_SCOPE: "" },
    fetchImpl: async () => { throw new Error("unscoped target must not be called"); },
  });
  assert.equal(noScope.status, "NOT_CONFIGURED");
});

test("transport rejects unknown/private payload fields and detects hash mismatch before network", async () => {
  let called = false;
  const fetchImpl = async () => { called = true; return new Response("{}", { status: 202 }); };
  const privateEvent = eventFixture({ payload: { raw_screenshot: "private" } });
  const mismatched = { ...eventFixture(), payload_hash: "a".repeat(64) };
  const privateResult = await deliverLabbeEvent(privateEvent, { env: baseEnv, fetchImpl });
  const mismatchResult = await deliverLabbeEvent(mismatched, { env: baseEnv, fetchImpl });
  assert.equal(privateResult.status, "INVALID_EVENT");
  assert.equal(mismatchResult.status, "INVALID_EVENT");
  assert.equal(called, false);
});

test("receiver conflict and timeout remain typed delivery outcomes", async () => {
  const event = eventFixture();
  const conflict = await deliverLabbeEvent(event, {
    env: baseEnv,
    fetchImpl: async () => new Response("{}", { status: 409 }),
  });
  assert.equal(conflict.status, "CONFLICT");
  assert.equal(conflict.delivered, false);

  const timeout = await deliverLabbeEvent(event, {
    env: baseEnv,
    timeoutMs: 250,
    fetchImpl: async () => {
      const error = new Error("receiver committed before client timeout");
      error.name = "AbortError";
      throw error;
    },
  });
  assert.equal(timeout.status, "TIMEOUT");
  assert.equal(timeout.delivered, false);
});
