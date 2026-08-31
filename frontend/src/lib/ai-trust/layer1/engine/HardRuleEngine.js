/**
 * Layer 1 — HardRuleEngine
 * 
 * Evaluates explicit, explainable P0/P1 deterministic hard-block rules.
 * If a rule matches, Layer 1 executes an immediate Early Exit STOP.
 */

import { LAYER_1_CONFIG } from "../config/Layer1Config.js";
import { LAYER_1_REASONS, SIGNAL_SEVERITY } from "../types.js";

export class HardRuleEngine {
  /**
   * Evaluates if detected signals satisfy any deterministic HARD BLOCK rule
   * @param {Array} signals
  * @returns {object} { isHardBlock, matchedRules, primaryConfidence, reasons }
  */
  static evaluate(signals = []) {
    const safeSignals = Array.isArray(signals)
      ? signals.filter((signal) => signal && typeof signal === "object" && !Array.isArray(signal))
      : [];
    const matchedRules = [];
    const reasons = new Set();
    let maxConfidence = LAYER_1_CONFIG.CONFIDENCE_BOUNDS.HARD_BLOCK_MIN;

    const signalTypes = new Set(safeSignals.filter((signal) => typeof signal.type === "string").map((signal) => signal.type));
    const criticalSignals = safeSignals.filter((signal) => signal.severity === SIGNAL_SEVERITY.CRITICAL);

    // RULE 1: Known Malicious Shell / Script Payload (P0)
    if (signalTypes.has(LAYER_1_REASONS.MALICIOUS_SHELL_PAYLOAD)) {
      matchedRules.push("RULE_MALICIOUS_SHELL_PAYLOAD");
      reasons.add(LAYER_1_REASONS.MALICIOUS_SHELL_PAYLOAD);
      maxConfidence = Math.max(maxConfidence, 0.99);
    }

    // RULE 2: Dangerous Executable Binary / Polyglot Spoofing (P0)
    if (
      signalTypes.has(LAYER_1_REASONS.EXECUTABLE_POLYGLOT) ||
      signalTypes.has(LAYER_1_REASONS.DANGEROUS_EXECUTABLE) ||
      signalTypes.has(LAYER_1_REASONS.MAGIC_BYTE_MISMATCH)
    ) {
      matchedRules.push("RULE_DANGEROUS_EXECUTABLE_OR_POLYGLOT");
      if (signalTypes.has(LAYER_1_REASONS.EXECUTABLE_POLYGLOT)) reasons.add(LAYER_1_REASONS.EXECUTABLE_POLYGLOT);
      if (signalTypes.has(LAYER_1_REASONS.DANGEROUS_EXECUTABLE)) reasons.add(LAYER_1_REASONS.DANGEROUS_EXECUTABLE);
      if (signalTypes.has(LAYER_1_REASONS.MAGIC_BYTE_MISMATCH)) reasons.add(LAYER_1_REASONS.MAGIC_BYTE_MISMATCH);
      maxConfidence = Math.max(maxConfidence, 0.99);
    }

    // RULE 3: Direct Credential & OTP / PIN Theft Combination (P0)
    const hasCredential = signalTypes.has(LAYER_1_REASONS.CREDENTIAL_REQUEST);
    const hasOtpOrPin = signalTypes.has(LAYER_1_REASONS.OTP_REQUEST) || signalTypes.has(LAYER_1_REASONS.PIN_REQUEST);
    if ((hasCredential && hasOtpOrPin) || signalTypes.has(LAYER_1_REASONS.PIN_REQUEST)) {
      matchedRules.push("RULE_CREDENTIAL_AND_OTP_THEFT");
      if (hasCredential) reasons.add(LAYER_1_REASONS.CREDENTIAL_REQUEST);
      if (signalTypes.has(LAYER_1_REASONS.OTP_REQUEST)) reasons.add(LAYER_1_REASONS.OTP_REQUEST);
      if (signalTypes.has(LAYER_1_REASONS.PIN_REQUEST)) reasons.add(LAYER_1_REASONS.PIN_REQUEST);
      maxConfidence = Math.max(maxConfidence, 0.98);
    }

    // RULE 4: Deceptive Phishing Domain / Homoglyph / Subdomain Impersonation / Typosquatting (P0)
    const hasDomainImpersonation =
      signalTypes.has(LAYER_1_REASONS.BRAND_IMPERSONATION_SUBDOMAIN) ||
      signalTypes.has(LAYER_1_REASONS.UNICODE_HOMOGLYPH) ||
      signalTypes.has(LAYER_1_REASONS.BRAND_IMPERSONATION) ||
      signalTypes.has(LAYER_1_REASONS.TYPOSQUATTING);

    const hasCorroboratingSignal =
      signalTypes.has(LAYER_1_REASONS.PHISHING_PATH_PATTERN) ||
      signalTypes.has(LAYER_1_REASONS.SUSPICIOUS_QUERY_PARAM) ||
      signalTypes.has(LAYER_1_REASONS.CREDENTIAL_REQUEST) ||
      signalTypes.has(LAYER_1_REASONS.UNENCRYPTED_TRANSPORT) ||
      signalTypes.has(LAYER_1_REASONS.SUSPICIOUS_TLD) ||
      signalTypes.has(LAYER_1_REASONS.SHORTENED_URL);

    const hasCriticalDomainThreat =
      signalTypes.has(LAYER_1_REASONS.BRAND_IMPERSONATION_SUBDOMAIN) ||
      signalTypes.has(LAYER_1_REASONS.UNICODE_HOMOGLYPH) ||
      criticalSignals.some((signal) => signal.category === "url" && typeof signal.type === "string" && signal.type.includes("brand"));

    if (hasCriticalDomainThreat || (hasDomainImpersonation && hasCorroboratingSignal)) {
      matchedRules.push("RULE_DECEPTIVE_DOMAIN_AND_PHISHING_PATH");
      reasons.add(LAYER_1_REASONS.PHISHING_PATTERN);
      if (signalTypes.has(LAYER_1_REASONS.BRAND_IMPERSONATION_SUBDOMAIN)) reasons.add(LAYER_1_REASONS.BRAND_IMPERSONATION_SUBDOMAIN);
      if (signalTypes.has(LAYER_1_REASONS.UNICODE_HOMOGLYPH)) reasons.add(LAYER_1_REASONS.UNICODE_HOMOGLYPH);
      if (signalTypes.has(LAYER_1_REASONS.BRAND_IMPERSONATION)) reasons.add(LAYER_1_REASONS.BRAND_IMPERSONATION);
      if (signalTypes.has(LAYER_1_REASONS.TYPOSQUATTING)) reasons.add(LAYER_1_REASONS.TYPOSQUATTING);
      maxConfidence = Math.max(maxConfidence, 0.98);
    }

    // RULE 5: Confirmed Task Deposit & Affiliate Scam Pattern (P1)
    if (signalTypes.has(LAYER_1_REASONS.TASK_DEPOSIT_SCAM)) {
      matchedRules.push("RULE_TASK_DEPOSIT_SCAM_CONFIRMED");
      reasons.add(LAYER_1_REASONS.TASK_DEPOSIT_SCAM);
      reasons.add(LAYER_1_REASONS.ADVANCE_FEE_SCAM);
      maxConfidence = Math.max(maxConfidence, 0.96);
    }

    // RULE 6: OCR Phishing Text with Confirmed Demand (P0)
    if (signalTypes.has(LAYER_1_REASONS.OCR_PHISHING_PATTERN)) {
      matchedRules.push("RULE_OCR_PHISHING_TEXT");
      reasons.add(LAYER_1_REASONS.OCR_PHISHING_PATTERN);
      maxConfidence = Math.max(maxConfidence, 0.97);
    }

    // RULE 7: QR Code Targeting Confirmed Malicious Destination (P0)
    if (signalTypes.has(LAYER_1_REASONS.QR_MALICIOUS_URL)) {
      matchedRules.push("RULE_QR_MALICIOUS_DESTINATION");
      reasons.add(LAYER_1_REASONS.QR_MALICIOUS_URL);
      maxConfidence = Math.max(maxConfidence, 0.98);
    }

    // RULE 8: SSRF Private/Loopback Target Attempt (P0)
    if (signalTypes.has(LAYER_1_REASONS.SSRF_ATTEMPT)) {
      matchedRules.push("RULE_SSRF_NETWORK_BLOCK");
      reasons.add(LAYER_1_REASONS.SSRF_ATTEMPT);
      maxConfidence = Math.max(maxConfidence, 0.99);
    }

    // RULE 9: Unsupported active URL schemes are blocked at the boundary so
    // no later layer can accidentally treat javascript:/data:/file: or a
    // similar non-web payload as an ordinary URL.
    if (signalTypes.has(LAYER_1_REASONS.UNSUPPORTED_SCHEME)) {
      matchedRules.push("RULE_UNSUPPORTED_URL_SCHEME");
      reasons.add(LAYER_1_REASONS.UNSUPPORTED_SCHEME);
      maxConfidence = Math.max(maxConfidence, 0.99);
    }

    const isHardBlock = matchedRules.length > 0;

    return {
      isHardBlock,
      matchedRules,
      primaryConfidence: isHardBlock ? Math.min(0.99, maxConfidence) : 0,
      reasons: Array.from(reasons),
    };
  }
}
