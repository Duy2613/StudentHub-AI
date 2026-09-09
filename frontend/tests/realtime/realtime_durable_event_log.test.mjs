import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { test } from "node:test";

import {
  DurableRealtimeRepository,
  normalizeRealtimeEvent,
} from "../../src/lib/server/realtime/DurableRealtimeRepository.js";

const repositoryRoot = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const migration = readFileSync(join(repositoryRoot, "database", "migrations", "202609070001_realtime_event_log.sql"), "utf8");
const streamRoute = readFileSync(join(repositoryRoot, "frontend", "src", "app", "api", "realtime", "stream", "route.js"), "utf8");
const broadcastRoute = readFileSync(join(repositoryRoot, "frontend", "src", "app", "api", "realtime", "broadcast", "route.js"), "utf8");
const USER_A = "11111111-1111-4111-8111-111111111111";
const USER_B = "22222222-2222-4222-8222-222222222222";

function rowFrom(params, sequence) {
  const [eventId, channel, eventType, subjectId, classification, producer, environment,
    correlationId, causationId, payloadJson, payloadHash, idempotencyKey, occurredAt] = params;
  return {
    sequence: String(sequence),
    event_id: eventId,
    channel,
    event_type: eventType,
    subject_id: subjectId,
    classification,
    producer,
    environment,
    correlation_id: correlationId,
    causation_id: causationId,
    payload: JSON.parse(payloadJson),
    payload_hash: Buffer.from(payloadHash, "hex"),
    idempotency_key: idempotencyKey,
    occurred_at: occurredAt,
    recorded_at: occurredAt,
  };
}

class FakePool {
  constructor() {
    this.rows = [];
  }

  async query(sql, params = []) {
    const statement = sql.replace(/\s+/g, " ").trim().toLowerCase();
    if (statement.startsWith("insert into private.realtime_events")) {
      const duplicateById = this.rows.find((row) => row.event_id === params[0]);
      if (duplicateById) {
        const error = new Error("duplicate event_id");
        error.code = "23505";
        throw error;
      }
      const duplicate = params[11] && this.rows.find((row) => row.channel === params[1] && row.idempotency_key === params[11]);
      if (duplicate) return { rows: [] };
      const row = rowFrom(params, this.rows.length + 1);
      this.rows.push(row);
      return { rows: [row] };
    }
    if (statement.startsWith("select sequence, event_id") && statement.includes("where event_id = $1")) {
      return { rows: this.rows.filter((row) => row.event_id === params[0]).slice(0, 1) };
    }
    if (statement.startsWith("select sequence, event_id") && statement.includes("where channel = $1 and idempotency_key")) {
      return { rows: this.rows.filter((row) => row.channel === params[0] && row.idempotency_key === params[1]).slice(0, 1) };
    }
    if (statement.startsWith("select sequence, event_id") && statement.includes("where channel = any")) {
      const [channels, after, subject, publicChannels, limit] = params;
      const rows = this.rows.filter((row) => channels.includes(row.channel)
        && Number(row.sequence) > Number(after)
        && ((publicChannels.includes(row.channel) && !row.subject_id) || (subject && row.subject_id === subject)))
        .slice(0, limit);
      return { rows };
    }
    if (statement.startsWith("select count(*)")) {
      return {
        rows: [{
          event_count: this.rows.length,
          latest_sequence: this.rows.length ? String(this.rows.length) : null,
          last_event_at: this.rows.at(-1)?.recorded_at || null,
        }],
      };
    }
    throw new Error(`Unexpected SQL in fake pool: ${statement}`);
  }
}

test("realtime event log migration is private, append-only, and sequence indexed", () => {
  assert.match(migration, /create table if not exists private\.realtime_events/i);
  assert.match(migration, /event_id uuid/i);
  assert.match(migration, /sequence bigint generated always as identity/i);
  assert.match(migration, /unique\(channel, idempotency_key\)/i);
  assert.match(migration, /alter table private\.realtime_events enable row level security/i);
  assert.match(migration, /realtime_events_no_update/i);
  assert.match(migration, /realtime_events_no_delete/i);
  assert.match(migration, /revoke all on private\.realtime_events from public, anon, authenticated/i);
  assert.match(migration, /grant select, insert on private\.realtime_events to service_role/i);
  assert.match(streamRoute, /last-event-id/i);
  assert.match(streamRoute, /POSTGRES_EVENT_LOG_SSE/);
  assert.match(streamRoute, /REALTIME_DURABLE_REQUIRED/);
  assert.match(broadcastRoute, /getDurableRealtimeRepository/);
  assert.match(broadcastRoute, /Realtime event type is not allowed for this channel/);
});

test("durable normalization binds private events and hashes canonical payloads", () => {
  const first = normalizeRealtimeEvent({
    eventId: "33333333-3333-4333-8333-333333333333",
    channel: "trust",
    eventType: "trust:revision",
    subjectId: USER_A,
    data: { z: "cuối", a: 1 },
    idempotencyKey: "trust-run-1",
  });
  const reordered = normalizeRealtimeEvent({
    eventId: "44444444-4444-4444-8444-444444444444",
    channel: "trust",
    eventType: "trust:revision",
    subjectId: USER_A,
    data: { a: 1, z: "cuối" },
    idempotencyKey: "trust-run-2",
  });
  assert.equal(first.payloadHash, reordered.payloadHash);
  assert.throws(() => normalizeRealtimeEvent({ channel: "trust", eventType: "trust:revision", data: {} }), /subject binding/i);
  assert.throws(() => normalizeRealtimeEvent({ channel: "presence", eventType: "presence:update", data: { bad: "\ud800" } }), /canonical JSON/i);
  assert.throws(() => normalizeRealtimeEvent({ channel: "trust", eventType: "trust:revision", subjectId: "student:1", data: {} }), /canonical user UUID/i);
});

test("durable append deduplicates identical idempotency and rejects content conflicts", async () => {
  const repository = new DurableRealtimeRepository(new FakePool());
  const request = {
    eventId: "55555555-5555-4555-8555-555555555555",
    channel: "trust",
    eventType: "trust:revision",
    subjectId: USER_A,
    data: { revision: 1, state: "COMPLETED" },
    idempotencyKey: "run-1",
  };
  const first = await repository.append(request);
  const duplicate = await repository.append({ ...request, eventId: "66666666-6666-4666-8666-666666666666" });
  assert.equal(first.sequence, 1);
  assert.equal(duplicate.sequence, first.sequence);
  assert.equal(duplicate.deduplicated, true);
  await assert.rejects(
    repository.append({ ...request, eventId: "77777777-7777-4777-8777-777777777777", data: { revision: 2, state: "FAILED" } }),
    (error) => error.code === "REALTIME_IDEMPOTENCY_CONFLICT" && error.statusCode === 409,
  );
  await assert.rejects(
    repository.append({ ...request, eventId: "88888888-8888-4888-8888-888888888888", eventType: "trust:state" }),
    (error) => error.code === "REALTIME_IDEMPOTENCY_CONFLICT" && error.statusCode === 409,
  );
});

test("event ids are immutable and subject-bound public events stay private", async () => {
  const repository = new DurableRealtimeRepository(new FakePool());
  const request = {
    eventId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    channel: "system",
    eventType: "system:notice",
    subjectId: USER_A,
    data: { n: 7 },
    idempotencyKey: "system-a-1",
    occurredAt: "2026-09-07T00:00:00.000Z",
  };
  const first = await repository.append(request);
  const same = await repository.append(request);
  assert.equal(same.deduplicated, true);
  await assert.rejects(
    repository.append({ ...request, eventType: "system:ping", idempotencyKey: "system-a-2" }),
    (error) => error.code === "REALTIME_EVENT_ID_CONFLICT" && error.statusCode === 409,
  );

  const anonymous = await repository.replay({ channels: ["system"], afterSequence: 0 });
  const userA = await repository.replay({ channels: ["system"], subjectId: USER_A, afterSequence: 0 });
  const userB = await repository.replay({ channels: ["system"], subjectId: USER_B, afterSequence: 0 });
  assert.deepEqual(anonymous, []);
  assert.deepEqual(userA.map((event) => event.data.n), [7]);
  assert.deepEqual(userB, []);
  assert.equal(first.subjectId, USER_A);
});

test("replay uses a cursor and never returns another subject's private events", async () => {
  const repository = new DurableRealtimeRepository(new FakePool());
  await repository.append({ eventId: "77777777-7777-4777-8777-777777777777", channel: "trust", eventType: "trust:revision", subjectId: USER_A, data: { n: 1 }, idempotencyKey: "a-1" });
  await repository.append({ eventId: "88888888-8888-4888-8888-888888888888", channel: "trust", eventType: "trust:revision", subjectId: USER_B, data: { n: 2 }, idempotencyKey: "b-1" });
  await repository.append({ eventId: "99999999-9999-4999-8999-999999999999", channel: "system", eventType: "system:notice", data: { n: 3 }, idempotencyKey: "system-1" });

  const first = await repository.replay({ channels: ["trust", "system"], subjectId: USER_A, afterSequence: 0 });
  assert.deepEqual(first.map((event) => event.data.n), [1, 3]);
  const resumed = await repository.replay({ channels: ["trust", "system"], subjectId: USER_A, afterSequence: first[0].sequence });
  assert.deepEqual(resumed.map((event) => event.data.n), [3]);
  assert.equal(first.some((event) => event.data.n === 2), false);
});

test("separate repository instances observe one committed log and resume by cursor", async () => {
  const pool = new FakePool();
  const publisher = new DurableRealtimeRepository(pool);
  const replica = new DurableRealtimeRepository(pool);
  const event = await publisher.append({
    eventId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    channel: "trust",
    eventType: "trust:revision",
    subjectId: USER_A,
    data: { revision: 4 },
    idempotencyKey: "shared-revision-4",
  });
  const firstRead = await replica.replay({ channels: ["trust"], subjectId: USER_A, afterSequence: 0 });
  assert.deepEqual(firstRead.map((item) => item.eventId), [event.eventId]);

  const retry = await publisher.append({
    eventId: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
    channel: "trust",
    eventType: "trust:revision",
    subjectId: USER_A,
    data: { revision: 4 },
    idempotencyKey: "shared-revision-4",
  });
  assert.equal(retry.deduplicated, true);
  const resumedRead = await replica.replay({
    channels: ["trust"],
    subjectId: USER_A,
    afterSequence: firstRead.at(-1).sequence,
  });
  assert.deepEqual(resumedRead, []);
});
