/**
 * StudentHub AI — SecurityOutboxTransformer
 * 
 * Prepares and sanitizes security telemetry events for outbox persistence and Citadel export.
 * Enforces Zero Secret Leakage, Data Minimization, and Deterministic Canonical Hashing:
 * - Recursively redacts credentials, JWTs, bearer tokens, cookies, database URLs, service role keys, and private keys
 * - Blocks hidden AI reasoning / CoT traces
 * - Strips raw screenshot image data / base64 payloads, replacing them with deterministic SHA-256 digests
 * - Produces canonical RFC 8785 JCS JSON (lexicographical UTF-16 code unit key order, strict separators, UTF-8, no implicit normalization)
 * - Computes standard 64-character lowercase hex SHA-256 payload checksums
 */

import crypto from "node:crypto";

const SECRET_KEY_PATTERN = /(?:password|passwd|token|accessToken|refreshToken|jwt|cookie|session|secret|authorization|bearer|api[_-]?key|database[_-]?url|private[_-]?key|service_role|supabase_key|reasoning|hidden_reasoning|cot_trace|scratchpad|system_prompt)/i;
const BASE64_IMAGE_PATTERN = /^data:image\/[a-z]+;base64,/i;
const DB_URL_VALUE_PATTERN = /^postgres(?:ql)?:\/\/[^\s]+$/i;
const PRIVATE_KEY_PATTERN = /-----BEGIN[ A-Z0-9_-]*PRIVATE KEY-----/i;

const ALLOWED_CLASSIFICATIONS = new Set(["PUBLIC", "INTERNAL", "CONFIDENTIAL", "RESTRICTED"]);

function base64UrlDecode(str) {
  try {
    return Buffer.from(str, "base64url").toString("utf8");
  } catch {
    return null;
  }
}

/**
 * Validates whether a candidate string is structurally a JWT:
 * 1. Bounded total length (10 to 8192 characters)
 * 2. Exactly three Base64URL-compatible segments separated by '.'
 * 3. Individual segment length bounds: header <= 2048, payload <= 4096, signature <= 4096
 * 4. Header decodes to a valid JSON object containing 'alg' or 'typ'
 * 5. Payload decodes to a valid JSON object
 * 6. Signature is a valid Base64URL string (or empty/short synthetic)
 * Rejects 2-segment, 4-segment, and ordinary dotted strings (e.g. version.1.2.3).
 */
export function isStructuralJwt(candidate) {
  if (!candidate || typeof candidate !== "string") return false;
  if (candidate.length < 10 || candidate.length > 8192) return false;

  const parts = candidate.split(".");
  if (parts.length !== 3) return false;

  const [headerB64, payloadB64, signatureB64] = parts;
  if (!headerB64 || !payloadB64) return false;
  if (headerB64.length > 2048 || payloadB64.length > 4096 || signatureB64.length > 4096) return false;

  // Base64URL character set validation
  if (!/^[A-Za-z0-9_-]+$/.test(headerB64) || !/^[A-Za-z0-9_-]+$/.test(payloadB64)) return false;
  if (signatureB64.length > 0 && !/^[A-Za-z0-9_-]+$/.test(signatureB64)) return false;

  // Decodable JSON Header check
  const rawHeader = base64UrlDecode(headerB64);
  if (!rawHeader) return false;
  try {
    const parsedHeader = JSON.parse(rawHeader);
    if (!parsedHeader || typeof parsedHeader !== "object" || Array.isArray(parsedHeader)) return false;
    if (!("alg" in parsedHeader || "typ" in parsedHeader)) return false;
  } catch {
    return false;
  }

  // Decodable JSON Payload check
  const rawPayload = base64UrlDecode(payloadB64);
  if (!rawPayload) return false;
  try {
    const parsedPayload = JSON.parse(rawPayload);
    if (!parsedPayload || typeof parsedPayload !== "object" || Array.isArray(parsedPayload)) return false;
  } catch {
    return false;
  }

  return true;
}

/**
 * Scans a string and redacts any detected structural JWTs:
 * - If the whole string is a structural JWT, returns "[REDACTED_JWT]"
 * - Replaces embedded JWTs surrounded by arbitrary Unicode or log text with "[REDACTED_JWT]"
 * - Preserves ordinary dotted strings (e.g. version.1.2.3, domain.com.vn, 192.168.1.1)
 */
export function redactJwts(text) {
  if (typeof text !== "string" || text.length < 10) return text;
  if (isStructuralJwt(text)) return "[REDACTED_JWT]";

  // Bounded regex to locate candidate tokens starting with 'ey' (standard Base64 of '{"')
  // Lookbehind ensures no preceding identifier/dot characters.
  // Lookahead ensures no trailing identifier/dot-identifier characters (rejects 4-segment strings).
  const candidatePattern = /(?<![A-Za-z0-9_.-])(ey[A-Za-z0-9_-]{2,2048}\.[A-Za-z0-9_-]{2,4096}\.[A-Za-z0-9_-]{0,4096})(?![A-Za-z0-9_-]|\.[A-Za-z0-9_-])/g;
  return text.replace(candidatePattern, (match) => {
    return isStructuralJwt(match) ? "[REDACTED_JWT]" : match;
  });
}

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
      if (DB_URL_VALUE_PATTERN.test(value)) {
        return "[REDACTED_DATABASE_URL]";
      }
      if (PRIVATE_KEY_PATTERN.test(value)) {
        return "[REDACTED_PRIVATE_KEY]";
      }
      const redacted = redactJwts(value);
      return redacted.slice(0, 2048);
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
        if (/jwt/i.test(key) || (typeof val === "string" && isStructuralJwt(val))) {
          sanitized[key] = "[REDACTED_JWT]";
        } else {
          sanitized[key] = "[REDACTED]";
        }
      } else {
        sanitized[key] = this.sanitize(val, depth + 1);
      }
    }
    return sanitized;
  }

  /**
   * Serializes an object to deterministic canonical JSON according to RFC 8785 (JCS):
   * - Lexicographically sorted keys based on UTF-16 code units
   * - Strict separators (comma, colon, no extraneous whitespace)
   * - Standard ECMAScript number serialization, normalizing -0 to 0
   * - Deterministic null and boolean representations
   * - Arrays maintain exact positional element ordering
   * - Strict UTF-8 with NO implicit Unicode normalization (RFC 8785 Section 3.1)
   * 
   * @param {any} obj 
   * @returns {string}
   */
  static toCanonicalJson(obj) {
    if (obj === null || obj === undefined) {
      return "null";
    }
    if (typeof obj === "boolean") {
      return obj ? "true" : "false";
    }
    if (typeof obj === "number") {
      if (Number.isNaN(obj) || !Number.isFinite(obj)) {
        return "null";
      }
      if (Object.is(obj, -0)) {
        return "0";
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
