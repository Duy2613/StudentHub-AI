/**
 * StudentHub AI — Zero-Trust Security Fabric
 * CapabilityManager V1
 * 
 * First-Class Capability-Based Security Model:
 * - Represents fine-grained authority bound to subject, resource, action, and purpose
 * - Cryptographically signed and tracked server-side with strict single-use / max-uses bounds
 * - Provides replay attack immunity (consuming a 1-use capability marks it exhausted)
 */

import crypto from "node:crypto";
import { SecurityError, SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";

export class CapabilityManager {
  static #capabilities = new Map(); // capabilityId -> capabilityObject
  static #testSecret = "studenthub-capability-test-only";

  /**
   * Issues a new capability
   * @param {object} params
   * @param {string} params.subject - e.g. "student:24110001"
   * @param {string} params.action - e.g. "ACADEMIC.READ_TRANSCRIPT", "ACADEMIC.EXPORT"
   * @param {string} [params.resource] - e.g. "transcript:24110001" or "*"
   * @param {string} [params.purpose] - e.g. "ACADEMIC_PLANNING"
   * @param {number} [params.ttlSeconds] - default 300s (5 minutes)
   * @param {number} [params.maxUses] - default 1 (single-use)
   * @param {string} [params.correlationId]
   * @returns {object} Cryptographically signed capability
   */
  static issueCapability({
    subject,
    action,
    resource = "*",
    purpose = "ACADEMIC_PLANNING",
    ttlSeconds = 300,
    maxUses = 1,
    correlationId = null
  }) {
    if (!subject || !action) {
      throw new Error("[CAPABILITY_ERROR] subject and action are required to issue a capability.");
    }

    const now = Date.now();
    const capabilityId = `cap_${now}_${crypto.randomBytes(12).toString("hex")}`;
    const expiresAt = now + (ttlSeconds * 1000);

    const payload = {
      capabilityId,
      subject: String(subject).trim(),
      action: String(action).trim().toUpperCase(),
      resource: String(resource).trim(),
      purpose: String(purpose).trim().toUpperCase(),
      issuedAt: now,
      expiresAt,
      maxUses: Math.max(1, maxUses),
      usedCount: 0,
      revoked: false,
      correlationId: correlationId || `corr_${now}`
    };

    const signature = this.#signPayload(payload);
    payload.signature = signature;

    this.#capabilities.set(capabilityId, payload);
    return Object.freeze({ ...payload });
  }

  /**
   * Verifies and consumes a capability for an execution step
   * @param {string|object} capabilityOrId 
   * @param {object} context - { subject, action, resource, purpose }
   * @returns {object} Validated capability
   */
  static verifyAndConsume(capabilityOrId, context = {}) {
    const capabilityId = typeof capabilityOrId === "string"
      ? capabilityOrId
      : capabilityOrId?.capabilityId;

    if (!capabilityId) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CAPABILITY_REQUIRED,
        message: "Operation requires a valid security capability token.",
        statusCode: 403
      });
    }

    const record = this.#capabilities.get(capabilityId);
    if (!record) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CAPABILITY_MISMATCH,
        message: "Capability not found or invalid identifier.",
        statusCode: 403
      });
    }

    // 1. Signature Verification
    const isSignatureValid = this.#verifySignature(record);
    if (!isSignatureValid) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CAPABILITY_MISMATCH,
        message: "Capability cryptographic signature forgery detected.",
        statusCode: 403
      });
    }

    // 2. Revocation Check
    if (record.revoked) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CAPABILITY_MISMATCH,
        message: "Capability has been revoked.",
        statusCode: 403
      });
    }

    const now = Date.now();

    // 3. Expiration Check
    if (now > record.expiresAt) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CAPABILITY_EXPIRED,
        message: "Capability has expired.",
        statusCode: 403
      });
    }

    // 4. Replay & Max Uses Check
    if (record.usedCount >= record.maxUses) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CAPABILITY_REPLAY_DETECTED,
        message: `Capability usage quota exceeded (${record.usedCount}/${record.maxUses}). Replay attack prevented.`,
        statusCode: 403
      });
    }

    // 5. Subject Binding Check
    if (context.subject && record.subject !== context.subject) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CAPABILITY_MISMATCH,
        message: `Capability subject mismatch. Issued to '${record.subject}', claimed by '${context.subject}'.`,
        statusCode: 403
      });
    }

    // 6. Action Binding Check
    if (context.action && record.action !== context.action && record.action !== "*") {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CAPABILITY_MISMATCH,
        message: `Capability action mismatch. Issued for '${record.action}', used for '${context.action}'.`,
        statusCode: 403
      });
    }

    // 7. Resource Binding Check
    if (context.resource && record.resource !== "*" && record.resource !== context.resource) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CAPABILITY_MISMATCH,
        message: `Capability resource mismatch. Issued for '${record.resource}', used on '${context.resource}'.`,
        statusCode: 403
      });
    }

    // 8. Purpose Binding Check
    if (context.purpose && record.purpose !== context.purpose) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.PURPOSE_NOT_ALLOWED,
        message: `Capability purpose mismatch. Issued for '${record.purpose}', executed with '${context.purpose}'.`,
        statusCode: 403
      });
    }

    // Increment usage
    record.usedCount += 1;
    return Object.freeze({ ...record });
  }

  /**
   * Revokes a capability immediately
   * @param {string} capabilityId 
   */
  static revokeCapability(capabilityId) {
    const cap = this.#capabilities.get(capabilityId);
    if (cap) {
      cap.revoked = true;
    }
  }

  /**
   * Clear all capabilities (for unit tests isolation)
   */
  static clear() {
    this.#capabilities.clear();
  }

  static #signPayload(payload) {
    const raw = `${payload.capabilityId}:${payload.subject}:${payload.action}:${payload.resource}:${payload.purpose}:${payload.expiresAt}:${payload.maxUses}`;
    return crypto.createHmac("sha256", this.#getSecret()).update(raw).digest("hex");
  }

  static #verifySignature(payload) {
    const expected = this.#signPayload(payload);
    return crypto.timingSafeEqual(Buffer.from(payload.signature || "", "utf8"), Buffer.from(expected, "utf8"));
  }

  static #getSecret() {
    const configured = process.env.CAPABILITY_SECRET;
    if (configured) return configured;
    if (process.env.NODE_ENV !== "production") return this.#testSecret;
    throw new Error("CAPABILITY_SECRET must be configured in production.");
  }
}
