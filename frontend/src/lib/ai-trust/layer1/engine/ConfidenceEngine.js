/**
 * Layer 1 — ConfidenceEngine
 * 
 * Computes calibrated confidence representing certainty in the security classification.
 * Formula: Evidence Strength × Detector Reliability × Independent Corroboration.
 */

import { LAYER_1_CONFIG } from "../config/Layer1Config.js";
import { SIGNAL_SEVERITY, LAYER_1_STATUS } from "../types.js";

const SEVERITY_WEIGHT_MAP = {
  [SIGNAL_SEVERITY.CRITICAL]: 0.95,
  [SIGNAL_SEVERITY.HIGH]: 0.75,
  [SIGNAL_SEVERITY.MEDIUM]: 0.45,
  [SIGNAL_SEVERITY.LOW]: 0.20,
  [SIGNAL_SEVERITY.INFO]: 0.05,
};

export class ConfidenceEngine {
  /**
   * Computes calibrated confidence for a given status and aggregated signal set
   * @param {object} params
   * @param {string} params.status - 'BLOCK' | 'SUSPICIOUS' | 'PASS'
   * @param {Array} params.signals - Deduplicated signals
   * @param {boolean} params.isWhitelisted
   * @param {number} [params.hardRuleConfidence]
   * @returns {number} Calibrated confidence in [0.0 - 1.0]
   */
  static calculate({ status, signals = [], isWhitelisted = false, hardRuleConfidence = 0 }) {
    if (status === LAYER_1_STATUS.BLOCK) {
      // Hard block confidence is bounded strictly between 0.95 and 0.99
      return Math.min(
        LAYER_1_CONFIG.CONFIDENCE_BOUNDS.HARD_BLOCK_MAX,
        Math.max(LAYER_1_CONFIG.CONFIDENCE_BOUNDS.HARD_BLOCK_MIN, hardRuleConfidence || 0.96)
      );
    }

    if (isWhitelisted) {
      return LAYER_1_CONFIG.CONFIDENCE_BOUNDS.WHITELIST_PASS;
    }

    if (status === LAYER_1_STATUS.PASS) {
      // Clean pass confidence: Confidence that no immediate threat exists at Layer 1
      return LAYER_1_CONFIG.CONFIDENCE_BOUNDS.PASS_MIN;
    }

    // For SUSPICIOUS: Compute probabilistic compound risk
    const riskSignals = signals.filter(
      (s) => s.severity === SIGNAL_SEVERITY.HIGH || s.severity === SIGNAL_SEVERITY.MEDIUM || s.severity === SIGNAL_SEVERITY.CRITICAL
    );

    if (riskSignals.length === 0) {
      return LAYER_1_CONFIG.CONFIDENCE_BOUNDS.SUSPICIOUS_MIN;
    }

    // Compound score = 1 - product(1 - weight_i)
    const compoundRisk = 1 - riskSignals.reduce((acc, sig) => {
      const sevWeight = SEVERITY_WEIGHT_MAP[sig.severity] || 0.3;
      const effectiveWeight = (sig.confidence || 0.5) * sevWeight;
      return acc * (1 - Math.min(0.85, effectiveWeight));
    }, 1);

    // Number of distinct categories acting as independent corroboration
    const distinctCategories = new Set(riskSignals.map((s) => s.category)).size;
    const corroborationBoost = distinctCategories >= 2 ? 0.10 : 0.0;

    const rawCalibrated = compoundRisk + corroborationBoost;

    return Number(
      Math.min(
        LAYER_1_CONFIG.CONFIDENCE_BOUNDS.SUSPICIOUS_MAX,
        Math.max(LAYER_1_CONFIG.CONFIDENCE_BOUNDS.SUSPICIOUS_MIN, rawCalibrated)
      ).toFixed(2)
    );
  }
}
