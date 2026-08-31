/**
 * Layer 4 — RiskAssessmentEngine
 * 
 * Evaluates security risk level (NONE, LOW, MEDIUM, HIGH, CRITICAL)
 * independently from truth status (Truth != Safe).
 */

import { SECURITY_RISK_LEVEL } from "../types.js";
import { LAYER_4_CONFIG } from "../config/Layer4Config.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export class RiskAssessmentEngine {
  /**
   * Assesses risk level across fused evidence
   * @param {object} fusedGraph
   * @returns {object} { level, confidence, primaryVectors }
   */
  static assessRisk(fusedGraph, reconciliation = null) {
    fusedGraph = fusedGraph && typeof fusedGraph === "object" && !Array.isArray(fusedGraph) ? fusedGraph : {};
    const primaryVectors = [];
    let riskScore = 0.0;

    const layer1Signals = asArray(fusedGraph.layer1Signals).filter((item) => item && typeof item === "object" && !Array.isArray(item));
    const layer2ContextSignals = asArray(fusedGraph.layer2ContextSignals).filter((item) => item && typeof item === "object" && !Array.isArray(item));
    const layer3Evidence = asArray(fusedGraph.layer3Evidence).filter((item) => item && typeof item === "object" && !Array.isArray(item));
    const layer2Claims = asArray(fusedGraph.layer2Claims).filter((item) => item && typeof item === "object" && !Array.isArray(item));
    const layer3Conflicts = asArray(fusedGraph.layer3Conflicts).filter((item) => item && typeof item === "object" && !Array.isArray(item));
    const layer3ClaimStatuses = fusedGraph.layer3ClaimStatuses && typeof fusedGraph.layer3ClaimStatuses === "object" && !Array.isArray(fusedGraph.layer3ClaimStatuses)
      ? fusedGraph.layer3ClaimStatuses
      : {};
    const hasReconciliation = reconciliation && typeof reconciliation === "object" && !Array.isArray(reconciliation);
    const unresolvedConflicts = hasReconciliation
      ? asArray(reconciliation.unresolvedConflicts).filter((item) => item && typeof item === "object" && !Array.isArray(item))
      : layer3Conflicts;

    // A validated Layer 2A threat match is a hard security negative. This
    // method remains safe even when called independently of HardDecisionPolicy.
    if (fusedGraph?.layer2AFinding === "THREAT_MATCH" || fusedGraph?.layer2ASecurityClassification === "MALICIOUS") {
      return {
        level: SECURITY_RISK_LEVEL.CRITICAL,
        confidence: Number.isFinite(fusedGraph.layer2AProviderConfidence) ? fusedGraph.layer2AProviderConfidence : 0,
        primaryVectors: [LAYER_4_CONFIG.HARM_CATEGORIES.MALWARE_INFECTION, "known_threat_match"],
      };
    }

    if (fusedGraph?.layer1Status === "BLOCK" || fusedGraph?.layer2Status === "BLOCK") {
      return {
        level: SECURITY_RISK_LEVEL.CRITICAL,
        confidence: 0.98,
        primaryVectors: ["deterministic_hard_block"],
      };
    }

    const hasSuspiciousSignal =
      fusedGraph?.layer1Status === "SUSPICIOUS" ||
      fusedGraph?.layer2Status === "SUSPICIOUS" ||
      fusedGraph?.layer2Classification === "DECEPTIVE";
    const threatProviderFailed = fusedGraph?.layer2AResult &&
      !["SUCCESS", "success", "healthy"].includes(fusedGraph.layer2AProviderStatus) &&
      fusedGraph.layer2AFinding !== "NO_KNOWN_THREAT";

    // 1. Credential / Account Takeover Risk (CRITICAL)
    const hasCreds =
      layer1Signals.some((s) => s.type === "credential_request" || s.type === "otp_request") ||
      layer2ContextSignals.some((s) => s.type === "credential_harvesting_context" || s.type === "account_takeover_context");

    if (hasCreds) {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.CREDENTIAL_THEFT);
      riskScore = 1.0;
    }

    // 2. Financial Harm Risk (HIGH)
    const hasFinancial =
      layer2ContextSignals.some((s) => s.type === "financial_scam_context") ||
      fusedGraph.layer2Intent?.primary === "request_payment";

    if (hasFinancial) {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.FINANCIAL_LOSS);
      riskScore = Math.max(riskScore, 0.85);
    }

    // 3. High-Impact Dispute / Conflict Risk (HIGH / MEDIUM)
    const hasUnresolvedConflicts = unresolvedConflicts.length > 0;
    const isHighImpactEntity = layer2Claims.some(
      (c) => c.importance === "critical" || c.importance === "high" || c.subject?.toLowerCase().includes("bộ gd")
    );

    if (hasUnresolvedConflicts && isHighImpactEntity) {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.ACADEMIC_MISINFORMATION);
      riskScore = Math.max(riskScore, 0.80);
    } else if (hasUnresolvedConflicts || (!hasReconciliation && fusedGraph.layer3Status === "CONTESTED")) {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.ACADEMIC_MISINFORMATION);
      riskScore = Math.max(riskScore, 0.55);
    }

    // 4. Misleading / Scope Overstatement Risk (MEDIUM)
    const hasPartial =
      layer3Evidence.some((e) => e && e.relation === "PARTIALLY_SUPPORTS") ||
      Object.values(layer3ClaimStatuses).includes("PARTIALLY_SUPPORTED") ||
      fusedGraph.layer2Classification === "DECEPTIVE";

    if (hasPartial) {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.ACADEMIC_MISINFORMATION);
      riskScore = Math.max(riskScore, 0.50);
    }

    if (hasSuspiciousSignal) {
      primaryVectors.push("local_or_semantic_suspicion");
      riskScore = Math.max(riskScore, 0.45);
    }

    if (threatProviderFailed) {
      primaryVectors.push("threat_intelligence_unavailable");
      riskScore = Math.max(riskScore, 0.20);
    }

    // 5. Unverified Claims (LOW)
    const hasUnverified =
      fusedGraph.layer3Status === "UNVERIFIED" ||
      fusedGraph.layer3Status === "INSUFFICIENT_EVIDENCE" ||
      Object.values(layer3ClaimStatuses).includes("UNVERIFIED");

    if (hasUnverified && riskScore < 0.20) {
      primaryVectors.push("unverified_factual_claim");
      riskScore = Math.max(riskScore, 0.25);
    }

    const noEvidence = layer3Evidence.length === 0;
    const hasUnknownBoundary = fusedGraph?.layer1Status === "UNKNOWN" || fusedGraph?.layer2Status === "UNKNOWN" || threatProviderFailed;
    if (noEvidence && hasUnknownBoundary && riskScore < 0.20) {
      return {
        level: SECURITY_RISK_LEVEL.UNKNOWN,
        confidence: 0,
        primaryVectors: [...primaryVectors, "insufficient_evidence"],
      };
    }

    // 6. Determine Level
    let level = SECURITY_RISK_LEVEL.NONE;
    if (riskScore >= 0.90) level = SECURITY_RISK_LEVEL.CRITICAL;
    else if (riskScore >= 0.75) level = SECURITY_RISK_LEVEL.HIGH;
    else if (riskScore >= 0.45) level = SECURITY_RISK_LEVEL.MEDIUM;
    else if (riskScore >= 0.20) level = SECURITY_RISK_LEVEL.LOW;

    return {
      level,
      confidence: Number(Math.max(0, Math.min(1, riskScore || (fusedGraph?.layer2AFinding === "NO_KNOWN_THREAT" ? 0.20 : 0))).toFixed(2)),
      primaryVectors,
    };
  }
}
