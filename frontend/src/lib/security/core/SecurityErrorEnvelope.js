/**
 * StudentHub AI — Zero-Trust Security Fabric
 * SecurityErrorEnvelope V1
 * 
 * Standardized, RFC-7807 compliant error format preventing internal disclosure:
 * - Sanitizes stack traces, SQL internals, and secret names
 * - Encodes machine-readable security reason codes
 * - Correlates errors with immutable security telemetry
 */

import { createCorrelationId } from "../secureId.js";

export const SECURITY_ERROR_CODE = Object.freeze({
  UNAUTHORIZED: "UNAUTHORIZED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  INVALID_TOKEN_SIGNATURE: "INVALID_TOKEN_SIGNATURE",
  INVALID_AUDIENCE: "INVALID_AUDIENCE",
  INVALID_ISSUER: "INVALID_ISSUER",
  SESSION_EXPIRED: "SESSION_EXPIRED",
  SESSION_REVOKED: "SESSION_REVOKED",
  
  FORBIDDEN: "FORBIDDEN",
  OBJECT_NOT_OWNED: "OBJECT_NOT_OWNED",
  INSUFFICIENT_ROLE: "INSUFFICIENT_ROLE",
  INSUFFICIENT_PERMISSION: "INSUFFICIENT_PERMISSION",
  INSUFFICIENT_SCOPE: "INSUFFICIENT_SCOPE",
  PURPOSE_NOT_ALLOWED: "PURPOSE_NOT_ALLOWED",
  
  STEP_UP_REQUIRED: "STEP_UP_REQUIRED",
  HIGH_ASSURANCE_REQUIRED: "HIGH_ASSURANCE_REQUIRED",
  
  CAPABILITY_REQUIRED: "CAPABILITY_REQUIRED",
  CAPABILITY_EXPIRED: "CAPABILITY_EXPIRED",
  CAPABILITY_MISMATCH: "CAPABILITY_MISMATCH",
  CAPABILITY_REPLAY_DETECTED: "CAPABILITY_REPLAY_DETECTED",
  
  AI_TOOL_DENIED: "AI_TOOL_DENIED",
  AI_ESCALATION_BLOCKED: "AI_ESCALATION_BLOCKED",
  PROMPT_INJECTION_BLOCKED: "PROMPT_INJECTION_BLOCKED",
  
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  DATABASE_UNAVAILABLE: "DATABASE_UNAVAILABLE",
  CSRF_ORIGIN_REJECTED: "CSRF_ORIGIN_REJECTED",
  REQUEST_TOO_LARGE: "REQUEST_TOO_LARGE",
  RESOURCE_EXHAUSTED: "RESOURCE_EXHAUSTED",
  HARD_SAFETY_VIOLATION: "HARD_SAFETY_VIOLATION",
  INTERNAL_SECURITY_ERROR: "INTERNAL_SECURITY_ERROR"
});

const PUBLIC_ERROR_MESSAGES = Object.freeze({
  UNAUTHORIZED: "Authentication is required to perform this action.",
  INVALID_CREDENTIALS: "The supplied credentials are not valid.",
  TOKEN_EXPIRED: "Your session has expired. Please sign in again.",
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  SESSION_REVOKED: "This session is no longer active.",
  FORBIDDEN: "You do not have permission to perform this action.",
  OBJECT_NOT_OWNED: "You do not have access to this resource.",
  INSUFFICIENT_ROLE: "Your account role cannot perform this action.",
  INSUFFICIENT_PERMISSION: "Your account is not permitted to perform this action.",
  INSUFFICIENT_SCOPE: "The requested scope is not available for this session.",
  PURPOSE_NOT_ALLOWED: "This operation is not allowed for the declared purpose.",
  STEP_UP_REQUIRED: "Additional authentication is required for this operation.",
  CAPABILITY_REQUIRED: "A valid capability is required for this operation.",
  CAPABILITY_EXPIRED: "The capability has expired.",
  CAPABILITY_MISMATCH: "The capability does not match this operation.",
  CAPABILITY_REPLAY_DETECTED: "The capability has already been used.",
  AI_TOOL_DENIED: "This AI tool invocation is not permitted.",
  AI_ESCALATION_BLOCKED: "The requested AI escalation is not permitted.",
  PROMPT_INJECTION_BLOCKED: "The request contains disallowed instructions.",
  RATE_LIMIT_EXCEEDED: "Too many requests. Please try again later.",
  DATABASE_UNAVAILABLE: "The service is temporarily unavailable.",
  CSRF_ORIGIN_REJECTED: "The request origin was rejected.",
  REQUEST_TOO_LARGE: "The request exceeds the permitted size.",
  RESOURCE_EXHAUSTED: "The requested resource limit was exceeded.",
  HARD_SAFETY_VIOLATION: "The request was blocked by a safety policy.",
  INTERNAL_SECURITY_ERROR: "The request could not be completed securely."
});

export class SecurityError extends Error {
  #code;
  #statusCode;
  #correlationId;
  #details;
  #stepUpChallenge;

  /**
   * @param {object} params
   * @param {string} params.code - SECURITY_ERROR_CODE
   * @param {string} params.message - Safe user-facing message
   * @param {number} [params.statusCode] - HTTP Status (401, 403, 429, 500)
   * @param {string} [params.correlationId]
   * @param {object} [params.details]
   * @param {object} [params.stepUpChallenge]
   */
  constructor({
    code = SECURITY_ERROR_CODE.FORBIDDEN,
    message = "The requested operation is not permitted.",
    statusCode = 403,
    correlationId = null,
    details = {},
    stepUpChallenge = null
  }) {
    super(message);
    this.name = "SecurityError";
    this.#code = code;
    this.#statusCode = statusCode;
    const candidateCorrelationId = String(correlationId || "").trim();
    this.#correlationId = /^[A-Za-z0-9_.:-]{1,128}$/.test(candidateCorrelationId)
      ? candidateCorrelationId
      : createCorrelationId("sec_err");
    this.#details = details;
    this.#stepUpChallenge = stepUpChallenge;
  }

  get code() { return this.#code; }
  get statusCode() { return this.#statusCode; }
  get correlationId() { return this.#correlationId; }
  get details() { return this.#details; }
  get stepUpChallenge() { return this.#stepUpChallenge; }

  toResponsePayload() {
    // Keep the legacy RFC-style fields for existing clients while exposing the
    // stable public contract consumed by the web/mobile clients.  `message`
    // remains an alias for backwards compatibility; it is always the safe
    // message supplied to the error, never the original exception text.
    const retryable = this.#details?.retryable === true || [429, 502, 503, 504].includes(this.#statusCode);
    const publicMessage = PUBLIC_ERROR_MESSAGES[this.#code] || "The requested operation could not be completed.";
    return {
      error: {
        code: this.#code,
        message: publicMessage,
        userMessage: publicMessage,
        correlationId: this.#correlationId,
        requestId: this.#correlationId,
        retryable,
        ...(this.#stepUpChallenge ? { stepUpChallenge: this.#stepUpChallenge } : {}),
        timestamp: new Date().toISOString()
      }
    };
  }

  static unauthorized(message = "Authentication is required to perform this action.", correlationId = null, code = SECURITY_ERROR_CODE.UNAUTHORIZED) {
    return new SecurityError({
      code,
      message,
      statusCode: 401,
      correlationId
    });
  }

  static forbidden(message = "You do not have permission to access this resource or perform this action.", correlationId = null, code = SECURITY_ERROR_CODE.FORBIDDEN) {
    return new SecurityError({
      code,
      message,
      statusCode: 403,
      correlationId
    });
  }

  static stepUpRequired(message = "Elevated authentication assurance is required for this operation.", correlationId = null, requiredLevel = "AAL2_STEP_UP") {
    return new SecurityError({
      code: SECURITY_ERROR_CODE.STEP_UP_REQUIRED,
      message,
      statusCode: 403,
      correlationId,
      stepUpChallenge: {
        type: "STEP_UP_AUTHENTICATION",
        requiredAssurance: requiredLevel,
        challengeUrl: "/auth/step-up"
      }
    });
  }

  static rateLimited(message = "Too many requests. Please slow down and try again later.", correlationId = null, retryAfterSeconds = 60) {
    return new SecurityError({
      code: SECURITY_ERROR_CODE.RATE_LIMIT_EXCEEDED,
      message,
      statusCode: 429,
      correlationId,
      details: { retryAfterSeconds }
    });
  }
}
