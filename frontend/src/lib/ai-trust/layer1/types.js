/**
 * Layer 1 — Type Definitions, Severity Levels & Standardized Reasons Taxonomy
 */

export const LAYER_1_STATUS = {
  BLOCK: "BLOCK",           // Strong evidence of malicious / phishing / scam payload -> Early Exit STOP
  SUSPICIOUS: "SUSPICIOUS", // Anomaly or suspicious indicators detected -> Forward to Layer 2
  PASS: "PASS",             // No significant Layer 1 threat found -> Forward to Layer 2
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
};

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
export function createSignal({
  type,
  category = "security",
  severity = SIGNAL_SEVERITY.MEDIUM,
  confidence = 0.5,
  evidence = {},
  source = "deterministic_engine",
}) {
  return {
    type,
    category,
    severity,
    confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(2)),
    evidence: {
      matchedText: evidence.matchedText || evidence.snippet || null,
      location: evidence.location || "content",
      ...evidence,
    },
    source,
  };
}

/**
 * Standardized Layer 1 Result DTO builder
 */
export function createLayer1Result({
  status = LAYER_1_STATUS.PASS,
  confidence = 0.90,
  reasons = [],
  signals = [],
  nextLayer = null,
  requestId = null,
  metrics = {},
  details = {},
}) {
  return {
    layer: 1,
    status,
    confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(2)),
    reasons: Array.from(new Set(reasons)),
    signals,
    nextLayer: status === LAYER_1_STATUS.BLOCK ? null : (nextLayer || 2),
    requestId: requestId || `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    details: {
      decisionRationale: details.decisionRationale || null,
      hardTriggersCount: details.hardTriggersCount || 0,
      totalSignalsCount: signals.length,
      earlyExit: status === LAYER_1_STATUS.BLOCK,
      nextAction: status === LAYER_1_STATUS.BLOCK ? "STOP" : "PROCEED_TO_LAYER_2",
      ...details,
    },
    metrics: {
      executionTimeMs: metrics.executionTimeMs || 0,
      detectorsExecuted: metrics.detectorsExecuted || [],
      ruleVersion: metrics.ruleVersion || "layer1-v1.0.0",
      modelUsed: metrics.modelUsed || null,
      timestamp: metrics.timestamp || Date.now(),
    },
  };
}
