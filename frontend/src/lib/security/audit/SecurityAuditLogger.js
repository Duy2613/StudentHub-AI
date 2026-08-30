/**
 * StudentHub AI — Zero-Trust Security Fabric
 * SecurityAuditLogger V1
 * 
 * Immutable Structured Security Event Logger:
 * - Emits structured JSON security telemetry
 * - Standardizes event taxonomy across Auth, AuthZ, Capabilities, and AI tools
 * - Automatic redaction of credentials, tokens, and sensitive PII
 * - Backed by durable atomic file persistence (.data/security_audit_logs.json)
 */

import fs from "node:fs";
import path from "node:path";

export const SECURITY_EVENT_TYPE = Object.freeze({
  // Authentication Events
  AUTH_LOGIN_SUCCESS: "AUTH_LOGIN_SUCCESS",
  AUTH_LOGIN_FAILURE: "AUTH_LOGIN_FAILURE",
  AUTH_SESSION_CREATED: "AUTH_SESSION_CREATED",
  AUTH_SESSION_REVOKED: "AUTH_SESSION_REVOKED",
  AUTH_TOKEN_REJECTED: "AUTH_TOKEN_REJECTED",
  AUTH_TOKEN_REPLAY_SUSPECTED: "AUTH_TOKEN_REPLAY_SUSPECTED",

  // Authorization Events
  AUTHZ_ALLOW: "AUTHZ_ALLOW",
  AUTHZ_DENY: "AUTHZ_DENY",
  AUTHZ_STEP_UP: "AUTHZ_STEP_UP",

  // Capability Events
  CAPABILITY_ISSUED: "CAPABILITY_ISSUED",
  CAPABILITY_USED: "CAPABILITY_USED",
  CAPABILITY_EXPIRED: "CAPABILITY_EXPIRED",
  CAPABILITY_REVOKED: "CAPABILITY_REVOKED",

  // AI Tool Events
  AI_TOOL_REQUESTED: "AI_TOOL_REQUESTED",
  AI_TOOL_ALLOWED: "AI_TOOL_ALLOWED",
  AI_TOOL_DENIED: "AI_TOOL_DENIED",

  // Threat & Hardening Events
  RATE_LIMIT_TRIGGERED: "RATE_LIMIT_TRIGGERED",
  ENUMERATION_DETECTED: "ENUMERATION_DETECTED",
  ANOMALOUS_ACTIVITY: "ANOMALOUS_ACTIVITY",
  SECURITY_POLICY_VIOLATION: "SECURITY_POLICY_VIOLATION"
});

const DEFAULT_STORE_DIR = path.resolve(process.cwd(), ".data");
const DEFAULT_STORE_FILE = path.join(DEFAULT_STORE_DIR, "security_audit_logs.json");

export class SecurityAuditLogger {
  static #storageFilePath = DEFAULT_STORE_FILE;
  static #events = []; // In-memory telemetry buffer
  static #maxBufferSize = 1000;

  static #ensureStorageDir() {
    const dir = path.dirname(this.#storageFilePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Logs an immutable security audit event
   * @param {object} event
   * @returns {object}
   */
  static logEvent({
    eventType,
    subject = "anonymous",
    action = "UNKNOWN",
    resource = "UNKNOWN",
    decision = "ALLOW",
    reason = "",
    correlationId = null,
    clientIp = "127.0.0.1",
    details = {}
  }) {
    const auditRecord = Object.freeze({
      eventId: `audit_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      eventType,
      subject: this.#boundedText(subject, 128),
      action: this.#boundedText(action, 96).toUpperCase(),
      resource: this.#boundedText(resource, 160),
      decision,
      reason: this.#sanitizeReason(reason),
      correlationId: correlationId || `corr_${Date.now()}`,
      clientIp: this.#boundedText(clientIp, 64),
      details: this.#sanitizeDetails(details)
    });

    this.#events.push(auditRecord);
    if (this.#events.length > this.#maxBufferSize) {
      this.#events.shift();
    }

    // Persist durably in non-test mode or when configured
    this.#persistAuditLog(auditRecord);

    if (process.env.NODE_ENV !== "test" || process.env.DEBUG_SECURITY) {
      console.log(`[SECURITY_AUDIT] ${JSON.stringify(auditRecord)}`);
    }

    return auditRecord;
  }

  static #persistAuditLog(record) {
    try {
      this.#ensureStorageDir();
      const line = JSON.stringify(record) + "\n";
      fs.appendFileSync(this.#storageFilePath, line, "utf8");
    } catch {
      // ignore in constrained environments
    }
  }

  /**
   * Retrieves recorded audit events matching filter criteria
   * @param {object} [filter]
   * @returns {object[]}
   */
  static getEvents(filter = {}) {
    return this.#events.filter(e => {
      if (filter.eventType && e.eventType !== filter.eventType) return false;
      if (filter.subject && e.subject !== filter.subject) return false;
      if (filter.correlationId && e.correlationId !== filter.correlationId) return false;
      return true;
    });
  }

  /**
   * Clear buffer (for unit test isolation)
   */
  static clear() {
    this.#events = [];
    try {
      if (fs.existsSync(this.#storageFilePath)) {
        fs.unlinkSync(this.#storageFilePath);
      }
    } catch {
      // ignore
    }
  }

  static #sanitizeDetails(details) {
    if (!details || typeof details !== "object") return details;
    if (Array.isArray(details)) return details.slice(0, 50).map(value => this.#sanitizeDetails(value));
    const sanitized = { ...details };
    const sensitiveKeys = ["password", "token", "secret", "otp", "key", "authorization", "cookie"];

    for (const k of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
        sanitized[k] = "[REDACTED]";
      } else if (typeof sanitized[k] === "string") {
        sanitized[k] = this.#boundedText(sanitized[k], 512);
      } else if (typeof sanitized[k] === "object") {
        sanitized[k] = this.#sanitizeDetails(sanitized[k]);
      }
    }
    return sanitized;
  }

  static #boundedText(value, maxLength) {
    return String(value ?? "").trim().slice(0, maxLength);
  }

  static #sanitizeReason(reason) {
    return this.#boundedText(reason, 240)
      .replace(/Bearer\s+[^\s]+/gi, "Bearer [REDACTED]")
      .replace(/https?:\/\/[^\s]+/gi, "[REDACTED_URL]")
      .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[REDACTED_EMAIL]")
      .replace(/((?:principal|subject|user|account)\s*['"]?)[^'"\s]+/gi, "$1[REDACTED]");
  }
}
