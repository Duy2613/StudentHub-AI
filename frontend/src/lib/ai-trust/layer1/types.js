/**
 * Layer 1 — Type Definitions, Severity Levels & Standardized Reasons Taxonomy
 */

export const LAYER_1_STATUS = {
  BLOCK: "BLOCK",           // Strong evidence of malicious / phishing / scam payload -> Early Exit STOP
  SUSPICIOUS: "SUSPICIOUS", // Anomaly or suspicious indicators detected -> Forward to Layer 2
  PASS: "PASS",             // No significant Layer 1 threat found -> Forward to Layer 2
  UNKNOWN: "UNKNOWN",       // The local boundary could not produce a reliable result
};

export const SIGNAL_SEVERITY = {
  CRITICAL: "critical", // Strong evidence of malicious behavior (Hard Block trigger)
  HIGH: "high",         // Very suspicious (compounding factor for BLOCK / strong SUSPICIOUS)
  MEDIUM: "medium",     // Meaningful warning (SUSPICIOUS factor)
  LOW: "low",           // Weak contextual evidence
  INFO: "info",         // Informational metadata only
};

export const LAYER_1_REASONS = {
  // Credential & Phishing
  CREDENTIAL_REQUEST: "credential_request",
  OTP_REQUEST: "otp_request",
  PIN_REQUEST: "pin_request",
  PHISHING_PATTERN: "phishing_pattern",
  PHISHING_PATH_PATTERN: "phishing_path_pattern",
  SUSPICIOUS_QUERY_PARAM: "suspicious_query_param",

  // Brand & Domain Impersonation
  BRAND_IMPERSONATION: "brand_impersonation",
  BRAND_IMPERSONATION_SUBDOMAIN: "brand_impersonation_subdomain",
  TYPOSQUATTING: "typosquatting",
  UNICODE_HOMOGLYPH: "unicode_homoglyph",
  MIXED_SCRIPT_DOMAIN: "mixed_script_domain",
  PUNYCODE_DOMAIN: "punycode_domain",
  IP_BASED_HOST: "ip_based_host",
  SHORTENED_URL: "shortened_url",
  UNENCRYPTED_TRANSPORT: "unencrypted_transport",
  UNENCRYPTED_HTTP: "unencrypted_http",
  SUSPICIOUS_TLD: "suspicious_tld",
  EXCESSIVE_URL_LENGTH: "excessive_url_length",
  SUSPICIOUS_PORT: "suspicious_port",
  WHITELISTED_DOMAIN: "whitelisted_domain",

  // Social Engineering & Scam Patterns
  ADVANCE_FEE_SCAM: "advance_fee_scam",
  TASK_DEPOSIT_SCAM: "task_deposit_scam",
  REWARD_SCAM_PATTERN: "reward_scam_pattern",
  LOTTERY_PRIZE_SCAM: "lottery_prize_scam",
  URGENCY_PATTERN: "urgency_pattern",
  URGENT_COERCION: "urgent_coercion",
  IMPERSONATION_AUTHORITY: "impersonation_authority",
  IMPERSONATION_BANK: "impersonation_bank",
  IMPERSONATION_SCHOOL: "impersonation_school",
  AI_LIKE_TEXT: "ai_like_text",

  // Malicious Files & Binary
  DANGEROUS_EXTENSION: "dangerous_extension",
  DANGEROUS_EXECUTABLE: "dangerous_executable",
  MIME_MISMATCH: "mime_mismatch",
  MAGIC_BYTE_MISMATCH: "magic_byte_mismatch",
  EXECUTABLE_POLYGLOT: "executable_polyglot",
  MALICIOUS_SIGNATURE: "malicious_signature",
  MALICIOUS_SHELL_PAYLOAD: "malicious_shell_payload",
  MALWARE_PATTERN: "malware_pattern",
  ANOMALOUS_METADATA: "anomalous_metadata",
  OVERSIZED_FILE: "oversized_file",

  // OCR & QR
  OCR_PHISHING_PATTERN: "ocr_phishing_pattern",
  OCR_PHISHING_TEXT_DETECTED: "ocr_phishing_text_detected",
  QR_MALICIOUS_URL: "qr_malicious_url",
  QR_CONTAINS_MALICIOUS_URL: "qr_contains_malicious_url",

  // Network & Security
  SSRF_ATTEMPT: "ssrf_attempt",
  REDIRECT_CHAIN_ABUSE: "redirect_chain_abuse",
  PAYLOAD_LIMIT_EXCEEDED: "payload_limit_exceeded",
  INVALID_INPUT: "invalid_input",
  UNSUPPORTED_SCHEME: "unsupported_scheme",
};

const SENSITIVE_VALUE_PATTERN = /(password|passwd|pass|otp|token|secret|bearer|cookie|cvv|pin|private[_ -]?key|seed[_ -]?phrase)/i;

const MAX_SIGNAL_STRING_LENGTH = 200;
const MAX_EVIDENCE_STRING_LENGTH = 400;
const DEFAULT_RULE_VERSION = "layer1-v1.0.0";

function boundedString(value, fallback = "", maxLength = MAX_SIGNAL_STRING_LENGTH) {
  if (typeof value !== "string") return fallback;
  return value.slice(0, maxLength);
}

function boundedUnit(value, fallback = 0) {
  if (typeof value !== "number" || !Number.isFinite(value)) return fallback;
  return Number(Math.max(0, Math.min(1, value)).toFixed(2));
}

function boundedNonNegativeInteger(value, fallback = 0) {
  if (!Number.isInteger(value) || value < 0) return fallback;
  return value;
}

function safeEvidenceText(value, fallback = null) {
  if (typeof value === "string") return value.slice(0, MAX_EVIDENCE_STRING_LENGTH);
  if (value === null || value === undefined) return fallback;
  return fallback;
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function redactEvidenceValue(value, key = "", seen = new WeakSet()) {
  const keyText = typeof key === "string" ? key : String(key ?? "");
  if (SENSITIVE_VALUE_PATTERN.test(keyText)) return "[REDACTED]";
  if (typeof value === "string") {
    return value
      .replace(/(?:password|passwd|pass|otp|token|secret|bearer|cvv|pin)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
      .slice(0, MAX_EVIDENCE_STRING_LENGTH);
  }
  if (typeof value === "number" || typeof value === "boolean" || value === null) return value;
  if (Array.isArray(value)) {
    if (seen.has(value)) return "[REDACTED_CYCLIC_REFERENCE]";
    seen.add(value);
    try {
      return value.slice(0, 20).map((item) => redactEvidenceValue(item, key, seen));
    } catch {
      return "[REDACTED_UNREADABLE_VALUE]";
    } finally {
      seen.delete(value);
    }
  }
  if (value && typeof value === "object") {
    if (seen.has(value)) return "[REDACTED_CYCLIC_REFERENCE]";
    seen.add(value);
    try {
      const entries = Object.keys(value).slice(0, 20).map((childKey) => {
        let childValue;
        try {
          childValue = value[childKey];
        } catch {
          childValue = "[REDACTED_UNREADABLE_VALUE]";
        }
        return [childKey, redactEvidenceValue(childValue, childKey, seen)];
      });
      return Object.fromEntries(entries);
    } catch {
      return "[REDACTED_UNREADABLE_VALUE]";
    } finally {
      seen.delete(value);
    }
  }
  try {
    return String(value).slice(0, MAX_EVIDENCE_STRING_LENGTH);
  } catch {
    return "[REDACTED_UNREADABLE_VALUE]";
  }
}

function sanitizeEvidence(evidence = {}) {
  const source = safeObject(evidence);
  const sanitized = {};
  const seen = new WeakSet();
  seen.add(source);
  try {
    for (const key of Object.keys(source).slice(0, 20)) {
      let value;
      try {
        value = source[key];
      } catch {
        value = "[REDACTED_UNREADABLE_VALUE]";
      }
      sanitized[key] = redactEvidenceValue(value, key, seen);
    }
  } finally {
    seen.delete(source);
  }
  return sanitized;
}

/**
 * Creates a structured signal DTO
 * @param {object} params
 * @param {string} params.type - Machine-readable signal type (from LAYER_1_REASONS)
 * @param {string} params.category - 'url' | 'text' | 'image' | 'file' | 'social_engineering' | 'network'
 * @param {string} params.severity - 'critical' | 'high' | 'medium' | 'low' | 'info'
 * @param {number} params.confidence - [0.0 - 1.0]
 * @param {object} params.evidence - { matchedText, location, snippet, details }
 * @param {string} params.source - Detector name (e.g. 'UrlDetector', 'TextDetector')
 * @returns {object}
 */
export function createSignal(params = {}) {
  const input = safeObject(params);
  const type = boundedString(input.type, "unknown");
  const category = boundedString(input.category, "security", 80);
  const severity = Object.values(SIGNAL_SEVERITY).includes(input.severity)
    ? input.severity
    : SIGNAL_SEVERITY.MEDIUM;
  const source = boundedString(input.source, "deterministic_engine", 120);
  const signalId = boundedString(input.signalId, "", 180);
  const ruleVersion = boundedString(input.ruleVersion, DEFAULT_RULE_VERSION, 80);
  const observedAt = boundedString(input.observedAt, "", 80) || new Date().toISOString();
  const occurrences = boundedNonNegativeInteger(input.occurrences, 1) || 1;
  const safeEvidence = sanitizeEvidence(input.evidence);

  return {
    signalId: signalId || `${source}:${type}`,
    type,
    category,
    severity,
    confidence: boundedUnit(input.confidence, 0),
    evidence: {
      ...safeEvidence,
      matchedText: safeEvidenceText(safeEvidence.matchedText ?? safeEvidence.snippet),
      location: safeEvidenceText(safeEvidence.location, "content"),
    },
    source,
    detector: source,
    ruleVersion,
    observedAt,
    occurrences,
  };
}

/**
 * Standardized Layer 1 Result DTO builder
 */
export function createLayer1Result(params = {}) {
  const input = safeObject(params);
  const status = Object.values(LAYER_1_STATUS).includes(input.status)
    ? input.status
    : LAYER_1_STATUS.UNKNOWN;
  const confidence = boundedUnit(input.confidence, 0);
  const reasons = Array.isArray(input.reasons)
    ? Array.from(new Set(input.reasons.filter((reason) => typeof reason === "string").map((reason) => reason.slice(0, 120)))).slice(0, 40)
    : [];
  const signals = Array.isArray(input.signals)
    ? input.signals.filter((signal) => signal && typeof signal === "object" && !Array.isArray(signal)).slice(0, 100).map((signal) => createSignal(signal))
    : [];
  const nextLayer = Number.isInteger(input.nextLayer) && input.nextLayer > 0 && input.nextLayer <= 4 ? input.nextLayer : 2;
  const requestId = boundedString(input.requestId, "", 160) || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const metricsInput = safeObject(input.metrics);
  const detailsInput = safeObject(input.details);
  const hardTriggersCount = boundedNonNegativeInteger(detailsInput.hardTriggersCount, 0);
  const detectorsExecuted = Array.isArray(metricsInput.detectorsExecuted)
    ? metricsInput.detectorsExecuted.filter((detector) => typeof detector === "string").map((detector) => detector.slice(0, 120)).slice(0, 40)
    : [];
  const timestamp = typeof metricsInput.timestamp === "number" && Number.isFinite(metricsInput.timestamp)
    ? metricsInput.timestamp
    : Date.now();
  const matchedRules = Array.isArray(detailsInput.matchedRules)
    ? detailsInput.matchedRules.filter((rule) => typeof rule === "string").map((rule) => rule.slice(0, 120)).slice(0, 40)
    : [];
  const severityCounts = Object.fromEntries(
    Object.values(SIGNAL_SEVERITY).map((severity) => [
      severity,
      boundedNonNegativeInteger(detailsInput.severityCounts?.[severity], 0),
    ])
  );

  return {
    layer: 1,
    status,
    confidence,
    reasons,
    signals,
    nextLayer: status === LAYER_1_STATUS.BLOCK ? null : nextLayer,
    requestId,
    details: {
      decisionRationale: boundedString(detailsInput.decisionRationale, "", 500) || null,
      hardTriggersCount,
      totalSignalsCount: signals.length,
      earlyExit: status === LAYER_1_STATUS.BLOCK,
      nextAction:
        status === LAYER_1_STATUS.BLOCK
          ? "STOP"
          : status === LAYER_1_STATUS.UNKNOWN
            ? "REVIEW_INPUT"
            : "PROCEED_TO_LAYER_2",
      scope: "LOCAL_SCREEN_ONLY",
      providerIndependent: true,
      notFinalSafety: true,
      matchedRules,
      severityCounts,
    },
    metrics: {
      executionTimeMs: typeof metricsInput.executionTimeMs === "number" && Number.isFinite(metricsInput.executionTimeMs) && metricsInput.executionTimeMs >= 0
        ? metricsInput.executionTimeMs
        : 0,
      detectorsExecuted,
      ruleVersion: boundedString(metricsInput.ruleVersion, DEFAULT_RULE_VERSION, 80),
      modelUsed: boundedString(metricsInput.modelUsed, "", 120) || null,
      timestamp,
      providerIndependent: true,
    },
  };
}
