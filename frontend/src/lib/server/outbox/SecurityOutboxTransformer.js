/**
 * StudentHub AI — SecurityOutboxTransformer
 * 
 * Prepares and sanitizes security telemetry events for outbox persistence and Citadel export.
 * Enforces Zero Leakage and Data Minimization:
 * - Redacts credentials, tokens, session cookies, database URLs, and private keys
 * - Strips raw screenshot image data, preserving only object keys and sha256 digests
 * - Produces canonical deterministic JSON and SHA-256 integrity checksums
 */

import crypto from "node:crypto";

const SECRET_KEY_PATTERN = /(?:password|token|secret|authorization|cookie|bearer|api[_-]?key|database[_-]?url|private[_-]?key)/i;
const BASE64_IMAGE_PATTERN = /^data:image\/[a-z]+;base64,/i;

export class SecurityOutboxTransformer {
  /**
   * Recursively sanitizes an object, redacting secrets and stripping raw image bytes.
   * @param {any} value 
   * @param {number} depth 
   * @returns {any}
   */
  static sanitize(value, depth = 0) {
    if (depth > 8) return "[MAX_DEPTH_EXCEEDED]";
    if (value === null || value === undefined) return value;

    if (typeof value === "string") {
      if (BASE64_IMAGE_PATTERN.test(value) || (value.length > 1024 && /^[A-Za-z0-9+/=]+$/.test(value.slice(0, 100)))) {
        return `[IMAGE_RAW_STRIPPED:sha256=${crypto.createHash("sha256").update(value).digest("hex").slice(0, 16)}...]`;
      }
      return value.slice(0, 2048);
    }

    if (typeof value !== "object") {
      return value;
    }

    if (Buffer.isBuffer(value)) {
      return `[BUFFER_STRIPPED:bytes=${value.length}]`;
    }

    if (Array.isArray(value)) {
      return value.slice(0, 50).map((item) => this.sanitize(item, depth + 1));
    }

    const sanitized = {};
    for (const [key, val] of Object.entries(value)) {
      if (SECRET_KEY_PATTERN.test(key)) {
        sanitized[key] = "[REDACTED]";
      } else {
        sanitized[key] = this.sanitize(val, depth + 1);
      }
    }
    return sanitized;
  }

  /**
   * Serializes an object to deterministic canonical JSON (sorted keys, strict separators).
   * @param {any} obj 
   * @returns {string}
   */
  static toCanonicalJson(obj) {
    if (obj === null || typeof obj !== "object") {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return "[" + obj.map((it) => this.toCanonicalJson(it)).join(",") + "]";
    }
    const keys = Object.keys(obj).sort();
    return "{" + keys.map((k) => JSON.stringify(k) + ":" + this.toCanonicalJson(obj[k])).join(",") + "}";
  }

  /**
   * Computes a 64-character lowercase hex SHA-256 digest of canonical JSON.
   * @param {any} payload 
   * @returns {string}
   */
  static computePayloadHash(payload) {
    const canonical = this.toCanonicalJson(payload);
    return crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
  }

  /**
   * Formats a complete export envelope conforming to Citadel SECURITY_EVENT_CONTRACT_V1.
   * @param {object} params
   * @returns {object}
   */
  static createEnvelope({
    eventId = null,
    eventType = "security.studenthub.trust_decision.v1",
    schemaVersion = "studenthub-security-event-v1",
    classification = "INTERNAL",
    correlationId = null,
    causationId = null,
    subject = "studenthub-trust-engine",
    environment = process.env.NODE_ENV || "production",
    occurredAt = new Date().toISOString(),
    payload = {},
  }) {
    const sanitizedPayload = this.sanitize(payload);
    const payloadHash = this.computePayloadHash(sanitizedPayload);
    const id = eventId || `evt-${crypto.randomUUID()}`;

    return {
      eventId: id,
      eventType,
      schemaVersion,
      occurredAt,
      producedAt: new Date().toISOString(),
      producer: "StudentHub-AI",
      environment,
      correlationId: correlationId || `corr-${crypto.randomUUID()}`,
      causationId: causationId || null,
      subject,
      classification,
      payload: sanitizedPayload,
      payloadHash,
    };
  }
}
