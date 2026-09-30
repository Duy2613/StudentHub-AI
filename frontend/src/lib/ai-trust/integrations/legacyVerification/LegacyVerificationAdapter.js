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
import { MediaArtifactService } from "../../../server/media/MediaArtifactService.js";
import { LEGACY_VERIFICATION_CONFIG, getLegacyVerificationConfig } from "./config.js";

const LEGACY_LAYER2_VERDICTS = new Set(["SAFE", "DANGEROUS", "UNKNOWN"]);
const LEGACY_LAYER3_VERDICTS = new Set(["TRUE", "FALSE", "UNKNOWN", "SUPPORTED", "CONTRADICTED", "MIXED", "UNVERIFIED", "INSUFFICIENT_EVIDENCE", "UNAVAILABLE"]);
const LEGACY_LAYER4_VERDICTS = new Set(["TRUE", "FALSE", "UNKNOWN", "SAFE", "DANGEROUS", "SUSPICIOUS", "FAKE", "SUPPORTED", "CONTRADICTED", "MIXED", "UNVERIFIED", "INSUFFICIENT_EVIDENCE"]);
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
    excerpt: safeText(evidence.excerpt || evidence.observation || evidence.summary || evidence.quote || evidence.text, 400),
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
  if (result?.kind === "http" && result.status === 429) return "RATE_LIMITED";
  if (result?.kind === "invalid") return "INVALID_RESPONSE";
  if (result?.kind === "config") return "NOT_CONFIGURED";
  if (result?.kind === "http" || result?.kind === "failure") return "UNAVAILABLE";
  return "UNAVAILABLE";
}

function safeTransportMessage(result) {
  if (result?.kind === "config") return result.code || "LEGACY_BACKEND_NOT_CONFIGURED";
  if (result?.kind === "timeout") return "Legacy verification backend timed out.";
  if (result?.kind === "invalid") return result.code || "LEGACY_INVALID_RESPONSE";
  if (result?.kind === "http") return `Legacy verification backend returned HTTP ${result.status || 0}.`;
  return "Legacy verification backend is unavailable.";
}

function imageBytesForInput(input) {
  const metadata = asRecord(input?.metadata);
  const artifactId = safeText(metadata.mediaArtifactId, 180);
  const artifact = artifactId ? MediaArtifactService.getArtifact(artifactId) : null;
  let bytes = artifact?.buffer;

  // Public routes persist the complete image in MediaArtifactService before
  // the orchestrator runs. Direct adapter tests and internal callers may still
  // provide bytes without an artifact, so retain that safe server-side path.
  if (!bytes && !artifactId) {
    const rawBytes = metadata.bytes;
    if (Buffer.isBuffer(rawBytes)) bytes = rawBytes;
    else if (rawBytes instanceof Uint8Array) bytes = Buffer.from(rawBytes);
    else if (Array.isArray(rawBytes)) bytes = Buffer.from(rawBytes);
    else if (typeof rawBytes === "string") {
      const trimmed = rawBytes.trim();
      const comma = trimmed.indexOf(",");
      const encoded = trimmed.startsWith("data:") && comma >= 0 ? trimmed.slice(comma + 1) : trimmed;
      if (encoded && /^[A-Za-z0-9+/=\s]+$/.test(encoded)) {
        try { bytes = Buffer.from(encoded, "base64"); } catch { bytes = null; }
      }
    }
  }

  if (!bytes || !Buffer.isBuffer(bytes) || bytes.length === 0) {
    return { ok: false, code: artifactId ? "LEGACY_IMAGE_ARTIFACT_UNAVAILABLE" : "LEGACY_IMAGE_BYTES_UNAVAILABLE" };
  }
  if (bytes.length > LEGACY_VERIFICATION_CONFIG.MAX_IMAGE_BYTES) {
    return { ok: false, code: "LEGACY_IMAGE_TOO_LARGE" };
  }

  const contentType = safeText(artifact?.mimeType || metadata.mimeType, 80).toLowerCase();
  if (!/^image\/(jpeg|png|webp)$/.test(contentType)) {
    return { ok: false, code: "LEGACY_IMAGE_CONTENT_TYPE_UNSUPPORTED" };
  }

  return {
    ok: true,
    bytes,
    base64: bytes.toString("base64"),
    contentType,
    fileName: safeText(artifact?.fileName || metadata.fileName, 240) || "image",
  };
}

function imageProviderRecords(raw) {
  const source = asRecord(raw);
  const candidates = boundedArray(source.providers || source.results || source.providerResults, 20);
  const allowImplicitSuccess = !Array.isArray(source.providers) && Array.isArray(source.results);
  const records = candidates.length ? candidates : [source];
  return records.map((item, index) => {
    const record = asRecord(item);
    const provider = safeText(record.provider || record.providerId, 160) || `legacy_image_provider_${index + 1}`;
    const verdict = safeText(record.verdict || record.finding || record.status, 120).toUpperCase() || "UNKNOWN";
    const providerScore = unit(record.providerScore ?? record.confidence ?? record.score);
    const status = safeText(record.status, 80).toUpperCase() || (record.success === true || allowImplicitSuccess ? "SUCCESS" : "UNKNOWN");
    return {
      provider,
      providerId: safeText(record.providerId, 160) || provider,
      status,
      success: record.success === true || (allowImplicitSuccess && record.success === undefined) || ["SUCCESS", "COMPLETED", "VERIFIED"].includes(status),
      verdict,
      confidence: providerScore,
      providerScore,
      message: optionalText(record.message || record.reason || record.details, 1_200),
      threatTypes: boundedArray(record.threatTypes, 12).map((item) => safeText(item, 120)).filter(Boolean),
      errorCode: optionalText(record.errorCode, 120),
    };
  });
}

function imageMediaForensics(raw, providers, confidence) {
  const verdict = safeText(raw?.verdict, 120).toUpperCase() || "UNKNOWN";
  const reason = optionalText(raw?.reason, 1_200);
  const aiProviders = providers.filter((provider) => /ai|genai|synthetic|generation/i.test(`${provider.provider} ${provider.verdict}`));
  const deepfakeProviders = providers.filter((provider) => /deepfake|face.?swap/i.test(`${provider.provider} ${provider.verdict}`));
  const selectedAi = aiProviders[0] || null;
  const selectedDeepfake = deepfakeProviders[0] || null;
  const aiGeneration = selectedAi ? {
    status: selectedAi.success ? "SUCCESS" : "UNAVAILABLE",
    verdict,
    score: confidence,
    scoreKind: "PROVIDER_SCORE",
    provider: selectedAi.provider,
    providerScore: selectedAi.providerScore ?? confidence,
    confidenceType: "PROVIDER_ASSESSMENT",
    reason,
    providers: aiProviders.length ? aiProviders : providers,
  } : ["LIKELY_AI_GENERATED", "AI_GENERATED", "SYNTHETIC", "FAKE"].includes(verdict) ? {
    status: "SUCCESS",
    verdict,
    score: confidence,
    scoreKind: "PROVIDER_SCORE",
    provider: "legacy_verification_layer2_image",
    providerScore: confidence,
    confidenceType: "PROVIDER_ASSESSMENT",
    reason,
    providers,
  } : null;
  const deepfake = selectedDeepfake ? {
    status: selectedDeepfake.success ? "SUCCESS" : "UNAVAILABLE",
    verdict: selectedDeepfake.verdict,
    score: selectedDeepfake.providerScore,
    scoreKind: "PROVIDER_SCORE",
    provider: selectedDeepfake.provider,
    providerScore: selectedDeepfake.providerScore,
    confidenceType: "PROVIDER_ASSESSMENT",
    reason: selectedDeepfake.message,
    providers: deepfakeProviders,
  } : null;
  return {
    version: "legacy-image-forensics-v1",
    status: "COMPLETED",
    summary: {
      riskLevel: ["LIKELY_AI_GENERATED", "FAKE", "DEEPFAKE"].includes(verdict) ? "HIGH" : "UNKNOWN",
      requiresHumanReview: true,
      disclaimer: "Legacy image provider observation; it does not override StudentHub policy.",
      primarySignals: [reason].filter(Boolean),
    },
    aiGeneration,
    deepfake,
    manipulation: null,
    metadata: null,
    provenance: null,
    providerAgreement: { status: "PROVIDER_REPORTED" },
  };
}

export function normalizeLegacyImageLayer2Payload(payload, { requestId, latencyMs = 0 } = {}) {
  const raw = unwrapPayload(payload);
  if (!raw) return { ok: false, code: "LEGACY_IMAGE_LAYER2_PAYLOAD_NOT_OBJECT" };
  const verdict = safeText(raw.verdict, 120).toUpperCase();
  if (!verdict) return { ok: false, code: "LEGACY_IMAGE_LAYER2_VERDICT_INVALID" };
  const confidence = optionalUnit(raw, "confidence");
  if (!confidence.ok) return confidence;
  const providers = imageProviderRecords(raw);
  return {
    ok: true,
    result: {
      status: "COMPLETED",
      providerStatus: "SUCCESS",
      providerId: "legacy_verification_layer2_image",
      requestId,
      latencyMs,
      rawVerdict: verdict,
      finding: verdict,
      assessmentConfidence: confidence.value,
      providerConfidence: confidence.value,
      reason: optionalText(raw.reason, 1_200),
      providers,
      providerResults: providers,
      // Kept for the server-only Layer 3 -> Layer 4 hand-off. The public
      // contract allowlist does not expose this internal provider payload.
      rawResponse: raw,
      mediaForensics: imageMediaForensics(raw, providers, confidence.value),
      sourceOrigin: "LAYER_2_IMAGE_FORENSICS",
      limitations: [
        "Image provider output is an advisory observation and does not replace StudentHub deterministic policy.",
        "Provider confidence is not a calibrated safety probability.",
      ],
    },
  };
}

function unavailableImageLayer2Result(requestId, status, code, latencyMs = 0) {
  return {
    status: "UNAVAILABLE",
    providerStatus: status,
    providerId: "legacy_verification_layer2_image",
    requestId,
    latencyMs,
    rawVerdict: null,
    finding: "UNKNOWN",
    assessmentConfidence: null,
    providerConfidence: null,
    reason: safeTransportMessage({ kind: status === "TIMEOUT" ? "timeout" : status === "NOT_CONFIGURED" ? "config" : "failure", code }),
    providers: [],
    providerResults: [],
    mediaForensics: null,
    sourceOrigin: "LAYER_2_IMAGE_FORENSICS",
    limitations: ["Legacy image Layer 2 is unavailable; canonical StudentHub checks continue."],
    errorCode: safeText(code, 160) || "LEGACY_IMAGE_LAYER2_UNAVAILABLE",
  };
}

function legacyLayer2ForRequest(value) {
  const result = asRecord(value);
  const rawResponse = asRecord(result.rawResponse);
  if (typeof rawResponse.verdict === "string") return rawResponse;
  // Direct /api/verify callers pass the friend's JSON response exactly as
  // returned by Layer 2. Preserve every field instead of rebuilding a
  // reduced compatibility object for the next friend layer.
  if (
    typeof result.verdict === "string"
    && !Object.hasOwn(result, "finding")
    && !Object.hasOwn(result, "rawVerdict")
    && !Object.hasOwn(result, "legacyIntegration")
  ) return result;
  const normalized = {
    // Accept both the internal legacy DTO and the flattened compatibility
    // projection. The orchestrator may retain either form after canonical
    // supplemental processing; neither may silently degrade to UNKNOWN.
    verdict: safeText(result.rawVerdict || result.finding || result.verdict, 120).toUpperCase() || "UNKNOWN",
    confidence: unit(result.assessmentConfidence ?? result.providerConfidence ?? result.confidence) ?? 0,
    reason: optionalText(result.reason || result.message, 1_200),
    providers: boundedArray(result.providers || result.results || result.providerResults || rawResponse.providers || rawResponse.results, 20),
  };
  return normalized;
}

const LEGACY_LAYER4_MODES = new Set(["user", "pro", "expert"]);

function legacyLayer4Mode(input) {
  const value = safeText(input?.mode || input?.metadata?.legacyLayer4Mode || input?.metadata?.layer4Mode, 40).toLowerCase();
  return LEGACY_LAYER4_MODES.has(value) ? value : "user";
}

function legacyLayer3ForLayer4(layer3Result, { preserveRaw = true } = {}) {
  const integration = asRecord(layer3Result?.legacyIntegration);
  // The friend's Layer 4 endpoint expects the exact Layer 3 response shape
  // returned by its own endpoint. Use the validated server-only payload when
  // available, while retaining the normalized projection for audit/UI use.
  const rawResponse = asRecord(integration.rawResponse);
  if (preserveRaw && typeof rawResponse.verdict === "string") return rawResponse;
  // The direct compatibility route receives the friend's raw Layer 3 JSON,
  // not the normalized internal DTO. Keep that exact payload for Layer 4.
  if (
    preserveRaw
    && typeof layer3Result?.verdict === "string"
    && !Object.hasOwn(layer3Result, "legacyIntegration")
    && !Object.hasOwn(layer3Result, "status")
  ) return layer3Result;
  const verdict = safeText(integration.rawVerdict || layer3Result?.verdict, 80).toUpperCase() || "UNKNOWN";
  const confidence = unit(integration.legacyAssessmentConfidence ?? layer3Result?.evidenceConfidence) ?? 0;
  const reason = optionalText(integration.reason, 1_200) || "Evidence requires further assessment.";
  const evidence = boundedArray(integration.evidence || layer3Result?.evidence, LEGACY_VERIFICATION_CONFIG.MAX_EVIDENCE)
    .map((item) => {
      const record = asRecord(item);
      const url = safeHttpUrl(record.sourceUrl || record.url);
      if (!url) return null;
      return {
        title: safeText(record.sourceTitle || record.title, 240) || "Legacy source observation",
        url,
        content: optionalText(record.excerpt || record.content || record.observation || record.summary, 4_000),
      };
    })
    .filter(Boolean);
  const sources = boundedArray(integration.sources || layer3Result?.sources, LEGACY_VERIFICATION_CONFIG.MAX_SOURCES)
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
  return {
    verdict,
    confidence,
    reason,
    stop: integration.stop === true,
    canContinueToLayer4: integration.canContinueToLayer4 !== false,
    evidence,
    sources,
  };
}

function missingLayer3Result(requestId, status, code, latencyMs = 0) {
  const result = createLayer3Result({
    status: LAYER_3_STATUS.PARTIAL,
    claims: [],
    sources: [],
    evidence: [],
    limitations: ["Legacy Layer 3 evidence is unavailable; no local or demo evidence was substituted."],
    requestId,
    retrievalStatus: status === "NOT_CONFIGURED" ? EVIDENCE_PROVIDER_STATUS.NOT_CONFIGURED : EVIDENCE_PROVIDER_STATUS.UNAVAILABLE,
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
      reason: safeTransportMessage({ kind: status === "TIMEOUT" ? "timeout" : "failure", code }),
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
  const confidence = optionalUnit(raw, "confidence");
  if (!confidence.ok) return confidence;
  const stop = optionalBoolean(raw, "stop");
  const continuation = optionalBoolean(raw, "canContinueToLayer4");
  if (!stop.ok) return stop;
  if (!continuation.ok) return continuation;
  if (stop.value === true && continuation.value === true) return { ok: false, code: "LEGACY_LAYER3_CONTINUATION_CONTRADICTION" };

  const normalizedClaims = normalizeClaims(claims);
  const sourceRecords = boundedArray(raw.sources, LEGACY_VERIFICATION_CONFIG.MAX_SOURCES)
    .map((source, index) => normalizeSource(source, index, "LAYER_3_WEB_EVIDENCE"))
    .filter(Boolean);
  const sourceMap = new Map(sourceRecords.map((source) => [source.sourceId, source]));
  const evidenceRecords = boundedArray(raw.evidence, LEGACY_VERIFICATION_CONFIG.MAX_EVIDENCE)
    .map((evidence, index) => normalizeEvidence(evidence, index, normalizedClaims, sourceMap, "LAYER_3_WEB_EVIDENCE"))
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
    retrievalStatus: EVIDENCE_PROVIDER_STATUS.SUCCESS,
    retrievalMode: "LEGACY_VERIFICATION",
    externalEvidence: validLiveEvidence,
    auditEvents: [{ type: "LEGACY_LAYER3_NORMALIZED", code: null, at: new Date().toISOString() }],
    metrics: {
      executionTimeMs: latencyMs,
      retrievalProvider: "legacy_verification_layer3",
      retrievalStatus: EVIDENCE_PROVIDER_STATUS.SUCCESS,
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
      status: "COMPLETED",
      providerStatus: EVIDENCE_PROVIDER_STATUS.SUCCESS,
      rawVerdict: verdict,
      legacyAssessmentConfidence: confidence.value,
      reason: optionalText(raw.reason, 1200),
      stop: stop.value === null ? false : stop.value,
      canContinueToLayer4,
      continuationDerived: continuation.value === null,
      evidenceAgreement: scalar(raw.evidenceAgreement ?? raw.sourceAgreement),
      sourceQuality: scalar(raw.sourceQuality),
      sourceOrigin: "LAYER_3_WEB_EVIDENCE",
      sourceCount: sourceRecords.length,
      evidenceCount: evidenceRecords.length,
      sources: sourceRecords,
      evidence: evidenceRecords,
      // Server-only exact provider payload for the friend's Layer 4 contract.
      // The public projection allowlist intentionally omits this field.
      rawResponse: raw,
    },
  };
  return { ok: true, result: markTrustedLayer3Result(enriched) };
}

export function normalizeLegacyLayer4Payload(payload, { requestId, latencyMs = 0 } = {}) {
  const raw = unwrapPayload(payload);
  if (!raw) return { ok: false, code: "LEGACY_LAYER4_PAYLOAD_NOT_OBJECT" };
  const verdict = safeText(raw.verdict, 80).toUpperCase();
  if (!LEGACY_LAYER4_VERDICTS.has(verdict)) return { ok: false, code: "LEGACY_LAYER4_VERDICT_INVALID" };
  const confidence = optionalUnit(raw, "confidence");
  if (!confidence.ok) return confidence;
  const stop = optionalBoolean(raw, "stop");
  const continuation = optionalBoolean(raw, "canContinueToLayer4");
  if (!stop.ok) return stop;
  if (!continuation.ok) return continuation;

  const sourceRecords = boundedArray(raw.sources, LEGACY_VERIFICATION_CONFIG.MAX_SOURCES)
    .map((source, index) => normalizeSource(source, index, "LAYER_4_INDEPENDENT_RESEARCH"))
    .filter(Boolean);
  const contradictoryEvidence = boundedArray(raw.contradictoryEvidence, 40).map((item) => {
    if (typeof item === "string") return safeText(item, 700);
    const record = asRecord(item);
    return optionalText(record.details || record.observation || record.claim || record.reason, 700);
  }).filter(Boolean);

  return {
    ok: true,
    result: {
      status: "COMPLETED",
      providerStatus: "SUCCESS",
      providerId: "legacy_verification_layer4",
      requestId,
      latencyMs,
      rawVerdict: verdict,
      assessmentConfidence: confidence.value,
      evidenceAgreement: scalar(raw.evidenceAgreement),
      sourceQuality: scalar(raw.sourceQuality),
      stop: stop.value === null ? false : stop.value,
      canContinueToLayer4: continuation.value,
      mode: optionalText(raw.mode, 80),
      geminiModel: optionalText(raw.geminiModel, 160),
      groqModel: optionalText(raw.groqModel, 160),
      reason: optionalText(raw.reason, 1200),
      contradictoryEvidence,
      sources: sourceRecords,
      sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
      // Keep the exact friend-backend response for the authoritative adapter
      // and the direct /api/verify compatibility route. This is server-side
      // hand-off data; the public Trust contract exposes it through the
      // friendBackend compatibility envelope, never as a policy substitute.
      rawResponse: raw,
      limitations: [
        "Confidence is the friend backend's reported assessment score, not a calibrated probability.",
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
  } = {}) {
    this.config = getLegacyVerificationConfig(env);
    this.fetchImpl = fetchImpl;
    this.clock = clock;
    this.resolveDns = typeof resolveDns === "boolean" ? resolveDns : this.config.resolveDns;
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
    };
  }

  layer2Provider() {
    return { providerId: "legacy_verification_layer2", check: (params) => this.verifyLayer2(params) };
  }

  async #post(path, body, requestId, signal, { maxRequestBytes = this.config.MAX_REQUEST_BYTES } = {}) {
    if (!this.config.enabled) return { kind: "config", code: this.config.configError || "LEGACY_BACKEND_NOT_CONFIGURED" };
    if (typeof this.fetchImpl !== "function") return { kind: "failure", code: "FETCH_UNAVAILABLE" };

    const bodyText = JSON.stringify(body);
    const bodyBytes = new TextEncoder().encode(bodyText).byteLength;
    if (bodyBytes > maxRequestBytes) return { kind: "invalid", code: "LEGACY_REQUEST_TOO_LARGE" };

    const baseValidation = this.resolveDns
      ? await validateRemoteUrl(this.config.baseUrl, { resolveDns: true, dnsTimeoutMs: this.config.DNS_TIMEOUT_MS })
      : validateRemoteUrlSync(this.config.baseUrl);
    if (!baseValidation.ok) return { kind: "config", code: baseValidation.code };

    const endpoint = `${this.config.baseUrl}${path}`;
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
        },
        body: bodyText,
      });
      if (!response?.ok) {
        return { kind: "http", status: Number(response?.status) || 0, latencyMs: this.clock() - startedAt };
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

  async #postMultipart(path, image, requestId, signal) {
    if (!this.config.enabled) return { kind: "config", code: this.config.configError || "LEGACY_BACKEND_NOT_CONFIGURED" };
    if (typeof this.fetchImpl !== "function") return { kind: "failure", code: "FETCH_UNAVAILABLE" };
    if (typeof FormData !== "function" || typeof Blob !== "function") return { kind: "failure", code: "MULTIPART_UNAVAILABLE" };
    if (!image?.bytes || image.bytes.length > this.config.MAX_IMAGE_BYTES) return { kind: "invalid", code: "LEGACY_IMAGE_TOO_LARGE" };

    const baseValidation = this.resolveDns
      ? await validateRemoteUrl(this.config.baseUrl, { resolveDns: true, dnsTimeoutMs: this.config.DNS_TIMEOUT_MS })
      : validateRemoteUrlSync(this.config.baseUrl);
    if (!baseValidation.ok) return { kind: "config", code: baseValidation.code };

    const form = new FormData();
    form.append("image", new Blob([image.bytes], { type: image.contentType }), image.fileName || "image");
    const endpoint = `${this.config.baseUrl}${path}`;
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
          "X-Request-ID": requestId,
        },
        body: form,
      });
      if (!response?.ok) return { kind: "http", status: Number(response?.status) || 0, latencyMs: this.clock() - startedAt };
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

  async verifyLayer2({ url = "", input = null, requestId = null, signal, exactContract = false } = {}) {
    const id = requestIdFor(requestId);
    const inputType = safeText(input?.type, 40).toLowerCase();
    if (["image", "qr"].includes(inputType)) {
      const image = imageBytesForInput(input);
      if (!image.ok) return unavailableImageLayer2Result(id, "INVALID_INPUT", image.code);
      const response = await this.#postMultipart(this.config.ENDPOINTS.layer2Image, image, id, signal);
      if (response.kind !== "ok") return unavailableImageLayer2Result(id, statusForTransport(response), response.code || `LEGACY_IMAGE_LAYER2_HTTP_${response.status || 0}`, response.latencyMs || 0);
      const normalized = normalizeLegacyImageLayer2Payload(response.payload, { requestId: id, latencyMs: response.latencyMs || 0 });
      if (!normalized.ok) return unavailableImageLayer2Result(id, "INVALID_RESPONSE", normalized.code, response.latencyMs || 0);
      return normalized.result;
    }
    if (input && inputType === "text") {
      const content = safeText(input.content, this.config.MAX_CONTENT_CHARS);
      if (!content) {
        return createLayer2AResult({
          provider: "legacy_verification_layer2",
          providerStatus: LAYER_2A_PROVIDER_STATUS.INVALID_INPUT,
          finding: LAYER_2A_FINDING.UNKNOWN,
          requestId: id,
          errorCode: "LEGACY_LAYER2_TEXT_INPUT_INVALID",
        });
      }
      const response = await this.#post(
        this.config.ENDPOINTS.layer2,
        exactContract ? { type: "text", content } : { type: "text", content, requestId: id },
        id,
        signal,
      );
      if (response.kind !== "ok") {
        const providerStatus = response.kind === "timeout"
          ? LAYER_2A_PROVIDER_STATUS.TIMEOUT
          : response.kind === "http" && response.status === 429
            ? LAYER_2A_PROVIDER_STATUS.RATE_LIMITED
            : response.kind === "invalid"
              ? LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE
              : response.kind === "config"
                ? LAYER_2A_PROVIDER_STATUS.NOT_CONFIGURED
                : LAYER_2A_PROVIDER_STATUS.UNAVAILABLE;
        return createLayer2AResult({
          provider: "legacy_verification_layer2",
          providerStatus,
          finding: LAYER_2A_FINDING.UNKNOWN,
          requestId: id,
          latencyMs: response.latencyMs || 0,
          errorCode: response.code || `LEGACY_LAYER2_TEXT_HTTP_${response.status || 0}`,
          message: "Legacy text Layer 2 is not available for this run.",
        });
      }
      const rawPayload = unwrapPayload(response.payload);
      const normalized = normalizeLayer2AProviderPayload(rawPayload);
      if (!normalized.ok) return invalidLayer2Result(id, normalized.code, response.latencyMs || 0);
      return {
        ...createLayer2AResult({
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
        targetFingerprint: fingerprint(content),
        }),
        rawResponse: rawPayload,
      };
    }
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
    const response = await this.#post(
      this.config.ENDPOINTS.layer2,
      exactContract ? { type: "url", content: disclosedUrl } : { type: "url", content: disclosedUrl, requestId: id },
      id,
      signal,
    );
    if (response.kind !== "ok") {
      const providerStatus = response.kind === "timeout"
        ? LAYER_2A_PROVIDER_STATUS.TIMEOUT
        : response.kind === "http" && response.status === 429
          ? LAYER_2A_PROVIDER_STATUS.RATE_LIMITED
          : response.kind === "invalid"
            ? LAYER_2A_PROVIDER_STATUS.INVALID_RESPONSE
            : response.kind === "config"
              ? LAYER_2A_PROVIDER_STATUS.NOT_CONFIGURED
              : LAYER_2A_PROVIDER_STATUS.UNAVAILABLE;
      return createLayer2AResult({ provider: "legacy_verification_layer2", providerStatus, finding: LAYER_2A_FINDING.UNKNOWN, requestId: id, latencyMs: response.latencyMs || 0, errorCode: response.code || `LEGACY_LAYER2_HTTP_${response.status || 0}`, message: "Legacy Layer 2 is not available for this run." });
    }
    const rawPayload = unwrapPayload(response.payload);
    const normalized = normalizeLayer2AProviderPayload(rawPayload);
    if (!normalized.ok) return invalidLayer2Result(id, normalized.code, response.latencyMs || 0);
    return {
      ...createLayer2AResult({
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
      }),
      rawResponse: rawPayload,
    };
  }

  async verifyLayer3({ input = {}, claims = [], candidateSources = [], layer2Result = null, layer2CResult = null, legacyLayer2Result = null, requestId = null, signal, exactContract = false } = {}) {
    const id = requestIdFor(requestId);
    const type = safeText(input.type, 40).toLowerCase() || "text";
    if (["image", "qr"].includes(type)) {
      const image = imageBytesForInput(input);
      if (!image.ok) return missingLayer3Result(id, "INVALID_INPUT", image.code);
      const payload = {
        imageBase64: image.base64,
        contentType: image.contentType,
        layer2: legacyLayer2ForRequest(legacyLayer2Result),
      };
      const response = await this.#post(this.config.ENDPOINTS.layer3Image, payload, id, signal, { maxRequestBytes: this.config.MAX_IMAGE_REQUEST_BYTES });
      if (response.kind !== "ok") return missingLayer3Result(id, statusForTransport(response), response.code || `LEGACY_IMAGE_LAYER3_HTTP_${response.status || 0}`, response.latencyMs || 0);
      const normalized = normalizeLegacyLayer3Payload(response.payload, { claims, requestId: id, latencyMs: response.latencyMs || 0 });
      if (!normalized.ok) return missingLayer3Result(id, "INVALID_RESPONSE", normalized.code, response.latencyMs || 0);
      return normalized.result;
    }
    const payload = exactContract
      ? {
          type,
          content: safeText(input.content, this.config.MAX_CONTENT_CHARS),
          layer2: legacyLayer2ForRequest(legacyLayer2Result || layer2Result),
        }
      : {
          requestId: id,
          type,
          content: safeText(input.content, this.config.MAX_CONTENT_CHARS),
          layer2: legacyLayer2ForRequest(legacyLayer2Result || layer2Result),
          claims: normalizeClaims(claims),
          candidateSources: boundedArray(candidateSources, 40).map((item) => {
            const record = asRecord(item);
            return { id: safeText(record.id || record.sourceId, 160) || null, url: safeHttpUrl(record.url), title: safeText(record.title, 240) || null };
          }),
          layer2Result: { status: safeText(layer2Result?.status, 80) || null, finding: safeText(layer2Result?.finding, 80) || null },
          layer2CResult: { classification: safeText(layer2CResult?.classification, 120) || null },
        };
    let response = await this.#post(this.config.ENDPOINTS.layer3, payload, id, signal);
    // The supplied ASP.NET DTO version declares only Type + Content for the
    // text Layer 3 request, while the deployed PowerShell contract forwards
    // Layer 2 as well. Try the proven PowerShell shape first, then retry the
    // DTO-minimal shape only when the friend backend rejects the extra field.
    if (response.kind === "http" && response.status === 400 && exactContract && Object.hasOwn(payload, "layer2")) {
      response = await this.#post(
        this.config.ENDPOINTS.layer3,
        { type: payload.type, content: payload.content },
        id,
        signal,
      );
    }
    if (response.kind !== "ok") return missingLayer3Result(id, statusForTransport(response), response.code || safeTransportMessage(response), response.latencyMs || 0);
    const normalized = normalizeLegacyLayer3Payload(response.payload, { claims, requestId: id, latencyMs: response.latencyMs || 0 });
    if (!normalized.ok) return missingLayer3Result(id, "INVALID_RESPONSE", normalized.code, response.latencyMs || 0);
    return normalized.result;
  }

  async verifyLayer4({ input = {}, layer3Result = null, legacyLayer2Result = null, requestId = null, signal, exactContract = false } = {}) {
    const id = requestIdFor(requestId);
    const type = safeText(input.type, 40).toLowerCase() || "text";
    const content = safeText(input.content, this.config.MAX_CONTENT_CHARS);
    if (["image", "qr"].includes(type)) {
      const image = imageBytesForInput(input);
      const layer3 = legacyLayer3ForLayer4(layer3Result);
      if (!image.ok) {
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
          reason: "Legacy image Layer 4 input did not match the approved contract.",
          contradictoryEvidence: [],
          sources: [],
          sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
          limitations: ["Invalid image input was discarded and did not affect the deterministic policy."],
          errorCode: image.code,
        };
      }
      const payload = {
        imageBase64: image.base64,
        contentType: image.contentType,
        mode: legacyLayer4Mode(input),
        layer2: legacyLayer2ForRequest(legacyLayer2Result),
        layer3,
      };
      let response = await this.#post(this.config.ENDPOINTS.layer4Image, payload, id, signal, { maxRequestBytes: this.config.MAX_IMAGE_REQUEST_BYTES });
      // A few deployed versions of the friend's image Layer 4 validator
      // reject a provider response when it contains an optional field they do
      // not recognize. Retry once with the validated compact contract; this
      // keeps the provider result usable without substituting local/demo data.
      if (response.kind === "http" && response.status === 400 && asRecord(layer3Result?.legacyIntegration).rawResponse) {
        const compactLayer3 = legacyLayer3ForLayer4(layer3Result, { preserveRaw: false });
        response = await this.#post(this.config.ENDPOINTS.layer4Image, { ...payload, layer3: compactLayer3 }, id, signal, { maxRequestBytes: this.config.MAX_IMAGE_REQUEST_BYTES });
      }
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
          limitations: ["Legacy image Layer 4 synthesis is unavailable; deterministic StudentHub policy remains authoritative."],
          errorCode: safeText(response.code || `LEGACY_IMAGE_LAYER4_HTTP_${response.status || 0}`, 120),
        };
      }
      const normalized = normalizeLegacyLayer4Payload(response.payload, { requestId: id, latencyMs: response.latencyMs || 0 });
      if (!normalized.ok) {
        return {
          status: "UNAVAILABLE",
          providerStatus: "INVALID_RESPONSE",
          providerId: "legacy_verification_layer4",
          requestId: id,
          latencyMs: response.latencyMs || 0,
          rawVerdict: null,
          assessmentConfidence: null,
          evidenceAgreement: null,
          sourceQuality: null,
          stop: true,
          canContinueToLayer4: false,
          reason: "Legacy image Layer 4 response did not match the approved contract.",
          contradictoryEvidence: [],
          sources: [],
          sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
          limitations: ["Malformed legacy image synthesis was discarded and did not affect the deterministic policy."],
          errorCode: normalized.code,
        };
      }
      return normalized.result;
    }
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
    const payload = exactContract
      ? { type, content, mode: legacyLayer4Mode(input), layer3 }
      : {
          type,
          content,
          mode: legacyLayer4Mode(input),
          layer2: legacyLayer2ForRequest(legacyLayer2Result),
          layer3,
        };
    let response = await this.#post(this.config.ENDPOINTS.layer4, payload, id, signal);
    if (response.kind === "http" && response.status === 400 && asRecord(layer3Result?.legacyIntegration).rawResponse) {
      const compactLayer3 = legacyLayer3ForLayer4(layer3Result, { preserveRaw: false });
      response = await this.#post(this.config.ENDPOINTS.layer4, { ...payload, layer3: compactLayer3 }, id, signal);
    }
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
    const normalized = normalizeLegacyLayer4Payload(response.payload, { requestId: id, latencyMs: response.latencyMs || 0 });
    if (!normalized.ok) {
      return {
        status: "UNAVAILABLE",
        providerStatus: "INVALID_RESPONSE",
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
        errorCode: normalized.code,
      };
    }
    return normalized.result;
  }
}

export function createLegacyVerificationAdapter(options) {
  return new LegacyVerificationAdapter(options);
}

export { LEGACY_LAYER2_VERDICTS, LEGACY_LAYER3_VERDICTS, LEGACY_LAYER4_VERDICTS };
