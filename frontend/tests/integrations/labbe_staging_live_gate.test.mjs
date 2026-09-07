import assert from "node:assert/strict";
import crypto from "node:crypto";
import pg from "pg";
import { test, after } from "node:test";

import {
  buildTrustDecisionEvent,
  deliverLabbeEvent,
  getLabbeConfig,
  hashCanonicalJson,
} from "../../src/lib/server/integrations/LabbeBridge.js";
import { LabbeOutboxService } from "../../src/lib/server/integrations/LabbeOutboxService.js";
import { DurableTrustRepository } from "../../src/lib/server/database/DurableTrustRepository.js";

const requiredNames = [
  "STUDENTHUB_LABBE_BASE_URL",
  "STUDENTHUB_LABBE_TOKEN",
  "STUDENTHUB_LABBE_SCOPE",
  "STUDENTHUB_LABBE_TEST_DATABASE_URL",
];
const missing = requiredNames.filter((name) => !process.env[name]);
const liveEnv = { ...process.env, STUDENTHUB_LABBE_MODE: "STAGING" };
const liveReady = missing.length === 0 && getLabbeConfig(liveEnv).remoteConfigured;
let livePool = null;

function liveEvent(label, pipelineResult = {}) {
  return buildTrustDecisionEvent({
    caseId: crypto.randomUUID(),
    runId: crypto.randomUUID(),
    correlationId: `labbe-${label}-${crypto.randomUUID()}`,
    occurredAt: new Date().toISOString(),
    pipelineResult: {
      pipelineStatus: "COMPLETED",
      finalDecision: { security: "SAFE", truth: "SUPPORTED", action: "ALLOW" },
      ...pipelineResult,
    },
    env: liveEnv,
  });
}

function connectPool() {
  const sslDisabled = process.env.STUDENTHUB_LABBE_TEST_DATABASE_SSL === "disable";
  const ca = process.env.STUDENTHUB_LABBE_TEST_DATABASE_SSL_CA?.replace(/\\n/g, "\n");
  return new pg.Pool({
    connectionString: process.env.STUDENTHUB_LABBE_TEST_DATABASE_URL,
    max: 3,
    connectionTimeoutMillis: 5000,
    ssl: sslDisabled ? false : {
      rejectUnauthorized: process.env.STUDENTHUB_LABBE_TEST_DATABASE_SSL_REJECT_UNAUTHORIZED !== "false",
      ...(ca ? { ca } : {}),
    },
  });
}

after(async () => {
  await livePool?.end();
});

test("real Labbe STAGING transport: TLS, workload auth, scope, classification, Unicode hash, duplicate, and conflict", {
  skip: !liveReady && `LABBE_STAGING_BLOCKED_BY_ENV: missing ${missing.join(", ") || "valid HTTPS staging configuration"}`,
}, async () => {
  const config = getLabbeConfig(liveEnv);
  assert.equal(config.mode, "STAGING");
  assert.match(config.baseUrl, /^https:\/\//, "staging transport must use HTTPS");
  assert.ok(config.scope);
  assert.ok(config.classification);

  const event = liveEvent("primary");
  const first = await deliverLabbeEvent(event, { env: liveEnv });
  assert.equal(first.status, "DELIVERED", `initial staging delivery failed: ${first.status}`);

  const duplicate = await deliverLabbeEvent(event, { env: liveEnv });
  assert.equal(duplicate.status, "DELIVERED", `duplicate staging delivery failed: ${duplicate.status}`);

  const changedPayload = { ...event.payload, action: event.payload.action === "ALLOW" ? "BLOCK" : "ALLOW" };
  const conflict = await deliverLabbeEvent({
    ...event,
    payload: changedPayload,
    payload_hash: hashCanonicalJson(changedPayload),
  }, { env: liveEnv });
  assert.equal(conflict.status, "CONFLICT", `same event_id with changed hash did not conflict: ${conflict.status}`);

  const unicode = liveEvent("unicode", {
    finalDecision: { security: "SAFE", truth: "ĐỦ BẰNG CHỨNG", action: "ALLOW" },
  });
  assert.match(unicode.payload_hash, /^[0-9a-f]{64}$/);
  const unicodeResult = await deliverLabbeEvent(unicode, { env: liveEnv });
  assert.equal(unicodeResult.status, "DELIVERED", `Unicode hash staging delivery failed: ${unicodeResult.status}`);
});

test("real Labbe STAGING rejects wrong workload token and wrong scope", {
  skip: !liveReady && `LABBE_STAGING_BLOCKED_BY_ENV: missing ${missing.join(", ") || "valid HTTPS staging configuration"}`,
}, async () => {
  const event = liveEvent("auth-boundary");
  const wrongToken = await deliverLabbeEvent(event, {
    env: { ...liveEnv, STUDENTHUB_LABBE_TOKEN: "deliberately-wrong-token" },
  });
  assert.equal(wrongToken.status, "UNAUTHORIZED", `wrong token was not rejected: ${wrongToken.status}`);

  const wrongScope = await deliverLabbeEvent(event, {
    env: { ...liveEnv, STUDENTHUB_LABBE_SCOPE: "labbe.events.invalid" },
  });
  assert.equal(wrongScope.status, "FORBIDDEN", `wrong scope was not rejected: ${wrongScope.status}`);
});

test("real Labbe STAGING transaction, restart, lease worker, and catch-up gate", {
  skip: !liveReady && `LABBE_STAGING_BLOCKED_BY_ENV: missing ${missing.join(", ") || "valid HTTPS staging/database configuration"}`,
}, async () => {
  livePool = connectPool();
  const user = await livePool.query("SELECT id FROM auth.users LIMIT 1");
  assert.ok(user.rows[0]?.id, "a disposable authenticated owner is required");
  const ownerId = user.rows[0].id;
  const event = liveEvent("outbox");
  const failedCaseId = crypto.randomUUID();
  const conflictCaseId = crypto.randomUUID();
  const cleanupCaseIds = [event.payload.case_id, failedCaseId, conflictCaseId];

  try {
    const persisted = await DurableTrustRepository.persistTrustRecord({
      pool: livePool,
      caseRecord: { id: event.payload.case_id, ownerId, state: "INSUFFICIENT_EVIDENCE", visibility: "PRIVATE" },
      input: { id: crypto.randomUUID(), type: "text", content: "staging assurance synthetic input", metadata: {} },
      outboxEvents: [{ ...event, aggregateType: "TRUST_CASE", aggregateId: event.payload.case_id }],
    });
    assert.equal(persisted.persisted, true);
    assert.equal(persisted.counts.outbox, 1);

    const committed = await livePool.query("SELECT status, attempts, payload_hash FROM private.integration_outbox WHERE event_id = $1", [event.event_id]);
    assert.equal(committed.rows[0].status, "PENDING");
    assert.equal(committed.rows[0].attempts, 0);

    await livePool.end();
    livePool = connectPool();
    const afterRestart = await livePool.query("SELECT event_id FROM private.integration_outbox WHERE event_id = $1", [event.event_id]);
    assert.equal(afterRestart.rows[0].event_id, event.event_id, "committed outbox event must survive worker restart");

    const delivery = await LabbeOutboxService.dispatchOne({ env: liveEnv, pool: livePool });
    assert.equal(delivery.state, "DELIVERED");

    await assert.rejects(
      () => DurableTrustRepository.persistTrustRecord({
        pool: livePool,
        caseRecord: { id: failedCaseId, ownerId, state: "INSUFFICIENT_EVIDENCE", visibility: "PRIVATE" },
        input: { id: crypto.randomUUID(), type: "text", content: "rollback assurance synthetic input", metadata: {} },
        outboxEvents: [{ ...event, event_id: `invalid-${crypto.randomUUID()}`, payload_hash: "0".repeat(64), aggregateType: "TRUST_CASE", aggregateId: failedCaseId }],
      }),
      /OUTBOX_EVENT_INVALID/,
    );
    assert.equal((await livePool.query("SELECT count(*)::int AS count FROM public.trust_cases WHERE id = $1", [failedCaseId])).rows[0].count, 0);

    const changedPayload = { ...event.payload, action: "BLOCK" };
    await assert.rejects(
      () => DurableTrustRepository.persistTrustRecord({
        pool: livePool,
        caseRecord: { id: conflictCaseId, ownerId, state: "INSUFFICIENT_EVIDENCE", visibility: "PRIVATE" },
        input: { id: crypto.randomUUID(), type: "text", content: "conflict assurance synthetic input", metadata: {} },
        outboxEvents: [{ ...event, payload: changedPayload, payload_hash: hashCanonicalJson(changedPayload), aggregateType: "TRUST_CASE", aggregateId: conflictCaseId }],
      }),
      /OUTBOX_EVENT_CONFLICT/,
    );
    assert.equal((await livePool.query("SELECT count(*)::int AS count FROM public.trust_cases WHERE id = $1", [conflictCaseId])).rows[0].count, 0);
  } finally {
    await livePool.query("DELETE FROM private.integration_outbox WHERE event_id = $1", [event.event_id]).catch(() => {});
    await livePool.query("DELETE FROM public.case_inputs WHERE case_id = ANY($1::uuid[])", [cleanupCaseIds]).catch(() => {});
    await livePool.query("DELETE FROM public.trust_cases WHERE id = ANY($1::uuid[])", [cleanupCaseIds]).catch(() => {});
  }
});

const timeoutUrl = process.env.STUDENTHUB_LABBE_TIMEOUT_URL;
test("real Labbe receiver timeout is observable and retryable", {
  skip: !liveReady || !timeoutUrl ? "LABBE_STAGING_BLOCKED_BY_ENV: STUDENTHUB_LABBE_TIMEOUT_URL is required for the controlled timeout probe" : false,
}, async () => {
  const result = await deliverLabbeEvent(liveEvent("timeout"), {
    env: { ...liveEnv, STUDENTHUB_LABBE_BASE_URL: timeoutUrl },
    timeoutMs: 1000,
  });
  assert.equal(result.status, "TIMEOUT");
});

const outageUrl = process.env.STUDENTHUB_LABBE_OUTAGE_URL;
test("real Labbe receiver outage remains unavailable", {
  skip: !liveReady || !outageUrl ? "LABBE_STAGING_BLOCKED_BY_ENV: STUDENTHUB_LABBE_OUTAGE_URL is required for the controlled outage probe" : false,
}, async () => {
  const result = await deliverLabbeEvent(liveEvent("outage"), {
    env: { ...liveEnv, STUDENTHUB_LABBE_BASE_URL: outageUrl },
    timeoutMs: 1000,
  });
  assert.ok(["UNAVAILABLE", "TIMEOUT", "REJECTED"].includes(result.status));
});
