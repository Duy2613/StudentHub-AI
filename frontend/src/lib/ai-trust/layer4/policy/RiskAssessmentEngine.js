/**
 * Layer 4 — RiskAssessmentEngine
 * 
 * Evaluates security risk level (NONE, LOW, MEDIUM, HIGH, CRITICAL)
 * independently from truth status (Truth != Safe).
 */

import { SECURITY_RISK_LEVEL } from "../types.js";
import { LAYER_4_CONFIG } from "../config/Layer4Config.js";

export class RiskAssessmentEngine {
  /**
   * Assesses risk level across fused evidence
   * @param {object} fusedGraph
   * @returns {object} { level, confidence, primaryVectors }
   */
  static assessRisk(fusedGraph) {
    const primaryVectors = [];
    let riskScore = 0.0;

    // Check Educational Immunity
    const isEducational =
      fusedGraph.layer2ContextSignals.some((s) => s.type === "educational_discussion") ||
      fusedGraph.layer2Classification === "INFORMATIVE";

    if (isEducational) {
      return {
        level: SECURITY_RISK_LEVEL.NONE,
        confidence: 0.95,
        primaryVectors: ["educational_context_safe"],
      };
    }

    // 1. Credential / Account Takeover Risk (CRITICAL)
    const hasCreds =
      fusedGraph.layer1Signals.some((s) => s.type === "credential_request" || s.type === "otp_request") ||
      fusedGraph.layer2ContextSignals.some((s) => s.type === "credential_harvesting_context" || s.type === "account_takeover_context");

    if (hasCreds) {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.CREDENTIAL_THEFT);
      riskScore = 1.0;
    }

    // 2. Financial Harm Risk (HIGH)
    const hasFinancial =
      fusedGraph.layer2ContextSignals.some((s) => s.type === "financial_scam_context") ||
      fusedGraph.layer2Intent.primary === "request_payment";

    if (hasFinancial) {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.FINANCIAL_LOSS);
      riskScore = Math.max(riskScore, 0.85);
    }

    // 3. High-Impact Dispute / Conflict Risk (HIGH / MEDIUM)
    const hasUnresolvedConflicts = fusedGraph.layer3Conflicts?.length > 0;
    const isHighImpactEntity = fusedGraph.layer2Claims?.some(
      (c) => c.importance === "critical" || c.importance === "high" || c.subject?.toLowerCase().includes("bộ gd")
    );

    if (hasUnresolvedConflicts && isHighImpactEntity) {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.ACADEMIC_MISINFORMATION);
      riskScore = Math.max(riskScore, 0.80);
    } else if (hasUnresolvedConflicts || fusedGraph.layer3Status === "CONTESTED") {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.ACADEMIC_MISINFORMATION);
      riskScore = Math.max(riskScore, 0.55);
    }

    // 4. Misleading / Scope Overstatement Risk (MEDIUM)
    const hasPartial =
      fusedGraph.layer3Evidence?.some((e) => e.relation === "PARTIALLY_SUPPORTS") ||
      Object.values(fusedGraph.layer3ClaimStatuses || {}).includes("PARTIALLY_SUPPORTED") ||
      fusedGraph.layer2Classification === "DECEPTIVE";

    if (hasPartial) {
      primaryVectors.push(LAYER_4_CONFIG.HARM_CATEGORIES.ACADEMIC_MISINFORMATION);
      riskScore = Math.max(riskScore, 0.50);
    }

    // 5. Unverified Claims (LOW)
    const hasUnverified =
      fusedGraph.layer3Status === "UNVERIFIED" ||
      Object.values(fusedGraph.layer3ClaimStatuses || {}).includes("UNVERIFIED");

    if (hasUnverified && riskScore < 0.20) {
      primaryVectors.push("unverified_factual_claim");
      riskScore = Math.max(riskScore, 0.25);
    }

    // 6. Determine Level
    let level = SECURITY_RISK_LEVEL.NONE;
    if (riskScore >= 0.90) level = SECURITY_RISK_LEVEL.CRITICAL;
    else if (riskScore >= 0.75) level = SECURITY_RISK_LEVEL.HIGH;
    else if (riskScore >= 0.45) level = SECURITY_RISK_LEVEL.MEDIUM;
    else if (riskScore >= 0.20) level = SECURITY_RISK_LEVEL.LOW;

    return {
      level,
      confidence: Number(Math.max(0.70, riskScore).toFixed(2)),
      primaryVectors,
    };
  }
}
