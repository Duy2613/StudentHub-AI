/**
 * Layer 4 — DeterministicTrustPolicyProvider
 * 
 * High-speed zero-LLM deterministic decision science engine.
 * Serves as the authoritative baseline and reliable offline fallback provider.
 */

import { ITrustReasoningModel } from "./ITrustReasoningModel.js";
import { HardDecisionPolicy } from "../policy/HardDecisionPolicy.js";
import { RiskAssessmentEngine } from "../policy/RiskAssessmentEngine.js";
import { TruthAssessmentEngine } from "../policy/TruthAssessmentEngine.js";
import { ConfidenceCalibrationEngine } from "../policy/ConfidenceCalibrationEngine.js";
import { ContradictionReconciler } from "../fusion/ContradictionReconciler.js";
import { AuditExplanationEngine } from "../explainer/AuditExplanationEngine.js";
import { FINAL_CLASSIFICATION, SECURITY_RISK_LEVEL, RECOMMENDED_ACTION } from "../types.js";

export class DeterministicTrustPolicyProvider extends ITrustReasoningModel {
  constructor() {
    super("deterministic_trust_policy_engine");
  }

  async reason(fusedGraph) {
    // 1. Evaluate Hard Rules First
    const hardRule = HardDecisionPolicy.evaluate(fusedGraph);
    if (hardRule) {
      const explanation = AuditExplanationEngine.generateExplanation({
        classification: hardRule.classification,
        action: hardRule.action,
        riskLevel: hardRule.riskLevel,
        truthAssessment: { status: "CONTRADICTED_OR_PHISHING", confidence: 0.98 },
        fusedGraph,
        hardRule,
      });

      return {
        classification: hardRule.classification,
        status: hardRule.action,
        truthAssessment: { status: "CONTRADICTED", confidence: 0.98 },
        riskAssessment: { level: hardRule.riskLevel, confidence: 0.99, primaryVectors: ["credential_theft"] },
        decisionConfidence: hardRule.decisionConfidence,
        verificationCompleteness: fusedGraph.layer3Completeness || 0.90,
        claims: fusedGraph.layer2Claims,
        keyReasons: [hardRule.reason],
        evidenceRefs: fusedGraph.layer3Evidence.map((e) => e.evidenceId),
        conflicts: [],
        limitations: [],
        recommendedAction: hardRule.action,
        userExplanation: explanation,
        hardRuleTriggered: hardRule.ruleId,
      };
    }

    // 2. Reconcile Contradictions & Temporal Updates
    const reconciliation = ContradictionReconciler.reconcile(
      fusedGraph.layer3Conflicts,
      fusedGraph.layer3Evidence,
      fusedGraph.layer3Sources
    );

    // 3. Assess Risk & Truth Dimensions Separately
    const riskAssessment = RiskAssessmentEngine.assessRisk(fusedGraph);
    const truthAssessment = TruthAssessmentEngine.assessTruth(fusedGraph, reconciliation);

    // 4. Resolve Final Classification & Operational Action Matrix
    let classification = truthAssessment.status;
    let action = RECOMMENDED_ACTION.REQUIRE_VERIFICATION;

    // Check Educational Immunity
    const isEducational =
      fusedGraph.layer2ContextSignals.some((s) => s.type === "educational_discussion") ||
      fusedGraph.layer2Classification === "INFORMATIVE";

    if (isEducational) {
      classification = FINAL_CLASSIFICATION.VERIFIED_TRUE;
      action = RECOMMENDED_ACTION.ALLOW;
    } else if (riskAssessment.level === SECURITY_RISK_LEVEL.CRITICAL) {
      classification = FINAL_CLASSIFICATION.MALICIOUS;
      action = RECOMMENDED_ACTION.BLOCK;
    } else if (reconciliation.unresolvedConflicts.length > 0) {
      classification = "CONTESTED";
      action = RECOMMENDED_ACTION.ESCALATE;
    } else if (classification === FINAL_CLASSIFICATION.MISLEADING) {
      action = RECOMMENDED_ACTION.ALLOW_WITH_WARNING;
    } else if (classification === FINAL_CLASSIFICATION.VERIFIED_TRUE) {
      action = RECOMMENDED_ACTION.ALLOW;
    } else if (classification === FINAL_CLASSIFICATION.CONTRADICTED) {
      action = RECOMMENDED_ACTION.RESTRICT;
    } else {
      action = RECOMMENDED_ACTION.REQUIRE_VERIFICATION;
    }

    // 5. Calibrate Confidence
    const confidenceMetrics = ConfidenceCalibrationEngine.calibrate({
      truthAssessment,
      riskAssessment,
      hardRule: null,
      fusedGraph,
    });

    // 6. Generate Human Explanation
    const explanation = AuditExplanationEngine.generateExplanation({
      classification,
      action,
      riskLevel: riskAssessment.level,
      truthAssessment,
      fusedGraph,
      reconciliation,
      hardRule: null,
    });

    return {
      classification,
      status: action,
      truthAssessment,
      riskAssessment,
      decisionConfidence: confidenceMetrics.decisionConfidence,
      verificationCompleteness: confidenceMetrics.verificationCompleteness,
      claims: truthAssessment.claimVerdicts,
      keyReasons: [explanation.why],
      evidenceRefs: fusedGraph.layer3Evidence.map((e) => e.evidenceId),
      conflicts: reconciliation.unresolvedConflicts,
      limitations: reconciliation.temporalUpdates.map((t) => t.notes),
      recommendedAction: action,
      userExplanation: explanation,
      hardRuleTriggered: null,
    };
  }
}
