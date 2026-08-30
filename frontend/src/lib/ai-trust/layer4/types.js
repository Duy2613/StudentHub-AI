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

/**
 * Security classification is deliberately separate from factual truth.
 * A source can support a true claim while the delivery context is malicious,
 * and a clean reputation lookup is never a proof of safety.
 */
export const SECURITY_CLASSIFICATION = {
  MALICIOUS: "MALICIOUS",
  SUSPICIOUS: "SUSPICIOUS",
  NO_KNOWN_THREAT: "NO_KNOWN_THREAT",
  UNKNOWN: "UNKNOWN",
  NOT_APPLICABLE: "NOT_APPLICABLE",
};

export const TRUTH_STATUS = {
  SUPPORTED: "SUPPORTED",
  CONTRADICTED: "CONTRADICTED",
  MIXED: "MIXED",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  NOT_APPLICABLE: "NOT_APPLICABLE",
};

export const SECURITY_RISK_LEVEL = {
  NONE: "NONE",           // Safe informational or benign academic content
  LOW: "LOW",             // Minor unverified claim or harmless exaggeration
  MEDIUM: "MEDIUM",       // Misleading institutional claim or significant misinformation without direct theft
  HIGH: "HIGH",           // Financial deposit lure, unauthorized payment demand, high-impact medical/legal distortion
  CRITICAL: "CRITICAL",   // Active credential harvesting, OTP phishing, malicious binary payload, account takeover
  UNKNOWN: "UNKNOWN",     // The available evidence cannot support a bounded risk classification
};

export const RECOMMENDED_ACTION = {
  BLOCK: "BLOCK",                                 // Intercept and prevent user access immediately
  WARN: "WARN",                                   // Show a safety warning before continued interaction
  ALLOW_WITH_CAUTION: "ALLOW_WITH_CAUTION",       // No known threat, but no safety proof
  REVIEW: "REVIEW",                               // Abstain and require verification or human review

  // Deprecated compatibility aliases. They intentionally resolve to the
  // narrower canonical enforcement vocabulary; no caller can obtain a plain
  // ALLOW outcome from the Trust Engine.
  ALLOW: "ALLOW_WITH_CAUTION",
  ALLOW_WITH_WARNING: "WARN",
  REQUIRE_VERIFICATION: "REVIEW",
  REQUIRE_MORE_INFORMATION: "REVIEW",
  RESTRICT: "REVIEW",
  ESCALATE: "REVIEW",
};

const SECURITY_CLASSIFICATION_VALUES = new Set(Object.values(SECURITY_CLASSIFICATION));
const TRUTH_STATUS_VALUES = new Set(Object.values(TRUTH_STATUS));
const ENFORCEMENT_VALUES = new Set([
  RECOMMENDED_ACTION.BLOCK,
  RECOMMENDED_ACTION.WARN,
  RECOMMENDED_ACTION.ALLOW_WITH_CAUTION,
  RECOMMENDED_ACTION.REVIEW,
]);
const FINAL_CLASSIFICATION_VALUES = new Set(Object.values(FINAL_CLASSIFICATION));
const TRUTH_ASSESSMENT_VALUES = new Set([
  ...Object.values(FINAL_CLASSIFICATION),
  "CONTESTED",
  "UNVERIFIED",
]);
const RISK_LEVEL_VALUES = new Set(Object.values(SECURITY_RISK_LEVEL));

function clampUnit(value, fallback = 0) {
  return Number.isFinite(value) ? Number(Math.max(0, Math.min(1, value)).toFixed(2)) : fallback;
}

function canonicalEnforcement(value) {
  return ENFORCEMENT_VALUES.has(value) ? value : RECOMMENDED_ACTION.REVIEW;
}

function canonicalSecurityClassification(value) {
  return SECURITY_CLASSIFICATION_VALUES.has(value) ? value : SECURITY_CLASSIFICATION.UNKNOWN;
}

function canonicalTruthStatus(value) {
  return TRUTH_STATUS_VALUES.has(value) ? value : TRUTH_STATUS.INSUFFICIENT_EVIDENCE;
}

function canonicalClassification(value) {
  return FINAL_CLASSIFICATION_VALUES.has(value) ? value : FINAL_CLASSIFICATION.INSUFFICIENT_EVIDENCE;
}

function canonicalTruthAssessmentStatus(value) {
  return TRUTH_ASSESSMENT_VALUES.has(value) ? value : FINAL_CLASSIFICATION.INSUFFICIENT_EVIDENCE;
}

function canonicalRiskLevel(value) {
  return RISK_LEVEL_VALUES.has(value) ? value : SECURITY_RISK_LEVEL.UNKNOWN;
}

function boundedText(value, maxLength = 1000) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function safeArray(value, maxLength = 100) {
  return Array.isArray(value) ? value.slice(0, maxLength) : [];
}

/**
 * Creates a Claim-Level Verdict DTO
 */
export function createClaimVerdict(input = {}) {
  const {
  claimId,
  subject = "",
  predicate = "",
  rawText = "",
  importance = "medium",
  truthStatus = "UNVERIFIED",
  riskLevel = SECURITY_RISK_LEVEL.NONE,
  evidenceRefs = [],
  notes = "",
  } = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const safeEvidenceRefs = safeArray(evidenceRefs, 40).filter((ref) => typeof ref === "string").map((ref) => boundedText(ref, 160));
  return {
    claimId: boundedText(claimId, 160),
    subject: boundedText(subject, 240),
    predicate: boundedText(predicate, 500),
    rawText: boundedText(rawText, 1200),
    importance: boundedText(importance, 40) || "medium",
    truthStatus: boundedText(truthStatus, 80) || "UNVERIFIED",
    riskLevel: canonicalRiskLevel(riskLevel),
    evidenceRefs: safeEvidenceRefs,
    notes: boundedText(notes, 600),
  };
}

/**
 * Creates a Layer 4 Final Trust Result DTO
 */
export function createLayer4Result(input = {}) {
  const {
  classification = FINAL_CLASSIFICATION.INSUFFICIENT_EVIDENCE,
  status = RECOMMENDED_ACTION.REQUIRE_VERIFICATION,
  securityClassification = SECURITY_CLASSIFICATION.UNKNOWN,
  truthStatus = TRUTH_STATUS.INSUFFICIENT_EVIDENCE,
  enforcement = null,
  truthAssessment = { status: TRUTH_STATUS.INSUFFICIENT_EVIDENCE, confidence: 0 },
  riskAssessment = { level: SECURITY_RISK_LEVEL.UNKNOWN, confidence: 0, primaryVectors: [] },
  decisionConfidence = 0,
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
  } = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const safeTruthAssessment = truthAssessment && typeof truthAssessment === "object" && !Array.isArray(truthAssessment)
    ? truthAssessment
    : {};
  const safeRiskAssessment = riskAssessment && typeof riskAssessment === "object" && !Array.isArray(riskAssessment)
    ? riskAssessment
    : {};
  const safeUserExplanation = userExplanation && typeof userExplanation === "object" && !Array.isArray(userExplanation)
    ? userExplanation
    : {};
  const safeAuditTrail = auditTrail && typeof auditTrail === "object" && !Array.isArray(auditTrail) ? auditTrail : {};
  const safeMetrics = metrics && typeof metrics === "object" && !Array.isArray(metrics) ? metrics : {};
  const safeClaims = safeArray(claims, 80)
    .filter((claim) => claim && typeof claim === "object" && !Array.isArray(claim))
    .map((claim) => createClaimVerdict(claim));
  const safeKeyReasons = safeArray(keyReasons, 40).filter((reason) => typeof reason === "string").map((reason) => boundedText(reason, 1000));
  const safeEvidenceRefs = safeArray(evidenceRefs, 100).filter((ref) => typeof ref === "string").map((ref) => boundedText(ref, 160));
  const safeConflicts = safeArray(conflicts, 80).filter((conflict) => conflict && typeof conflict === "object" && !Array.isArray(conflict));
  const safeLimitations = safeArray(limitations, 40).filter((item) => typeof item === "string").map((item) => boundedText(item, 600));
  const safeExplanation = {
    verdictTitle: boundedText(safeUserExplanation.verdictTitle, 240),
    why: boundedText(safeUserExplanation.why, 1200),
    keyEvidence: safeArray(safeUserExplanation.keyEvidence, 10).filter((item) => item && typeof item === "object" && !Array.isArray(item)),
    uncertainties: safeArray(safeUserExplanation.uncertainties, 20).filter((item) => typeof item === "string").map((item) => boundedText(item, 500)),
    riskSummary: boundedText(safeUserExplanation.riskSummary, 600),
    recommendedActionNote: boundedText(safeUserExplanation.recommendedActionNote, 600),
    globalComplianceSummary: boundedText(safeUserExplanation.globalComplianceSummary, 600),
    matchedStandards: safeArray(safeUserExplanation.matchedStandards, 20).filter((item) => item && typeof item === "object" && !Array.isArray(item)),
    matchedUniversity: boundedText(safeUserExplanation.matchedUniversity, 240) || null,
  };
  const canonicalAction = canonicalEnforcement(enforcement || status || recommendedAction);

  return {
    layer: 4,
    classification: canonicalClassification(classification),
    securityClassification: canonicalSecurityClassification(securityClassification),
    truthStatus: canonicalTruthStatus(truthStatus),
    enforcement: canonicalAction,
    status: canonicalAction,
    truthAssessment: {
      status: canonicalTruthAssessmentStatus(safeTruthAssessment.status),
      confidence: clampUnit(safeTruthAssessment.confidence, 0),
    },
    riskAssessment: {
      level: canonicalRiskLevel(safeRiskAssessment.level),
      confidence: clampUnit(safeRiskAssessment.confidence, 0),
      primaryVectors: safeArray(safeRiskAssessment.primaryVectors, 30).filter((item) => typeof item === "string").map((item) => boundedText(item, 120)),
    },
    decisionConfidence: clampUnit(decisionConfidence, 0),
    verificationCompleteness: clampUnit(verificationCompleteness, 0),
    claims: safeClaims,
    keyReasons: safeKeyReasons,
    evidenceRefs: safeEvidenceRefs,
    conflicts: safeConflicts,
    limitations: safeLimitations,
    recommendedAction: canonicalAction,
    userExplanation: safeExplanation,
    auditTrail: {
      requestId: boundedText(safeAuditTrail.requestId, 160) || `req_l4_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      timestamp: boundedText(safeAuditTrail.timestamp, 80) || new Date().toISOString(),
      ruleVersion: boundedText(safeAuditTrail.ruleVersion, 120) || "layer4-v1.0.0",
      fusedEvidenceCount: Number.isFinite(Number(safeAuditTrail.fusedEvidenceCount)) ? Math.max(0, Number(safeAuditTrail.fusedEvidenceCount)) : 0,
      hardRuleTriggered: boundedText(safeAuditTrail.hardRuleTriggered, 120) || null,
      policyPrecedence: safeArray(safeAuditTrail.policyPrecedence, 30).filter((item) => typeof item === "string").map((item) => boundedText(item, 120)),
      evidenceBound: safeAuditTrail.evidenceBound !== false,
      noFalseSafeInvariant: true,
    },
    metrics: {
      executionTimeMs: Number.isFinite(Number(safeMetrics.executionTimeMs)) ? Math.max(0, Number(safeMetrics.executionTimeMs)) : 0,
      modelUsed: boundedText(safeMetrics.modelUsed, 160) || "deterministic_trust_engine",
      providerStatus: boundedText(safeMetrics.providerStatus, 120) || "NOT_APPLICABLE",
      confidenceBasis: boundedText(safeMetrics.confidenceBasis, 160) || "deterministic_policy",
    },
  };
}
