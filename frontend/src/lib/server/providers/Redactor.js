/**
 * StudentHub AI — Redactor
 * 
 * Redacts secrets, API keys, Bearer tokens, and sensitive headers
 * before telemetry, audit logs, or error responses are emitted.
 */

const SECRET_KEY_PATTERN = /key|secret|token|password|auth|bearer|credential|signature/i;
const SENSITIVE_VALUE_PATTERN = /(Bearer\s+[a-zA-Z0-9_\-\.]+)|(AIza[0-9A-Za-z\-_]{35})|(sk-[a-zA-Z0-9]{20,})|(gsk_[a-zA-Z0-9]{20,})|(tvly-[a-zA-Z0-9]{20,})/i;

export class Redactor {
  /**
   * Sanitizes a single string.
   * @param {string} text
   * @returns {string}
   */
  static redactString(text) {
    if (typeof text !== "string") return text;
    return text.replace(SENSITIVE_VALUE_PATTERN, "[REDACTED_SECRET]");
  }

  /**
   * Recursively redacts objects, headers, query parameters, and arrays.
   * @param {any} data
   * @param {number} [depth=0]
   * @returns {any}
   */
  static redact(data, depth = 0) {
    if (depth > 8) return "[MAX_DEPTH]";
    if (data === null || data === undefined) return data;
    if (typeof data === "string") return this.redactString(data);
    if (typeof data === "number" || typeof data === "boolean") return data;

    if (Array.isArray(data)) {
      return data.map((item) => this.redact(item, depth + 1));
    }

    if (typeof data === "object") {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        if (SECRET_KEY_PATTERN.test(key)) {
          sanitized[key] = "[REDACTED]";
        } else {
          sanitized[key] = this.redact(value, depth + 1);
        }
      }
      return sanitized;
    }

    return String(data);
  }
}
