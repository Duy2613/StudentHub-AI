/**
 * Layer 4 — Types, Enums & Standardized Contract Definitions
 * 
 * Defines the core decision science DTOs for:
 * - Final Classification: VERIFIED_TRUE, LIKELY_TRUE, PARTIALLY_TRUE, MISLEADING, LIKELY_FALSE, CONTRADICTED, UNVERIFIED, INSUFFICIENT_EVIDENCE, MALICIOUS
 * - Security Risk Level: NONE, LOW, MEDIUM, HIGH, CRITICAL
 * - Recommended Operational Action: ALLOW, ALLOW_WITH_WARNING, REQUIRE_VERIFICATION, RESTRICT, BLOCK, ESCALATE
 * - Truth Assessment, Risk Assessment, and Auditable Explanation builders
 */

export const FINAL_CLASSIFICATION = {
  VERIFIED_TRUE: "VERIFIED_TRUE",                 // Supported by official primary authoritative evidence
  LIKELY_TRUE: "LIKELY_TRUE",                     // Strong secondary evidence without contradiction
  PARTIALLY_TRUE: "PARTIALLY_TRUE",               // Core fact is supported but some details are inaccurate
  MISLEADING: "MISLEADING",                       // Information materially distorted, overgeneralized, or presented in false context
  LIKELY_FALSE: "LIKELY_FALSE",                   // Substantial evidence contradicting claim
  CONTRADICTED: "CONTRADICTED",                   // Conclusively refuted by primary authoritative sources
  UNVERIFIED: "UNVERIFIED",                       // Insufficient external evidence (NOT automatically false!)
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE", // Outdated or ambiguous evidence
  MALICIOUS: "MALICIOUS",                         // Active harmful/deceptive attack (phishing, scam, malware)
};

export const SECURITY_RISK_LEVEL = {
  NONE: "NONE",           // Safe informational or benign academic content
  LOW: "LOW",             // Minor unverified claim or harmless exaggeration
  MEDIUM: "MEDIUM",       // Misleading institutional claim or significant misinformation without direct theft
  HIGH: "HIGH",           // Financial deposit lure, unauthorized payment demand, high-impact medical/legal distortion
  CRITICAL: "CRITICAL",   // Active credential harvesting, OTP phishing, malicious binary payload, account takeover
};

export const RECOMMENDED_ACTION = {
  ALLOW: "ALLOW",                                 // Content is safe and verified; allow full interaction
  ALLOW_WITH_WARNING: "ALLOW_WITH_WARNING",       // Present content with an informative disclaimer/context note
  REQUIRE_VERIFICATION: "REQUIRE_VERIFICATION",   // Urge user to cross-check with official sources before acting
  RESTRICT: "RESTRICT",                           // Throttle propagation or warn before external navigation
  BLOCK: "BLOCK",                                 // Intercept and prevent user access immediately (Early Exit STOP)
  ESCALATE: "ESCALATE",                           // Flag for human expert review / administrative audit
};

/**
 * Creates a Claim-Level Verdict DTO
 */
export function createClaimVerdict({
  claimId,
  subject = "",
  predicate = "",
  rawText = "",
  importance = "medium",
  truthStatus = "UNVERIFIED",
  riskLevel = SECURITY_RISK_LEVEL.NONE,
  evidenceRefs = [],
  notes = "",
}) {
  return {
    claimId,
    subject,
    predicate,
    rawText,
    importance,
    truthStatus,
    riskLevel,
    evidenceRefs,
    notes,
  };
}

/**
 * Creates a Layer 4 Final Trust Result DTO
 */
export function createLayer4Result({
  classification = FINAL_CLASSIFICATION.UNVERIFIED,
  status = RECOMMENDED_ACTION.REQUIRE_VERIFICATION,
  truthAssessment = { status: "UNVERIFIED", confidence: 0.5 },
  riskAssessment = { level: SECURITY_RISK_LEVEL.LOW, confidence: 0.5, primaryVectors: [] },
  decisionConfidence = 0.5,
  verificationCompleteness = 0.0,
  claims = [],
  keyReasons = [],
  evidenceRefs = [],
  conflicts = [],
  limitations = [],
  recommendedAction = RECOMMENDED_ACTION.REQUIRE_VERIFICATION,
  userExplanation = {
    verdictTitle: "",
    why: "",
    keyEvidence: [],
    uncertainties: [],
    riskSummary: "",
    recommendedActionNote: "",
  },
  auditTrail = {},
  metrics = {},
}) {
  return {
    layer: 4,
    classification,
    status,
    truthAssessment: {
      status: truthAssessment.status || "UNVERIFIED",
      confidence: Number((truthAssessment.confidence || 0.5).toFixed(2)),
    },
    riskAssessment: {
      level: riskAssessment.level || SECURITY_RISK_LEVEL.LOW,
      confidence: Number((riskAssessment.confidence || 0.5).toFixed(2)),
      primaryVectors: riskAssessment.primaryVectors || [],
    },
    decisionConfidence: Number(decisionConfidence.toFixed(2)),
    verificationCompleteness: Number(verificationCompleteness.toFixed(2)),
    claims,
    keyReasons,
    evidenceRefs,
    conflicts,
    limitations,
    recommendedAction,
    userExplanation,
    auditTrail: {
      requestId: auditTrail.requestId || `req_l4_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: auditTrail.timestamp || new Date().toISOString(),
      ruleVersion: auditTrail.ruleVersion || "layer4-v1.0.0",
      fusedEvidenceCount: auditTrail.fusedEvidenceCount || 0,
      hardRuleTriggered: auditTrail.hardRuleTriggered || null,
    },
    metrics: {
      executionTimeMs: metrics.executionTimeMs || 0,
      modelUsed: metrics.modelUsed || "deterministic_trust_engine",
      providerStatus: metrics.providerStatus || "healthy",
    },
  };
}
