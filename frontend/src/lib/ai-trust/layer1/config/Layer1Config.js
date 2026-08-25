/**
 * Layer 1 — Fast & Deterministic Screening Configuration
 * 
 * Centralized options, limits, thresholds, and policy definitions.
 */

export const LAYER_1_CONFIG = {
  RULE_VERSION: "layer1-v1.0.0",

  // Input & Processing Limits (Prevent DoS and ReDoS)
  LIMITS: {
    MAX_URL_LENGTH: 2048,
    MAX_TEXT_LENGTH: 50000,
    MAX_FILE_SIZE_BYTES: 25 * 1024 * 1024, // 25 MB
    MAX_OCR_TEXT_LENGTH: 10000,
    MAX_REDIRECT_HOPS: 3,
    PROCESSING_TIMEOUT_MS: 3000,
    MAGIC_BYTES_INSPECT_LENGTH: 64,
  },

  // Target Execution Latency
  PERFORMANCE_BUDGET_MS: 15,

  // SSRF Protection Network Ranges
  SSRF_BLOCKED_RANGES: [
    /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,         // Loopback (127.0.0.0/8)
    /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,          // Private Class A (10.0.0.0/8)
    /^172\.(1[6-9]|2\d|3[0-1])\.\d{1,3}\.\d{1,3}$/, // Private Class B (172.16.0.0/12)
    /^192\.168\.\d{1,3}\.\d{1,3}$/,             // Private Class C (192.168.0.0/16)
    /^169\.254\.\d{1,3}\.\d{1,3}$/,             // Link-local / Cloud Metadata (169.254.0.0/16)
    /^0\.0\.0\.0$/,
    /^localhost$/i,
    /\.internal$/i,
    /\.local$/i,
    /\.onion$/i,
  ],

  // Reliability weights of detectors
  DETECTOR_RELIABILITY: {
    KNOWN_MALICIOUS_SIGNATURE: 0.99,
    MAGIC_BYTE_MISMATCH: 0.99,
    MALICIOUS_SHELL_PAYLOAD: 0.99,
    CREDENTIAL_PHISHING_PATTERN: 0.95,
    TASK_DEPOSIT_SCAM: 0.95,
    HOMOGLYPH_BRAND: 0.95,
    TYPOSQUATTING_DOMAIN: 0.85,
    DECEPTIVE_SUBDOMAIN: 0.90,
    SHORT_URL: 0.60,
    RAW_IP_HOST: 0.65,
    UNENCRYPTED_HTTP: 0.45,
    URGENT_WORDING: 0.35,
    METADATA_ANOMALY: 0.30,
    AI_STYLE_WORDING: 0.10, // Strictly minimal weight
  },

  // Confidence Bounds
  CONFIDENCE_BOUNDS: {
    HARD_BLOCK_MIN: 0.95,
    HARD_BLOCK_MAX: 0.99,
    SUSPICIOUS_MIN: 0.45,
    SUSPICIOUS_MAX: 0.85,
    PASS_MIN: 0.90,
    PASS_MAX: 0.99,
    WHITELIST_PASS: 0.99,
  },
};
