// StudentHub AI realtime transport.
//
// This module is intentionally a transport adapter, not the source of truth.
// Durable domain events must be committed by their owning service before they
// are published here. The adapter keeps only a bounded process-local replay
// window for development and short reconnects; it never invents product data.

import { createSecureId } from "../security/secureId.js";

const MAX_HISTORY = 100;
const MAX_EVENT_BYTES = 64 * 1024;
const IDEMPOTENCY_TTL_MS = 5 * 60 * 1000;
const CHANNEL_PATTERN = /^[a-z][a-z0-9._:-]{0,63}$/;
const EVENT_TYPE_PATTERN = /^[a-z][a-z0-9._:-]{0,95}$/;

function normalizeToken(value, pattern, label) {
  const token = String(value || "").trim().toLowerCase();
  if (!pattern.test(token)) throw new TypeError(`${label} must be a bounded lowercase token.`);
  return token;
}

function jsonByteLength(value) {
  let serialized;
  try {
    serialized = JSON.stringify(value);
  } catch {
    throw new TypeError("Realtime event data must be JSON serializable.");
  }
  const bytes = new TextEncoder().encode(serialized).byteLength;
  if (bytes > MAX_EVENT_BYTES) throw new TypeError(`Realtime event data exceeds the ${MAX_EVENT_BYTES}-byte limit.`);
  return bytes;
}

function serializeSse(eventType, payload) {
  // `id` lets a browser EventSource send Last-Event-ID after reconnect.  The
  // durable adapter uses the same sequence field, while the local adapter
  // keeps the event id as a bounded fallback cursor.
  const cursor = payload?.sequence ?? payload?.id ?? "";
  const idLine = cursor ? `id: ${cursor}\n` : "";
  return `${idLine}event: ${eventType}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export class RealtimeHub {
  constructor() {
    this.version = "realtime-transport-v2";
    this.clients = new Map();
    this.history = [];
    this.sequence = 0;
    this.idempotency = new Map();
    this.lastEventAt = null;
    this.heartbeatTimer = null;
    this.startHeartbeat();
  }

  getRuntimeSnapshot() {
    return {
      transport: "PROCESS_LOCAL_SSE",
      authoritative: false,
      activeConnections: this.clients.size,
      replayWindowSize: this.history.length,
      lastEventAt: this.lastEventAt,
      measuredAt: new Date().toISOString(),
    };
  }

  registerClient(clientId, controller, channels = ["system"], metadata = {}) {
    const safeClientId = String(clientId || createSecureId("client")).slice(0, 128);
    const safeChannels = [...new Set(channels.map((channel) => normalizeToken(channel, CHANNEL_PATTERN, "Realtime channel")))];
    const previous = this.clients.get(safeClientId);
    if (previous?.controller && previous.controller !== controller) {
      try { previous.controller.close(); } catch { /* already closed */ }
    }

    this.clients.set(safeClientId, {
      controller,
      channels: new Set(safeChannels.length ? safeChannels : ["system"]),
      joinedAt: Date.now(),
      lastPing: Date.now(),
      subjectId: String(metadata.subjectId || "anonymous").slice(0, 160),
    });

    const client = this.clients.get(safeClientId);
    this.sendToClient(safeClientId, "system:connected", {
      type: "HANDSHAKE",
      clientId: safeClientId,
      timestamp: Date.now(),
      serverTime: new Date().toISOString(),
      channels: [...client.channels],
      runtime: this.getRuntimeSnapshot(),
      recentEvents: this.historyForChannels(client.channels, 10, client.subjectId),
    });
    this.broadcastPresence();
    return safeClientId;
  }

  unregisterClient(clientId) {
    if (!this.clients.has(clientId)) return;
    this.clients.delete(clientId);
    this.broadcastPresence();
  }

  sendToClient(clientId, eventType, data) {
    const client = this.clients.get(clientId);
    if (!client?.controller) return false;
    try {
      const safeEventType = normalizeToken(eventType, EVENT_TYPE_PATTERN, "Realtime event type");
      const payload = serializeSse(safeEventType, data);
      client.controller.enqueue(new TextEncoder().encode(payload));
      client.lastPing = Date.now();
      return true;
    } catch {
      this.unregisterClient(clientId);
      return false;
    }
  }

  broadcast(channel, eventType, data, { idempotencyKey = null, subjectId = null, classification = "INTERNAL" } = {}) {
    const safeChannel = normalizeToken(channel, CHANNEL_PATTERN, "Realtime channel");
    const safeEventType = normalizeToken(eventType, EVENT_TYPE_PATTERN, "Realtime event type");
    jsonByteLength(data);

    const safeIdempotencyKey = idempotencyKey == null ? null : String(idempotencyKey).trim().slice(0, 160);
    this.pruneIdempotency();
    if (safeIdempotencyKey && this.idempotency.has(safeIdempotencyKey)) return this.idempotency.get(safeIdempotencyKey).event;

    const eventRecord = {
      id: createSecureId("evt"),
      sequence: ++this.sequence,
      channel: safeChannel,
      eventType: safeEventType,
      data,
      subjectId: subjectId ? String(subjectId).slice(0, 160) : null,
      classification: String(classification || "INTERNAL").toUpperCase(),
      timestamp: Date.now(),
      emittedAt: new Date().toISOString(),
    };

    this.history.push(eventRecord);
    if (this.history.length > MAX_HISTORY) this.history.shift();
    this.lastEventAt = eventRecord.emittedAt;

    const payload = new TextEncoder().encode(serializeSse(safeEventType, eventRecord));
    const deadClients = [];
    for (const [clientId, client] of this.clients.entries()) {
      if (!client.channels.has(safeChannel)) continue;
      if (eventRecord.subjectId && client.subjectId !== eventRecord.subjectId) continue;
      try {
        client.controller.enqueue(payload);
        client.lastPing = Date.now();
      } catch {
        deadClients.push(clientId);
      }
    }
    for (const deadId of deadClients) this.unregisterClient(deadId);

    if (safeIdempotencyKey) this.idempotency.set(safeIdempotencyKey, { event: eventRecord, expiresAt: Date.now() + IDEMPOTENCY_TTL_MS });
    return eventRecord;
  }

  broadcastPresence() {
    if (this.clients.size === 0) return;
    this.broadcast("presence", "presence:update", {
      connectedClients: this.clients.size,
      measuredAt: new Date().toISOString(),
      source: "realtime_transport",
    });
  }

  historyForChannels(channels, limit, subjectId = null) {
    return this.history
      .filter((event) => channels.has(event.channel))
      .filter((event) => !event.subjectId || event.subjectId === subjectId)
      .slice(-limit);
  }

  pruneIdempotency() {
    const now = Date.now();
    for (const [key, entry] of this.idempotency.entries()) {
      if (entry.expiresAt <= now) this.idempotency.delete(key);
    }
  }

  startHeartbeat() {
    if (this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      if (this.clients.size === 0) return;
      this.broadcast("system", "system:ping", {
        ping: Date.now(),
        connectedClients: this.clients.size,
        measuredAt: new Date().toISOString(),
      });
    }, 20_000);
    this.heartbeatTimer.unref?.();
  }
}

const globalForRealtime = globalThis;
if (globalForRealtime.realtimeHub?.version !== "realtime-transport-v2") {
  globalForRealtime.realtimeHub = new RealtimeHub();
}

export const realtimeHub = globalForRealtime.realtimeHub;
