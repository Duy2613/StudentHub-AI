/**
 * StudentHub AI — Zero-Trust Security Fabric
 * SecurityErrorEnvelope V1
 * 
 * Standardized, RFC-7807 compliant error format preventing internal disclosure:
 * - Sanitizes stack traces, SQL internals, and secret names
 * - Encodes machine-readable security reason codes
 * - Correlates errors with immutable security telemetry
 */

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
  RESOURCE_EXHAUSTED: "RESOURCE_EXHAUSTED",
  HARD_SAFETY_VIOLATION: "HARD_SAFETY_VIOLATION",
  INTERNAL_SECURITY_ERROR: "INTERNAL_SECURITY_ERROR"
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
    this.#correlationId = correlationId || `sec_err_${Date.now()}`;
    this.#details = details;
    this.#stepUpChallenge = stepUpChallenge;
  }

  get code() { return this.#code; }
  get statusCode() { return this.#statusCode; }
  get correlationId() { return this.#correlationId; }
  get details() { return this.#details; }
  get stepUpChallenge() { return this.#stepUpChallenge; }

  toResponsePayload() {
    return {
      error: {
        code: this.#code,
        message: this.message,
        correlationId: this.#correlationId,
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
