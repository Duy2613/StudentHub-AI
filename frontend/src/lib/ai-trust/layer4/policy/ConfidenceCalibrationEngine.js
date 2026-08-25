/**
 * Layer 4 — ConfidenceCalibrationEngine
 * 
 * Computes calibrated multidimensional confidence metrics:
 * 1. Truth Confidence (Confidence in the factual assessment)
 * 2. Risk Confidence (Confidence in the harm assessment)
 * 3. Decision Confidence (Confidence that the action is justified)
 * 4. Verification Completeness
 */

export class ConfidenceCalibrationEngine {
  /**
   * Calibrates confidence scores
   */
  static calibrate({
    truthAssessment,
    riskAssessment,
    hardRule,
    fusedGraph,
  }) {
    if (hardRule) {
      return {
        truthConfidence: 0.95,
        riskConfidence: 0.99,
        decisionConfidence: hardRule.decisionConfidence || 0.98,
        verificationCompleteness: fusedGraph.layer3Completeness || 0.90,
      };
    }

    const completeness = fusedGraph.layer3Completeness || 0.85;
    const agreement = fusedGraph.layer3Agreement?.agreementScore || 1.0;

    const truthConfidence = Math.min(0.99, Math.max(0.60, truthAssessment.confidence * agreement));
    const riskConfidence = Math.min(0.99, Math.max(0.60, riskAssessment.confidence));
    const decisionConfidence = Math.min(0.99, Number(((truthConfidence * 0.4 + riskConfidence * 0.4 + completeness * 0.2)).toFixed(2)));

    return {
      truthConfidence: Number(truthConfidence.toFixed(2)),
      riskConfidence: Number(riskConfidence.toFixed(2)),
      decisionConfidence,
      verificationCompleteness: Number(completeness.toFixed(2)),
    };
  }
}
