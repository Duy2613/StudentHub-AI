/**
 * Layer 4 — DeterministicTrustPolicyProvider
 *
 * The final policy boundary. Every outcome is derived from validated layer
 * state and the policy is deliberately fail-closed: absence, uncertainty,
 * provider failure, and incomplete evidence cannot become an allow result.
 */

import { ITrustReasoningModel } from "./ITrustReasoningModel.js";
import { HardDecisionPolicy } from "../policy/HardDecisionPolicy.js";
import { RiskAssessmentEngine } from "../policy/RiskAssessmentEngine.js";
import { TruthAssessmentEngine } from "../policy/TruthAssessmentEngine.js";
import { ConfidenceCalibrationEngine } from "../policy/ConfidenceCalibrationEngine.js";
import { ContradictionReconciler } from "../fusion/ContradictionReconciler.js";
import { AuditExplanationEngine } from "../explainer/AuditExplanationEngine.js";
import {
  FINAL_CLASSIFICATION,
  SECURITY_CLASSIFICATION,
  SECURITY_RISK_LEVEL,
  TRUTH_STATUS,
  RECOMMENDED_ACTION,
} from "../types.js";
import { isTrustedLayer2AResult } from "../../layer2a/TrustBoundary.js";
import { isTrustedLayer3Result } from "../../layer3/TrustBoundary.js";

const SUCCESS_PROVIDER_STATUS = new Set(["SUCCESS", "success", "healthy"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isFiniteUnit(value) {
  return Number.isFinite(value) && value >= 0 && value <= 1;
}

function hasThreatLookup(fusedGraph) {
  const result = fusedGraph?.layer2AResult;
  if (!result || typeof result !== "object" || Array.isArray(result)) return false;
  if (result.notApplicable === true) return false;
  return !(result.finding === "NOT_APPLICABLE" && result.providerStatus === "NOT_APPLICABLE");
}

function hasValidNoKnownThreat(fusedGraph) {
  const result = fusedGraph?.layer2AResult;
  if (!result || typeof result !== "object" || Array.isArray(result)) return false;
  if (!isTrustedLayer2AResult(result)) return false;
  return SUCCESS_PROVIDER_STATUS.has(result.providerStatus) &&
    result.finding === "NO_KNOWN_THREAT" &&
    result.provenance?.noMatchIsSafetyProof === false;
}

function hasUsableEvidence(fusedGraph) {
  if (!isTrustedLayer3Result(fusedGraph?.layer3Result)) return false;
  const evidence = asArray(fusedGraph?.layer3Evidence);
  const claims = asArray(fusedGraph?.layer2Claims).filter((claim) => claim && typeof claim === "object");
  const completeness = fusedGraph?.layer3Completeness;
  if (evidence.length === 0 || !isFiniteUnit(completeness) || completeness < 0.75) return false;

  if (claims.length > 0) {
    const claimIds = claims.map((claim) => claim.claimId).filter((claimId) => typeof claimId === "string" && claimId.trim());
    if (claimIds.length !== claims.length) return false;
    const coveredClaimIds = new Set(evidence.map((item) => item?.claimId).filter((claimId) => typeof claimId === "string"));
    if (!claimIds.every((claimId) => coveredClaimIds.has(claimId))) return false;
  }

  // M3 evidence must carry independently observed live provenance. A bare
  // excerpt, local knowledge-base item, or caller-asserted VERIFIED status is
  // never enough to authorize even a cautious allow.
  return evidence.some((item) => {
    if (!item || typeof item !== "object") return false;
    const hasSourceType = ["OFFICIAL_INSTITUTION", "REPUTABLE_SECONDARY", "SEARCH_RETRIEVAL"].includes(item.sourceType);
    const hasSourceFingerprint = typeof item.sourceFingerprint === "string" && item.sourceFingerprint.trim().length > 0;
    const hasBoundSourceUrl = typeof item.sourceUrl === "string" && /^https:\/\//i.test(item.sourceUrl);
    return item.liveEvidence === true &&
      item.providerStatus === "SUCCESS" &&
      item.retrievalOutcome === "SUCCESS" &&
      hasSourceType &&
      hasSourceFingerprint &&
      hasBoundSourceUrl &&
      typeof item.relation === "string";
  });
}

function hasUnresolvedConflict(fusedGraph, reconciliation) {
  return asArray(reconciliation?.unresolvedConflicts).length > 0 ||
    (asArray(fusedGraph?.layer3Conflicts).length > 0 && fusedGraph?.layer3Status === "CONTESTED");
}

function mapTruthStatus(truthAssessment, fusedGraph, reconciliation) {
  const claims = asArray(fusedGraph?.layer2Claims);
  if (claims.length === 0) return TRUTH_STATUS.NOT_APPLICABLE;
  if (hasUnresolvedConflict(fusedGraph, reconciliation)) return TRUTH_STATUS.MIXED;

  switch (truthAssessment?.status) {
    case FINAL_CLASSIFICATION.VERIFIED_TRUE:
    case FINAL_CLASSIFICATION.LIKELY_TRUE:
      return TRUTH_STATUS.SUPPORTED;
    case FINAL_CLASSIFICATION.CONTRADICTED:
    case FINAL_CLASSIFICATION.LIKELY_FALSE:
      return TRUTH_STATUS.CONTRADICTED;
    case FINAL_CLASSIFICATION.PARTIALLY_TRUE:
    case FINAL_CLASSIFICATION.MISLEADING:
    case "CONTESTED":
      return TRUTH_STATUS.MIXED;
    default:
      return TRUTH_STATUS.INSUFFICIENT_EVIDENCE;
  }
}

function getLocalSuspicion(fusedGraph, riskAssessment) {
  return fusedGraph?.layer1Status === "SUSPICIOUS" ||
    fusedGraph?.layer2Status === "SUSPICIOUS" ||
    fusedGraph?.layer2Classification === "DECEPTIVE" ||
    (typeof fusedGraph?.layer2CClassification === "string" &&
      !["NO_MATERIAL_STUDENT_RISK", "UNKNOWN_STUDENT_RISK", "UNKNOWN"].includes(fusedGraph.layer2CClassification)) ||
    riskAssessment?.level === SECURITY_RISK_LEVEL.HIGH ||
    riskAssessment?.level === SECURITY_RISK_LEVEL.MEDIUM;
}

function resolveLegacyClassification(truthAssessment, securityClassification, evidenceSufficient) {
  if (securityClassification === SECURITY_CLASSIFICATION.MALICIOUS) return FINAL_CLASSIFICATION.MALICIOUS;
  if (!evidenceSufficient && securityClassification === SECURITY_CLASSIFICATION.UNKNOWN) {
    return FINAL_CLASSIFICATION.INSUFFICIENT_EVIDENCE;
  }
  return truthAssessment?.status || FINAL_CLASSIFICATION.UNVERIFIED;
}

export class DeterministicTrustPolicyProvider extends ITrustReasoningModel {
  constructor() {
    super("deterministic_trust_policy_engine");
  }

  async reason(fusedGraph = {}) {
    const safeGraph = {
      ...fusedGraph,
      layer1Signals: asArray(fusedGraph.layer1Signals),
      layer2ContextSignals: asArray(fusedGraph.layer2ContextSignals),
      layer2CrossModalFindings: asArray(fusedGraph.layer2CrossModalFindings),
      layer2CDomainSignals: asArray(fusedGraph.layer2CDomainSignals),
      layer2Claims: asArray(fusedGraph.layer2Claims),
      layer3Sources: asArray(fusedGraph.layer3Sources),
      layer3Evidence: asArray(fusedGraph.layer3Evidence),
      layer3Conflicts: asArray(fusedGraph.layer3Conflicts),
      layer3ClaimStatuses: fusedGraph.layer3ClaimStatuses && typeof fusedGraph.layer3ClaimStatuses === "object"
        ? fusedGraph.layer3ClaimStatuses
        : {},
    };

    // 1. Hard rules always run first. This includes L2A threat intelligence;
    // AI, educational context, and source agreement cannot downgrade it.
    const hardRule = HardDecisionPolicy.evaluate(safeGraph);
    if (hardRule) {
      const explanation = AuditExplanationEngine.generateExplanation({
        classification: hardRule.classification,
        securityClassification: hardRule.securityClassification || SECURITY_CLASSIFICATION.MALICIOUS,
        action: hardRule.action,
        riskLevel: hardRule.riskLevel,
        truthAssessment: { status: hardRule.truthStatus || TRUTH_STATUS.NOT_APPLICABLE, confidence: hardRule.decisionConfidence },
        fusedGraph: safeGraph,
        hardRule,
      });

      return {
        classification: hardRule.classification,
        securityClassification: hardRule.securityClassification || SECURITY_CLASSIFICATION.MALICIOUS,
        truthStatus: hardRule.truthStatus || TRUTH_STATUS.NOT_APPLICABLE,
        enforcement: RECOMMENDED_ACTION.BLOCK,
        status: RECOMMENDED_ACTION.BLOCK,
        truthAssessment: { status: hardRule.truthStatus || TRUTH_STATUS.NOT_APPLICABLE, confidence: isFiniteUnit(hardRule.decisionConfidence) ? hardRule.decisionConfidence : 0 },
        riskAssessment: {
          level: hardRule.riskLevel,
          confidence: isFiniteUnit(hardRule.decisionConfidence) ? hardRule.decisionConfidence : 0,
          primaryVectors: ["known_threat_or_hard_negative"],
        },
        decisionConfidence: isFiniteUnit(hardRule.decisionConfidence) ? hardRule.decisionConfidence : 0,
        verificationCompleteness: isFiniteUnit(safeGraph.layer3Completeness) ? safeGraph.layer3Completeness : 0,
        claims: safeGraph.layer2Claims,
        keyReasons: [hardRule.reason],
        evidenceRefs: safeGraph.layer3Evidence.map((e) => e?.evidenceId).filter(Boolean),
        conflicts: safeGraph.layer3Conflicts,
        limitations: ["Threat match is a security finding; it is not a factual truth claim."],
        recommendedAction: RECOMMENDED_ACTION.BLOCK,
        userExplanation: explanation,
        hardRuleTriggered: hardRule.ruleId,
        policyPrecedence: hardRule.policyPrecedence || [hardRule.ruleId, "BLOCK"],
        confidenceBasis: hardRule.confidenceBasis || "deterministic_hard_policy",
        scamTypes: safeGraph.scamTypes || [],
        psychTactics: safeGraph.psychTactics || [],
        attackStage: safeGraph.attackStage || null,
        requestedActions: safeGraph.requestedActions || [],
        targetAssets: safeGraph.targetAssets || [],
        triggeredInteractions: safeGraph.triggeredInteractions || [],
        isHardNegative: true,
        uncertainty: safeGraph.uncertainty || {},
      };
    }

    const reconciliation = ContradictionReconciler.reconcile(
      safeGraph.layer3Conflicts,
      safeGraph.layer3Evidence,
      safeGraph.layer3Sources
    );
    const riskAssessment = RiskAssessmentEngine.assessRisk(safeGraph, reconciliation);
    const truthAssessment = TruthAssessmentEngine.assessTruth(safeGraph, reconciliation);
    const truthStatus = mapTruthStatus(truthAssessment, safeGraph, reconciliation);
    const evidenceSufficient = hasUsableEvidence(safeGraph);
    const threatLookupPresent = hasThreatLookup(safeGraph);
    const threatLookupSucceeded = hasValidNoKnownThreat(safeGraph) ||
      (threatLookupPresent && SUCCESS_PROVIDER_STATUS.has(safeGraph.layer2AProviderStatus) && safeGraph.layer2AFinding === "THREAT_MATCH");
    const threatLookupFailed = threatLookupPresent && !threatLookupSucceeded;
    const localSuspicion = getLocalSuspicion(safeGraph, riskAssessment);
    const hasUnknownLayer = safeGraph.layer1Status === "UNKNOWN" || safeGraph.layer2Status === "UNKNOWN";
    const noKnownThreat = hasValidNoKnownThreat(safeGraph);

    let securityClassification = SECURITY_CLASSIFICATION.UNKNOWN;
    let enforcement = RECOMMENDED_ACTION.REVIEW;
    const policyPrecedence = [];

    // Deterministic hard-negative checks are repeated at the final boundary in
    // case a caller supplied a graph that bypassed a previous helper.
    if (safeGraph.layer1Status === "BLOCK" || safeGraph.layer2Status === "BLOCK") {
      securityClassification = SECURITY_CLASSIFICATION.MALICIOUS;
      enforcement = RECOMMENDED_ACTION.BLOCK;
      policyPrecedence.push("LAYER_HARD_BLOCK", "BLOCK");
    } else if (hasUnresolvedConflict(safeGraph, reconciliation)) {
      securityClassification = SECURITY_CLASSIFICATION.SUSPICIOUS;
      enforcement = RECOMMENDED_ACTION.REVIEW;
      policyPrecedence.push("UNRESOLVED_SOURCE_CONFLICT", "REVIEW");
    } else if (localSuspicion) {
      securityClassification = SECURITY_CLASSIFICATION.SUSPICIOUS;
      enforcement = threatLookupFailed ? RECOMMENDED_ACTION.REVIEW : RECOMMENDED_ACTION.WARN;
      policyPrecedence.push(noKnownThreat ? "LOCAL_SUSPICION_PLUS_NO_MATCH" : "LOCAL_SUSPICION");
      policyPrecedence.push(enforcement);
    } else if (threatLookupFailed || hasUnknownLayer || (!evidenceSufficient && !noKnownThreat)) {
      securityClassification = SECURITY_CLASSIFICATION.UNKNOWN;
      enforcement = RECOMMENDED_ACTION.REVIEW;
      policyPrecedence.push(threatLookupFailed ? "THREAT_PROVIDER_FAILURE" : "INSUFFICIENT_OR_UNKNOWN_EVIDENCE", "REVIEW");
    } else if (noKnownThreat || evidenceSufficient) {
      securityClassification = SECURITY_CLASSIFICATION.NO_KNOWN_THREAT;
      enforcement = RECOMMENDED_ACTION.ALLOW_WITH_CAUTION;
      policyPrecedence.push(noKnownThreat ? "L2A_NO_KNOWN_THREAT" : "EVIDENCE_SUPPORTED", "ALLOW_WITH_CAUTION");
    }

    if (securityClassification === SECURITY_CLASSIFICATION.UNKNOWN && enforcement !== RECOMMENDED_ACTION.REVIEW) {
      enforcement = RECOMMENDED_ACTION.REVIEW;
    }
    const classification = resolveLegacyClassification(truthAssessment, securityClassification, evidenceSufficient);

    const confidenceMetrics = ConfidenceCalibrationEngine.calibrate({
      truthAssessment,
      riskAssessment,
      hardRule: null,
      fusedGraph: safeGraph,
      securityClassification,
      evidenceSufficient,
    });

    const explanation = AuditExplanationEngine.generateExplanation({
      classification,
      securityClassification,
      action: enforcement,
      riskLevel: riskAssessment.level,
      truthAssessment: { ...truthAssessment, status: truthStatus },
      fusedGraph: safeGraph,
      reconciliation,
    });

    return {
      classification,
      securityClassification,
      truthStatus,
      enforcement,
      status: enforcement,
      truthAssessment,
      riskAssessment,
      decisionConfidence: confidenceMetrics.decisionConfidence,
      verificationCompleteness: confidenceMetrics.verificationCompleteness,
      claims: truthAssessment.claimVerdicts,
      keyReasons: [explanation.why],
      evidenceRefs: safeGraph.layer3Evidence.map((e) => e?.evidenceId).filter(Boolean),
      conflicts: reconciliation.unresolvedConflicts,
      limitations: [
        ...(threatLookupFailed ? ["Threat-intelligence provider did not return a usable result."] : []),
        ...(!evidenceSufficient ? ["Không đủ bằng chứng có provenance để xác minh an toàn."] : []),
        ...reconciliation.temporalUpdates.map((t) => t.notes),
      ],
      recommendedAction: enforcement,
      userExplanation: explanation,
      hardRuleTriggered: null,
      policyPrecedence,
      confidenceBasis: confidenceMetrics.confidenceBasis,
      scamTypes: safeGraph.scamTypes || [],
      psychTactics: safeGraph.psychTactics || [],
      attackStage: safeGraph.attackStage || null,
      requestedActions: safeGraph.requestedActions || [],
      targetAssets: safeGraph.targetAssets || [],
      triggeredInteractions: safeGraph.triggeredInteractions || [],
      isHardNegative: safeGraph.isHardNegative || false,
      uncertainty: safeGraph.uncertainty || {},
    };
  }
}
