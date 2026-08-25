/**
 * Layer 2 — Types, Enums & Standardized Contract Definitions
 * 
 * Defines the core semantic data transfer objects (DTOs) for:
 * - Quad-state Status: BLOCK, SUSPICIOUS, NEEDS_VERIFICATION, PASS
 * - Semantic Classification: BENIGN, INFORMATIVE, AMBIGUOUS, MISLEADING, DECEPTIVE, MALICIOUS, UNVERIFIED
 * - Structured Claims, Extracted Entities, Context Signals, Consistency Findings, Cross-Modal Findings
 * - Verification Tasks Package for Layer 3 consumption
 */

export const LAYER_2_STATUS = {
  BLOCK: "BLOCK",                         // Strong contextual evidence of malicious / deceptive intent -> STOP
  SUSPICIOUS: "SUSPICIOUS",               // Strong contextual/cross-modal anomaly requiring external proof -> L3
  NEEDS_VERIFICATION: "NEEDS_VERIFICATION", // Unverified institutional / factual claims requiring evidence -> L3
  PASS: "PASS",                           // No significant semantic/contextual anomaly detected -> L3 / End
};

export const SIGNAL_SEVERITY = {
  CRITICAL: "critical",
  HIGH: "high",
  MEDIUM: "medium",
  LOW: "low",
  INFO: "info",
};

export const SEMANTIC_CLASSIFICATION = {
  BENIGN: "BENIGN",             // Harmless communication, discussion, or query
  INFORMATIVE: "INFORMATIVE",   // Neutral informational or academic reporting
  AMBIGUOUS: "AMBIGUOUS",       // Vague or underspecified statements
  MISLEADING: "MISLEADING",     // Distorted context or internal contradictions
  DECEPTIVE: "DECEPTIVE",       // Coercive framing or authority imitation
  MALICIOUS: "MALICIOUS",       // Clear credential harvesting or attack payload
  UNVERIFIED: "UNVERIFIED",     // Factual claims without internal verification
};

export const INTENT_TYPES = {
  INFORM: "inform",
  EDUCATE: "educate",
  WARN: "warn",
  PERSUADE: "persuade",
  SELL: "sell",
  PROMOTE: "promote",
  REQUEST_ACTION: "request_action",
  REQUEST_CREDENTIALS: "request_credentials",
  REQUEST_PAYMENT: "request_payment",
  REQUEST_DOWNLOAD: "request_download",
  REDIRECT: "redirect",
  IMPERSONATE: "impersonate",
  MANIPULATE: "manipulate",
  DECEIVE: "deceive",
};

export const CLAIM_TYPES = {
  INSTITUTIONAL: "institutional",     // Policy changes, admissions, scholarships, university official news
  FINANCIAL: "financial",             // Banking fees, transactions, deposits, rewards, money transfers
  SECURITY: "security",               // Account status, lockouts, credential demands, OTP requirements
  ACADEMIC: "academic",               // Course syllabus, exam rules, faculty assignments
  TECHNICAL: "technical",             // Software updates, system installation, commands
  IDENTITY: "identity",               // Self-representation ("I am HCMUTE Security")
  EVENT: "event",                     // Conferences, deadlines, webinars
  STATISTICAL: "statistical",         // Numerical data, rankings, percentages
  GENERAL_FACT: "general_fact",       // General factual statements
};

export const CLAIM_IMPORTANCE = {
  CRITICAL: "critical", // Immediate potential for financial, credential, or security loss
  HIGH: "high",         // High-impact institutional, official, or policy claim
  MEDIUM: "medium",     // Moderate informational claim
  LOW: "low",           // Peripheral or subjective remark
};

export const CONTEXT_SIGNAL_TYPES = {
  CREDENTIAL_HARVESTING_CONTEXT: "credential_harvesting_context",
  FINANCIAL_SCAM_CONTEXT: "financial_scam_context",
  INSTITUTIONAL_IMPERSONATION_CONTEXT: "institutional_impersonation_context",
  ACCOUNT_TAKEOVER_CONTEXT: "account_takeover_context",
  MALWARE_DELIVERY_CONTEXT: "malware_delivery_context",
  SOCIAL_ENGINEERING_CONTEXT: "social_engineering_context",
  EDUCATIONAL_DISCUSSION: "educational_discussion",
  BENIGN_BRAND_MENTION: "benign_brand_mention",
  SATIRE_OR_HUMOR: "satire_or_humor",
  URGENCY_MANIPULATION: "urgency_manipulation",
  AUTHORITY_PRESSURE: "authority_pressure",
  ARTIFICIAL_SCARCITY: "artificial_scarcity",
};

export const CONSISTENCY_TYPES = {
  TEMPORAL_CONTRADICTION: "temporal_contradiction",
  NUMERICAL_CONTRADICTION: "numerical_contradiction",
  IDENTITY_CONTRADICTION: "identity_contradiction",
  INSTRUCTION_CONTRADICTION: "instruction_contradiction",
  LOCATION_CONTRADICTION: "location_contradiction",
};

export const CROSS_MODAL_TYPES = {
  BRAND_VISUAL_MISMATCH: "brand_visual_mismatch",
  URL_DESTINATION_MISMATCH: "url_destination_mismatch",
  OCR_TEXT_CONTRADICTION: "ocr_text_contradiction",
  QR_DESTINATION_MISMATCH: "qr_destination_mismatch",
  FILE_METADATA_MISMATCH: "file_metadata_mismatch",
};

export const VERIFICATION_TASK_TYPES = {
  CLAIM_VERIFICATION: "CLAIM_VERIFICATION",
  ENTITY_VERIFICATION: "ENTITY_VERIFICATION",
  SOURCE_VERIFICATION: "SOURCE_VERIFICATION",
  DOMAIN_VERIFICATION: "DOMAIN_VERIFICATION",
  DOCUMENT_VERIFICATION: "DOCUMENT_VERIFICATION",
  TEMPORAL_VERIFICATION: "TEMPORAL_VERIFICATION",
  CROSS_SOURCE_VERIFICATION: "CROSS_SOURCE_VERIFICATION",
};

/**
 * Creates a structured Claim DTO
 */
export function createClaim({
  claimId = `claim-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  subject = "unknown",
  predicate = "claims",
  object = "",
  scope = "general",
  time = null,
  claimType = CLAIM_TYPES.GENERAL_FACT,
  importance = CLAIM_IMPORTANCE.MEDIUM,
  verificationRequired = true,
  verificationReason = "factual_claim",
  rawText = "",
}) {
  return {
    claimId,
    subject,
    predicate,
    object,
    scope,
    time,
    claimType,
    importance,
    verificationRequired,
    verificationReason,
    rawText: rawText || `${subject} ${predicate} ${object}`.trim(),
  };
}

/**
 * Creates an Extracted Entity DTO
 */
export function createEntity({
  name,
  type = "organization",
  normalizedName = null,
  isClaimedAuthor = false,
  officialDomains = [],
  confidence = 0.9,
}) {
  return {
    name,
    type,
    normalizedName: normalizedName || name.trim(),
    isClaimedAuthor,
    officialDomains,
    confidence: Number(confidence.toFixed(2)),
  };
}

/**
 * Creates a Layer 2 Response DTO
 */
export function createLayer2Result({
  status = LAYER_2_STATUS.PASS,
  classification = SEMANTIC_CLASSIFICATION.BENIGN,
  confidence = 0.90,
  semanticSummary = "",
  intent = { primary: INTENT_TYPES.INFORM, secondary: null },
  entities = [],
  claims = [],
  contextSignals = [],
  consistencyFindings = [],
  crossModalFindings = [],
  verificationPackage = null,
  nextLayer = null,
  requestId = null,
  metrics = {},
  details = {},
}) {
  return {
    layer: 2,
    status,
    classification,
    confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(2)),
    semanticSummary: semanticSummary || "Semantic analysis complete with no anomalies.",
    intent: {
      primary: intent.primary || INTENT_TYPES.INFORM,
      secondary: intent.secondary || null,
      coercive: [
        INTENT_TYPES.REQUEST_CREDENTIALS,
        INTENT_TYPES.REQUEST_PAYMENT,
        INTENT_TYPES.IMPERSONATE,
        INTENT_TYPES.DECEIVE,
      ].includes(intent.primary) || [
        INTENT_TYPES.REQUEST_CREDENTIALS,
        INTENT_TYPES.REQUEST_PAYMENT,
        INTENT_TYPES.IMPERSONATE,
        INTENT_TYPES.DECEIVE,
      ].includes(intent.secondary),
    },
    entities,
    claims,
    contextSignals,
    consistencyFindings,
    crossModalFindings,
    verificationPackage: verificationPackage || {
      claims: claims.filter((c) => c.verificationRequired),
      entities,
      candidateSources: [],
      verificationTasks: [],
    },
    nextLayer: status === LAYER_2_STATUS.BLOCK ? null : (nextLayer || 3),
    requestId: requestId || `req_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    details: {
      isEducationalContent: contextSignals.some((s) => s.type === CONTEXT_SIGNAL_TYPES.EDUCATIONAL_DISCUSSION),
      isBenignBrandMention: contextSignals.some((s) => s.type === CONTEXT_SIGNAL_TYPES.BENIGN_BRAND_MENTION),
      hasInternalContradictions: consistencyFindings.length > 0,
      hasCrossModalMismatches: crossModalFindings.length > 0,
      totalClaimsCount: claims.length,
      unverifiedClaimsCount: claims.filter((c) => c.verificationRequired).length,
      ...details,
    },
    metrics: {
      executionTimeMs: metrics.executionTimeMs || 0,
      modelUsed: metrics.modelUsed || "deterministic_fallback",
      providerStatus: metrics.providerStatus || "healthy",
      timestamp: metrics.timestamp || Date.now(),
    },
  };
}
