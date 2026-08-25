/**
 * Layer 2 — Layer2ConfidenceEngine
 * 
 * Synthesizes compound confidence scores from Layer 1 prior signals,
 * semantic intents, context vectors, cross-modal discrepancies, and consistency findings.
 */

import { LAYER_2_CONFIG } from "../config/Layer2Config.js";

export class Layer2ConfidenceEngine {
  /**
   * Calibrates Layer 2 confidence
   * @param {object} params
   * @param {object} params.layer1Result
   * @param {object} params.semanticAnalysis
   * @returns {number} Confidence score [0.0 - 1.0]
   */
  static calibrateConfidence({ layer1Result = {}, semanticAnalysis = {} }) {
    const { contextSignals = [], consistencyFindings = [], crossModalFindings = [], intent = {} } = semanticAnalysis;

    // 1. Check for Educational Discussion Guard (Dampens risk confidence)
    const isEducational = contextSignals.some((s) => s.type === "educational_discussion");
    if (isEducational) {
      return 0.92; // High confidence that this is benign educational content
    }

    // 2. High-Severity Critical Compounds (Instant high confidence in threat)
    const hasCriticalContext = contextSignals.some((s) => s.severity === "critical");
    const hasCriticalCrossModal = crossModalFindings.some((f) => f.severity === "critical");
    const isCoerciveIntent = intent.coercive || intent.primary === "request_credentials" || intent.primary === "request_payment";

    if (hasCriticalContext && (hasCriticalCrossModal || isCoerciveIntent || layer1Result.status === "BLOCK")) {
      return 0.98; // Very high certainty of malicious social engineering
    }

    if (hasCriticalContext || hasCriticalCrossModal) {
      return 0.95;
    }

    // 3. Contradictions & Misleading Cues
    if (consistencyFindings.length > 0) {
      return 0.88;
    }

    // 4. Layer 1 Prior Suspicion Corroboration
    if (layer1Result.status === "SUSPICIOUS") {
      return 0.85;
    }

    // 5. Unverified Factual Claims
    const hasUnverifiedClaims = semanticAnalysis.claims?.some((c) => c.verificationRequired);
    if (hasUnverifiedClaims) {
      return 0.86; // High confidence that external verification is required
    }

    // 6. Clean Content Baseline
    return LAYER_2_CONFIG.CONFIDENCE.PASS_MINIMUM_CONFIDENCE;
  }
}
