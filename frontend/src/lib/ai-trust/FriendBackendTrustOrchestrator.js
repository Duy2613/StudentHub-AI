/**
 * Friend-backend-authoritative four-layer pipeline.
 *
 * This module deliberately does not call StudentHub's semantic, evidence or
 * policy services. Layer 1 is the small local input check from the friend's
 * PowerShell script; Layers 2-4 are executed sequentially by the friend
 * adapter and their raw JSON responses remain the authoritative result.
 */

import { createSecureId } from "../security/secureId.js";
import { createLegacyVerificationAdapter } from "./integrations/legacyVerification/LegacyVerificationAdapter.js";
import { tryFriendBackendTavilyFallback } from "./integrations/legacyVerification/FriendBackendTavilyFallback.js";
import { TrustPipelineCancelledError } from "./v5/TrustPipelineOrchestrator.js";
import {
  createInitialPipeline,
  createStageEnvelope,
  FOUR_LAYER_MODEL,
  FOUR_LAYER_PIPELINE_VERSION,
  OPERATION_STATUS,
  PIPELINE_STATUS,
  toPublicPipelineResult,
} from "./v5/contracts.js";

const FRIEND_L1_MAX_CHARS = 10_000;
const FRIEND_ENDPOINT_SEQUENCE = Object.freeze([
  "/api/verify/layer2",
  "/api/verify/layer3",
  "/api/verify/layer4",
]);

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asRecord(value) {
  return isRecord(value) ? value : {};
}

function boundedText(value, max = 1_200) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, max)
    : "";
}

function cloneSafe(value) {
  if (value === undefined) return undefined;
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return null;
  }
}

function nowIso() {
  return new Date().toISOString();
}

function normalizedInput(rawInput = {}) {
  const type = boundedText(rawInput?.type, 40).toLowerCase() || "text";
  const metadata = isRecord(rawInput?.metadata) ? rawInput.metadata : {};
  return {
    ...rawInput,
    type,
    content: typeof rawInput?.content === "string" ? rawInput.content.trim() : "",
    metadata,
  };
}

function hasImageInput(input) {
  return Boolean(
    input?.metadata?.mediaArtifactId
    || input?.metadata?.bytes
    || (typeof input?.content === "string" && /^data:image\//i.test(input.content)),
  );
}

function friendLayer1(input) {
  const isImage = ["image", "qr"].includes(input.type);
  const contentValid = isImage
    ? hasImageInput(input)
    : Boolean(input.content) && input.content.length <= FRIEND_L1_MAX_CHARS;
  const reason = contentValid
    ? "Frontend validation passed."
    : !input.content && !isImage
      ? "Content is empty."
      : "Content is too long or image input is missing.";
  return {
    status: contentValid ? "PASS" : "FAIL",
    reason,
    checks: [
      { check: "content_required", status: input.content || isImage ? "PASS" : "FAIL" },
      { check: "content_length_or_image_present", status: contentValid ? "PASS" : "FAIL" },
    ],
    source: "FRONTEND_VALIDATION",
  };
}

function rawLayer2(result) {
  const raw = asRecord(result?.rawResponse);
  return typeof raw.verdict === "string" ? raw : null;
}

function rawLayer3(result) {
  const raw = asRecord(result?.legacyIntegration?.rawResponse);
  return typeof raw.verdict === "string" ? raw : null;
}

function rawLayer4(result) {
  const raw = asRecord(result?.rawResponse);
  return typeof raw.verdict === "string" ? raw : null;
}

function confidenceOf(raw, normalized) {
  const value = raw?.confidence ?? normalized?.assessmentConfidence ?? normalized?.providerConfidence;
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1 ? value : null;
}

function verdictOf(raw, normalized) {
  return boundedText(raw?.verdict || normalized?.rawVerdict || normalized?.finding, 120).toUpperCase() || "UNKNOWN";
}

function friendProviderStatus(normalized, raw) {
  const explicit = boundedText(
    raw?.providerStatus
      || normalized?.legacyIntegration?.providerStatus
      || normalized?.providerStatus
      || normalized?.status,
    80,
  ).toUpperCase();
  if (explicit && explicit !== "COMPLETED" && explicit !== "SUCCESS") return explicit;
  if (raw) return "SUCCESS";
  return explicit || boundedText(
    normalized?.legacyIntegration?.providerStatus
      || normalized?.providerStatus
      || normalized?.status,
    80,
  ).toUpperCase() || "UNAVAILABLE";
}

function actionFor(verdict, raw) {
  if (raw?.stop === true || ["DANGEROUS", "MALICIOUS"].includes(verdict)) return "BLOCK";
  if (["SAFE", "TRUE", "SUPPORTED"].includes(verdict)) return "ALLOW_WITH_CAUTION";
  return "REVIEW";
}

function l2Finding(verdict) {
  if (["DANGEROUS", "THREAT_MATCH", "MALICIOUS"].includes(verdict)) return "THREAT_MATCH";
  if (["SAFE", "NO_KNOWN_THREAT"].includes(verdict)) return "NO_KNOWN_THREAT";
  if (["LIKELY_AI_GENERATED", "AI_GENERATED", "SYNTHETIC", "FAKE"].includes(verdict)) return "MANIPULATION_DETECTED";
  return "UNKNOWN";
}

function l3Finding(verdict) {
  if (["TRUE", "SUPPORTED"].includes(verdict)) return "SUPPORTED";
  if (["FALSE", "CONTRADICTED"].includes(verdict)) return "CONTRADICTED";
  if (verdict === "MIXED") return "MIXED";
  if (["UNAVAILABLE", "ERROR"].includes(verdict)) return "UNAVAILABLE";
  return "INSUFFICIENT";
}

function l4Finding(verdict) {
  if (["DANGEROUS", "MALICIOUS", "FAKE"].includes(verdict)) return "MALICIOUS";
  if (["SUSPICIOUS"].includes(verdict)) return "SUSPICIOUS";
  if (["SAFE"].includes(verdict)) return "SAFE";
  if (["NO_KNOWN_THREAT"].includes(verdict)) return "NO_KNOWN_THREAT";
  return "UNKNOWN";
}

function rawSources(raw, normalized) {
  return Array.isArray(raw?.sources) ? raw.sources : Array.isArray(normalized?.sources) ? normalized.sources : [];
}

function rawEvidence(raw, normalized) {
  return Array.isArray(raw?.evidence) ? raw.evidence : Array.isArray(normalized?.evidence) ? normalized.evidence : [];
}

function legacyIntegrationFor(raw, normalized, sourceOrigin) {
  const nested = asRecord(normalized?.legacyIntegration);
  const localFallback = nested.providerStatus === "LOCAL_TAVILY_FALLBACK";
  const verdict = verdictOf(raw, normalized);
  const confidence = confidenceOf(raw, normalized);
  return {
    status: raw ? "COMPLETED" : "UNAVAILABLE",
    providerStatus: friendProviderStatus(normalized, raw),
    providerId: localFallback ? "local_tavily_fallback" : "friend_backend",
    rawVerdict: verdict,
    assessmentConfidence: confidence,
    evidenceAgreement: raw?.evidenceAgreement ?? normalized?.evidenceAgreement ?? null,
    sourceQuality: raw?.sourceQuality ?? normalized?.sourceQuality ?? null,
    stop: typeof raw?.stop === "boolean" ? raw.stop : null,
    canContinueToLayer3: typeof raw?.canContinueToLayer3 === "boolean" ? raw.canContinueToLayer3 : null,
    canContinueToLayer4: typeof raw?.canContinueToLayer4 === "boolean" ? raw.canContinueToLayer4 : null,
    reason: boundedText(raw?.reason || normalized?.reason, 1_200) || null,
    sourceOrigin: localFallback ? "LOCAL_TAVILY_FALLBACK" : sourceOrigin,
    sourceCount: rawSources(raw, normalized).length,
    evidenceCount: rawEvidence(raw, normalized).length,
    sources: rawSources(raw, normalized),
    evidence: rawEvidence(raw, normalized),
    mode: boundedText(raw?.mode || normalized?.mode, 80) || null,
    geminiModel: boundedText(raw?.geminiModel || normalized?.geminiModel, 160) || null,
    groqModel: boundedText(raw?.groqModel || normalized?.groqModel, 160) || null,
  };
}

function layerResultFor(stageId, normalized, raw) {
  const result = asRecord(normalized);
  const verdict = verdictOf(raw, result);
  const confidence = confidenceOf(raw, result);
  const providerStatus = friendProviderStatus(result, raw);
  const sources = rawSources(raw, result);
  const evidence = rawEvidence(raw, result);
  if (stageId === "l1") return raw || result;
  if (stageId === "l2") {
    return {
      layer: "L2",
      status: result.status || "COMPLETED",
      finding: l2Finding(verdict),
      classification: verdict,
      rawVerdict: verdict,
      verdict,
      confidence,
      assessmentConfidence: confidence,
      providerStatus,
      provider: "friend_backend",
      stop: typeof raw?.stop === "boolean" ? raw.stop : null,
      canContinueToLayer3: typeof raw?.canContinueToLayer3 === "boolean" ? raw.canContinueToLayer3 : null,
      providerResults: raw?.providers || raw?.results || result.providerResults || result.providers || result.results || [],
      providers: raw?.providers || raw?.results || result.providers || result.providerResults || result.results || [],
      reason: boundedText(raw?.reason || result.reason, 1_200) || null,
      explanation: boundedText(raw?.reason || result.reason, 1_000) || null,
      legacyIntegration: legacyIntegrationFor(raw, result, "LAYER_2_FRIEND_BACKEND"),
    };
  }
  if (stageId === "l3") {
    return {
      layer: "L3",
      status: result.status || "COMPLETED",
      finding: l3Finding(verdict),
      classification: verdict,
      rawVerdict: verdict,
      verdict,
      confidence,
      assessmentConfidence: confidence,
      providerStatus,
      provider: "friend_backend",
      reason: boundedText(raw?.reason || result.legacyIntegration?.reason || result.reason, 1_200) || null,
      sources,
      evidence,
      externalEvidence: raw?.externalEvidence === true || result.externalEvidence === true,
      sourceCount: sources.length,
      evidenceCount: evidence.length,
      legacyIntegration: legacyIntegrationFor(raw, result, "LAYER_3_FRIEND_BACKEND"),
    };
  }
  const action = actionFor(verdict, raw);
  return {
    layer: "L4",
    status: result.status || "COMPLETED",
    finding: l4Finding(verdict),
    classification: verdict,
    securityClassification: verdict,
    truthStatus: verdict,
    enforcement: action,
    recommendedAction: action,
    rawVerdict: verdict,
    verdict,
    confidence,
    assessmentConfidence: confidence,
    decisionConfidence: confidence,
    evidenceAgreement: raw?.evidenceAgreement ?? result.evidenceAgreement ?? null,
    sourceQuality: raw?.sourceQuality ?? result.sourceQuality ?? null,
    providerStatus,
    provider: "friend_backend",
    reason: boundedText(raw?.reason || result.reason, 1_200) || null,
    contradictoryEvidence: Array.isArray(raw?.contradictoryEvidence) ? raw.contradictoryEvidence : result.contradictoryEvidence || [],
    sources,
    keyReasons: [raw?.reason || result.reason, ...(Array.isArray(raw?.contradictoryEvidence) ? raw.contradictoryEvidence : [])]
      .map((item) => boundedText(item, 700))
      .filter(Boolean)
      .slice(0, 20),
    legacyIntegration: legacyIntegrationFor(raw, result, "LAYER_4_FRIEND_BACKEND"),
  };
}

function stageFor(stageId, normalized, raw, requestId, startedAt, completedAt) {
  const result = asRecord(normalized);
  const layer = layerResultFor(stageId, result, raw);
  const verdict = stageId === "l1"
    ? boundedText(raw?.status, 120).toUpperCase() || "UNKNOWN"
    : verdictOf(raw, result);
  const confidence = confidenceOf(raw, result);
  const providerStatus = stageId === "l1" ? "FRONTEND_VALIDATION" : friendProviderStatus(result, raw);
  const operationStatus = stageId === "l1" || raw || providerStatus === "SUCCESS"
    ? OPERATION_STATUS.COMPLETED
    : OPERATION_STATUS.PARTIAL;
  const finding = stageId === "l1"
    ? (raw?.status === "PASS" ? "LOCAL_CLEAR" : "LOCAL_UNKNOWN")
    : stageId === "l2"
      ? l2Finding(verdict)
      : stageId === "l3"
        ? l3Finding(verdict)
        : l4Finding(verdict);
  const action = stageId === "l4" ? actionFor(verdict, raw) : null;
  const sources = rawSources(raw, result);
  const evidence = rawEvidence(raw, result);
  return createStageEnvelope({
    stageId,
    requestId,
    pipelineModel: FOUR_LAYER_MODEL,
    operationStatus,
    startedAt,
    completedAt,
    latencyMs: Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime()),
    finding,
    verdict: stageId === "l1" ? boundedText(raw?.status, 120) || "FAIL" : verdict,
    severity: finding === "MALICIOUS" || finding === "THREAT_MATCH" ? "CRITICAL" : finding === "UNKNOWN" || finding === "INSUFFICIENT" ? "MEDIUM" : "INFO",
    providerStatus,
    providerId: stageId === "l1" ? "frontend_validation" : "friend_backend",
    confidence,
    confidenceKind: stageId === "l1" ? "DETERMINISTIC_CHECK" : "FRIEND_BACKEND_REPORTED_SCORE",
    explanation: boundedText(raw?.reason || result.reason, 1_000) || `Friend backend returned ${verdict}.`,
    reason: boundedText(raw?.reason || result.reason, 700) || null,
    summary: `Friend backend ${stageId.toUpperCase()} returned ${verdict}.`,
    reasons: [raw?.reason || result.reason].map((item) => boundedText(item, 700)).filter(Boolean),
    signals: [{ code: `FRIEND_${stageId.toUpperCase()}_${verdict}`, source: "friend_backend", severity: "INFO", details: "Exact friend-backend response was retained." }],
    evidenceRefs: sources.map((item) => item?.url || item?.sourceUrl).filter((item) => typeof item === "string").slice(0, 40),
    sources,
    evidence,
    sourceCount: sources.length,
    evidenceCount: evidence.length,
    externalEvidence: stageId === "l3" && (raw?.externalEvidence === true || result.externalEvidence === true),
    truthStatus: stageId === "l4" ? verdict : null,
    securityClassification: stageId === "l4" ? verdict : null,
    enforcement: action,
    recommendedAction: action,
    decisionConfidence: confidence,
    keyReasons: layer.keyReasons || [],
    safeToContinue: true,
    userAction: action === "BLOCK" ? "Dừng tương tác với input." : "Xem nguyên văn kết quả friend backend trước khi hành động.",
    rawMetadata: { source: "FRIEND_BACKEND", rawVerdict: verdict, providerStatus },
  });
}

function finalDecisionFor(raw, normalized) {
  const verdict = verdictOf(raw, normalized);
  const action = actionFor(verdict, raw);
  return {
    security: verdict,
    truth: verdict,
    action,
    securityClassification: verdict,
    truthStatus: verdict,
    enforcement: action,
    decisionAuthority: "FINAL_PREDICT_DETERMINISTIC",
    authoritativeComponent: "FRIEND_BACKEND",
    aiOverride: false,
    friendBackendVerdict: verdict,
  };
}

function finalPredictFor(raw, normalized, layer3Raw, layer3Normalized) {
  const verdict = verdictOf(raw, normalized);
  const confidence = confidenceOf(raw, normalized);
  const action = actionFor(verdict, raw);
  const sources = rawSources(raw, normalized);
  const evidence = rawEvidence(layer3Raw, layer3Normalized);
  const reason = boundedText(raw?.reason || normalized?.reason, 700) || null;
  const keyReasons = [reason, ...(Array.isArray(raw?.contradictoryEvidence) ? raw.contradictoryEvidence : [])]
    .map((item) => boundedText(item, 700))
    .filter(Boolean)
    .slice(0, 20);
  return {
    status: "READY",
    verdict,
    truthVerdict: verdict,
    truthStatus: verdict,
    truthAssessment: verdict,
    security: verdict,
    securityRisk: verdict,
    securityClassification: verdict,
    recommendedAction: action,
    action,
    assessmentConfidence: confidence,
    decisionConfidence: confidence,
    confidence,
    confidenceKind: "FRIEND_BACKEND_REPORTED_SCORE",
    confidenceExplanation: "Điểm confidence được giữ nguyên từ friend backend; không phải xác suất hiệu chuẩn của StudentHub.",
    reason,
    authoritativeComponent: "FRIEND_BACKEND",
    evidenceAgreement: raw?.evidenceAgreement ?? null,
    sourceQuality: raw?.sourceQuality ?? null,
    verificationCompleteness: layer3Raw?.verificationCompleteness ?? null,
    evidenceSufficiency: boundedText(layer3Raw?.verdict || layer3Normalized?.legacyIntegration?.rawVerdict, 120) || "UNKNOWN",
    securityEvidenceStatus: "FRIEND_BACKEND",
    independentSourceCount: sources.length,
    evidenceCount: evidence.length,
    sourceCount: sources.length,
    keyReasons,
    remainingUncertainty: verdict === "UNKNOWN" ? ["Friend backend returned UNKNOWN; no local verdict was substituted."] : [],
    uncertainties: verdict === "UNKNOWN" ? ["Friend backend returned UNKNOWN; no local verdict was substituted."] : [],
    keySources: sources,
    sources,
    topEvidence: evidence,
    evidenceRefs: sources.map((item) => item?.url || item?.sourceUrl).filter((item) => typeof item === "string").slice(0, 40),
    derivedFrom: ["FRIEND_BACKEND_LAYER1", "FRIEND_BACKEND_LAYER2", "FRIEND_BACKEND_LAYER3", "FRIEND_BACKEND_LAYER4"],
    traceability: [{ source: "FRIEND_BACKEND", stage: "layer4", field: "verdict", value: verdict }],
    calls: { finalPredict: 0 },
  };
}

function fallbackRaw(stageId, normalized) {
  const result = asRecord(normalized);
  const verdict = verdictOf(null, result);
  return {
    verdict,
    confidence: confidenceOf(null, result) ?? 0,
    reason: boundedText(result.reason, 1_200) || "Friend backend did not return a usable response.",
    ...(stageId === "layer2" ? { providers: result.providers || result.results || result.providerResults || [] } : {}),
    ...(stageId === "layer3" ? { stop: false, canContinueToLayer4: true, evidence: [], sources: [] } : {}),
    ...(stageId === "layer4" ? { stop: true, canContinueToLayer4: false, contradictoryEvidence: [], sources: [] } : {}),
  };
}

export function rawFriendLayer(stageId, normalized) {
  const raw = stageId === "layer2"
    ? rawLayer2(normalized)
    : stageId === "layer3"
      ? rawLayer3(normalized)
      : stageId === "layer4"
        ? rawLayer4(normalized)
        : null;
  return raw || fallbackRaw(stageId, normalized);
}

export async function runFriendBackendLayer({ stage, input: rawInput, layer2 = null, layer3 = null, adapter = null, requestId = null, signal, tavilyFallbackOptions = null } = {}) {
  const input = normalizedInput(rawInput);
  const verificationAdapter = adapter || createLegacyVerificationAdapter();
  const id = boundedText(requestId, 160) || createSecureId("req_friend");
  if (stage === "layer2") {
    const result = await verificationAdapter.verifyLayer2({ input, url: input.content, requestId: id, signal, exactContract: true });
    return { normalized: result, raw: rawFriendLayer("layer2", result) };
  }
  if (stage === "layer3") {
    const result = await verificationAdapter.verifyLayer3({ input, legacyLayer2Result: layer2, requestId: id, signal, exactContract: true });
    const friendRaw = rawFriendLayer("layer3", result);
    const fallback = await tryFriendBackendTavilyFallback({
      input,
      layer2Result: layer2,
      friendLayer3Result: result,
      requestId: id,
      signal,
      ...(tavilyFallbackOptions && typeof tavilyFallbackOptions === "object" ? tavilyFallbackOptions : {}),
    });
    return {
      normalized: fallback.applied ? fallback.normalized : result,
      raw: fallback.applied ? fallback.raw : friendRaw,
      friendRaw,
      fallback: fallback.metadata,
    };
  }
  if (stage === "layer4") {
    const result = await verificationAdapter.verifyLayer4({ input, legacyLayer2Result: layer2, layer3Result: layer3, requestId: id, signal, exactContract: true });
    return { normalized: result, raw: rawFriendLayer("layer4", result) };
  }
  throw new Error("UNKNOWN_FRIEND_BACKEND_LAYER");
}

export async function runFriendBackendFourLayers({ input: rawInput, adapter = null, requestId = null, signal, tavilyFallbackOptions = null } = {}) {
  const input = normalizedInput(rawInput);
  const id = boundedText(requestId, 160) || createSecureId("req_friend");
  const verificationAdapter = adapter || createLegacyVerificationAdapter();
  const layer1 = friendLayer1(input);
  if (signal?.aborted) throw new TrustPipelineCancelledError();
  const l2 = await runFriendBackendLayer({ stage: "layer2", input, adapter: verificationAdapter, requestId: id, signal });
  if (signal?.aborted) throw new TrustPipelineCancelledError();
  const l3 = await runFriendBackendLayer({ stage: "layer3", input, layer2: l2.normalized, adapter: verificationAdapter, requestId: id, signal, tavilyFallbackOptions });
  if (signal?.aborted) throw new TrustPipelineCancelledError();
  const l4 = await runFriendBackendLayer({ stage: "layer4", input, layer2: l2.normalized, layer3: l3.normalized, adapter: verificationAdapter, requestId: id, signal });
  return {
    input,
    layer1,
    normalized: { layer2: l2.normalized, layer3: l3.normalized, layer4: l4.normalized },
    rawLayers: { layer1, layer2: l2.raw, layer3: l3.friendRaw || l3.raw, layer4: l4.raw },
    fallbacks: l3.fallback?.applied ? { layer3: l3.fallback } : {},
    adapter: verificationAdapter,
  };
}

export class FriendBackendTrustOrchestrator {
  constructor(options = {}) {
    this.adapter = options.adapter || createLegacyVerificationAdapter();
    this.tavilyFallbackOptions = options.tavilyFallbackOptions || null;
    this._activeController = null;
  }

  async _emit(pipeline, event, onTransition) {
    if (typeof onTransition !== "function") return;
    const publicPipeline = toPublicPipelineResult(cloneSafe(pipeline));
    await onTransition({
      event,
      stageId: pipeline.currentStage,
      stage: pipeline.currentStage
        ? publicPipeline?.stages?.[pipeline.currentStage] || null
        : event === "FINAL_PREDICT_READY" ? publicPipeline?.finalPredict || null : null,
      pipeline: publicPipeline,
    });
  }

  async run(rawInput = {}, options = {}) {
    if (this._activeController) this._activeController.abort("superseded-by-new-run");
    const controller = new AbortController();
    this._activeController = controller;
    const callerSignal = options.signal;
    const forwardAbort = () => controller.abort(callerSignal?.reason || "caller-aborted");
    if (callerSignal?.aborted) forwardAbort();
    else callerSignal?.addEventListener?.("abort", forwardAbort, { once: true });

    const input = normalizedInput(rawInput);
    const requestId = boundedText(options.requestId, 160) || createSecureId("req_friend");
    const pipeline = createInitialPipeline({ requestId, startedAt: nowIso(), pipelineModel: FOUR_LAYER_MODEL });
    pipeline.pipelineVersion = FOUR_LAYER_PIPELINE_VERSION;
    pipeline.pipelineStatus = PIPELINE_STATUS.RUNNING;
    pipeline.layerResults = { layer1: null, layer2: null, layer3: null, layer4: null };
    pipeline.audit.policyVersion = "friend-backend-authoritative";
    pipeline.audit.assuranceVersion = null;
    pipeline.audit.inputFingerprint = null;
    let partial = false;

    const execute = async (stageId, worker) => {
      if (controller.signal.aborted) throw new TrustPipelineCancelledError();
      const startedAt = nowIso();
      pipeline.currentStage = stageId;
      pipeline.audit.stageSequence.push(stageId);
      pipeline.stages[stageId] = createStageEnvelope({
        ...pipeline.stages[stageId],
        stageId,
        requestId,
        pipelineModel: FOUR_LAYER_MODEL,
        operationStatus: OPERATION_STATUS.RUNNING,
        startedAt,
        completedAt: null,
        providerStatus: "RUNNING",
        summary: "Friend backend layer đang thực thi.",
        safeToContinue: false,
      });
      await this._emit(pipeline, "STAGE_STARTED", options.onTransition);
      await this._emit(pipeline, "STAGE_PROGRESS", options.onTransition);
      const output = await worker();
      if (controller.signal.aborted) throw new TrustPipelineCancelledError();
      const completedAt = nowIso();
      const normalized = output.normalized || {};
      const raw = output.raw || null;
      const stage = stageFor(stageId, normalized, raw, requestId, startedAt, completedAt);
      pipeline.stages[stageId] = stage;
      pipeline.layerResults[`layer${stageId.slice(-1)}`] = layerResultFor(stageId, normalized, raw);
      partial ||= stage.operationStatus !== OPERATION_STATUS.COMPLETED;
      await this._emit(pipeline, "STAGE_COMPLETED", options.onTransition);
      return {
        normalized,
        raw,
        friendRaw: output.friendRaw || null,
        fallback: output.fallback || null,
      };
    };

    try {
      await this._emit(pipeline, "PIPELINE_STARTED", options.onTransition);
      const l1Output = await execute("l1", async () => ({ normalized: pipeline.layerResults.layer1 = friendLayer1(input), raw: pipeline.layerResults.layer1 }));
      if (l1Output.raw.status !== "PASS") partial = true;
      // The Expert handoff is observational: it must receive the exact input
      // that entered the friend-authoritative pipeline after L1, but it must
      // never change or delay the four-layer result.  The route supplies this
      // callback to create the server-owned blind-review assignment.
      if (typeof options.onL1ClaimReady === "function") {
        try {
          const handoff = options.onL1ClaimReady({
            l1Result: cloneSafe(l1Output.normalized),
            input: cloneSafe(input),
            pipeline,
            requestId,
          });
          if (handoff && typeof handoff.then === "function") handoff.catch(() => {});
        } catch {
          // Expert dispatch is advisory and must not alter Trust authority.
        }
      }
      const l2 = await execute("l2", () => runFriendBackendLayer({ stage: "layer2", input, adapter: this.adapter, requestId, signal: controller.signal }));
      const l3 = await execute("l3", () => runFriendBackendLayer({ stage: "layer3", input, layer2: l2.normalized, adapter: this.adapter, requestId, signal: controller.signal, tavilyFallbackOptions: this.tavilyFallbackOptions }));
      const l4 = await execute("l4", () => runFriendBackendLayer({ stage: "layer4", input, layer2: l2.normalized, layer3: l3.normalized, adapter: this.adapter, requestId, signal: controller.signal }));

      pipeline.currentStage = null;
      const friendRawLayers = {
        layer1: friendLayer1(input),
        layer2: l2.raw,
        layer3: l3.friendRaw || l3.raw,
        layer4: l4.raw,
      };
      pipeline.friendBackend = {
        sourceMode: "FRIEND_BACKEND",
        authoritativeComponent: "FRIEND_BACKEND",
        baseUrl: this.adapter.config?.baseUrl || null,
        endpointSequence: [...FRIEND_ENDPOINT_SEQUENCE],
        layers: friendRawLayers,
        final: l4.raw,
        fallbacks: l3.fallback?.applied ? { layer3: l3.fallback } : {},
      };
      pipeline.legacyResponse = {
        sourceMode: "FRIEND_BACKEND",
        layer1: friendRawLayers.layer1,
        layer2: friendRawLayers.layer2,
        layer3: friendRawLayers.layer3,
        layer4: friendRawLayers.layer4,
      };
      pipeline.finalPredict = finalPredictFor(l4.raw, l4.normalized, l3.raw, l3.normalized);
      pipeline.finalDecision = finalDecisionFor(l4.raw, l4.normalized);
      pipeline.pipelineStatus = partial ? PIPELINE_STATUS.PARTIAL : PIPELINE_STATUS.COMPLETED;
      pipeline.completedAt = nowIso();
      pipeline.audit.stageAttempts = pipeline.audit.stageSequence.map((stageId) => ({ stageId, attempt: 1, status: pipeline.stages[stageId].operationStatus, finding: pipeline.stages[stageId].finding }));
      await this._emit(pipeline, "FINAL_PREDICT_READY", options.onTransition);
      await this._emit(pipeline, partial ? "PIPELINE_PARTIAL" : "PIPELINE_COMPLETED", options.onTransition);
      return toPublicPipelineResult(cloneSafe(pipeline));
    } catch (error) {
      if (error instanceof TrustPipelineCancelledError || controller.signal.aborted || error?.name === "AbortError") {
        pipeline.pipelineStatus = PIPELINE_STATUS.CANCELLED;
        pipeline.currentStage = null;
        pipeline.completedAt = nowIso();
        await this._emit(pipeline, "PIPELINE_CANCELLED", options.onTransition);
        throw new TrustPipelineCancelledError();
      }
      pipeline.pipelineStatus = PIPELINE_STATUS.FAILED;
      pipeline.currentStage = null;
      pipeline.completedAt = nowIso();
      await this._emit(pipeline, "PIPELINE_FAILED", options.onTransition);
      throw error;
    } finally {
      callerSignal?.removeEventListener?.("abort", forwardAbort);
      if (this._activeController === controller) this._activeController = null;
    }
  }
}

export function createFriendBackendTrustOrchestrator(options = {}) {
  return new FriendBackendTrustOrchestrator(options);
}
