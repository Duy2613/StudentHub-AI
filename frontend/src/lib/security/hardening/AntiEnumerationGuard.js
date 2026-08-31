/**
 * StudentHub AI — Zero-Trust Security Fabric
 * AntiEnumerationGuard V1
 * 
 * Protects against resource existence probing and account enumeration:
 * - Returns uniform responses when non-disclosure policy is active
 * - Constant-time comparison for sensitive tokens
 */

import crypto from "node:crypto";
import { createCorrelationId } from "../secureId.js";

export class AntiEnumerationGuard {
  /**
   * Performs constant-time string comparison to prevent timing attacks
   * @param {string} a 
   * @param {string} b 
   * @returns {boolean}
   */
  static constantTimeEqual(a, b) {
    if (typeof a !== "string" || typeof b !== "string") return false;
    const bufA = Buffer.from(a, "utf8");
    const bufB = Buffer.from(b, "utf8");
    if (bufA.length !== bufB.length) return false;
    return crypto.timingSafeEqual(bufA, bufB);
  }

  /**
   * Returns a sanitized, non-disclosing 404 / 403 response
   */
  static createNonDisclosingErrorResponse(correlationId) {
    return {
      error: {
        code: "RESOURCE_NOT_FOUND_OR_FORBIDDEN",
        message: "The requested resource could not be found or access is denied.",
        correlationId: /^[A-Za-z0-9_.:-]{1,128}$/.test(String(correlationId || "").trim())
          ? String(correlationId).trim()
          : createCorrelationId("sec"),
        timestamp: new Date().toISOString()
      }
    };
  }
}
