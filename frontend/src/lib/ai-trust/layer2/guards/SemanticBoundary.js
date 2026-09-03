/**
 * Layer 2B trust boundary helpers.
 *
 * Content supplied to the semantic layer is data, never instructions.  This
 * module performs the small, boring validation step that must happen between
 * every semantic provider and the rest of the pipeline.  It deliberately
 * drops fields it does not understand instead of preserving provider output
 * by spreading an arbitrary object into a security DTO.
 */

import {
  CLAIM_IMPORTANCE,
  CLAIM_TYPES,
  CONTEXT_SIGNAL_TYPES,
  CROSS_MODAL_TYPES,
  INTENT_TYPES,
  SEMANTIC_CLASSIFICATION,
  SIGNAL_SEVERITY,
  createClaim,
  createEntity,
} from "../types.js";

export const SEMANTIC_BOUNDARY_LIMITS = Object.freeze({
  TEXT: 12_000,
  OCR: 8_000,
  QR: 4_096,
  URL: 2_048,
  SUMMARY: 800,
  DETAILS: 1_200,
  CLAIMS: 40,
  ENTITIES: 40,
  SIGNALS: 80,
  FINDINGS: 40,
  CANDIDATE_SOURCES: 40,
  GATEWAY_ATTEMPTS: 12,
});

const INTENT_VALUES = new Set(Object.values(INTENT_TYPES));
const CLASSIFICATION_VALUES = new Set(Object.values(SEMANTIC_CLASSIFICATION));
const SEVERITY_VALUES = new Set(Object.values(SIGNAL_SEVERITY));
const CLAIM_TYPE_VALUES = new Set(Object.values(CLAIM_TYPES));
const CLAIM_IMPORTANCE_VALUES = new Set(Object.values(CLAIM_IMPORTANCE));
const CONTEXT_TYPE_VALUES = new Set(Object.values(CONTEXT_SIGNAL_TYPES));
const CROSS_MODAL_TYPE_VALUES = new Set(Object.values(CROSS_MODAL_TYPES));

function isPlainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function normalizeGatewayUsage(value) {
  if (!isPlainObject(value)) return null;
  const boundedCount = (item) => {
    const number = Number(item);
    return Number.isFinite(number) && number >= 0 ? Math.min(1_000_000, Math.floor(number)) : null;
  };
  const inputTokens = boundedCount(value.inputTokens);
  const outputTokens = boundedCount(value.outputTokens);
  const totalTokens = boundedCount(value.totalTokens);
  if (inputTokens === null && outputTokens === null && totalTokens === null) return null;
  return {
    inputTokens: inputTokens ?? 0,
    outputTokens: outputTokens ?? 0,
    totalTokens: totalTokens ?? Math.min(1_000_000, (inputTokens ?? 0) + (outputTokens ?? 0)),
    source: ["provider", "estimated", "mixed"].includes(value.source) ? value.source : "estimated",
  };
}

export function boundedString(value, maxLength, fallback = "") {
  if (typeof value !== "string") return fallback;
  return value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").slice(0, maxLength);
}

export function boundedArray(value, maxLength) {
  return Array.isArray(value) ? value.slice(0, maxLength) : [];
}

export function clampUnit(value, fallback = 0) {
  return Number.isFinite(value) ? Math.max(0, Math.min(1, Number(value))) : fallback;
}

/**
 * JSON-encodes untrusted values so delimiters and role-like text cannot be
 * mistaken for instructions by a model.  The wrapper is still only a prompt
 * hygiene measure; model output never becomes a security decision by itself.
 */
export function wrapUntrustedData(label, value, maxLength = SEMANTIC_BOUNDARY_LIMITS.TEXT) {
  const safeLabel = boundedString(label, 80, "field").replace(/[^a-zA-Z0-9_.-]/g, "_");
  const serialized = JSON.stringify(boundedString(value, maxLength, ""));
  return `<untrusted-data field="${safeLabel}">${serialized}</untrusted-data>`;
}

export function normalizeSemanticIntent(value) {
  if (!isPlainObject(value)) {
    return { primary: INTENT_TYPES.INFORM, secondary: null, coercive: false };
  }

  const primary = INTENT_VALUES.has(value.primary) ? value.primary : INTENT_TYPES.INFORM;
  const secondary = value.secondary === null || value.secondary === undefined || !INTENT_VALUES.has(value.secondary)
    ? null
    : value.secondary === primary ? null : value.secondary;
  const coercive = [
    INTENT_TYPES.REQUEST_CREDENTIALS,
    INTENT_TYPES.REQUEST_PAYMENT,
    INTENT_TYPES.IMPERSONATE,
    INTENT_TYPES.DECEIVE,
  ].includes(primary) || [
    INTENT_TYPES.REQUEST_CREDENTIALS,
    INTENT_TYPES.REQUEST_PAYMENT,
    INTENT_TYPES.IMPERSONATE,
    INTENT_TYPES.DECEIVE,
  ].includes(secondary);

  return { primary, secondary, coercive };
}

function normalizeEntity(value) {
  if (!isPlainObject(value)) return null;
  const name = boundedString(value.name, 180).trim();
  if (!name) return null;
  const officialDomains = boundedArray(value.officialDomains, 12)
    .map((domain) => boundedString(domain, 180).trim().toLowerCase())
    .filter((domain) => domain && !/[\s<>"']/u.test(domain));
  return createEntity({
    name,
    type: boundedString(value.type, 80, "organization"),
    normalizedName: boundedString(value.normalizedName, 180).trim() || name,
    isClaimedAuthor: value.isClaimedAuthor === true,
    officialDomains,
    // Missing or malformed provider confidence is absence of evidence, not a
    // midpoint estimate. Never manufacture confidence at this boundary.
    confidence: clampUnit(value.confidence, 0),
  });
}

function normalizeClaim(value, index) {
  if (!isPlainObject(value)) return null;
  const rawText = boundedString(value.rawText || value.object, 1_200).trim();
  if (!rawText) return null;
  return createClaim({
    claimId: boundedString(value.claimId, 160).trim() || `provider-claim-${index + 1}`,
    subject: boundedString(value.subject, 240).trim() || "unknown",
    predicate: boundedString(value.predicate, 500).trim() || "claims",
    object: boundedString(value.object, 800).trim(),
    scope: boundedString(value.scope, 160).trim() || "general",
    time: boundedString(value.time, 80).trim() || null,
    claimType: CLAIM_TYPE_VALUES.has(value.claimType) ? value.claimType : undefined,
    importance: CLAIM_IMPORTANCE_VALUES.has(value.importance) ? value.importance : undefined,
    verificationRequired: value.verificationRequired !== false,
    verificationReason: boundedString(value.verificationReason, 160).trim() || "provider_candidate_claim",
    rawText,
  });
}

function normalizeSignal(value, index, kind, authoritative) {
  if (!isPlainObject(value)) return null;
  const type = boundedString(value.type, 120).trim();
  if (!type || !/^[a-zA-Z0-9_.:-]+$/u.test(type)) return null;
  const details = boundedString(value.details || value.description, SEMANTIC_BOUNDARY_LIMITS.DETAILS).trim();
  const safeEvidence = isPlainObject(value.evidence)
    ? Object.fromEntries(Object.entries(value.evidence).slice(0, 8).map(([key, item]) => [
      boundedString(key, 80).replace(/[^a-zA-Z0-9_.-]/g, "_"),
      boundedString(item, 400),
    ]))
    : {};
  return {
    signalId: boundedString(value.signalId, 160).trim() || `provider-${kind}-${index + 1}`,
    type,
    severity: SEVERITY_VALUES.has(value.severity) ? value.severity : SIGNAL_SEVERITY.INFO,
    details,
    evidence: safeEvidence,
    confidence: clampUnit(value.confidence, 0),
    source: "ai_candidate_semantic_signal",
    detector: "ai_candidate_semantic_signal",
    ruleVersion: "layer2b-provider-boundary-v1",
    authoritative,
    inputTrust: "UNTRUSTED_CONTENT",
  };
}

function normalizeFinding(value, index, kind, authoritative) {
  if (!isPlainObject(value)) return null;
  const type = boundedString(value.type, 120).trim();
  if (!type || !/^[a-zA-Z0-9_.:-]+$/u.test(type)) return null;
  const evidence = boundedArray(value.evidence, 8).map((item) => boundedString(item, 400)).filter(Boolean);
  return {
    findingId: boundedString(value.findingId, 160).trim() || `provider-${kind}-${index + 1}`,
    type,
    severity: SEVERITY_VALUES.has(value.severity) ? value.severity : SIGNAL_SEVERITY.INFO,
    confidence: clampUnit(value.confidence, 0),
    evidence,
    details: boundedString(value.details || value.description, SEMANTIC_BOUNDARY_LIMITS.DETAILS),
    source: "ai_candidate_semantic_finding",
    authoritative,
    inputTrust: "UNTRUSTED_CONTENT",
  };
}

function normalizeKnownType(type, knownValues) {
  const bounded = boundedString(type, 120).trim();
  return knownValues.has(bounded) || /^[a-zA-Z0-9_.:-]+$/u.test(bounded) ? bounded : null;
}

/**
 * Normalizes provider output.  `null` means the provider violated the
 * boundary; callers must use the deterministic fallback in that case.
 */
export function normalizeSemanticAnalysis(value, { source = "provider" } = {}) {
  if (!isPlainObject(value)) return null;

  const authoritative = source === "deterministic_neural_semantic_engine" ||
    source === "deterministic_fallback" ||
    source === "local_deterministic" ||
    value.baselineAuthority === "deterministic_semantic_provider";

  const semanticSummary = boundedString(value.semanticSummary, SEMANTIC_BOUNDARY_LIMITS.SUMMARY).trim();
  const entities = boundedArray(value.entities, SEMANTIC_BOUNDARY_LIMITS.ENTITIES).map(normalizeEntity).filter(Boolean);
  const claims = boundedArray(value.claims, SEMANTIC_BOUNDARY_LIMITS.CLAIMS).map(normalizeClaim).filter(Boolean);
  const contextSignals = boundedArray(value.contextSignals, SEMANTIC_BOUNDARY_LIMITS.SIGNALS)
    .map((item, index) => normalizeSignal(item, index, "context", authoritative))
    .filter(Boolean);
  const consistencyFindings = boundedArray(value.consistencyFindings, SEMANTIC_BOUNDARY_LIMITS.FINDINGS)
    .map((item, index) => normalizeFinding(item, index, "consistency", authoritative))
    .filter(Boolean);
  const crossModalFindings = boundedArray(value.crossModalFindings, SEMANTIC_BOUNDARY_LIMITS.FINDINGS)
    .map((item, index) => normalizeFinding(item, index, "cross-modal", authoritative))
    .filter(Boolean);

  const classification = CLASSIFICATION_VALUES.has(value.classification)
    ? value.classification
    : SEMANTIC_CLASSIFICATION.UNKNOWN;

  return {
    semanticSummary,
    intent: normalizeSemanticIntent(value.intent),
    entities,
    claims,
    contextSignals,
    consistencyFindings,
    crossModalFindings,
    classification,
    manipulation: isPlainObject(value.manipulation) ? {
      urgencyScore: clampUnit(value.manipulation.urgencyScore, 0),
      authorityPressureScore: clampUnit(value.manipulation.authorityPressureScore, 0),
      detectedTactics: boundedArray(value.manipulation.detectedTactics, 20).map((tactic) => {
        if (!isPlainObject(tactic)) return null;
        return {
          tactic: boundedString(tactic.tactic, 100),
          confidence: clampUnit(tactic.confidence, 0),
          evidence: boundedString(tactic.evidence || tactic.details, 300),
          authoritative: false,
        };
      }).filter((tactic) => tactic?.tactic),
      hardNegativeSignal: authoritative && value.manipulation.hardNegativeSignal === true,
    } : null,
    modelStatus: boundedString(value.modelStatus, 80) || "PROVIDER_SUCCESS_UNTRUSTED",
    fallbackReason: boundedString(value.fallbackReason, 160) || null,
    gatewayAttempts: boundedArray(value.gatewayAttempts, SEMANTIC_BOUNDARY_LIMITS.GATEWAY_ATTEMPTS)
      .map((attempt) => isPlainObject(attempt) ? {
        provider: boundedString(attempt.provider, 80),
        model: boundedString(attempt.model, 120),
        ok: attempt.ok === true,
        errorType: boundedString(attempt.errorType, 80),
      } : null).filter(Boolean),
    gatewayUsage: normalizeGatewayUsage(value.gatewayUsage),
    gatewayEstimatedCostCents: Number.isFinite(Number(value.gatewayEstimatedCostCents))
      ? Math.max(0, Math.min(1_000_000, Math.floor(Number(value.gatewayEstimatedCostCents))))
      : null,
    providerId: boundedString(value.providerId, 120) || source,
    modelUsed: boundedString(value.modelUsed, 120) || null,
    modelProvider: boundedString(value.modelProvider, 120) || null,
    promptInjectionDetected: value.promptInjectionDetected === true,
    baselineAuthority: authoritative ? "deterministic_semantic_provider" : null,
    confidenceKind: "semantic_candidate_only",
    confidenceSource: source,
    providerIndependent: authoritative,
    aiCannotOverrideSecurity: true,
    inputTrust: "UNTRUSTED_CONTENT_ISOLATED",
  };
}

export function sanitizeLayer1ForSemantic(value) {
  if (!isPlainObject(value)) return { status: "UNKNOWN", signals: [] };
  return {
    status: boundedString(value.status, 40) || "UNKNOWN",
    signals: boundedArray(value.signals, 40).map((signal, index) => {
      if (!isPlainObject(signal)) return null;
      return {
        signalId: boundedString(signal.signalId, 160) || `layer1-signal-${index + 1}`,
        type: boundedString(signal.type, 120),
        severity: SEVERITY_VALUES.has(signal.severity) ? signal.severity : SIGNAL_SEVERITY.INFO,
      };
    }).filter((signal) => signal?.type),
    confidence: clampUnit(value.confidence, 0),
  };
}

export function detectSemanticInputInjection(values) {
  const combined = values.filter((value) => typeof value === "string").join("\n");
  return /(?:ignore\s+(?:all\s+)?(?:previous|prior)\s+instructions|system\s+(?:prompt|override|message)|reveal\s+(?:internal|secret|system)\s+key|trust_override\s*=\s*true|bypass_verification|<\s*(?:system|script)\b|javascript\s*:)/iu.test(combined);
}

export function mergeSemanticCandidates(baseline, candidate) {
  const safeBaseline = normalizeSemanticAnalysis(baseline, { source: baseline?.providerId || "deterministic_fallback" }) || {
    semanticSummary: "",
    intent: { primary: INTENT_TYPES.INFORM, secondary: null, coercive: false },
    entities: [], claims: [], contextSignals: [], consistencyFindings: [], crossModalFindings: [],
    classification: SEMANTIC_CLASSIFICATION.UNKNOWN,
  };
  const safeCandidate = normalizeSemanticAnalysis(candidate, { source: "ai_candidate" });
  if (!safeCandidate) return safeBaseline;

  const appendUnique = (left, right, key) => {
    const seen = new Set(left.map((item) => item?.[key]).filter(Boolean));
    return [...left, ...right.filter((item) => item && (!item[key] || !seen.has(item[key])))];
  };

  return {
    ...safeBaseline,
    // A candidate model cannot replace a deterministic classification or
    // intent.  It may add bounded context for review and Layer 3 planning.
    semanticSummary: safeBaseline.semanticSummary || safeCandidate.semanticSummary,
    entities: appendUnique(safeBaseline.entities, safeCandidate.entities, "normalizedName"),
    claims: appendUnique(safeBaseline.claims, safeCandidate.claims, "claimId"),
    contextSignals: appendUnique(safeBaseline.contextSignals, safeCandidate.contextSignals, "signalId"),
    consistencyFindings: appendUnique(safeBaseline.consistencyFindings, safeCandidate.consistencyFindings, "findingId"),
    crossModalFindings: appendUnique(safeBaseline.crossModalFindings, safeCandidate.crossModalFindings, "findingId"),
    modelStatus: "AI_ENRICHMENT_UNTRUSTED",
    providerId: safeBaseline.providerId,
    modelUsed: safeCandidate.modelUsed,
    modelProvider: safeCandidate.modelProvider,
    confidenceKind: "deterministic_baseline_plus_untrusted_candidate_signals",
    confidenceSource: "deterministic_baseline",
    providerIndependent: true,
    aiCandidateOnly: true,
    baselineAuthority: "deterministic_semantic_provider",
    aiCannotOverrideSecurity: true,
    inputTrust: "UNTRUSTED_CONTENT_ISOLATED",
    candidateClassification: safeCandidate.classification,
  };
}

export function createUnknownSemanticAnalysis(reason = "SEMANTIC_BOUNDARY_FAILURE") {
  return {
    semanticSummary: "Không thể hoàn tất phân tích ngữ nghĩa một cách đáng tin cậy.",
    intent: { primary: INTENT_TYPES.INFORM, secondary: null, coercive: false },
    entities: [], claims: [], contextSignals: [], consistencyFindings: [], crossModalFindings: [],
    classification: SEMANTIC_CLASSIFICATION.UNKNOWN,
    modelStatus: reason,
    fallbackReason: reason,
    providerId: "semantic_boundary",
    confidenceKind: "unknown_no_confidence",
    confidenceSource: "boundary_failure",
    providerIndependent: true,
    aiCannotOverrideSecurity: true,
    inputTrust: "UNTRUSTED_CONTENT_ISOLATED",
  };
}
