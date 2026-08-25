/**
 * Layer 1 — Security Logger & Observability Engine
 * 
 * Provides structured telemetry and audit logging with strict PII & credential redaction.
 */

// Regex patterns to redact sensitive credentials from logs
const SENSITIVE_PATTERNS = [
  /password\s*[:=]\s*['"]?[^\s,'"]+['"]?/gi,
  /pass\s*[:=]\s*['"]?[^\s,'"]+['"]?/gi,
  /otp\s*[:=]\s*['"]?[^\s,'"]+['"]?/gi,
  /bearer\s+[a-zA-Z0-9_\-\.]+/gi,
  /token\s*[:=]\s*['"]?[^\s,'"]+['"]?/gi,
  /cvv\s*[:=]\s*\d{3,4}/gi,
  /pin\s*[:=]\s*\d{4,6}/gi,
  /\b\d{6}\b/g, // 6-digit OTP codes
];

/**
 * Redacts sensitive tokens and credentials from text/evidence
 * @param {string|object} input 
 * @returns {string|object} Redacted copy
 */
export function redactSensitiveData(input) {
  if (typeof input === "string") {
    let sanitized = input;
    for (const pat of SENSITIVE_PATTERNS) {
      sanitized = sanitized.replace(pat, "[REDACTED_CREDENTIAL]");
    }
    return sanitized;
  }

  if (input && typeof input === "object" && !Array.isArray(input)) {
    const copy = { ...input };
    for (const key of Object.keys(copy)) {
      if (/password|token|secret|otp|pin|auth|cookie|key/i.test(key)) {
        copy[key] = "[REDACTED]";
      } else if (typeof copy[key] === "string") {
        copy[key] = redactSensitiveData(copy[key]);
      }
    }
    return copy;
  }

  return input;
}

export class SecurityLogger {
  /**
   * Logs a structured screening event safely
   * @param {object} event
   */
  static logScreenEvent(event) {
    const safeSignals = (event.signals || []).map((s) => ({
      type: s.type,
      category: s.category,
      severity: s.severity,
      confidence: s.confidence,
      evidence: redactSensitiveData(s.evidence),
      source: s.source,
    }));

    const structuredLog = {
      timestamp: new Date().toISOString(),
      requestId: event.requestId,
      layer: 1,
      inputType: event.inputType,
      status: event.status,
      confidence: event.confidence,
      reasons: event.reasons || [],
      signalsCount: safeSignals.length,
      signals: safeSignals,
      executionTimeMs: event.metrics?.executionTimeMs,
      detectorsExecuted: event.metrics?.detectorsExecuted || [],
      modelUsed: event.metrics?.modelUsed || null,
      ruleVersion: event.metrics?.ruleVersion || "layer1-v1.0.0",
    };

    // Output formatted structured JSON in production/dev
    if (process.env.NODE_ENV !== "test") {
      console.log(`[AI-TRUST-L1] [${structuredLog.status}] ${JSON.stringify(structuredLog)}`);
    }

    return structuredLog;
  }

  static warn(message, details = {}) {
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[AI-TRUST-L1-WARN] ${message}`, redactSensitiveData(details));
    }
  }

  static error(message, err = {}) {
    console.error(`[AI-TRUST-L1-ERROR] ${message}`, {
      message: err.message || err,
      stack: err.stack ? err.stack.split("\n").slice(0, 3) : undefined,
    });
  }
}
