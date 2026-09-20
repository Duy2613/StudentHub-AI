/**
 * Compatibility response projection for the historical four-layer API.
 *
 * The canonical pipeline remains authoritative.  This module only reshapes
 * its already validated observations into the response shape used by the
 * older curl/backend sample:
 *   verdict, confidence, reason, providers, evidence, sources
 *
 * It deliberately never invents a URL.  A URL is emitted only when it is an
 * HTTP(S) URL present in a validated source, evidence item, or validated AI
 * citation.  Provider score and deterministic decision confidence are kept
 * separate so a media detector score cannot silently become claim truth.
 */

import { validateRemoteUrlSync } from "../../security/hardening/SafeRemoteUrl.js";

const MAX_TEXT_LENGTH = 500_000;
const MAX_URL_LENGTH = 4_096;

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function text(value, maxLength = MAX_TEXT_LENGTH) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .trim()
    .slice(0, maxLength);
}

function httpUrl(value) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value.trim())) return null;
  const guard = validateRemoteUrlSync(value.trim());
  if (!guard.ok) return null;
  try {
    const parsed = new URL(guard.url);
    if (!["http:", "https:"].includes(parsed.protocol) || !parsed.hostname) return null;
    return parsed.toString().slice(0, MAX_URL_LENGTH);
  } catch {
    return null;
  }
}

function numberOrNull(...values) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return Math.max(0, Math.min(1, number));
  }
  return null;
}

function providerSuccess(record) {
  if (record?.success === true) return true;
  const status = String(record?.status || record?.providerStatus || "").toUpperCase();
  return ["SUCCESS", "COMPLETED", "REACHABLE", "VERIFIED", "LIVE"].includes(status);
}

function sourceUrl(record) {
  const value = asRecord(record);
  return httpUrl(value.url || value.sourceUrl || value.requestedUrl || value.link);
}

function sourceTitle(record, fallback = "Evidence source") {
  const value = asRecord(record);
  return text(value.title || value.sourceTitle || value.publisher || value.domain || value.sourceId, 500) || fallback;
}

function contentForEvidence(record) {
  const value = asRecord(record);
  return text(value.content || value.excerpt || value.relevantSnippet || value.summary || value.description, MAX_TEXT_LENGTH);
}

function collectSourceRecords(...groups) {
  const seen = new Set();
  const output = [];
  for (const group of groups) {
    for (const item of asArray(group)) {
      const url = sourceUrl(item);
      if (!url) continue;
      const key = url.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      output.push({
        title: sourceTitle(item, `Evidence source ${output.length + 1}`),
        url,
      });
    }
  }
  return output;
}

function collectEvidenceRecords(evidenceItems, sources) {
  const output = [];
  const seen = new Set();
  const evidenceUrls = new Set();
  const sourceByKey = new Map();
  for (const source of asArray(sources)) {
    const key = sourceUrl(source);
    if (key) sourceByKey.set(key.toLowerCase(), source);
  }

  for (const item of asArray(evidenceItems)) {
    const record = asRecord(item);
    const url = sourceUrl(record) || sourceUrl(sourceByKey.get(String(record.sourceUrl || record.url || "").toLowerCase()));
    if (!url) continue;
    evidenceUrls.add(url.toLowerCase());
    const key = `${url.toLowerCase()}|${text(record.evidenceId || record.sourceId || record.claimId, 200)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      title: sourceTitle(record, sourceByKey.get(url.toLowerCase())?.title || `Evidence source ${output.length + 1}`),
      url,
      content: contentForEvidence(record),
    });
  }

  // The older API exposed every source in both `evidence` and `sources`.
  // Preserve source-only records too, even when no claim-specific excerpt was
  // produced (for example an image/contextual search result).
  for (const source of asArray(sources)) {
    const url = sourceUrl(source);
    if (!url) continue;
    if (evidenceUrls.has(url.toLowerCase())) continue;
    const key = `${url.toLowerCase()}|`;
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      title: sourceTitle(source, `Evidence source ${output.length + 1}`),
      url,
      content: contentForEvidence(source),
    });
  }
  return output;
}

function providerRecord(record, fallbackProvider = "StudentHub provider") {
  const value = asRecord(record);
  const verdict = text(value.verdict || value.finding || value.classification || value.status, 120) || "UNKNOWN";
  const confidence = numberOrNull(value.confidence, value.providerScore, value.calibratedConfidence, value.score);
  return {
    provider: text(value.provider || value.providerId || fallbackProvider, 180) || fallbackProvider,
    success: providerSuccess(value),
    verdict,
    ...(confidence === null ? {} : { confidence }),
    message: text(value.message || value.humanExplanation || value.reason || value.details, 1_200) || "Provider returned no message.",
  };
}

function mediaProviderRecords(media) {
  const value = asRecord(media);
  const output = [];
  for (const item of asArray(value.aiGeneration?.providers)) {
    output.push(providerRecord({
      ...item,
      provider: item?.provider ? `${item.provider} GenAI` : "Sightengine GenAI",
      confidence: item?.providerScore ?? item?.confidence,
      message: item?.message || (item?.providerScore != null ? `AI-generated score: ${Number(item.providerScore).toFixed(3)}` : null),
    }, "Sightengine GenAI"));
  }
  if (!output.length && value.aiGeneration && value.aiGeneration.status !== "NOT_CONFIGURED") {
    output.push(providerRecord({
      provider: "Sightengine GenAI",
      status: value.aiGeneration.status,
      verdict: value.aiGeneration.verdict,
      providerScore: value.aiGeneration.providerScore,
      reason: value.aiGeneration.reason,
    }, "Sightengine GenAI"));
  }
  for (const item of asArray(value.deepfake?.providers)) {
    output.push(providerRecord({
      ...item,
      provider: item?.provider ? `${item.provider} Deepfake` : "Sightengine Deepfake",
      confidence: item?.confidence ?? (item?.providerScore == null ? null : 1 - Number(item.providerScore)),
      message: item?.message || (item?.providerScore != null ? `Deepfake score: ${Number(item.providerScore).toFixed(3)}` : null),
    }, "Sightengine Deepfake"));
  }
  if (!value.deepfake?.providers?.length && value.deepfake && value.deepfake.status !== "NOT_CONFIGURED") {
    const score = Number(value.deepfake.providerScore);
    output.push(providerRecord({
      provider: "Sightengine Deepfake",
      status: value.deepfake.status,
      verdict: value.deepfake.verdict,
      confidence: Number.isFinite(score) ? 1 - score : null,
      reason: value.deepfake.reason,
    }, "Sightengine Deepfake"));
  }
  return output;
}

function genericProviderRecords(layer2) {
  const value = asRecord(layer2);
  return asArray(value.providerObservations || value.providers || value.providerResults)
    .map((item) => providerRecord(item, "StudentHub Layer 2"));
}

function publicQrIntake(value) {
  const intake = asRecord(value);
  if (!Object.keys(intake).length) return null;
  return {
    inputType: text(intake.inputType, 40) || null,
    decodedType: text(intake.decodedType, 80) || null,
    decodedValue: text(intake.decodedValue, MAX_TEXT_LENGTH) || null,
    normalizedValue: text(intake.normalizedValue, MAX_TEXT_LENGTH) || null,
    securityStatus: text(intake.securityStatus, 80) || null,
    ssrfStatus: text(intake.ssrfStatus, 80) || null,
    autoNavigation: text(intake.autoNavigation, 40) || null,
    selectedRoute: text(intake.selectedRoute, 120) || null,
    warnings: asArray(intake.warnings).map((item) => text(item, 1_200)).filter(Boolean),
    signals: asArray(intake.signals),
  };
}

function publicInputMetadata(input) {
  const source = asRecord(input);
  const metadata = asRecord(source.metadata);
  const requestedUrl = metadata.url || (String(source.type || "").toLowerCase() === "url" ? source.content : "");
  return {
    url: httpUrl(requestedUrl),
    ocrText: text(metadata.ocrText, MAX_TEXT_LENGTH) || null,
    qrContent: text(metadata.qrContent || metadata.qrPayload, MAX_TEXT_LENGTH) || null,
    qrIntake: publicQrIntake(metadata.qrIntake),
    mimeType: text(metadata.mimeType, 120) || null,
    fileName: text(metadata.fileName, 2_048) || null,
    inputKind: text(metadata.inputKind, 80) || null,
    mediaArtifactId: text(metadata.mediaArtifactId, 180) || null,
    imageHash: text(metadata.imageHash, 180) || null,
    width: Number.isFinite(Number(metadata.width)) ? Number(metadata.width) : null,
    height: Number.isFinite(Number(metadata.height)) ? Number(metadata.height) : null,
  };
}

function mediaForensicsFrom(...layers) {
  for (const layer of layers) {
    const value = asRecord(layer);
    if (value.mediaForensics && typeof value.mediaForensics === "object") return value.mediaForensics;
  }
  return null;
}

function legacyLayer1(layer1) {
  const value = asRecord(layer1);
  const blocked = value.status === "BLOCK" || value.finding === "LOCAL_BLOCK";
  const signals = asArray(value.signals || value.reasons);
  const confidence = numberOrNull(value.confidence, value.metrics?.confidence) ?? 0;
  return {
    verdict: blocked ? "BLOCK" : value.status === "UNKNOWN" ? "UNKNOWN" : "PASS",
    confidence,
    reason: text(value.details?.decisionRationale || value.reason || signals[0]?.details || signals[0], 1_200) || "Layer 1 deterministic screen completed.",
    providers: [],
    signals,
  };
}

function legacyLayer2(layer2, layer2A, input) {
  const value = asRecord(layer2);
  const media = mediaForensicsFrom(value, layer2A);
  const mediaProviders = mediaProviderRecords(media);
  const providers = [...mediaProviders, ...genericProviderRecords(layer2A), ...genericProviderRecords(value)];
  const mediaVerdict = text(media?.aiGeneration?.verdict, 120);
  const mediaConfidence = numberOrNull(media?.aiGeneration?.providerScore, media?.aiGeneration?.calibratedConfidence);
  const verdict = mediaVerdict && mediaVerdict !== "UNKNOWN"
    ? mediaVerdict
    : text(value.finding || value.classification || value.status, 120) || "UNKNOWN";
  const confidence = mediaConfidence ?? numberOrNull(value.confidence, value.providerConfidence) ?? 0;
  const reasons = [
    media?.aiGeneration?.reason,
    ...(asArray(media?.summary?.primarySignals)),
    value.semanticSummary,
    value.conclusion,
    value.reason,
  ].map((item) => text(item, 1_200)).filter(Boolean);
  const metadata = asRecord(input?.metadata);
  return {
    verdict,
    confidence,
    reason: reasons[0] || "Layer 2 completed without a provider explanation.",
    providers,
    ...(media ? {
      mediaForensics: media,
      aiGeneration: media.aiGeneration || null,
      deepfake: media.deepfake || null,
      ocr: media.ocr || null,
      qrContent: text(metadata.qrContent || metadata.qrPayload || input?.content, MAX_TEXT_LENGTH) || null,
    } : {}),
    claims: asArray(value.claims),
    entities: asArray(value.entities),
  };
}

function legacyLayer3(layer3, layer2) {
  const value = asRecord(layer3);
  const layer2Value = asRecord(layer2);
  const media = mediaForensicsFrom(layer2Value);
  const sources = collectSourceRecords(
    value.sources,
    value.verifiedSources,
    value.evidence,
    Array.isArray(media?.visibleUrls)
      ? media.visibleUrls.map((url) => ({ title: "Visible URL from image", url }))
      : [],
  );
  const evidence = collectEvidenceRecords(value.evidence, sources);
  const rawStatus = String(value.status || value.finding || "").toUpperCase();
  const verdict = rawStatus === "SUPPORTED" || rawStatus === "TRUE" ? "TRUE"
    : rawStatus === "CONTRADICTED" || rawStatus === "FALSE" ? "FALSE"
      : rawStatus === "MIXED" ? "MIXED" : "UNKNOWN";
  const confidence = numberOrNull(value.evidenceConfidence, value.verificationCompleteness, value.confidence) ?? 0;
  const canContinueToLayer4 = value.canContinueToLayer4 !== false && !["UNAVAILABLE", "FAILED", "BLOCKED"].includes(rawStatus);
  const reason = text(value.evidenceSummary || value.reason, MAX_TEXT_LENGTH)
    || `Layer 3 collected ${sources.length} web source(s) and ${evidence.length} evidence item(s).`;
  return {
    verdict,
    confidence,
    stop: !canContinueToLayer4,
    canContinueToLayer4,
    reason,
    evidence,
    sources,
    evidenceAgreement: value.crossSourceAgreement?.agreementScore ?? value.evidenceAgreement ?? null,
    sourceQuality: numberOrNull(value.sourceQuality),
    ...(media ? { mediaForensics: media } : {}),
  };
}

function legacyLayer4(layer4, layer3, layer2, finalPredict) {
  const value = asRecord(layer4);
  const predict = asRecord(finalPredict);
  const media = mediaForensicsFrom(layer2);
  const aiGenerated = String(media?.aiGeneration?.verdict || "").toUpperCase() === "LIKELY_AI_GENERATED";
  const truthStatus = String(value.truthStatus || value.truthAssessment?.status || predict.truthStatus || "").toUpperCase();
  const security = String(value.securityClassification || predict.securityClassification || "").toUpperCase();
  const verdict = aiGenerated ? "FAKE"
    : truthStatus === "SUPPORTED" ? "TRUE"
      : truthStatus === "CONTRADICTED" ? "FAKE"
        : security === "MALICIOUS" ? "DANGEROUS"
          : security === "SUSPICIOUS" || security === "HIGH" ? "SUSPICIOUS" : "UNKNOWN";
  const policyConfidence = numberOrNull(value.decisionConfidence, predict.decisionConfidence, predict.confidence);
  const forensicConfidence = numberOrNull(media?.aiGeneration?.providerScore, media?.aiGeneration?.calibratedConfidence);
  const confidence = aiGenerated ? (forensicConfidence ?? policyConfidence ?? 0) : (policyConfidence ?? 0);
  const stop = value.enforcement === "BLOCK" || value.recommendedAction === "BLOCK" || predict.action === "BLOCK" || security === "MALICIOUS";
  const sources = collectSourceRecords(
    asRecord(layer3).sources,
    value.sources,
    value.independentResearchSources,
    predict.sources,
    predict.keySources,
    value.aiVerification?.citationsUsed,
  );
  const contradictoryEvidence = [
    ...asArray(value.contradictoryEvidence),
    ...asArray(value.conflicts),
    ...asArray(value.aiVerification?.contradictionReasons),
  ].map((item) => text(typeof item === "string" ? item : item?.details || item?.reason || item?.message, 1_200)).filter(Boolean);
  const reason = text(value.userExplanation?.why || value.reason || predict.reason, MAX_TEXT_LENGTH)
    || (aiGenerated ? text(media?.aiGeneration?.reason, MAX_TEXT_LENGTH) : "Layer 4 chưa công bố kết luận đủ tin cậy.");
  const evidenceAgreement = value.evidenceAgreement ?? predict.evidenceAgreement ?? asRecord(layer3).crossSourceAgreement?.agreementScore ?? null;
  return {
    verdict,
    confidence,
    evidenceAgreement,
    sourceQuality: numberOrNull(value.sourceQuality, predict.sourceQuality),
    stop,
    canContinueToLayer4: !stop,
    mode: "user",
    geminiModel: text(value.aiExecutedModel || value.aiVerification?.model, 180) || null,
    groqModel: null,
    reason,
    contradictoryEvidence,
    sources,
    confidenceKind: aiGenerated ? "PROVIDER_SCORE_FOR_MEDIA_SIGNAL" : (value.confidenceKind || predict.confidenceKind || "DETERMINISTIC_POLICY_SCORE"),
    decisionConfidence: policyConfidence,
    aiGenerated,
    aiGenerationConfidence: forensicConfidence,
    ...(media ? {
      mediaForensics: media,
      aiGeneration: media.aiGeneration || null,
      deepfake: media.deepfake || null,
    } : {}),
  };
}

export function buildLegacyPipelineResponse({ input = {}, layerResults = {}, finalPredict = null } = {}) {
  const safeInput = asRecord(input);
  const layers = asRecord(layerResults);
  const layer1 = layers.layer1 || null;
  const layer2 = layers.layer2 || layers.layer2B || null;
  const layer2A = layers.layer2A || null;
  const layer3 = layers.layer3 || null;
  const layer4 = layers.layer4 || null;
  return {
    input: {
      type: text(safeInput.type, 40) || "text",
      content: text(safeInput.content, MAX_TEXT_LENGTH),
      metadata: publicInputMetadata(safeInput),
    },
    layer1: legacyLayer1(layer1),
    layer2: legacyLayer2(layer2, layer2A, safeInput),
    layer3: legacyLayer3(layer3, layer2),
    layer4: legacyLayer4(layer4, layer3, layer2, finalPredict),
  };
}

export function buildLegacyLayerResponse(layerId, context = {}) {
  const response = buildLegacyPipelineResponse(context);
  return response[`layer${String(layerId).replace(/^layer/i, "")}`] || response.layer4;
}
