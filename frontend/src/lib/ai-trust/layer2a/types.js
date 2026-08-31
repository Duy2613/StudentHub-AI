/**
 * Layer 2A — URL reputation contract.
 *
 * This boundary deliberately distinguishes a provider's explicit no-match
 * from every failure and from local absence of evidence. A no-match is only a
 * candidate finding; it is never a safety verdict.
 */

import { createSecureId } from "../../security/secureId.js";
import {
  REPUTATION_LOOKUP_POLICY,
  REPUTATION_LOOKUP_REASON,
  REPUTATION_LOOKUP_STATUS,
} from "./ReputationLookupPolicy.js";

export const LAYER_2A_CAPABILITY = {
  URL_REPUTATION: "URL_REPUTATION",
  THREAT_INTELLIGENCE: "THREAT_INTELLIGENCE",
  KNOWN_THREAT_LOOKUP: "KNOWN_THREAT_LOOKUP",
};

export const LAYER_2A_PROVIDER_STATUS = {
  SUCCESS: "SUCCESS",
  TIMEOUT: "TIMEOUT",
  RATE_LIMITED: "RATE_LIMITED",
  NOT_CONFIGURED: "NOT_CONFIGURED",
  UNAVAILABLE: "UNAVAILABLE",
  INVALID_RESPONSE: "INVALID_RESPONSE",
  ERROR: "ERROR",
  CIRCUIT_OPEN: "CIRCUIT_OPEN",
  INVALID_INPUT: "INVALID_INPUT",
  NOT_APPLICABLE: "NOT_APPLICABLE",
};

export const LAYER_2A_FINDING = {
  THREAT_MATCH: "THREAT_MATCH",
  NO_KNOWN_THREAT: "NO_KNOWN_THREAT",
  UNKNOWN: "UNKNOWN",
  NOT_APPLICABLE: "NOT_APPLICABLE",
  SKIPPED_PRIVACY_SAFETY: "SKIPPED_PRIVACY_SAFETY",
};

function boundedString(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function optionalProviderConfidence(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? Number(value.toFixed(4))
    : null;
}

function safeTimestamp(value) {
  if (typeof value !== "string") return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeStatus(value) {
  return Object.values(LAYER_2A_PROVIDER_STATUS).includes(value)
    ? value
    : LAYER_2A_PROVIDER_STATUS.ERROR;
}

function normalizeFinding(value) {
  return Object.values(LAYER_2A_FINDING).includes(value)
    ? value
    : LAYER_2A_FINDING.UNKNOWN;
}

function securityClassificationFor(finding) {
  if (finding === LAYER_2A_FINDING.THREAT_MATCH) return "MALICIOUS";
  if (finding === LAYER_2A_FINDING.NO_KNOWN_THREAT) return "NO_KNOWN_THREAT";
  if (finding === LAYER_2A_FINDING.NOT_APPLICABLE) return "NOT_APPLICABLE";
  return "UNKNOWN";
}

function normalizeLookupPolicy(value) {
  return Object.values(REPUTATION_LOOKUP_POLICY).includes(value) ? value : null;
}

function normalizeLookupReason(value) {
  return Object.values(REPUTATION_LOOKUP_REASON).includes(value) ? value : null;
}

function normalizeLookupStatus(value) {
  return Object.values(REPUTATION_LOOKUP_STATUS).includes(value) ? value : null;
}

function normalizeProviderResult(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const provider = boundedString(value.provider, 120);
  if (!provider || typeof value.success !== "boolean") return null;
  const verdict = Object.values({ SAFE: "SAFE", DANGEROUS: "DANGEROUS", UNKNOWN: "UNKNOWN" }).includes(value.verdict)
    ? value.verdict
    : "UNKNOWN";
  const message = value.message === undefined || value.message === null
    ? null
    : boundedString(value.message, 500) || null;
  const threatTypes = Array.from(new Set(
    (Array.isArray(value.threatTypes) ? value.threatTypes : [])
      .filter((item) => typeof item === "string")
      .map((item) => item.trim().toUpperCase().slice(0, 80))
      .filter(Boolean)
  )).slice(0, 20);
  return {
    provider,
    success: value.success,
    verdict,
    confidence: optionalProviderConfidence(value.confidence),
    message,
    threatTypes,
  };
}

/**
 * Creates the only DTO allowed to cross the Layer 2A boundary.
 * `providerConfidence` is null unless the provider supplied a valid numeric
 * value. The adapter never invents a score.
 */
export function createLayer2AResult(input = {}) {
  const {
  provider = "studenthub_layer2_backend",
  providerStatus = LAYER_2A_PROVIDER_STATUS.NOT_CONFIGURED,
  finding = LAYER_2A_FINDING.UNKNOWN,
  threatTypes = [],
  rawVerdict = null,
  providerConfidence = null,
  checkedAt = null,
  latencyMs = 0,
  requestId = null,
  targetFingerprint = null,
  cacheMetadata = {},
  providerResults = [],
  message = null,
  errorCode = null,
  contractViolation = null,
  notApplicable = false,
  reputationLookupPolicy = null,
  reputationLookupReason = null,
  reputationLookupStatus = null,
  reputationLookupTargetClass = null,
  reputationLookupDisclosed = null,
  } = input && typeof input === "object" && !Array.isArray(input) ? input : {};
  const normalizedFinding = normalizeFinding(finding);
  const normalizedStatus = normalizeStatus(providerStatus);
  const boundedLatency = Number.isFinite(Number(latencyMs))
    ? Math.max(0, Math.round(Number(latencyMs)))
    : 0;

  return {
    layer: "2A",
    capability: LAYER_2A_CAPABILITY.URL_REPUTATION,
    provider: boundedString(provider, 120) || "studenthub_layer2_backend",
    providerStatus: normalizedStatus,
    finding: normalizedFinding,
    securityClassification: securityClassificationFor(normalizedFinding),
    threatTypes: Array.from(new Set(
      (Array.isArray(threatTypes) ? threatTypes : [])
        .filter((item) => typeof item === "string")
        .map((item) => item.trim().toUpperCase().slice(0, 80))
        .filter(Boolean)
    )).slice(0, 20),
    rawVerdict: typeof rawVerdict === "string" ? rawVerdict.trim().toUpperCase().slice(0, 40) : null,
    providerConfidence: optionalProviderConfidence(providerConfidence),
    checkedAt: safeTimestamp(checkedAt),
    latencyMs: boundedLatency,
    requestId: boundedString(requestId, 160) || createSecureId("req_l2a"),
    targetFingerprint: boundedString(targetFingerprint, 128) || null,
    cacheMetadata: {
      hit: Boolean(cacheMetadata?.hit),
      ttlMs: Number.isFinite(Number(cacheMetadata?.ttlMs)) ? Math.max(0, Math.round(Number(cacheMetadata.ttlMs))) : 0,
      ageMs: Number.isFinite(Number(cacheMetadata?.ageMs)) ? Math.max(0, Math.round(Number(cacheMetadata.ageMs))) : 0,
      expiresAt: typeof cacheMetadata?.expiresAt === "string" ? cacheMetadata.expiresAt : null,
    },
    providerResults: Array.isArray(providerResults)
      ? providerResults.slice(0, 20).map(normalizeProviderResult).filter(Boolean)
      : [],
    message: boundedString(message, 500) || null,
    errorCode: boundedString(errorCode, 120) || null,
    contractViolation: boundedString(contractViolation, 120) || null,
    notApplicable: Boolean(notApplicable),
    reputationLookupPolicy: normalizeLookupPolicy(reputationLookupPolicy),
    reputationLookupReason: normalizeLookupReason(reputationLookupReason),
    reputationLookupStatus: normalizeLookupStatus(reputationLookupStatus),
    reputationLookupTargetClass: boundedString(reputationLookupTargetClass, 100) || null,
    reputationLookupDisclosed: typeof reputationLookupDisclosed === "boolean" ? reputationLookupDisclosed : null,
    provenance: {
      sourceType: "THREAT_INTELLIGENCE",
      authorityScope: "URL reputation and known-threat lookup only",
      providerStatus: normalizedStatus,
      liveEvidence: normalizedStatus === LAYER_2A_PROVIDER_STATUS.SUCCESS,
      noMatchIsSafetyProof: false,
    },
  };
}
