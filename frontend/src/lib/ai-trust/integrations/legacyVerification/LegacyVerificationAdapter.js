/**
 * Server-side anti-corruption adapter for the optional legacy four-layer
 * verification service. The legacy response is never allowed to cross into
 * the Trust UI without normalization.
 */

import { createHash } from "node:crypto";
import { validateRemoteUrl, validateRemoteUrlSync } from "../../../security/hardening/SafeRemoteUrl.js";
import { createSecureId } from "../../../security/secureId.js";
import { normalizeLayer2AProviderPayload } from "../../layer2a/RenderLayer2AProvider.js";
import { createLayer2AResult, LAYER_2A_FINDING, LAYER_2A_PROVIDER_STATUS } from "../../layer2a/types.js";
import { createEvidence, createLayer3Result, createSource, EVIDENCE_PROVIDER_STATUS, LAYER_3_STATUS, SOURCE_AUTHORITY_TIER, SOURCE_TYPE } from "../../layer3/types.js";
import { markTrustedLayer3Result } from "../../layer3/TrustBoundary.js";
import { decideReputationLookup, REPUTATION_LOOKUP_POLICY, REPUTATION_LOOKUP_REASON, REPUTATION_LOOKUP_STATUS } from "../../layer2a/ReputationLookupPolicy.js";
import { LEGACY_VERIFICATION_CONFIG, getLegacyVerificationConfig } from "./config.js";

const LEGACY_LAYER2_VERDICTS = new Set(["SAFE", "DANGEROUS", "UNKNOWN"]);
const LEGACY_LAYER3_VERDICTS = new Set(["TRUE", "FALSE", "FAKE", "UNKNOWN", "SUPPORTED", "CONTRADICTED", "MIXED", "UNVERIFIED", "INSUFFICIENT_EVIDENCE", "UNAVAILABLE"]);
const LEGACY_LAYER4_VERDICTS = new Set(["TRUE", "FALSE", "FAKE", "MISLEADING", "UNKNOWN", "SAFE", "DANGEROUS", "SUSPICIOUS", "SUPPORTED", "CONTRADICTED", "MIXED", "UNVERIFIED", "INSUFFICIENT_EVIDENCE"]);
function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value) {
  return isRecord(value) ? value : {};
}

function safeText(value, max = 700) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max)
    : "";
}

function redactedProviderText(value, max = 700) {
  return safeText(value, max)
    .replace(/(api[_-]?key|password|secret|token|authorization|bearer|connection(?:string)?|postgres(?:ql)?)[\s:=]+[^\s,;]+/gi, "$1=[REDACTED]")
    .replace(/\b(?:sk|gsk|key|tok)_[A-Za-z0-9_-]{12,}\b/g, "[REDACTED]");
}

function optionalText(value, max = 700) {
  const text = safeText(value, max);
  return text || null;
}

function boundedArray(value, max = 40) {
  return Array.isArray(value) ? value.slice(0, max) : [];
}

function unit(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
    ? Number(value.toFixed(4))
    : null;
}

function optionalUnit(record, field) {
  if (!(field in record) || record[field] === null || record[field] === undefined) return { ok: true, value: null };
  const value = unit(record[field]);
  return value === null ? { ok: false, code: `LEGACY_${field.toUpperCase()}_INVALID` } : { ok: true, value };
}

function scalar(value, max = 240) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") return safeText(value, max) || null;
  return null;
}

function safeTimestamp(value) {
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

function requestIdFor(value) {
  return safeText(value, 160) || createSecureId("req_legacy");
}

function fingerprint(value) {
  return value ? createHash("sha256").update(String(value), "utf8").digest("hex").slice(0, 32) : null;
}

function unwrapPayload(payload) {
  if (!isRecord(payload)) return null;
  if (typeof payload.verdict === "string") return payload;
  const nested = asRecord(payload.data);
  return typeof nested.verdict === "string" ? nested : payload;
}

function optionalBoolean(record, field) {
  if (!(field in record)) return { ok: true, value: null };
  return typeof record[field] === "boolean"
    ? { ok: true, value: record[field] }
    : { ok: false, code: `LEGACY_${field.toUpperCase()}_MUST_BE_BOOLEAN` };
}

function safeHttpUrl(value) {
  const candidate = safeText(value, 4096);
  if (!candidate) return null;
  const validation = validateRemoteUrlSync(candidate);
  return validation.ok ? validation.url : null;
}

function sourceTypeFor(value) {
  const type = safeText(value, 100).toUpperCase();
  if (Object.values(SOURCE_TYPE).includes(type)) return type;
  if (["OFFICIAL", "OFFICIAL_SOURCE", "INSTITUTION"].includes(type)) return SOURCE_TYPE.OFFICIAL_INSTITUTION;
  if (["NEWS", "REPUTABLE", "SECONDARY"].includes(type)) return SOURCE_TYPE.REPUTABLE_SECONDARY;
  if (["SEARCH", "WEB", "WEB_SEARCH"].includes(type)) return SOURCE_TYPE.SEARCH_RETRIEVAL;
  if (["COMMUNITY", "SOCIAL"].includes(type)) return SOURCE_TYPE.COMMUNITY_OR_AGGREGATOR;
  return SOURCE_TYPE.UNKNOWN;
}

function authorityTierFor(value) {
  const tier = safeText(value, 100).toUpperCase();
  return Object.values(SOURCE_AUTHORITY_TIER).includes(tier) ? tier : SOURCE_AUTHORITY_TIER.TIER_1_UNKNOWN_LOW;
}

function claimIdFor(raw, claims, index) {
  const direct = safeText(raw?.claimId, 160);
  if (direct) return direct;
  if (claims.length === 1) return safeText(claims[0]?.claimId, 160);
  return safeText(claims[index]?.claimId, 160);
}

function normalizeClaims(value) {
  return boundedArray(value, LEGACY_VERIFICATION_CONFIG.MAX_CLAIMS).map((item, index) => {
    const claim = asRecord(item);
    const claimId = safeText(claim.claimId, 160) || `legacy-claim-${index + 1}`;
    const rawText = safeText(claim.rawText || claim.text || claim.claim || claim.statement, 1200);
    return {
      claimId,
      subject: safeText(claim.subject, 240),
      predicate: safeText(claim.predicate, 500),
      object: safeText(claim.object, 800),
      scope: safeText(claim.scope, 160) || "general",
      rawText,
      claimType: safeText(claim.claimType, 80) || "GENERAL_FACT",
      importance: safeText(claim.importance, 40) || "medium",
      verificationRequired: claim.verificationRequired !== false,
      origin: "L2B_SEMANTIC",
      candidateOnly: true,
      sourceScope: safeText(claim.sourceScope, 120) || "GENERAL_SOURCE",
      verificationTaskId: safeText(claim.verificationTaskId, 160) || null,
    };
  });
}

function normalizeSource(raw, index, origin, providerStatus = EVIDENCE_PROVIDER_STATUS.SUCCESS) {
  const source = typeof raw === "string" ? { title: raw, url: raw } : asRecord(raw);
  const url = safeHttpUrl(source.url || source.sourceUrl || source.link || source.href);
  const sourceId = safeText(source.sourceId || source.id || source.reference, 160) || `legacy-${origin.toLowerCase()}-source-${index + 1}`;
  const explicitLiveEvidence = source.liveEvidence === true && source.retrievalOutcome === "SUCCESS" && typeof source.sourceFingerprint === "string" && source.sourceFingerprint.trim();
  const normalized = createSource({
    sourceId,
    url,
    domain: safeText(source.domain, 180),
    title: safeText(source.title || source.name, 240),
    publisher: safeText(source.publisher || source.author, 180),
    authorityTier: authorityTierFor(source.authorityTier || source.authority),
    authorityScore: unit(source.authorityScore) ?? 0,
    authorityBasis: boundedArray(source.authorityBasis, 12).map((item) => safeText(item, 120)).filter(Boolean),
    publishedAt: safeTimestamp(source.publishedAt || source.published || source.date),
    retrievedAt: safeTimestamp(source.retrievedAt) || new Date().toISOString(),
    clusterId: safeText(source.clusterId || source.lineageId, 160) || sourceId,
    isOfficial: source.isOfficial === true || sourceTypeFor(source.sourceType) === SOURCE_TYPE.OFFICIAL_INSTITUTION,
    sourceType: sourceTypeFor(source.sourceType),
    providerStatus,
    liveEvidence: Boolean(explicitLiveEvidence),
    sourceFingerprint: explicitLiveEvidence ? safeText(source.sourceFingerprint, 128) : null,
    contentFingerprint: safeText(source.contentFingerprint, 128) || null,
    retrievalOutcome: source.retrievalOutcome === "SUCCESS" ? "SUCCESS" : "UNKNOWN",
    sourceScope: safeText(source.sourceScope, 120) || "legacy_provider_report",
  });
  return {
    ...normalized,
    origin,
    provider: safeText(source.provider, 120) || `legacy_verification_${origin.toLowerCase()}`,
    limitations: explicitLiveEvidence ? [] : ["Legacy source did not provide independently verifiable live-evidence markers."],
  };
}

function relationFor(raw, verdict) {
  const relation = safeText(raw?.relation || raw?.relationship || raw?.status, 100).toUpperCase();
  if (["STRONGLY_SUPPORTS", "SUPPORTS", "TRUE", "SUPPORTED", "SUPPORT"].includes(relation)) return "SUPPORTS";
  if (["STRONGLY_CONTRADICTS", "CONTRADICTS", "FALSE", "CONTRADICTED", "CONTRADICT"].includes(relation)) return "CONTRADICTS";
  if (["MIXED", "CONTEXTUALIZES"].includes(relation)) return "CONTEXTUALIZES";
  if (verdict === "TRUE" || verdict === "SUPPORTED") return "SUPPORTS";
  if (verdict === "FALSE" || verdict === "CONTRADICTED") return "CONTRADICTS";
  return "INSUFFICIENT";
}

function normalizeEvidence(raw, index, claims, sourceMap, origin, providerStatus = EVIDENCE_PROVIDER_STATUS.SUCCESS) {
  const evidence = typeof raw === "string" ? { excerpt: raw } : asRecord(raw);
  const sourceId = safeText(evidence.sourceId || evidence.source?.sourceId || evidence.source?.id, 160);
  const linkedSource = sourceMap.get(sourceId) || null;
  const sourceUrl = safeHttpUrl(evidence.sourceUrl || evidence.url || linkedSource?.url);
  const evidenceId = safeText(evidence.evidenceId || evidence.id || evidence.reference, 160) || `legacy-${origin.toLowerCase()}-evidence-${index + 1}`;
  const explicitLiveEvidence = evidence.liveEvidence === true && evidence.retrievalOutcome === "SUCCESS" && typeof evidence.sourceFingerprint === "string" && evidence.sourceFingerprint.trim();
  const normalized = createEvidence({
    evidenceId,
    claimId: claimIdFor(evidence, claims, index),
    sourceId: sourceId || linkedSource?.sourceId || `legacy-${origin.toLowerCase()}-source-${index + 1}`,
    sourceUrl,
    sourceTitle: safeText(evidence.sourceTitle || evidence.title || linkedSource?.title, 240),
    excerpt: redactedProviderText(evidence.excerpt || evidence.observation || evidence.summary || evidence.quote || evidence.text, 400),
    relation: relationFor(evidence, safeText(evidence.verdict, 40).toUpperCase()),
    relevance: unit(evidence.relevance) ?? 0,
    strength: unit(evidence.strength) ?? 0,
    publishedAt: safeTimestamp(evidence.publishedAt || evidence.date),
    retrievedAt: safeTimestamp(evidence.retrievedAt) || new Date().toISOString(),
    freshness: safeText(evidence.freshness, 40).toUpperCase() || "UNKNOWN",
    authorityTier: authorityTierFor(evidence.authorityTier || linkedSource?.authorityTier),
    clusterId: safeText(evidence.clusterId || linkedSource?.clusterId, 160) || sourceId || evidenceId,
    isDirectQuote: evidence.isDirectQuote === true,
    sourceType: sourceTypeFor(evidence.sourceType || linkedSource?.sourceType),
    providerStatus,
    liveEvidence: Boolean(explicitLiveEvidence),
    sourceFingerprint: explicitLiveEvidence ? safeText(evidence.sourceFingerprint, 128) : null,
    contentFingerprint: safeText(evidence.contentFingerprint, 128) || null,
    evidenceScope: safeText(evidence.evidenceScope, 120) || "legacy_provider_report",
    retrievalOutcome: evidence.retrievalOutcome === "SUCCESS" ? "SUCCESS" : "UNKNOWN",
  });
  return {
    ...normalized,
    origin,
    provider: safeText(evidence.provider || linkedSource?.provider, 120) || `legacy_verification_${origin.toLowerCase()}`,
    limitations: explicitLiveEvidence ? [] : ["Legacy evidence is retained as a provider observation until its live provenance is independently verified."],
  };
}

function statusForLayer3Verdict(verdict, { evidenceCount = 0, validLiveEvidence = false } = {}) {
  const hasEvidence = evidenceCount > 0;
  const hasEvidenceBackedVerdict = hasEvidence && validLiveEvidence;
  if (["TRUE", "SUPPORTED"].includes(verdict)) {
    return hasEvidenceBackedVerdict
      ? LAYER_3_STATUS.VERIFIED
      : hasEvidence ? LAYER_3_STATUS.PARTIAL : LAYER_3_STATUS.INSUFFICIENT_EVIDENCE;
  }
  if (["FALSE", "CONTRADICTED", "MIXED"].includes(verdict)) {
    return hasEvidenceBackedVerdict
      ? LAYER_3_STATUS.CONTESTED
      : hasEvidence ? LAYER_3_STATUS.PARTIAL : LAYER_3_STATUS.INSUFFICIENT_EVIDENCE;
  }
  if (verdict === "UNAVAILABLE") return LAYER_3_STATUS.PARTIAL;
  return LAYER_3_STATUS.INSUFFICIENT_EVIDENCE;
}

function statusForTransport(result) {
  if (result?.kind === "timeout") return "TIMEOUT";
  if (result?.kind === "http" && [401, 403].includes(result.status)) return "AUTH_FAILED";
  if (result?.kind === "http" && result.status === 429) return "RATE_LIMITED";
  if (result?.kind === "circuit") return "CIRCUIT_OPEN";
  if (result?.kind === "bulkhead") return "UNAVAILABLE";
  if (result?.kind === "invalid") return "INVALID_RESPONSE";
  if (result?.kind === "config") return "NOT_CONFIGURED";
  if (result?.kind === "http" || result?.kind === "failure") return "UNAVAILABLE";
  return "UNAVAILABLE";
}

function safeTransportMessage(result) {
  if (result?.kind === "config") return result.code || "LEGACY_BACKEND_NOT_CONFIGURED";
  if (result?.kind === "timeout") return "Legacy verification backend timed out.";
  if (result?.kind === "circuit") return "Legacy verification backend circuit is open.";
  if (result?.kind === "bulkhead") return "Legacy verification backend concurrency limit was reached.";
  if (result?.kind === "invalid") return result.code || "LEGACY_INVALID_RESPONSE";
  if (result?.kind === "http") return `Legacy verification backend returned HTTP ${result.status || 0}.`;
  return "Legacy verification backend is unavailable.";
}

function safeStatusMessage(status, code) {
  if (status === "TIMEOUT") return "Legacy verification backend timed out.";
  if (status === "RATE_LIMITED") return "Legacy verification backend rate limit was reached.";
  if (status === "AUTH_FAILED") return "Legacy verification backend authentication failed.";
  if (status === "CIRCUIT_OPEN") return "Legacy verification backend circuit is open.";
  if (status === "INVALID_INPUT") return "Legacy verification input did not match the approved contract.";
  if (status === "INVALID_RESPONSE") return "Legacy verification backend returned an invalid response.";
  if (status === "NOT_CONFIGURED") return code || "LEGACY_BACKEND_NOT_CONFIGURED";
  return "Legacy verification backend is unavailable.";
}

function providerStatusFromLegacyReason(reason) {
  const value = safeText(reason, 1_200).toLowerCase();
  if (!value) return EVIDENCE_PROVIDER_STATUS.SUCCESS;
  if (/not configured|missing .*key|api key/.test(value)) return EVIDENCE_PROVIDER_STATUS.NOT_CONFIGURED;
  if (/timed out|timeout/.test(value)) return EVIDENCE_PROVIDER_STATUS.TIMEOUT;
  if (/429|rate limit|too many requests/.test(value)) return EVIDENCE_PROVIDER_STATUS.RATE_LIMITED;
  if (/401|403|unauthorized|forbidden|authentication/.test(value)) return EVIDENCE_PROVIDER_STATUS.AUTH_FAILED;
  if (/unavailable|failed|error/.test(value)) return EVIDENCE_PROVIDER_STATUS.UNAVAILABLE;
  return EVIDENCE_PROVIDER_STATUS.SUCCESS;
}

function retryAfterMilliseconds(value, now) {
  const raw = safeText(value, 120);
  if (!raw) return 0;
  const seconds = Number(raw);
  if (Number.isFinite(seconds) && seconds >= 0) return Math.min(30_000, Math.floor(seconds * 1_000));
  const timestamp = Date.parse(raw);
  return Number.isFinite(timestamp) ? Math.min(30_000, Math.max(0, timestamp - now)) : 0;
}

const LEGACY_LAYER3_INPUT_TYPES = new Set(["url", "text"]);
const LEGACY_LAYER4_MODES = new Set(["user", "pro", "expert"]);

function normalizedInputType(input, allowedTypes, fallback = "text") {
  const value = safeText(input?.type, 40).toLowerCase();
  return allowedTypes.has(value) ? value : fallback;
}

function legacyLayer4Mode(input) {
  const value = safeText(input?.mode || input?.metadata?.legacyLayer4Mode || input?.metadata?.layer4Mode, 40).toLowerCase();
  return LEGACY_LAYER4_MODES.has(value) ? value : "user";
}

function legacyLayer3ForLayer4(layer3Result) {
  const integration = asRecord(layer3Result?.legacyIntegration);
  const verdict = safeText(integration.rawVerdict || layer3Result?.verdict, 80).toUpperCase() || "UNKNOWN";
  const confidence = unit(integration.legacyAssessmentConfidence ?? layer3Result?.evidenceConfidence) ?? 0;
  const reason = redactedProviderText(integration.reason, 1_200) || "Evidence requires further assessment.";
  const evidence = boundedArray(layer3Result?.evidence, LEGACY_VERIFICATION_CONFIG.MAX_EVIDENCE)
    .map((item) => {
      const record = asRecord(item);
      const url = safeHttpUrl(record.sourceUrl || record.url);
      if (!url) return null;
      return {
        title: safeText(record.sourceTitle || record.title, 240) || "Legacy source observation",
        url,
        content: optionalText(redactedProviderText(record.excerpt || record.content || record.observation || record.summary, 4_000), 4_000),
      };
    })
    .filter(Boolean);
  const sources = boundedArray(layer3Result?.sources, LEGACY_VERIFICATION_CONFIG.MAX_SOURCES)
    .map((item) => {
      const record = asRecord(item);
      const url = safeHttpUrl(record.url || record.sourceUrl || record.link);
      if (!url) return null;
      return {
        title: safeText(record.title || record.name, 240) || "Legacy source",
        url,
      };
    })
    .filter(Boolean);
  return { verdict, confidence, reason, evidence, sources };
}

function validateLegacyLayer3WireResponse(payload) {
  const raw = unwrapPayload(payload);
  if (!raw) return { ok: false, code: "LEGACY_LAYER3_PAYLOAD_NOT_OBJECT" };
  const verdict = safeText(raw.verdict, 80).toUpperCase();
  if (!LEGACY_LAYER3_VERDICTS.has(verdict)) return { ok: false, code: "LEGACY_LAYER3_VERDICT_INVALID" };
  if (unit(raw.confidence) === null) return { ok: false, code: "LEGACY_CONFIDENCE_INVALID" };
  if (typeof raw.stop !== "boolean") return { ok: false, code: "LEGACY_STOP_MUST_BE_BOOLEAN" };
  if (typeof raw.canContinueToLayer4 !== "boolean") return { ok: false, code: "LEGACY_CONTINUATION_MUST_BE_BOOLEAN" };
  if (raw.stop === true && raw.canContinueToLayer4 === true) return { ok: false, code: "LEGACY_LAYER3_CONTINUATION_CONTRADICTION" };
  if (typeof raw.reason !== "string" || raw.reason.length > 1_200) return { ok: false, code: "LEGACY_REASON_INVALID" };
  if (!Array.isArray(raw.evidence) || raw.evidence.length > LEGACY_VERIFICATION_CONFIG.MAX_EVIDENCE) return { ok: false, code: "LEGACY_LAYER3_EVIDENCE_INVALID" };
  if (!Array.isArray(raw.sources) || raw.sources.length > LEGACY_VERIFICATION_CONFIG.MAX_SOURCES) return { ok: false, code: "LEGACY_LAYER3_SOURCES_INVALID" };
  for (const item of raw.evidence) {
    if (!isRecord(item) || typeof item.title !== "string" || !safeText(item.title, 240) || item.title.length > 240 || typeof item.url !== "string" || !safeHttpUrl(item.url)) {
      return { ok: false, code: "LEGACY_LAYER3_EVIDENCE_INVALID" };
    }
    if (item.content !== null && item.content !== undefined && (typeof item.content !== "string" || item.content.length > 4_000)) {
      return { ok: false, code: "LEGACY_LAYER3_EVIDENCE_CONTENT_TOO_LARGE" };
    }
  }
  for (const item of raw.sources) {
    if (!isRecord(item) || typeof item.title !== "string" || !safeText(item.title, 240) || item.title.length > 240 || typeof item.url !== "string" || !safeHttpUrl(item.url)) {
      return { ok: false, code: "LEGACY_LAYER3_SOURCE_INVALID" };
    }
  }
  return { ok: true };
}

function validateLegacyLayer4WireResponse(payload) {
  const raw = unwrapPayload(payload);
  if (!raw) return { ok: false, code: "LEGACY_LAYER4_PAYLOAD_NOT_OBJECT" };
  const verdict = safeText(raw.verdict, 80).toUpperCase();
  if (!LEGACY_LAYER4_VERDICTS.has(verdict)) return { ok: false, code: "LEGACY_LAYER4_VERDICT_INVALID" };
  for (const field of ["confidence", "evidenceAgreement", "sourceQuality"]) {
    if (unit(raw[field]) === null) return { ok: false, code: `LEGACY_${field.toUpperCase()}_INVALID` };
  }
  if (typeof raw.stop !== "boolean") return { ok: false, code: "LEGACY_STOP_MUST_BE_BOOLEAN" };
  if (typeof raw.canContinueToLayer4 !== "boolean") return { ok: false, code: "LEGACY_CONTINUATION_MUST_BE_BOOLEAN" };
  if (typeof raw.mode !== "string" || !LEGACY_LAYER4_MODES.has(safeText(raw.mode, 40).toLowerCase())) return { ok: false, code: "LEGACY_MODE_INVALID" };
  if (typeof raw.geminiModel !== "string" || raw.geminiModel.length > 160) return { ok: false, code: "LEGACY_GEMINI_MODEL_INVALID" };
  if (raw.groqModel !== null && raw.groqModel !== undefined && (typeof raw.groqModel !== "string" || raw.groqModel.length > 160)) return { ok: false, code: "LEGACY_GROQ_MODEL_INVALID" };
  if (typeof raw.reason !== "string" || raw.reason.length > 1_200) return { ok: false, code: "LEGACY_REASON_INVALID" };
  if (!Array.isArray(raw.contradictoryEvidence) || raw.contradictoryEvidence.length > 40 || raw.contradictoryEvidence.some((item) => typeof item !== "string" || item.length > 700)) return { ok: false, code: "LEGACY_CONTRADICTIONS_INVALID" };
  if (!Array.isArray(raw.sources) || raw.sources.length > LEGACY_VERIFICATION_CONFIG.MAX_SOURCES) return { ok: false, code: "LEGACY_LAYER4_SOURCES_INVALID" };
  for (const item of raw.sources) {
    if (!isRecord(item) || typeof item.title !== "string" || !safeText(item.title, 240) || item.title.length > 240 || typeof item.url !== "string" || !safeHttpUrl(item.url)) {
      return { ok: false, code: "LEGACY_LAYER4_SOURCE_INVALID" };
    }
  }
  return { ok: true };
}

function missingLayer3Result(requestId, status, code, latencyMs = 0) {
  const result = createLayer3Result({
    status: LAYER_3_STATUS.PARTIAL,
    claims: [],
    sources: [],
    evidence: [],
    limitations: ["Legacy Layer 3 evidence is unavailable; no local or demo evidence was substituted."],
    requestId,
    retrievalStatus: Object.values(EVIDENCE_PROVIDER_STATUS).includes(status)
      ? status
      : EVIDENCE_PROVIDER_STATUS.UNAVAILABLE,
    retrievalMode: "LEGACY_VERIFICATION_UNAVAILABLE",
    externalEvidence: false,
    auditEvents: [{ type: "LEGACY_LAYER3_UNAVAILABLE", code, at: new Date().toISOString() }],
    metrics: {
      executionTimeMs: latencyMs,
      retrievalProvider: "legacy_verification_layer3",
      retrievalStatus: status,
      retrievalMode: "LEGACY_VERIFICATION_UNAVAILABLE",
      externalEvidence: false,
      providerIndependent: false,
    },
  });
  return markTrustedLayer3Result({
    ...result,
    legacyIntegration: {
      status: "UNAVAILABLE",
      providerStatus: status,
      rawVerdict: null,
      legacyAssessmentConfidence: null,
      reason: safeStatusMessage(status, code),
      stop: null,
      canContinueToLayer4: false,
      continuationDerived: true,
      errorCode: safeText(code, 120) || "LEGACY_LAYER3_UNAVAILABLE",
      sourceOrigin: "LAYER_3_WEB_EVIDENCE",
    },
  });
}

function invalidLayer2Result(requestId, code, latencyMs = 0) {
  return createLayer2AResult({
    provider: "legacy_verification_layer2",
    providerStatus: LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE,
    finding: LAYER_2A_FINDING.UNKNOWN,
    requestId,
    latencyMs,
    errorCode: code,
    message: "Legacy Layer 2 response did not match the approved contract.",
  });
}

export function normalizeLegacyLayer3Payload(payload, { claims = [], requestId, latencyMs = 0 } = {}) {
  const raw = unwrapPayload(payload);
  if (!raw) return { ok: false, code: "LEGACY_LAYER3_PAYLOAD_NOT_OBJECT" };
  const verdict = safeText(raw.verdict, 80).toUpperCase();
  if (!LEGACY_LAYER3_VERDICTS.has(verdict)) return { ok: false, code: "LEGACY_LAYER3_VERDICT_INVALID" };
  const providerStatus = providerStatusFromLegacyReason(raw.reason);
  const confidence = optionalUnit(raw, "confidence");
  if (!confidence.ok) return confidence;
  const stop = optionalBoolean(raw, "stop");
  const continuation = optionalBoolean(raw, "canContinueToLayer4");
  if (!stop.ok) return stop;
  if (!continuation.ok) return continuation;
  if (stop.value === true && continuation.value === true) return { ok: false, code: "LEGACY_LAYER3_CONTINUATION_CONTRADICTION" };

  const normalizedClaims = normalizeClaims(claims);
  const sourceRecords = boundedArray(raw.sources, LEGACY_VERIFICATION_CONFIG.MAX_SOURCES)
    .map((source, index) => normalizeSource(source, index, "LAYER_3_WEB_EVIDENCE", providerStatus))
    .filter(Boolean);
  const sourceMap = new Map(sourceRecords.map((source) => [source.sourceId, source]));
  const evidenceRecords = boundedArray(raw.evidence, LEGACY_VERIFICATION_CONFIG.MAX_EVIDENCE)
    .map((evidence, index) => normalizeEvidence(evidence, index, normalizedClaims, sourceMap, "LAYER_3_WEB_EVIDENCE", providerStatus))
    .filter(Boolean);
  const validLiveEvidence = evidenceRecords.some((item) => item.liveEvidence === true && item.providerStatus === EVIDENCE_PROVIDER_STATUS.SUCCESS && item.retrievalOutcome === "SUCCESS" && item.sourceFingerprint);
  const rawExternalEvidence = raw.externalEvidence === true;
  const canContinueToLayer4 = continuation.value === null
    ? stop.value !== true && verdict !== "UNAVAILABLE"
    : continuation.value;
  const mappedStatus = statusForLayer3Verdict(verdict, {
    evidenceCount: evidenceRecords.length,
    validLiveEvidence,
  });
  const result = createLayer3Result({
    status: mappedStatus,
    claims: normalizedClaims,
    sources: sourceRecords,
    evidence: evidenceRecords,
    verificationCompleteness: unit(raw.verificationCompleteness ?? raw.evidenceCoverage) ?? 0,
    evidenceConfidence: 0,
    crossSourceAgreement: isRecord(raw.sourceAgreement)
      ? raw.sourceAgreement
      : { agreementScore: unit(raw.sourceAgreement) ?? 0, supportingSourcesCount: 0, contradictingSourcesCount: 0, unresolved: verdict === "MIXED" },
    conflicts: boundedArray(raw.conflicts || raw.contradictoryEvidence, 80).map((item) => ({
      conflictId: safeText(item?.id || item?.conflictId, 160) || null,
      claimId: safeText(item?.claimId, 160) || null,
      conflictType: safeText(item?.type || item?.conflictType, 100) || "LEGACY_CONFLICT",
      resolutionRecommendation: safeText(item?.reason || item?.details || item, 500),
    })),
    limitations: [
      "Legacy Layer 3 verdict is retained separately from canonical evidence completeness.",
      ...(rawExternalEvidence && !validLiveEvidence ? ["Legacy response asserted external evidence without independently verifiable live-evidence markers."] : []),
    ],
    requestId,
    retrievalStatus: providerStatus,
    retrievalMode: "LEGACY_VERIFICATION",
    externalEvidence: validLiveEvidence,
    auditEvents: [{ type: "LEGACY_LAYER3_NORMALIZED", code: null, at: new Date().toISOString() }],
    metrics: {
      executionTimeMs: latencyMs,
      retrievalProvider: "legacy_verification_layer3",
      retrievalStatus: providerStatus,
      retrievalMode: "LEGACY_VERIFICATION",
      externalEvidence: validLiveEvidence,
      providerIndependent: true,
    },
  });

  const enriched = {
    ...result,
    sources: result.sources.map((source) => ({ ...source, origin: "LAYER_3_WEB_EVIDENCE", provider: sourceMap.get(source.sourceId)?.provider || "legacy_verification_layer3" })),
    evidence: result.evidence.map((evidence) => ({ ...evidence, origin: "LAYER_3_WEB_EVIDENCE", provider: evidenceRecords.find((item) => item.evidenceId === evidence.evidenceId)?.provider || "legacy_verification_layer3" })),
    legacyIntegration: {
      status: providerStatus === EVIDENCE_PROVIDER_STATUS.SUCCESS ? "COMPLETED" : "PARTIAL",
      providerStatus,
      rawVerdict: verdict,
      legacyAssessmentConfidence: confidence.value,
      reason: optionalText(redactedProviderText(raw.reason, 1200), 1200),
      stop: stop.value === null ? false : stop.value,
      canContinueToLayer4,
      continuationDerived: continuation.value === null,
      evidenceAgreement: scalar(raw.evidenceAgreement ?? raw.sourceAgreement),
      sourceQuality: scalar(raw.sourceQuality),
      sourceOrigin: "LAYER_3_WEB_EVIDENCE",
      sourceCount: sourceRecords.length,
      evidenceCount: evidenceRecords.length,
    },
  };
  return { ok: true, result: markTrustedLayer3Result(enriched) };
}

export function normalizeLegacyLayer4Payload(payload, { requestId, latencyMs = 0 } = {}) {
  const raw = unwrapPayload(payload);
  if (!raw) return { ok: false, code: "LEGACY_LAYER4_PAYLOAD_NOT_OBJECT" };
  const verdict = safeText(raw.verdict, 80).toUpperCase();
  if (!LEGACY_LAYER4_VERDICTS.has(verdict)) return { ok: false, code: "LEGACY_LAYER4_VERDICT_INVALID" };
  const providerStatus = providerStatusFromLegacyReason(raw.reason);
  const confidence = optionalUnit(raw, "confidence");
  if (!confidence.ok) return confidence;
  const evidenceAgreement = optionalUnit(raw, "evidenceAgreement");
  if (!evidenceAgreement.ok) return evidenceAgreement;
  const sourceQuality = optionalUnit(raw, "sourceQuality");
  if (!sourceQuality.ok) return sourceQuality;
  const stop = optionalBoolean(raw, "stop");
  const continuation = optionalBoolean(raw, "canContinueToLayer4");
  if (!stop.ok) return stop;
  if (!continuation.ok) return continuation;

  const sourceRecords = boundedArray(raw.sources, LEGACY_VERIFICATION_CONFIG.MAX_SOURCES)
    .map((source, index) => normalizeSource(source, index, "LAYER_4_INDEPENDENT_RESEARCH", providerStatus))
    .filter(Boolean);
  const contradictoryEvidence = boundedArray(raw.contradictoryEvidence, 40).map((item) => {
    if (typeof item === "string") return safeText(item, 700);
    const record = asRecord(item);
    return optionalText(redactedProviderText(record.details || record.observation || record.claim || record.reason, 700), 700);
  }).filter(Boolean);

  return {
    ok: true,
    result: {
      status: providerStatus === EVIDENCE_PROVIDER_STATUS.SUCCESS ? "COMPLETED" : "PARTIAL",
      providerStatus,
      providerId: "legacy_verification_layer4",
      requestId,
      latencyMs,
      rawVerdict: verdict,
      assessmentConfidence: confidence.value,
      evidenceAgreement: evidenceAgreement.value,
      sourceQuality: sourceQuality.value,
      stop: stop.value === null ? false : stop.value,
      canContinueToLayer4: continuation.value,
      mode: optionalText(raw.mode, 80),
      geminiModel: optionalText(raw.geminiModel, 160),
      groqModel: optionalText(raw.groqModel, 160),
      reason: optionalText(redactedProviderText(raw.reason, 1200), 1200),
      contradictoryEvidence,
      sources: sourceRecords,
      sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
      limitations: [
        "Independent synthesis is a candidate assessment and does not override StudentHub deterministic policy.",
        "Model-reported confidence is assessment confidence, not safety probability or decision confidence.",
      ],
    },
  };
}

export class LegacyVerificationAdapter {
  constructor({
    env = process.env,
    fetchImpl = globalThis.fetch,
    clock = () => Date.now(),
    resolveDns = null,
    sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
    random = Math.random,
  } = {}) {
    this.config = getLegacyVerificationConfig(env);
    this.fetchImpl = fetchImpl;
    this.clock = clock;
    this.resolveDns = typeof resolveDns === "boolean" ? resolveDns : this.config.resolveDns;
    this.sleep = typeof sleep === "function" ? sleep : async () => {};
    this.random = typeof random === "function" ? random : () => 0;
    this.inFlight = 0;
    this.consecutiveFailures = 0;
    this.circuitOpenedAt = null;
    this.providerId = "legacy_verification_backend";
  }

  get enabled() {
    return this.config.enabled;
  }

  get isConfigured() {
    return this.config.enabled;
  }

  describe() {
    return {
      enabled: this.config.enabled,
      configured: this.config.configured,
      dependency: this.providerId,
      configError: this.config.enabled ? null : this.config.configError,
      endpoints: { ...this.config.ENDPOINTS },
      resilience: {
        maxAttempts: this.config.maxAttempts,
        retryBaseDelayMs: this.config.retryBaseDelayMs,
        retryMaxDelayMs: this.config.retryMaxDelayMs,
        circuitFailureThreshold: this.config.circuitFailureThreshold,
        circuitCooldownMs: this.config.circuitCooldownMs,
        circuitState: this.#circuitState(),
        bulkheadMaxConcurrency: this.config.bulkheadMaxConcurrency,
        inFlight: this.inFlight,
      },
    };
  }

  layer2Provider() {
    return { providerId: "legacy_verification_layer2", check: (params) => this.verifyLayer2(params) };
  }

  #circuitState() {
    if (this.circuitOpenedAt === null) return "CLOSED";
    if (this.clock() - this.circuitOpenedAt >= this.config.circuitCooldownMs) {
      this.circuitOpenedAt = null;
      this.consecutiveFailures = 0;
      return "CLOSED";
    }
    return "OPEN";
  }

  #isCircuitOpen() {
    return this.#circuitState() === "OPEN";
  }

  #isRetryable(result) {
    if (result?.kind === "timeout" || result?.kind === "failure") return true;
    return result?.kind === "http" && [408, 425, 429, 500, 502, 503, 504].includes(result.status);
  }

  #countsAsCircuitFailure(result) {
    return this.#isRetryable(result) || result?.kind === "invalid";
  }

  #recordSuccess() {
    this.consecutiveFailures = 0;
    this.circuitOpenedAt = null;
  }

  #recordFailure(result) {
    if (!this.#countsAsCircuitFailure(result)) return;
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= this.config.circuitFailureThreshold) this.circuitOpenedAt = this.clock();
  }

  #retryDelay(result, attempt) {
    const exponential = Math.min(
      this.config.retryMaxDelayMs,
      this.config.retryBaseDelayMs * (2 ** Math.max(0, attempt - 1)),
    );
    const retryAfter = Number.isFinite(result?.retryAfterMs) ? result.retryAfterMs : 0;
    const jitterRange = Math.max(1, Math.floor(exponential * 0.25));
    const jitter = Math.floor(Math.max(0, Math.min(1, Number(this.random()) || 0)) * jitterRange);
    return Math.min(this.config.retryMaxDelayMs, Math.max(exponential, retryAfter) + jitter);
  }

  async #waitBeforeRetry(milliseconds, signal) {
    if (milliseconds <= 0) return;
    if (signal?.aborted) {
      const error = new Error("Legacy request cancelled");
      error.name = "AbortError";
      throw error;
    }
    await new Promise((resolve, reject) => {
      let settled = false;
      const cleanup = () => signal?.removeEventListener?.("abort", onAbort);
      const onAbort = () => {
        if (settled) return;
        settled = true;
        cleanup();
        const error = new Error("Legacy request cancelled");
        error.name = "AbortError";
        reject(error);
      };
      signal?.addEventListener?.("abort", onAbort, { once: true });
      Promise.resolve(this.sleep(milliseconds)).then(() => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      }, (error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      });
    });
  }

  async #post(path, body, requestId, signal, budget = null) {
    if (!this.config.enabled) return { kind: "config", code: this.config.configError || "LEGACY_BACKEND_NOT_CONFIGURED" };
    if (typeof this.fetchImpl !== "function") return { kind: "failure", code: "FETCH_UNAVAILABLE" };

    let bodyText;
    try {
      bodyText = JSON.stringify(body);
    } catch {
      return { kind: "invalid", code: "LEGACY_REQUEST_SERIALIZATION_FAILED" };
    }
    const bodyBytes = new TextEncoder().encode(bodyText).byteLength;
    if (bodyBytes > this.config.MAX_REQUEST_BYTES) return { kind: "invalid", code: "LEGACY_REQUEST_TOO_LARGE" };

    const baseValidation = this.resolveDns
      ? await validateRemoteUrl(this.config.baseUrl, { resolveDns: true, dnsTimeoutMs: this.config.DNS_TIMEOUT_MS })
      : validateRemoteUrlSync(this.config.baseUrl);
    if (!baseValidation.ok) return { kind: "config", code: baseValidation.code };

    if (this.#isCircuitOpen()) return { kind: "circuit", code: "LEGACY_CIRCUIT_OPEN" };
    if (this.inFlight >= this.config.bulkheadMaxConcurrency) return { kind: "bulkhead", code: "LEGACY_BULKHEAD_FULL" };

    const endpoint = `${this.config.baseUrl}${path}`;
    this.inFlight += 1;
    try {
      let result = null;
      for (let attempt = 1; attempt <= this.config.maxAttempts; attempt += 1) {
        if (attempt > 1 && typeof budget?.tryConsume === "function") {
          const retryBudget = budget.tryConsume("retries");
          if (!retryBudget?.allowed) return { kind: "budget", code: retryBudget.code || "BUDGET_EXCEEDED", attempts: attempt - 1 };
        }
        if (typeof budget?.recordUsage === "function") budget.recordUsage("legacyCalls");
        result = await this.#postAttempt(endpoint, bodyText, requestId, signal);
        if (result.kind === "ok") {
          this.#recordSuccess();
          return { ...result, attempts: attempt };
        }
        if (!this.#isRetryable(result) || attempt >= this.config.maxAttempts) {
          this.#recordFailure(result);
          return { ...result, attempts: attempt };
        }
        await this.#waitBeforeRetry(this.#retryDelay(result, attempt), signal);
      }
      this.#recordFailure(result);
      return { ...(result || { kind: "failure", code: "LEGACY_RETRY_EXHAUSTED" }), attempts: this.config.maxAttempts };
    } finally {
      this.inFlight = Math.max(0, this.inFlight - 1);
    }
  }

  async #postAttempt(endpoint, bodyText, requestId, signal) {
    const controller = new AbortController();
    let timedOut = false;
    const onAbort = () => controller.abort(signal?.reason || "caller-aborted");
    if (signal?.aborted) onAbort();
    else signal?.addEventListener?.("abort", onAbort, { once: true });
    const timeoutId = setTimeout(() => { timedOut = true; controller.abort("legacy-timeout"); }, this.config.timeoutMs);
    const startedAt = this.clock();

    try {
      const response = await this.fetchImpl(endpoint, {
        method: "POST",
        redirect: "error",
        signal: controller.signal,
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: bodyText,
      });
      if (!response?.ok) {
        return {
          kind: "http",
          status: Number(response?.status) || 0,
          retryAfterMs: retryAfterMilliseconds(response?.headers?.get?.("retry-after") || response?.headers?.get?.("Retry-After"), this.clock()),
          latencyMs: this.clock() - startedAt,
        };
      }
      const contentType = safeText(response?.headers?.get?.("content-type"), 120).toLowerCase();
      if (contentType && !contentType.includes("json")) return { kind: "invalid", code: "LEGACY_UNEXPECTED_CONTENT_TYPE", latencyMs: this.clock() - startedAt };
      const contentLength = Number(response?.headers?.get?.("content-length") || 0);
      if (Number.isFinite(contentLength) && contentLength > this.config.MAX_RESPONSE_BYTES) return { kind: "invalid", code: "LEGACY_RESPONSE_TOO_LARGE", latencyMs: this.clock() - startedAt };
      const bytes = typeof response?.arrayBuffer === "function"
        ? new Uint8Array(await response.arrayBuffer())
        : new TextEncoder().encode(await response.text());
      if (bytes.byteLength > this.config.MAX_RESPONSE_BYTES) return { kind: "invalid", code: "LEGACY_RESPONSE_TOO_LARGE", latencyMs: this.clock() - startedAt };
      let payload;
      try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { return { kind: "invalid", code: "LEGACY_INVALID_JSON", latencyMs: this.clock() - startedAt }; }
      return { kind: "ok", payload, latencyMs: Math.max(0, this.clock() - startedAt) };
    } catch (error) {
      if (signal?.aborted) {
        const abortError = error instanceof Error ? error : new Error("Legacy request cancelled");
        abortError.name = "AbortError";
        throw abortError;
      }
      return { kind: timedOut ? "timeout" : "failure", code: timedOut ? "LEGACY_TIMEOUT" : "LEGACY_NETWORK_ERROR", latencyMs: Math.max(0, this.clock() - startedAt) };
    } finally {
      clearTimeout(timeoutId);
      signal?.removeEventListener?.("abort", onAbort);
    }
  }

  async verifyLayer2({ url = "", requestId = null, signal, budget = null } = {}) {
    const id = requestIdFor(requestId);
    const normalizedUrl = safeText(url, 2048);
    const guard = validateRemoteUrlSync(normalizedUrl);
    if (!guard.ok) {
      return createLayer2AResult({ provider: "legacy_verification_layer2", providerStatus: LAYER_2A_PROVIDER_STATUS.INVALID_INPUT, finding: LAYER_2A_FINDING.UNKNOWN, requestId: id, errorCode: guard.code });
    }
    const lookup = decideReputationLookup(guard.url);
    if (lookup.policy === REPUTATION_LOOKUP_POLICY.SKIP) {
      return createLayer2AResult({
        provider: "legacy_verification_layer2",
        providerStatus: LAYER_2A_PROVIDER_STATUS.INVALID_INPUT,
        finding: LAYER_2A_FINDING.SKIPPED_PRIVACY_SAFETY,
        requestId: id,
        errorCode: `REPUTATION_LOOKUP_SKIPPED_${lookup.reason || REPUTATION_LOOKUP_REASON.OTHER}`,
        message: "External reputation lookup skipped by the URL disclosure policy.",
        reputationLookupPolicy: lookup.policy,
        reputationLookupReason: lookup.reason,
        reputationLookupStatus: REPUTATION_LOOKUP_STATUS.SKIPPED_PRIVACY_SAFETY,
        reputationLookupTargetClass: lookup.targetClass,
        reputationLookupDisclosed: lookup.disclosed,
      });
    }
    const disclosedUrl = lookup.lookupUrl || guard.url;
    const response = await this.#post(this.config.ENDPOINTS.layer2, { type: "url", content: disclosedUrl }, id, signal, budget);
    if (response.kind !== "ok") {
      const providerStatus = response.kind === "timeout"
        ? LAYER_2A_PROVIDER_STATUS.TIMEOUT
        : response.kind === "circuit"
          ? LAYER_2A_PROVIDER_STATUS.CIRCUIT_OPEN
        : response.kind === "http" && [401, 403].includes(response.status)
          ? LAYER_2A_PROVIDER_STATUS.AUTH_FAILED
        : response.kind === "http" && response.status === 429
          ? LAYER_2A_PROVIDER_STATUS.RATE_LIMITED
          : response.kind === "invalid"
            ? LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE
            : response.kind === "config"
              ? LAYER_2A_PROVIDER_STATUS.NOT_CONFIGURED
              : LAYER_2A_PROVIDER_STATUS.UNAVAILABLE;
      return createLayer2AResult({ provider: "legacy_verification_layer2", providerStatus, finding: LAYER_2A_FINDING.UNKNOWN, requestId: id, latencyMs: response.latencyMs || 0, errorCode: response.code || `LEGACY_LAYER2_HTTP_${response.status || 0}`, message: "Legacy Layer 2 is not available for this run." });
    }
    const normalized = normalizeLayer2AProviderPayload(unwrapPayload(response.payload));
    if (!normalized.ok) return invalidLayer2Result(id, normalized.code, response.latencyMs || 0);
    return createLayer2AResult({
      provider: "legacy_verification_layer2",
      providerStatus: normalized.providerStatus || LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE,
      finding: normalized.finding || LAYER_2A_FINDING.UNKNOWN,
      rawVerdict: normalized.rawVerdict,
      providerConfidence: normalized.providerConfidence,
      threatTypes: normalized.threatTypes,
      providerResults: normalized.providerResults,
      message: normalized.message,
      errorCode: normalized.errorCode,
      contractViolation: normalized.contractViolation,
      requestId: id,
      latencyMs: response.latencyMs || 0,
      targetFingerprint: fingerprint(disclosedUrl),
      reputationLookupPolicy: lookup.policy,
      reputationLookupReason: lookup.reason,
      reputationLookupStatus: lookup.policy === REPUTATION_LOOKUP_POLICY.REDACT
        ? REPUTATION_LOOKUP_STATUS.LOOKUP_REDACTED
        : REPUTATION_LOOKUP_STATUS.LOOKUP_PERFORMED,
      reputationLookupTargetClass: lookup.targetClass,
      reputationLookupDisclosed: lookup.disclosed,
    });
  }

  async verifyLayer3({ input = {}, claims = [], requestId = null, signal, budget = null } = {}) {
    const id = requestIdFor(requestId);
    const type = safeText(input.type, 40).toLowerCase();
    const content = safeText(input.content, this.config.MAX_CONTENT_CHARS);
    if (this.config.enabled && (!LEGACY_LAYER3_INPUT_TYPES.has(type) || !content)) {
      return missingLayer3Result(id, "INVALID_INPUT", "LEGACY_LAYER3_INPUT_INVALID", 0);
    }
    const payload = {
      type: LEGACY_LAYER3_INPUT_TYPES.has(type) ? type : normalizedInputType(input, LEGACY_LAYER3_INPUT_TYPES),
      content,
    };
    const response = await this.#post(this.config.ENDPOINTS.layer3, payload, id, signal, budget);
    if (response.kind !== "ok") return missingLayer3Result(id, statusForTransport(response), response.code || safeTransportMessage(response), response.latencyMs || 0);
    const wire = validateLegacyLayer3WireResponse(response.payload);
    if (!wire.ok) return missingLayer3Result(id, "MALFORMED", wire.code, response.latencyMs || 0);
    const normalized = normalizeLegacyLayer3Payload(response.payload, { claims, requestId: id, latencyMs: response.latencyMs || 0 });
    if (!normalized.ok) return missingLayer3Result(id, "MALFORMED", normalized.code, response.latencyMs || 0);
    return normalized.result;
  }

  async verifyLayer4({ input = {}, layer3Result = null, requestId = null, signal, budget = null } = {}) {
    const id = requestIdFor(requestId);
    const type = safeText(input.type, 40).toLowerCase() || "text";
    const content = safeText(input.content, this.config.MAX_CONTENT_CHARS);
    if (this.config.enabled && !content) {
      return {
        status: "UNAVAILABLE",
        providerStatus: "INVALID_INPUT",
        providerId: "legacy_verification_layer4",
        requestId: id,
        latencyMs: 0,
        rawVerdict: null,
        assessmentConfidence: null,
        evidenceAgreement: null,
        sourceQuality: null,
        stop: true,
        canContinueToLayer4: false,
        reason: "Legacy Layer 4 input did not match the approved contract.",
        contradictoryEvidence: [],
        sources: [],
        sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
        limitations: ["Invalid legacy input was discarded and did not affect the deterministic policy."],
        errorCode: "LEGACY_LAYER4_INPUT_INVALID",
      };
    }
    const layer3 = legacyLayer3ForLayer4(layer3Result);
    const payload = {
      type,
      content,
      mode: legacyLayer4Mode(input),
      layer3,
    };
    const response = await this.#post(this.config.ENDPOINTS.layer4, payload, id, signal, budget);
    if (response.kind !== "ok") {
      return {
        status: "UNAVAILABLE",
        providerStatus: statusForTransport(response),
        providerId: "legacy_verification_layer4",
        requestId: id,
        latencyMs: response.latencyMs || 0,
        rawVerdict: null,
        assessmentConfidence: null,
        evidenceAgreement: null,
        sourceQuality: null,
        stop: true,
        canContinueToLayer4: false,
        reason: safeTransportMessage(response),
        contradictoryEvidence: [],
        sources: [],
        sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
        limitations: ["Legacy Layer 4 synthesis is unavailable; deterministic StudentHub policy remains authoritative."],
        errorCode: safeText(response.code || `LEGACY_LAYER4_HTTP_${response.status || 0}`, 120),
      };
    }
    const wire = validateLegacyLayer4WireResponse(response.payload);
    const normalized = normalizeLegacyLayer4Payload(response.payload, { requestId: id, latencyMs: response.latencyMs || 0 });
    if (!wire.ok || !normalized.ok) {
      return {
        status: "UNAVAILABLE",
        providerStatus: "MALFORMED",
        providerId: "legacy_verification_layer4",
        requestId: id,
        latencyMs: response.latencyMs || 0,
        rawVerdict: null,
        assessmentConfidence: null,
        evidenceAgreement: null,
        sourceQuality: null,
        stop: true,
        canContinueToLayer4: false,
        reason: "Legacy Layer 4 response did not match the approved contract.",
        contradictoryEvidence: [],
        sources: [],
        sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
        limitations: ["Malformed legacy synthesis was discarded and did not affect the deterministic policy."],
        errorCode: wire.code || normalized.code,
      };
    }
    return normalized.result;
  }
}

export function createLegacyVerificationAdapter(options) {
  return new LegacyVerificationAdapter(options);
}

export { LEGACY_LAYER2_VERDICTS, LEGACY_LAYER3_VERDICTS, LEGACY_LAYER4_VERDICTS };
