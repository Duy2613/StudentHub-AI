/**
 * StudentHub AI — SecurityOutboxTransformer
 * 
 * Prepares and sanitizes security telemetry events for outbox persistence and Citadel export.
 * Enforces Zero Secret Leakage, Data Minimization, and Deterministic Canonical Hashing:
 * - Recursively redacts credentials, JWTs, bearer tokens, cookies, database URLs, service role keys, and private keys
 * - Blocks hidden AI reasoning / CoT traces
 * - Strips raw screenshot image data / base64 payloads, replacing them with deterministic SHA-256 digests
 * - Produces canonical RFC 8259 JSON (lexicographical key order, strict separators, UTF-8)
 * - Computes standard 64-character lowercase hex SHA-256 payload checksums
 */

import crypto from "node:crypto";

const SECRET_KEY_PATTERN = /(?:password|passwd|token|secret|authorization|cookie|bearer|api[_-]?key|database[_-]?url|private[_-]?key|service_role|supabase_key|reasoning|hidden_reasoning|cot_trace|scratchpad|system_prompt)/i;
const BASE64_IMAGE_PATTERN = /^data:image\/[a-z]+;base64,/i;
const JWT_VALUE_PATTERN = /^ey[A-Za-z0-9_-]{10,}\.ey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}$/;
const DB_URL_VALUE_PATTERN = /^postgres(?:ql)?:\/\/[^\s]+$/i;
const PRIVATE_KEY_PATTERN = /-----BEGIN[ A-Z0-9_-]*PRIVATE KEY-----/i;

const ALLOWED_CLASSIFICATIONS = new Set(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]);

export class SecurityOutboxTransformer {
  /**
   * Recursively sanitizes a data structure, redacting secrets and stripping raw byte/image payloads.
   * @param {any} value 
   * @param {number} depth 
   * @returns {any}
   */
  static sanitize(value, depth = 0) {
    if (depth > 8) return "[MAX_DEPTH_EXCEEDED]";
    if (value === null || value === undefined) return value;

    if (typeof value === "string") {
      if (BASE64_IMAGE_PATTERN.test(value) || (value.length > 512 && /^[A-Za-z0-9+/=]+$/.test(value.slice(0, 100)))) {
        const hash = crypto.createHash("sha256").update(value).digest("hex").slice(0, 16);
        return `[IMAGE_RAW_STRIPPED:sha256=${hash}...]`;
      }
      if (JWT_VALUE_PATTERN.test(value)) {
        return "[REDACTED_JWT]";
      }
      if (DB_URL_VALUE_PATTERN.test(value)) {
        return "[REDACTED_DATABASE_URL]";
      }
      if (PRIVATE_KEY_PATTERN.test(value)) {
        return "[REDACTED_PRIVATE_KEY]";
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
      return value.slice(0, 100).map((item) => this.sanitize(item, depth + 1));
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
   * Serializes an object to deterministic canonical JSON according to strict rules:
   * - Lexicographically sorted keys (Unicode code point order)
   * - Strict separators (comma, colon, no extraneous whitespace)
   * - Deterministic null and boolean representations
   * - Arrays maintain exact positional element ordering
   * 
   * @param {any} obj 
   * @returns {string}
   */
  static toCanonicalJson(obj) {
    if (obj === null || obj === undefined) {
      return "null";
    }
    if (typeof obj === "boolean" || typeof obj === "number") {
      if (Number.isNaN(obj) || !Number.isFinite(obj)) {
        return "null";
      }
      return JSON.stringify(obj);
    }
    if (typeof obj === "string") {
      return JSON.stringify(obj);
    }
    if (Array.isArray(obj)) {
      return "[" + obj.map((it) => this.toCanonicalJson(it)).join(",") + "]";
    }
    if (typeof obj === "object") {
      const keys = Object.keys(obj).sort();
      return "{" + keys.map((k) => JSON.stringify(k) + ":" + this.toCanonicalJson(obj[k])).join(",") + "}";
    }
    return JSON.stringify(String(obj));
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
    occurredAt = null,
    payload = {},
  }) {
    const normClassification = String(classification || "INTERNAL").toUpperCase();
    if (!ALLOWED_CLASSIFICATIONS.has(normClassification)) {
      throw new Error(`INVALID_CLASSIFICATION: ${classification}. Must be one of: PUBLIC, INTERNAL, CONFIDENTIAL, RESTRICTED`);
    }

    const sanitizedPayload = this.sanitize(payload);
    const payloadHash = this.computePayloadHash(sanitizedPayload);
    const id = eventId || `evt-${crypto.randomUUID()}`;
    const tsOccurred = occurredAt || new Date().toISOString();

    return {
      eventId: id,
      eventType,
      schemaVersion,
      occurredAt: tsOccurred,
      producedAt: new Date().toISOString(),
      producer: "StudentHub-AI",
      environment,
      correlationId: correlationId || `corr-${crypto.randomUUID()}`,
      causationId: causationId || null,
      subject,
      classification: normClassification,
      payload: sanitizedPayload,
      payloadHash,
    };
  }
}
