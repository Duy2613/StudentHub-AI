import crypto from "node:crypto";

import { hashCanonicalJson } from "../integrations/CanonicalJson.js";
import { getPostgresPool } from "../database/PostgresPool.js";

export const REALTIME_PUBLIC_CHANNELS = Object.freeze(["system", "presence"]);
export const REALTIME_CLASSIFICATIONS = Object.freeze([
  "PUBLIC",
  "INTERNAL",
  "CONFIDENTIAL",
  "RESTRICTED",
]);

const CHANNEL_PATTERN = /^[a-z][a-z0-9._:-]{0,127}$/;
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9._:-]{0,127}$/;
const IDENTIFIER_PATTERN = /^[A-Za-z0-9_.:@/-]{1,160}$/;
const SUBJECT_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EVENT_ID_PATTERN = SUBJECT_PATTERN;
const MAX_PAYLOAD_BYTES = 64 * 1024;
const MAX_REPLAY = 200;

function bounded(value, max, fallback = "") {
  const text = String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return text || fallback;
}

function jsonByteLength(value) {
  const serialized = JSON.stringify(value);
  const bytes = new TextEncoder().encode(serialized).byteLength;
  if (bytes > MAX_PAYLOAD_BYTES) {
    const error = new Error(`Realtime event payload exceeds ${MAX_PAYLOAD_BYTES} bytes.`);
    error.code = "REALTIME_PAYLOAD_TOO_LARGE";
    error.statusCode = 413;
    throw error;
  }
  return bytes;
}

function normalizePayload(payload) {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    const error = new Error("Realtime event payload must be a JSON object.");
    error.code = "REALTIME_PAYLOAD_OBJECT_REQUIRED";
    error.statusCode = 400;
    throw error;
  }
  try {
    jsonByteLength(payload);
    // hashCanonicalJson rejects non-finite values, unsupported values and
    // lone surrogates instead of silently changing the event bytes.
    return { payload, payloadHash: hashCanonicalJson(payload) };
  } catch (error) {
    if (error?.statusCode) throw error;
    const wrapped = new Error("Realtime event payload is not canonical JSON.");
    wrapped.code = "REALTIME_PAYLOAD_INVALID";
    wrapped.statusCode = 400;
    throw wrapped;
  }
}

function subjectValue(value) {
  if (value === null || value === undefined || value === "") return null;
  const candidate = String(value).trim();
  if (!SUBJECT_PATTERN.test(candidate)) {
    const error = new Error("Realtime event subject must be a canonical user UUID.");
    error.code = "REALTIME_SUBJECT_INVALID";
    error.statusCode = 400;
    throw error;
  }
  return candidate.toLowerCase();
}

function normalizeEvent(input = {}, { environment = process.env.NODE_ENV || "development" } = {}) {
  const channel = bounded(input.channel, 128).toLowerCase();
  const eventType = bounded(input.eventType ?? input.event_type, 128).toLowerCase();
  if (!CHANNEL_PATTERN.test(channel)) {
    const error = new Error("Realtime channel is invalid.");
    error.code = "REALTIME_CHANNEL_INVALID";
    error.statusCode = 400;
    throw error;
  }
  if (!EVENT_TYPE_PATTERN.test(eventType)) {
    const error = new Error("Realtime event type is invalid.");
    error.code = "REALTIME_EVENT_TYPE_INVALID";
    error.statusCode = 400;
    throw error;
  }
  const { payload, payloadHash } = normalizePayload(input.data ?? input.payload);
  const subjectId = subjectValue(input.subjectId ?? input.subject_id);
  if (!REALTIME_PUBLIC_CHANNELS.includes(channel) && !subjectId) {
    const error = new Error("Private realtime events require a subject binding.");
    error.code = "REALTIME_SUBJECT_REQUIRED";
    error.statusCode = 400;
    throw error;
  }
  const classification = bounded(input.classification, 32, "INTERNAL").toUpperCase();
  if (!REALTIME_CLASSIFICATIONS.includes(classification)) {
    const error = new Error("Realtime classification is invalid.");
    error.code = "REALTIME_CLASSIFICATION_INVALID";
    error.statusCode = 400;
    throw error;
  }
  const producer = bounded(input.producer, 120, "StudentHub-AI");
  const correlationId = bounded(input.correlationId ?? input.correlation_id, 160, "realtime");
  if (!IDENTIFIER_PATTERN.test(producer) || !IDENTIFIER_PATTERN.test(correlationId)) {
    const error = new Error("Realtime producer or correlation identifier is invalid.");
    error.code = "REALTIME_IDENTIFIER_INVALID";
    error.statusCode = 400;
    throw error;
  }
  const causationId = input.causationId ?? input.causation_id;
  const normalizedCausation = causationId === null || causationId === undefined || causationId === ""
    ? null
    : bounded(causationId, 160);
  if (normalizedCausation && !IDENTIFIER_PATTERN.test(normalizedCausation)) {
    const error = new Error("Realtime causation identifier is invalid.");
    error.code = "REALTIME_IDENTIFIER_INVALID";
    error.statusCode = 400;
    throw error;
  }
  const occurredAt = input.occurredAt ?? input.occurred_at ?? new Date().toISOString();
  const occurredDate = new Date(occurredAt);
  if (Number.isNaN(occurredDate.getTime())) {
    const error = new Error("Realtime occurredAt must be an ISO timestamp.");
    error.code = "REALTIME_TIMESTAMP_INVALID";
    error.statusCode = 400;
    throw error;
  }
  const idempotencyKey = input.idempotencyKey ?? input.idempotency_key ?? null;
  const normalizedIdempotency = idempotencyKey === null || idempotencyKey === undefined || idempotencyKey === ""
    ? null
    : bounded(idempotencyKey, 180);
  if (normalizedIdempotency && !IDENTIFIER_PATTERN.test(normalizedIdempotency)) {
    const error = new Error("Realtime idempotency key is invalid.");
    error.code = "REALTIME_IDEMPOTENCY_KEY_INVALID";
    error.statusCode = 400;
    throw error;
  }
  const eventId = String(input.eventId ?? input.event_id ?? crypto.randomUUID()).trim().toLowerCase();
  if (!EVENT_ID_PATTERN.test(eventId)) {
    const error = new Error("Realtime event id must be a canonical UUID.");
    error.code = "REALTIME_EVENT_ID_INVALID";
    error.statusCode = 400;
    throw error;
  }
  return {
    eventId,
    channel,
    eventType,
    subjectId,
    classification,
    producer,
    environment: bounded(input.environment, 80, environment || "development"),
    correlationId,
    causationId: normalizedCausation,
    payload,
    payloadHash,
    idempotencyKey: normalizedIdempotency,
    occurredAt: occurredDate.toISOString(),
  };
}

function hashBuffer(value) {
  if (Buffer.isBuffer(value)) return value;
  if (value instanceof Uint8Array) return Buffer.from(value);
  if (typeof value === "string" && /^[0-9a-f]{64}$/i.test(value)) return Buffer.from(value, "hex");
  if (typeof value === "string" && /^\\x[0-9a-f]+$/i.test(value)) return Buffer.from(value.slice(2), "hex");
  return null;
}

function sameHash(left, right) {
  const a = hashBuffer(left);
  const b = hashBuffer(right);
  return Boolean(a && b && a.length === 32 && b.length === 32 && crypto.timingSafeEqual(a, b));
}

function sameNullable(left, right) {
  const normalizedLeft = left === null || left === undefined ? null : String(left);
  const normalizedRight = right === null || right === undefined ? null : String(right);
  return normalizedLeft === normalizedRight;
}

function sameEventEnvelope(row, event, { includeOccurredAt = false } = {}) {
  if (!row || !event) return false;
  const sameFields = sameNullable(row.channel, event.channel)
    && sameNullable(row.event_type, event.eventType)
    && sameNullable(row.subject_id, event.subjectId)
    && sameNullable(row.classification, event.classification)
    && sameNullable(row.producer, event.producer)
    && sameNullable(row.environment, event.environment)
    && sameNullable(row.correlation_id, event.correlationId)
    && sameNullable(row.causation_id, event.causationId)
    && sameNullable(row.idempotency_key, event.idempotencyKey)
    && sameHash(row.payload_hash, event.payloadHash);
  if (!sameFields) return false;
  if (!includeOccurredAt) return true;
  const rowTime = new Date(row.occurred_at).getTime();
  const eventTime = new Date(event.occurredAt).getTime();
  return Number.isFinite(rowTime) && rowTime === eventTime;
}

function rowToEvent(row, deduplicated = false) {
  if (!row) return null;
  return {
    id: String(row.event_id),
    eventId: String(row.event_id),
    sequence: Number(row.sequence),
    channel: String(row.channel),
    eventType: String(row.event_type),
    subjectId: row.subject_id ? String(row.subject_id) : null,
    classification: String(row.classification),
    producer: String(row.producer),
    environment: String(row.environment),
    correlationId: String(row.correlation_id),
    causationId: row.causation_id ? String(row.causation_id) : null,
    data: row.payload,
    timestamp: new Date(row.occurred_at).getTime(),
    emittedAt: new Date(row.recorded_at).toISOString(),
    occurredAt: new Date(row.occurred_at).toISOString(),
    payloadHash: hashBuffer(row.payload_hash)?.toString("hex") || null,
    idempotencyKey: row.idempotency_key ? String(row.idempotency_key) : null,
    deduplicated,
  };
}

export function isDurableRealtimeConfigured(env = process.env) {
  return typeof env.DATABASE_URL === "string"
    && env.DATABASE_URL.trim().length > 0
    && env.STUDENTHUB_REALTIME_ADAPTER !== "memory";
}

export function isRealtimeLocalFallbackAllowed(env = process.env) {
  return env.NODE_ENV !== "production";
}

export function normalizeRealtimeEvent(input, options) {
  return normalizeEvent(input, options);
}

export class DurableRealtimeRepository {
  constructor(pool = getPostgresPool()) {
    this.pool = pool;
  }

  async append(input, options = {}) {
    const event = normalizeEvent(input, options);
    let inserted;
    try {
      inserted = await this.pool.query(
        `insert into private.realtime_events
          (event_id, channel, event_type, subject_id, classification, producer,
           environment, correlation_id, causation_id, payload, payload_hash,
           idempotency_key, occurred_at)
         values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::jsonb,decode($11,'hex'),$12,$13)
         on conflict (channel, idempotency_key) do nothing
         returning sequence, event_id, channel, event_type, subject_id,
           classification, producer, environment, correlation_id, causation_id,
           payload, payload_hash, idempotency_key, occurred_at, recorded_at`,
        [event.eventId, event.channel, event.eventType, event.subjectId, event.classification,
          event.producer, event.environment, event.correlationId, event.causationId,
          JSON.stringify(event.payload), event.payloadHash, event.idempotencyKey, event.occurredAt],
      );
    } catch (error) {
      if (error?.code === "23505") {
        const existingById = await this.pool.query(
          `select sequence, event_id, channel, event_type, subject_id,
             classification, producer, environment, correlation_id, causation_id,
             payload, payload_hash, idempotency_key, occurred_at, recorded_at
             from private.realtime_events where event_id = $1 limit 1`,
          [event.eventId],
        );
        const row = existingById.rows[0];
        if (row && sameEventEnvelope(row, event, { includeOccurredAt: true })) return rowToEvent(row, true);
        const conflict = new Error("Realtime event id is bound to different content.");
        conflict.code = "REALTIME_EVENT_ID_CONFLICT";
        conflict.statusCode = 409;
        throw conflict;
      }
      throw error;
    }
    if (inserted.rows[0]) return rowToEvent(inserted.rows[0]);
    if (!event.idempotencyKey) {
      const error = new Error("Realtime event could not be persisted.");
      error.code = "REALTIME_EVENT_NOT_PERSISTED";
      error.statusCode = 503;
      throw error;
    }
    const existing = await this.pool.query(
      `select sequence, event_id, channel, event_type, subject_id,
         classification, producer, environment, correlation_id, causation_id,
         payload, payload_hash, idempotency_key, occurred_at, recorded_at
         from private.realtime_events
        where channel = $1 and idempotency_key = $2
        limit 1`,
      [event.channel, event.idempotencyKey],
    );
    const row = existing.rows[0];
    if (!row || !sameEventEnvelope(row, event)) {
      const error = new Error("Realtime idempotency key is bound to different content.");
      error.code = "REALTIME_IDEMPOTENCY_CONFLICT";
      error.statusCode = 409;
      throw error;
    }
    return rowToEvent(row, true);
  }

  async replay({ channels, subjectId = null, afterSequence = 0, limit = 100 } = {}) {
    const normalizedChannels = [...new Set((Array.isArray(channels) ? channels : ["system"])
      .map((channel) => bounded(channel, 128).toLowerCase())
      .filter((channel) => CHANNEL_PATTERN.test(channel)))];
    if (!normalizedChannels.length) return [];
    const safeSubject = subjectValue(subjectId);
    const safeSequence = Number.isSafeInteger(Number(afterSequence)) && Number(afterSequence) >= 0
      ? Number(afterSequence)
      : 0;
    const safeLimit = Math.min(MAX_REPLAY, Math.max(1, Number.isInteger(limit) ? limit : 100));
    const result = await this.pool.query(
      `select sequence, event_id, channel, event_type, subject_id,
         classification, producer, environment, correlation_id, causation_id,
         payload, payload_hash, idempotency_key, occurred_at, recorded_at
         from private.realtime_events
        where channel = any($1::text[])
          and sequence > $2
          and ((channel = any($4::text[]) and subject_id is null)
            or ($3::uuid is not null and subject_id = $3::uuid))
          and (expires_at is null or expires_at > now())
        order by sequence asc
        limit $5`,
      [normalizedChannels, safeSequence, safeSubject, REALTIME_PUBLIC_CHANNELS, safeLimit],
    );
    return result.rows.map((row) => rowToEvent(row));
  }

  async runtimeSnapshot() {
    const result = await this.pool.query(
      `select count(*)::integer as event_count,
              max(sequence)::bigint as latest_sequence,
              max(recorded_at) as last_event_at
         from private.realtime_events
        where expires_at is null or expires_at > now()`,
    );
    const row = result.rows[0] || {};
    return {
      transport: "POSTGRES_EVENT_LOG_SSE",
      authoritative: true,
      activeConnections: null,
      replayWindowSize: Number(row.event_count || 0),
      latestSequence: row.latest_sequence === null || row.latest_sequence === undefined
        ? 0
        : Number(row.latest_sequence),
      lastEventAt: row.last_event_at ? new Date(row.last_event_at).toISOString() : null,
      measuredAt: new Date().toISOString(),
    };
  }
}

let durableRepository;
export function getDurableRealtimeRepository() {
  durableRepository ||= new DurableRealtimeRepository();
  return durableRepository;
}

export function resetDurableRealtimeRepositoryForTests() {
  durableRepository = undefined;
}
