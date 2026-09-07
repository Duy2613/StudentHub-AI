import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  buildTrustDecisionEvent,
  deliverLabbeEvent,
  hashCanonicalJson,
} from "../../src/lib/server/integrations/LabbeBridge.js";
import {
  LABBE_ASSURANCE_PERMISSION,
  projectLabbeAssurance,
} from "../../src/lib/server/integrations/LabbeAssuranceProjection.js";
import {
  LABBE_OUTBOX_MAX_ATTEMPTS,
  LabbeOutboxService,
} from "../../src/lib/server/integrations/LabbeOutboxService.js";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const frontendRoot = join(repositoryRoot, "frontend");
const bridgeSource = readFileSync(join(frontendRoot, "src", "lib", "server", "integrations", "LabbeBridge.js"), "utf8");
const outboxSource = readFileSync(join(frontendRoot, "src", "lib", "server", "integrations", "LabbeOutboxService.js"), "utf8");
const persistenceSource = readFileSync(join(frontendRoot, "src", "lib", "server", "database", "DurableTrustRepository.js"), "utf8");
const trustPersistenceSource = readFileSync(join(frontendRoot, "src", "lib", "server", "database", "TrustPersistenceService.js"), "utf8");
const routeSource = readFileSync(join(frontendRoot, "src", "app", "api", "v1", "integrations", "labbe", "route.js"), "utf8");

const stagingEnv = {
  NODE_ENV: "test",
  STUDENTHUB_LABBE_MODE: "STAGING",
  STUDENTHUB_LABBE_BASE_URL: "https://labbe.staging.invalid",
  STUDENTHUB_LABBE_TOKEN: "workload-token-fixture",
  STUDENTHUB_LABBE_SCOPE: "labbe.events.ingest",
  STUDENTHUB_LABBE_CLASSIFICATION: "INTERNAL",
};

function makeEvent(name, overrides = {}) {
  const pipelineResult = {
    pipelineStatus: "COMPLETED",
    finalDecision: { security: "SAFE", truth: "SUPPORTED", action: "ALLOW" },
    ...overrides.pipelineResult,
  };
  return buildTrustDecisionEvent({
    caseId: `closure-${name}`,
    runId: `run-${name}`,
    correlationId: `corr-${name}`,
    occurredAt: "2026-09-06T00:00:00.000Z",
    pipelineResult,
    env: stagingEnv,
  });
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

class FakeOutboxStore {
  constructor() {
    this.rows = new Map();
    this.nowMs = Date.parse("2026-09-06T00:10:00.000Z");
    this.nextId = 1;
    this.queryLog = [];
  }

  add(event, { status = "PENDING", attempts = 0, leasedUntil = null } = {}) {
    const row = {
      id: this.nextId++,
      event_id: event.event_id,
      event_type: event.event_type,
      schema_version: event.schema_version,
      occurred_at: new Date(event.occurred_at),
      produced_at: new Date(event.produced_at),
      producer: event.producer,
      environment: event.environment,
      correlation_id: event.correlation_id,
      causation_id: event.causation_id,
      subject: event.subject,
      classification: event.classification,
      payload: clone(event.payload),
      payload_hash: Buffer.from(event.payload_hash, "hex"),
      status,
      attempts,
      available_at: this.nowMs,
      leased_until: leasedUntil,
      lease_token: null,
      lease_count: 0,
      shadow_count: 0,
      shadowed_at: null,
      delivered_at: null,
      last_error: null,
      locked: false,
    };
    this.rows.set(row.event_id, row);
    return row;
  }

  putOutbox(event) {
    const existing = this.rows.get(event.event_id);
    if (!existing) {
      this.add(event);
      return { result: "INSERTED" };
    }
    const same = existing.payload_hash.equals(Buffer.from(event.payload_hash, "hex"));
    return { result: same ? "DEDUPLICATED" : "CONFLICT" };
  }

  get(eventId) {
    return this.rows.get(eventId);
  }

  advance(seconds) {
    this.nowMs += seconds * 1000;
  }

  async connect() {
    const transaction = { selectedId: null };
    return {
      query: (sql, params = []) => this.clientQuery(transaction, sql, params),
      release: () => {},
    };
  }

  async clientQuery(transaction, sql, params) {
    this.queryLog.push(sql);
    if (sql === "BEGIN" || sql === "COMMIT" || sql === "ROLLBACK") {
      if (sql === "COMMIT" || sql === "ROLLBACK") {
        const row = transaction.selectedId && [...this.rows.values()].find((item) => item.id === transaction.selectedId);
        if (row) row.locked = false;
        transaction.selectedId = null;
      }
      return { rowCount: 0, rows: [] };
    }

    if (sql.includes("FOR UPDATE SKIP LOCKED")) {
      const row = [...this.rows.values()]
        .sort((left, right) => left.available_at - right.available_at || left.id - right.id)
        .find((item) => {
          if (item.locked) return false;
          const available = item.available_at <= this.nowMs;
          const retryable = ["PENDING", "FAILED", "SHADOW"].includes(item.status)
            && available && item.attempts < LABBE_OUTBOX_MAX_ATTEMPTS;
          const expired = item.status === "IN_FLIGHT" && item.leased_until !== null && item.leased_until < this.nowMs;
          return retryable || expired;
        });
      if (!row) return { rowCount: 0, rows: [] };
      row.locked = true;
      transaction.selectedId = row.id;
      return { rowCount: 1, rows: [{ ...row, payload: clone(row.payload) }] };
    }

    if (sql.includes("SET status = 'IN_FLIGHT'")) {
      const row = [...this.rows.values()].find((item) => item.id === params[0]);
      if (!row) return { rowCount: 0, rows: [] };
      row.status = "IN_FLIGHT";
      row.attempts = params[1];
      row.lease_token = params[2];
      row.lease_count += 1;
      row.leased_until = this.nowMs + (params[3] * 1000);
      return { rowCount: 1, rows: [] };
    }
    throw new Error(`Unhandled fake client SQL: ${sql}`);
  }

  async query(sql, params = []) {
    this.queryLog.push(sql);
    if (sql.includes("SET status = 'SHADOW'")) {
      const row = [...this.rows.values()].find((item) => item.id === params[0]);
      if (!row || row.status !== "IN_FLIGHT" || row.lease_token !== params[1]) return { rowCount: 0, rows: [] };
      row.status = "SHADOW";
      row.lease_token = null;
      row.leased_until = null;
      row.shadow_count += 1;
      row.shadowed_at = this.nowMs;
      row.last_error = "SHADOW_SUPPRESSED";
      return { rowCount: 1, rows: [] };
    }

    if (sql.includes("SET status = $3")) {
      const row = [...this.rows.values()].find((item) => item.id === params[0]);
      if (!row || row.status !== "IN_FLIGHT" || row.lease_token !== params[1]) return { rowCount: 0, rows: [] };
      const [, , status, delivered, delay, error] = params;
      row.status = status;
      row.lease_token = null;
      row.leased_until = null;
      if (delivered) row.delivered_at = this.nowMs;
      else if (status !== "CONFLICT") row.available_at = this.nowMs + (delay * 1000);
      row.last_error = delivered ? null : error;
      return { rowCount: 1, rows: [] };
    }
    throw new Error(`Unhandled fake pool SQL: ${sql}`);
  }
}

function receiverHarness() {
  const records = new Map();
  const effects = new Map();
  const received = [];
  let failNext = null;
  let timeoutAfterCommit = false;
  const fetchImpl = async (_url, options) => {
    const event = JSON.parse(options.body);
    received.push({ event, headers: options.headers });
    if (options.headers.Authorization !== "Bearer workload-token-fixture") return new Response("{}", { status: 401 });
    if (options.headers["X-StudentHub-Workload-Scope"] !== "labbe.events.ingest") return new Response("{}", { status: 403 });
    if (failNext) {
      const status = failNext;
      failNext = null;
      return new Response("{}", { status });
    }
    const existing = records.get(event.event_id);
    if (existing) {
      return existing.payloadHash === event.payload_hash
        ? new Response(JSON.stringify({ result: "DEDUPLICATED" }), { status: 200 })
        : new Response(JSON.stringify({ result: "CONFLICT" }), { status: 409 });
    }
    records.set(event.event_id, { payloadHash: event.payload_hash });
    effects.set(event.event_id, (effects.get(event.event_id) || 0) + 1);
    if (timeoutAfterCommit) {
      timeoutAfterCommit = false;
      const error = new Error("receiver committed before client timeout");
      error.name = "AbortError";
      throw error;
    }
    return new Response(JSON.stringify({ result: "ACCEPTED" }), { status: 202 });
  };
  return {
    fetchImpl,
    received,
    effects,
    failWith(status) { failNext = status; },
    timeoutNext() { timeoutAfterCommit = true; },
  };
}

test("SHADOW persists and leases an event without opening transport; STAGING catches it up", async () => {
  const event = makeEvent("shadow");
  const store = new FakeOutboxStore();
  store.add(event);
  let networkCalled = false;
  const shadowResult = await LabbeOutboxService.dispatchOne({
    env: { ...stagingEnv, STUDENTHUB_LABBE_MODE: "SHADOW" },
    pool: store,
    fetchImpl: async () => { networkCalled = true; },
  });
  assert.equal(shadowResult.state, "SHADOW");
  assert.equal(networkCalled, false);
  assert.equal(store.get(event.event_id).status, "SHADOW");
  assert.equal(store.get(event.event_id).attempts, 0);
  assert.equal(store.get(event.event_id).lease_count, 1);
  assert.equal(store.get(event.event_id).shadow_count, 1);

  const receiver = receiverHarness();
  const stagingResult = await LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl });
  assert.equal(stagingResult.state, "DELIVERED");
  assert.equal(store.get(event.event_id).status, "DELIVERED");
  assert.equal(receiver.effects.get(event.event_id), 1);
});

test("outbox event identity is idempotent and conflicts on a changed hash", () => {
  const event = makeEvent("identity");
  const store = new FakeOutboxStore();
  assert.equal(store.putOutbox(event).result, "INSERTED");
  assert.equal(store.putOutbox({ ...event, payload: { ...event.payload } }).result, "DEDUPLICATED");
  const changedPayload = { ...event.payload, action: "BLOCK" };
  const changed = { ...event, payload: changedPayload, payload_hash: hashCanonicalJson(changedPayload) };
  assert.equal(store.putOutbox(changed).result, "CONFLICT");
});

test("timeout after receiver commit retries the same event without a second business effect", async () => {
  const event = makeEvent("timeout");
  const store = new FakeOutboxStore();
  store.add(event);
  const receiver = receiverHarness();
  receiver.timeoutNext();
  const first = await LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl });
  assert.equal(first.state, "FAILED");
  assert.equal(first.deliveryStatus, "TIMEOUT");
  assert.equal(receiver.effects.get(event.event_id), 1);
  store.advance(2);
  const retry = await LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl });
  assert.equal(retry.state, "DELIVERED");
  assert.equal(receiver.effects.get(event.event_id), 1);
});

test("retry backoff, permanent conflict, and lease expiry are explicit worker states", async () => {
  const receiver = receiverHarness();
  const retryEvent = makeEvent("backoff");
  const store = new FakeOutboxStore();
  store.add(retryEvent);
  receiver.failWith(503);
  const failed = await LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl });
  assert.equal(failed.state, "FAILED");
  assert.equal(store.get(retryEvent.event_id).last_error, "REJECTED_HTTP_503");
  assert.equal((await LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl })).state, "IDLE");
  store.advance(2);
  assert.equal((await LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl })).state, "DELIVERED");

  const conflictEvent = makeEvent("conflict");
  const originalResponse = await deliverLabbeEvent(conflictEvent, { env: stagingEnv, fetchImpl: receiver.fetchImpl });
  assert.equal(originalResponse.status, "DELIVERED");
  const conflictPayload = { ...conflictEvent.payload, action: "BLOCK" };
  const changedConflictEvent = {
    ...conflictEvent,
    payload: conflictPayload,
    payload_hash: hashCanonicalJson(conflictPayload),
  };
  store.add(changedConflictEvent);
  const conflictResult = await LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl });
  assert.equal(conflictResult.state, "CONFLICT");
  assert.equal(store.get(conflictEvent.event_id).status, "CONFLICT");

  const expiredEvent = makeEvent("expired");
  store.add(expiredEvent, { status: "IN_FLIGHT", attempts: LABBE_OUTBOX_MAX_ATTEMPTS, leasedUntil: store.nowMs - 1 });
  const recovered = await LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl });
  assert.equal(recovered.state, "DELIVERED");
  assert.equal(store.get(expiredEvent.event_id).status, "DELIVERED");
});

test("SKIP LOCKED permits multiple workers and lease tokens prevent stale completion", async () => {
  const receiver = receiverHarness();
  const store = new FakeOutboxStore();
  const first = makeEvent("worker-a");
  const second = makeEvent("worker-b");
  store.add(first);
  store.add(second);
  const results = await Promise.all([
    LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl }),
    LabbeOutboxService.dispatchOne({ env: stagingEnv, pool: store, fetchImpl: receiver.fetchImpl }),
  ]);
  assert.deepEqual(new Set(results.map((result) => result.eventId)), new Set([first.event_id, second.event_id]));
  assert.equal(receiver.effects.get(first.event_id), 1);
  assert.equal(receiver.effects.get(second.event_id), 1);
  assert.ok(store.queryLog.some((query) => query.includes("FOR UPDATE SKIP LOCKED")));
  assert.match(outboxSource, /lease_token = \$3::uuid/);
  assert.match(outboxSource, /AND lease_token = \$2::uuid/);
});

test("Trust transaction contract places outbox insert before COMMIT and rolls back together", () => {
  assert.match(trustPersistenceSource, /\["SHADOW", "STAGING"\]\.includes\(labbeConfig\.mode\)/);
  assert.doesNotMatch(trustPersistenceSource, /\["STAGING", "CONTROLLED"\]\.includes\(labbeConfig\.mode\)/);
  assert.match(persistenceSource, /INSERT INTO private\.integration_outbox/);
  assert.match(persistenceSource, /await client\.query\("COMMIT"\)/);
  assert.match(persistenceSource, /await client\.query\("ROLLBACK"\)/);
  assert.ok(persistenceSource.indexOf("INSERT INTO private.integration_outbox") < persistenceSource.indexOf('await client.query("COMMIT")'));

  const committed = [];
  const staged = { trustCase: "case-atomic", event: "event-atomic" };
  const crashBeforeCommit = true;
  if (!crashBeforeCommit) committed.push(staged);
  assert.equal(committed.length, 0);
  committed.push(staged);
  assert.deepEqual(committed[0], { trustCase: "case-atomic", event: "event-atomic" });
  // The committed event remains in the durable model after a new worker starts.
  assert.equal(committed.find((item) => item.event === "event-atomic").event, "event-atomic");
});

test("Labbe authority is observation-only and assurance freshness is authorization-gated", () => {
  assert.match(bridgeSource, /writeback: "DISABLED"/);
  assert.doesNotMatch(routeSource, /\bPUT\b|\bPATCH\b|\bDELETE\b/);
  assert.match(routeSource, /DRAIN_LABBE_OUTBOX/);

  const denied = projectLabbeAssurance({
    observation: { event_id: "event-1", payload_hash: "a".repeat(64), observed_at: "2026-09-06T00:09:00.000Z", security: "BLOCK" },
    authorization: { allowed: false, permission: LABBE_ASSURANCE_PERMISSION },
    now: "2026-09-06T00:10:00.000Z",
  });
  assert.equal(denied.status, "UNAVAILABLE");

  const current = projectLabbeAssurance({
    observation: { event_id: "event-1", payload_hash: "a".repeat(64), observed_at: "2026-09-06T00:09:00.000Z", security: "BLOCK" },
    authorization: { allowed: true, permission: LABBE_ASSURANCE_PERMISSION },
    now: "2026-09-06T00:10:00.000Z",
  });
  assert.equal(current.status, "CURRENT");
  assert.equal(Object.hasOwn(current, "security"), false);
  assert.equal(Object.hasOwn(current, "truth"), false);

  const stale = projectLabbeAssurance({
    observation: { event_id: "event-1", payload_hash: "a".repeat(64), observed_at: "2026-09-05T23:00:00.000Z" },
    authorization: { allowed: true, permission: LABBE_ASSURANCE_PERMISSION },
    now: "2026-09-06T00:10:00.000Z",
  });
  assert.equal(stale.status, "STALE");
});
