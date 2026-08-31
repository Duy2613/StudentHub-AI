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
  static calibrate(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const truthAssessment = input.truthAssessment && typeof input.truthAssessment === "object" ? input.truthAssessment : {};
    const riskAssessment = input.riskAssessment && typeof input.riskAssessment === "object" ? input.riskAssessment : {};
    const hardRule = input.hardRule && typeof input.hardRule === "object" ? input.hardRule : null;
    const fusedGraph = input.fusedGraph && typeof input.fusedGraph === "object" && !Array.isArray(input.fusedGraph)
      ? input.fusedGraph
      : {};
    const securityClassification = typeof input.securityClassification === "string" ? input.securityClassification : "UNKNOWN";
    const evidenceSufficient = input.evidenceSufficient === true;

    if (hardRule) {
      return {
        truthConfidence: Number.isFinite(hardRule.decisionConfidence) ? hardRule.decisionConfidence : 0,
        riskConfidence: Number.isFinite(hardRule.decisionConfidence) ? hardRule.decisionConfidence : 0,
        decisionConfidence: Number.isFinite(hardRule.decisionConfidence) ? hardRule.decisionConfidence : 0,
        verificationCompleteness: Number.isFinite(fusedGraph.layer3Completeness) ? fusedGraph.layer3Completeness : 0,
        confidenceBasis: hardRule.confidenceBasis || "deterministic_hard_policy",
      };
    }

    const completeness = Number.isFinite(fusedGraph.layer3Completeness)
      ? Math.max(0, Math.min(1, fusedGraph.layer3Completeness))
      : 0;
    const agreement = Number.isFinite(fusedGraph.layer3Agreement?.agreementScore)
      ? Math.max(0, Math.min(1, fusedGraph.layer3Agreement.agreementScore))
      : 0;

    const truthBase = Number.isFinite(truthAssessment?.confidence) ? Math.max(0, Math.min(1, truthAssessment.confidence)) : 0;
    const riskBase = Number.isFinite(riskAssessment?.confidence) ? Math.max(0, Math.min(1, riskAssessment.confidence)) : 0;
    const truthConfidence = Number((truthBase * agreement).toFixed(2));
    const riskConfidence = Number(riskBase.toFixed(2));
    const rawDecisionConfidence = Number(((truthConfidence * 0.4 + riskConfidence * 0.4 + completeness * 0.2)).toFixed(2));
    const decisionConfidence = securityClassification === "UNKNOWN" || !evidenceSufficient
      ? Math.min(0.49, rawDecisionConfidence)
      : Math.min(0.99, rawDecisionConfidence);

    return {
      truthConfidence: Number(truthConfidence.toFixed(2)),
      riskConfidence: Number(riskConfidence.toFixed(2)),
      decisionConfidence,
      verificationCompleteness: Number(completeness.toFixed(2)),
      confidenceBasis: evidenceSufficient ? "bounded_evidence_fusion" : "abstention_or_incomplete_evidence",
    };
  }
}
