/**
 * Standalone Sequential Trust Orchestrator.
 *
 * This variant owns the four-layer execution boundary used by the sequential
 * Trust Studio:
 *   - Layer 1: local/offline screening
 *   - Layer 2: Google Safe Browsing through FriendBackendAdapter
 *   - Layer 3: Tavily web evidence through FriendBackendAdapter
 *   - Layer 4: independent Groq/Gemini synthesis through FriendBackendAdapter
 *
 * The friend backend is deliberately the only live provider path here. A
 * missing or unhealthy provider is represented as UNKNOWN/PARTIAL; it is
 * never converted into SAFE, TRUE, or a fabricated confidence score.
 */

import { createFriendBackendAdapter } from "./integrations/friendBackend/FriendBackendAdapter.js";
import { Layer1ScreenService } from "./layer1/Layer1ScreenService.js";
import { stageFromL1 } from "./v5/stageAdapters.js";
import {
  OPERATION_STATUS,
  PIPELINE_STATUS,
  createInitialPipeline,
  createStageEnvelope,
  toPublicPipelineResult,
} from "./v5/contracts.js";
import { createSecureId } from "../security/secureId.js";

const BLOCKED_PROVIDER_STATUSES = new Set([
  "UNKNOWN",
  "UNAVAILABLE",
  "TIMEOUT",
  "RATE_LIMITED",
  "AUTH_FAILED",
  "MALFORMED",
  "INVALID_RESPONSE",
  "INVALID_INPUT",
  "NOT_CONFIGURED",
  "CIRCUIT_OPEN",
  "ERROR",
]);

function upper(value) {
  return typeof value === "string" ? value.trim().toUpperCase() : "";
}

function boundedCode(error, fallback = "PROVIDER_ERROR") {
  const candidate = upper(error?.code);
  return /^[A-Z0-9_.:-]{1,120}$/.test(candidate) ? candidate : fallback;
}

function providerStatusFor(result) {
  const candidate = result?.legacyIntegration?.providerStatus
    || result?.providerStatus
    || result?.retrievalStatus
    || result?.status;
  return upper(candidate) || "UNKNOWN";
}

function providerIsBlocked(result) {
  return BLOCKED_PROVIDER_STATUSES.has(providerStatusFor(result));
}

function providerIsAvailable(result) {
  return Boolean(result) && !providerIsBlocked(result);
}

function l2RawVerdictFor(result) {
  const direct = upper(result?.rawVerdict || result?.verdict);
  if (direct) return direct;
  if (result?.finding === "THREAT_MATCH") return "DANGEROUS";
  if (result?.finding === "NO_KNOWN_THREAT" && providerStatusFor(result) === "SUCCESS") return "SAFE";
  return "UNKNOWN";
}

function l2FindingFor(result, rawVerdict) {
  const providerStatus = providerStatusFor(result);
  if (result?.finding === "SKIPPED_PRIVACY_SAFETY") return "SKIPPED_PRIVACY_SAFETY";
  if (result?.finding === "NOT_APPLICABLE" || providerStatus === "NOT_APPLICABLE" || providerStatus === "INVALID_INPUT") {
    return "NOT_APPLICABLE";
  }
  if (providerStatus !== "SUCCESS") return "UNKNOWN";
  if (rawVerdict === "DANGEROUS") return "THREAT_MATCH";
  if (rawVerdict === "SAFE") return "NO_KNOWN_THREAT";
  return "UNKNOWN";
}

function l3RawVerdictFor(result) {
  return upper(result?.legacyIntegration?.rawVerdict || result?.rawVerdict || result?.verdict || result?.status) || "UNKNOWN";
}

function l3FindingFor(result, rawVerdict) {
  if (providerIsBlocked(result)) return "UNAVAILABLE";
  if (["FALSE", "FAKE", "CONTRADICTED"].includes(rawVerdict)) return "CONTRADICTED";
  if (rawVerdict === "MIXED") return "MIXED";
  if (["TRUE", "SUPPORTED"].includes(rawVerdict)) return "SUPPORTED";
  if (rawVerdict === "UNAVAILABLE") return "UNAVAILABLE";
  return "INSUFFICIENT";
}

function l4RawVerdictFor(result) {
  return upper(result?.rawVerdict || result?.verdict) || "UNKNOWN";
}

function isL2HardStop(l1Result, l2Result, l2RawVerdict) {
  return l1Result?.status === "BLOCK"
    || (l2RawVerdict === "DANGEROUS" && providerStatusFor(l2Result) === "SUCCESS");
}

function canContinueToLayer4(result) {
  if (!result || providerIsBlocked(result)) return false;
  const integration = result.legacyIntegration || result;
  return integration.stop !== true && integration.canContinueToLayer4 === true;
}

function evidenceRefsFor(result) {
  const values = [
    ...(Array.isArray(result?.evidence) ? result.evidence : []),
    ...(Array.isArray(result?.sources) ? result.sources : []),
  ];
  return Array.from(new Set(values.map((item) => {
    if (typeof item === "string") return item.trim();
    return item?.evidenceId || item?.sourceId || item?.id || null;
  }).filter((item) => typeof item === "string" && item.trim()))).slice(0, 40);
}

function providerUnavailableReason(result, fallback) {
  return result?.reason
    || result?.message
    || result?.legacyIntegration?.reason
    || fallback;
}

function skipFindingFor(stageId) {
  if (stageId === "l3") return "INSUFFICIENT";
  if (stageId === "l4") return "NOT_APPLICABLE";
  if (stageId === "l5") return "INCONCLUSIVE";
  if (stageId === "l2c") return "UNKNOWN_STUDENT_RISK";
  return "UNKNOWN";
}

function skippedStage(stageId, requestId, summary) {
  return createStageEnvelope({
    stageId,
    requestId,
    operationStatus: OPERATION_STATUS.SKIPPED,
    finding: skipFindingFor(stageId),
    severity: "INFO",
    providerStatus: "NOT_APPLICABLE",
    summary,
    reasons: [summary],
    signals: [{
      type: "STAGE_SKIPPED",
      details: summary,
      source: "sequential_orchestrator",
      severity: "INFO",
    }],
    meaning: "Stage này không được thực thi trong nhánh hiện tại; không có finding provider nào được suy ra.",
    notProve: "SKIPPED không phải là SAFE, TRUE hoặc bằng chứng rằng stage sẽ cho kết quả tích cực.",
    userAction: "Giữ nguyên mức thận trọng của các stage đã chạy.",
    safeToContinue: false,
  });
}

function unavailableLayer2(requestId, errorCode = "PROVIDER_ERROR") {
  return {
    layer: "2A",
    provider: "google-safe-browsing",
    providerStatus: "UNAVAILABLE",
    finding: "UNKNOWN",
    securityClassification: "UNKNOWN",
    threatTypes: [],
    rawVerdict: null,
    providerConfidence: null,
    confidence: null,
    providerResults: [],
    requestId,
    errorCode,
    message: "Google Safe Browsing did not return a determinate result.",
  };
}

function unavailableLayer3(requestId, errorCode = "PROVIDER_ERROR", reason = "Friend backend Layer 3 did not return a determinate result.") {
  return {
    status: "PARTIAL",
    providerStatus: "UNAVAILABLE",
    retrievalStatus: "UNAVAILABLE",
    retrievalMode: "FRIEND_BACKEND_UNAVAILABLE",
    externalEvidence: false,
    verificationCompleteness: 0,
    claims: [],
    sources: [],
    evidence: [],
    legacyIntegration: {
      status: "UNAVAILABLE",
      providerStatus: "UNAVAILABLE",
      rawVerdict: null,
      legacyAssessmentConfidence: null,
      reason,
      stop: true,
      canContinueToLayer4: false,
      continuationDerived: true,
      sourceOrigin: "LAYER_3_WEB_EVIDENCE",
      sourceCount: 0,
      evidenceCount: 0,
      errorCode,
    },
  };
}

function unavailableLayer4(requestId, errorCode = "PROVIDER_ERROR", reason = "Friend backend Layer 4 did not return a determinate result.") {
  return {
    status: "UNAVAILABLE",
    providerStatus: "UNAVAILABLE",
    providerId: "friend_backend_layer4",
    requestId,
    rawVerdict: null,
    assessmentConfidence: null,
    evidenceAgreement: null,
    sourceQuality: null,
    stop: true,
    canContinueToLayer4: false,
    reason,
    contradictoryEvidence: [],
    sources: [],
    sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
    errorCode,
  };
}

function finalDecisionFor({ l1Result, l2Result, l2RawVerdict, l3Result, l4Result }) {
  const l1HardBlock = l1Result?.status === "BLOCK";
  const l2HardBlock = l2RawVerdict === "DANGEROUS" && providerStatusFor(l2Result) === "SUCCESS";
  const l4RawVerdict = l4RawVerdictFor(l4Result);
  const l4Available = providerIsAvailable(l4Result);
  const l3RawVerdict = l3RawVerdictFor(l3Result);

  let security = "UNKNOWN";
  let truth = "INSUFFICIENT_EVIDENCE";
  let action = "REVIEW";
  let decisionAuthority = "L1_L2_L3_POLICY";

  if (l1HardBlock || l2HardBlock) {
    security = "MALICIOUS";
    truth = "CONTRADICTED";
    action = "BLOCK";
    decisionAuthority = l2HardBlock ? "GOOGLE_SAFE_BROWSING" : "LOCAL_SECURITY_SCREEN";
  } else if (l4Available) {
    if (["FALSE", "FAKE", "MALICIOUS", "DANGEROUS", "CONTRADICTED"].includes(l4RawVerdict)) {
      security = "MALICIOUS";
      truth = "CONTRADICTED";
      action = "BLOCK";
    } else if (["SUSPICIOUS", "MISLEADING", "MIXED"].includes(l4RawVerdict)) {
      security = "SUSPICIOUS";
      truth = "INSUFFICIENT_EVIDENCE";
      action = "WARN";
    } else if (["TRUE", "SUPPORTED", "SAFE"].includes(l4RawVerdict)) {
      security = "SAFE";
      truth = "VERIFIED_TRUE";
      action = "ALLOW_WITH_CAUTION";
    }
    decisionAuthority = "FRIEND_BACKEND_AI";
  } else if (["FALSE", "FAKE", "CONTRADICTED"].includes(l3RawVerdict)) {
    security = "SUSPICIOUS";
    truth = "CONTRADICTED";
    action = "WARN";
    decisionAuthority = "FRIEND_BACKEND_EVIDENCE";
  } else if (["TRUE", "SUPPORTED"].includes(l3RawVerdict) && l3Result?.legacyIntegration?.stop === true) {
    // Evidence can support a claim without becoming a security certificate.
    security = "UNKNOWN";
    truth = "VERIFIED_TRUE";
    action = "ALLOW_WITH_CAUTION";
    decisionAuthority = "FRIEND_BACKEND_EVIDENCE";
  } else if (l1Result?.status === "SUSPICIOUS") {
    security = "SUSPICIOUS";
    truth = "INSUFFICIENT_EVIDENCE";
    action = "WARN";
    decisionAuthority = "LOCAL_SECURITY_SCREEN";
  }

  const fallbackReason = security === "UNKNOWN"
    ? "Không có đủ dữ liệu độc lập để đưa ra kết luận mạnh hơn UNKNOWN."
    : "Kết luận được giới hạn trong dữ liệu và policy của các layer đã chạy.";
  const sourceResult = l4Available ? l4Result : l3Result;
  const reason = providerUnavailableReason(sourceResult, fallbackReason);
  const confidence = l4Available
    ? (typeof l4Result?.assessmentConfidence === "number" ? l4Result.assessmentConfidence : typeof l4Result?.confidence === "number" ? l4Result.confidence : null)
    : null;
  const activeModel = l4Available ? (l4Result?.groqModel || l4Result?.geminiModel || null) : null;

  return {
    security,
    truth,
    action,
    securityClassification: security,
    truthStatus: truth,
    enforcement: action,
    presentedTruthStatus: truth,
    presentedEnforcement: action,
    decisionAuthority,
    assuranceAuthority: "L5_NOT_RUN_IN_SEQUENTIAL_VARIANT",
    assuranceStatus: "INCONCLUSIVE",
    assuranceApplied: false,
    actualModel: activeModel,
    geminiModel: l4Available ? (l4Result?.geminiModel || null) : null,
    groqModel: l4Available ? (l4Result?.groqModel || null) : null,
    reason,
    l4Decision: {
      security,
      truth,
      action,
      verdict: l4Available ? l4RawVerdict : (l3Result ? l3RawVerdict : null),
      confidence,
      reason,
      model: activeModel,
    },
    isHardNegative: security === "MALICIOUS" || action === "BLOCK",
  };
}

function sequentialAssurance() {
  return {
    status: "INCONCLUSIVE",
    anomalies: [{
      code: "L5_NOT_RUN_IN_SEQUENTIAL_VARIANT",
      severity: "INFO",
      details: "Phiên bản này có bốn layer; adversarial assurance L5 không được thực thi.",
    }],
    assuranceReasons: ["Không được diễn giải việc bỏ qua L5 thành assurance pass."],
    recommendedRechecks: ["run_full_v5_assurance"],
    assuranceConfidence: null,
    assuranceConfidenceKind: "NOT_APPLICABLE",
    auditVersion: "trust-sequential-4-layer",
    downgradeOnly: true,
    deterministicChecks: [],
    aiAuditStatus: "NOT_CONFIGURED",
    aiAuditProvider: null,
  };
}

export class TrustPipelineCancelledError extends Error {
  constructor(message = "Trust pipeline was cancelled.") {
    super(message);
    this.name = "TrustPipelineCancelledError";
    this.code = "CANCELLED";
  }
}

export class FriendBackendNotConfiguredError extends Error {
  constructor(message = "FRIEND_BACKEND_NOT_CONFIGURED: Friend backend integration is required for this sequential variant.") {
    super(message);
    this.name = "FriendBackendNotConfiguredError";
    this.code = "FRIEND_BACKEND_NOT_CONFIGURED";
    this.statusCode = 503;
  }
}

function signal(type, details, source = "friend_backend", severity = "INFO") {
  return { type, details, source, severity };
}

function cloneSafe(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

export class TrustOrchestrator {
  constructor(options = {}) {
    this.friendBackendAdapter = options.friendBackendAdapter || createFriendBackendAdapter();
  }

  _setStage(pipeline, stageId, patch) {
    pipeline.stages[stageId] = createStageEnvelope({
      ...pipeline.stages[stageId],
      ...patch,
      stageId,
      requestId: pipeline.requestId,
    });
  }

  async _emit(pipeline, event, onTransition) {
    if (["STAGE_STARTED", "STAGE_COMPLETED", "STAGE_FAILED"].includes(event) && pipeline.currentStage) {
      if (!pipeline.audit.stageSequence.includes(pipeline.currentStage)) pipeline.audit.stageSequence.push(pipeline.currentStage);
    }
    if (typeof onTransition !== "function") return;
    try {
      await onTransition({
        event,
        stageId: pipeline.currentStage,
        pipeline: toPublicPipelineResult(cloneSafe(pipeline)),
      });
    } catch {
      // Observability/stream listeners must never change a policy result.
    }
  }

  _markOutOfScopeStages(pipeline) {
    this._setStage(pipeline, "l2b", skippedStage("l2b", pipeline.requestId, "L2B semantic intelligence không thuộc contract 4-layer standalone này."));
    this._setStage(pipeline, "l2c", skippedStage("l2c", pipeline.requestId, "L2C StudentHub domain AI không thuộc contract 4-layer standalone này."));
    this._setStage(pipeline, "l5", skippedStage("l5", pipeline.requestId, "L5 adversarial assurance không chạy trong biến thể 4-layer này."));
  }

  async _skipStage(pipeline, stageId, summary, onTransition) {
    pipeline.currentStage = stageId;
    this._setStage(pipeline, stageId, skippedStage(stageId, pipeline.requestId, summary));
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);
  }

  async run(rawInput = {}, options = {}) {
    if (this.friendBackendAdapter && this.friendBackendAdapter.isConfigured) {
      return this.runFriendSequentialPipeline(rawInput, options);
    }
    throw new FriendBackendNotConfiguredError();
  }

  async runFriendSequentialPipeline(rawInput = {}, options = {}) {
    const callerSignal = options.signal;
    if (callerSignal?.aborted) throw new TrustPipelineCancelledError();

    const input = {
      type: ["text", "url", "image", "file"].includes(String(rawInput.type || "text").toLowerCase()) ? String(rawInput.type || "text").toLowerCase() : "text",
      content: typeof rawInput.content === "string" ? rawInput.content.trim() : "",
      metadata: rawInput.metadata && typeof rawInput.metadata === "object" ? rawInput.metadata : {},
    };
    const requestId = options.requestId || createSecureId("req_seq");
    const onTransition = options.onTransition;
    const startedAt = new Date().toISOString();
    const pipeline = createInitialPipeline({ requestId, startedAt });
    pipeline.pipelineStatus = PIPELINE_STATUS.RUNNING;
    pipeline.contractVersion = "trust.v5";
    pipeline.version = "v5";
    this._markOutOfScopeStages(pipeline);

    const rawResults = {
      layer1: null,
      layer2A: null,
      layer2B: null,
      layer2C: null,
      layer3: null,
      layer4: null,
    };
    const publishLayerResults = () => {
      pipeline.layerResults = { ...rawResults };
    };
    const finalize = async (pipelineStatus = PIPELINE_STATUS.COMPLETED) => {
      publishLayerResults();
      pipeline.finalDecision = finalDecisionFor({
        l1Result: rawResults.layer1,
        l2Result: rawResults.layer2A,
        l2RawVerdict: l2RawVerdictFor(rawResults.layer2A),
        l3Result: rawResults.layer3,
        l4Result: rawResults.layer4,
      });
      pipeline.assurance = sequentialAssurance();
      pipeline.pipelineStatus = pipelineStatus;
      pipeline.currentStage = "l4";
      pipeline.completedAt = new Date().toISOString();
      await this._emit(pipeline, "PIPELINE_COMPLETED", onTransition);
      return toPublicPipelineResult(cloneSafe(pipeline));
    };

    await this._emit(pipeline, "PIPELINE_STARTED", onTransition);

    // ----------------------------------------------------
    // LAYER 1: Local / Offline Regex Screening
    // ----------------------------------------------------
    if (callerSignal?.aborted) throw new TrustPipelineCancelledError();
    pipeline.currentStage = "l1";
    const l1Start = Date.now();
    this._setStage(pipeline, "l1", {
      operationStatus: OPERATION_STATUS.RUNNING,
      providerStatus: "RUNNING",
      summary: "Quét cú pháp, regex & blacklist offline trong phạm vi local (<15ms)",
      startedAt: new Date().toISOString(),
    });
    await this._emit(pipeline, "STAGE_STARTED", onTransition);

    const l1Result = await Layer1ScreenService.screen({ ...input, options: { requestId, signal: callerSignal } });
    const l1Timing = { startedAt: new Date(l1Start).toISOString(), completedAt: new Date().toISOString(), latencyMs: Date.now() - l1Start };
    this._setStage(pipeline, "l1", stageFromL1(l1Result, requestId, l1Timing));
    rawResults.layer1 = l1Result;
    publishLayerResults();
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);

    // ----------------------------------------------------
    // LAYER 2: Google Safe Browsing via Friend Backend
    // ----------------------------------------------------
    if (callerSignal?.aborted) throw new TrustPipelineCancelledError();
    pipeline.currentStage = "l2a";
    const l2Start = Date.now();
    this._setStage(pipeline, "l2a", {
      operationStatus: OPERATION_STATUS.RUNNING,
      providerStatus: "RUNNING",
      summary: "Đối soát an toàn và kiểm tra mối đe dọa với Google Safe Browsing...",
      startedAt: new Date().toISOString(),
    });
    await this._emit(pipeline, "STAGE_STARTED", onTransition);

    let l2Result;
    try {
      l2Result = await this.friendBackendAdapter.verifyLayer2({
        url: input.type === "url" ? input.content : input.metadata?.url,
        input,
        requestId,
        signal: callerSignal,
      });
    } catch (error) {
      if (callerSignal?.aborted || error?.name === "AbortError") throw new TrustPipelineCancelledError();
      l2Result = unavailableLayer2(requestId, boundedCode(error, "L2_PROVIDER_ERROR"));
    }
    const l2Timing = { startedAt: new Date(l2Start).toISOString(), completedAt: new Date().toISOString(), latencyMs: Date.now() - l2Start };
    const l2RawVerdict = l2RawVerdictFor(l2Result);
    const l2Finding = l2FindingFor(l2Result, l2RawVerdict);
    const l2ProviderStatus = providerStatusFor(l2Result);
    const l2Unavailable = providerIsBlocked(l2Result);
    const l2Stage = createStageEnvelope({
      stageId: "l2a",
      requestId,
      operationStatus: l2Unavailable ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.COMPLETED,
      finding: l2Finding,
      severity: l2Finding === "THREAT_MATCH" ? "CRITICAL" : "INFO",
      providerStatus: l2ProviderStatus,
      providerId: l2Result?.provider || "google-safe-browsing",
      confidence: typeof l2Result?.providerConfidence === "number"
        ? l2Result.providerConfidence
        : typeof l2Result?.confidence === "number" ? l2Result.confidence : null,
      summary: providerUnavailableReason(l2Result, l2Finding === "NOT_APPLICABLE"
        ? "Layer 2 chỉ áp dụng cho URL; không thực hiện reputation lookup cho input này."
        : "Google Safe Browsing không trả về kết quả xác định."),
      reasons: [l2Result?.reason, l2Result?.message].filter(Boolean),
      signals: [
        signal("URL_THREAT_VERDICT", l2RawVerdict, "google-safe-browsing", l2Finding === "THREAT_MATCH" ? "CRITICAL" : "INFO"),
        ...(l2Result?.threatTypes?.length ? [signal("THREAT_TYPES", l2Result.threatTypes.join(", "), "google-safe-browsing", "CRITICAL")] : []),
        ...(l2Unavailable ? [signal("PROVIDER_STATUS", l2ProviderStatus, "google-safe-browsing", "WARN")] : []),
      ],
      startedAt: l2Timing.startedAt,
      completedAt: l2Timing.completedAt,
      latencyMs: l2Timing.latencyMs,
      safeToContinue: !isL2HardStop(l1Result, l2Result, l2RawVerdict),
      rawMetadata: l2Result,
    });
    this._setStage(pipeline, "l2a", l2Stage);
    rawResults.layer2A = l2Result;
    rawResults.layer2B = l2Result;
    publishLayerResults();
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);

    if (isL2HardStop(l1Result, l2Result, l2RawVerdict)) {
      const stopReason = l1Result?.status === "BLOCK"
        ? "Layer 1 đã phát hiện hard block; các layer bên ngoài bị bỏ qua."
        : "Google Safe Browsing trả về DANGEROUS; pipeline dừng theo hard-stop policy.";
      await this._skipStage(pipeline, "l3", stopReason, onTransition);
      await this._skipStage(pipeline, "l4", stopReason, onTransition);
      return finalize();
    }

    // ----------------------------------------------------
    // LAYER 3: Tavily Web Evidence via Friend Backend
    // ----------------------------------------------------
    if (callerSignal?.aborted) throw new TrustPipelineCancelledError();
    pipeline.currentStage = "l3";
    const l3Start = Date.now();
    this._setStage(pipeline, "l3", {
      operationStatus: OPERATION_STATUS.RUNNING,
      providerStatus: "RUNNING",
      summary: "Truy vấn bằng chứng thực tế đa nguồn qua Tavily search...",
      startedAt: new Date().toISOString(),
    });
    await this._emit(pipeline, "STAGE_STARTED", onTransition);

    let l3Result;
    try {
      l3Result = await this.friendBackendAdapter.verifyLayer3({
        input,
        claims: l1Result.claims || [],
        requestId,
        signal: callerSignal,
      });
    } catch (error) {
      if (callerSignal?.aborted || error?.name === "AbortError") throw new TrustPipelineCancelledError();
      l3Result = unavailableLayer3(requestId, boundedCode(error, "L3_PROVIDER_ERROR"));
    }
    const l3Timing = { startedAt: new Date(l3Start).toISOString(), completedAt: new Date().toISOString(), latencyMs: Date.now() - l3Start };
    const l3RawVerdict = l3RawVerdictFor(l3Result);
    const l3Finding = l3FindingFor(l3Result, l3RawVerdict);
    const l3ProviderStatus = providerStatusFor(l3Result);
    const l3CanContinue = canContinueToLayer4(l3Result);
    const l3Partial = providerIsBlocked(l3Result);
    const l3Integration = l3Result?.legacyIntegration || {};
    this._setStage(pipeline, "l3", createStageEnvelope({
      stageId: "l3",
      requestId,
      operationStatus: l3Partial ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.COMPLETED,
      finding: l3Finding,
      severity: l3Finding === "CONTRADICTED" ? "HIGH" : "INFO",
      providerStatus: l3ProviderStatus,
      providerId: l3Result?.metrics?.retrievalProvider || "tavily_web_retriever",
      confidence: typeof l3Integration.legacyAssessmentConfidence === "number"
        ? l3Integration.legacyAssessmentConfidence
        : typeof l3Result?.evidenceConfidence === "number" ? l3Result.evidenceConfidence : null,
      summary: providerUnavailableReason(l3Result, "Tavily không trả về đủ bằng chứng để kết luận."),
      reasons: [l3Integration.reason, l3Result?.reason].filter(Boolean),
      signals: [
        signal("SOURCES_CHECKED", `${l3Result?.sources?.length || 0} source(s), ${l3Result?.evidence?.length || 0} evidence item(s).`, "tavily_retriever", "INFO"),
        signal("TAVILY_VERDICT", l3RawVerdict, "friend_backend_layer3", "INFO"),
        signal("LAYER4_CONTINUATION", l3CanContinue ? "ALLOWED" : "STOPPED", "sequential_policy", l3CanContinue ? "INFO" : "WARN"),
        ...(l3Partial ? [signal("PROVIDER_STATUS", l3ProviderStatus, "tavily_retriever", "WARN")] : []),
      ],
      evidenceRefs: evidenceRefsFor(l3Result),
      startedAt: l3Timing.startedAt,
      completedAt: l3Timing.completedAt,
      latencyMs: l3Timing.latencyMs,
      safeToContinue: l3CanContinue,
      rawMetadata: l3Result,
    }));
    rawResults.layer3 = l3Result;
    publishLayerResults();
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);

    if (!l3CanContinue) {
      const stopReason = l3Partial
        ? "Layer 3 provider không khả dụng; Layer 4 không được phép tự động chạy."
        : "Layer 3 không cấp quyền canContinueToLayer4; pipeline dừng theo response contract.";
      await this._skipStage(pipeline, "l4", stopReason, onTransition);
      return finalize(l3Partial ? PIPELINE_STATUS.PARTIAL : PIPELINE_STATUS.COMPLETED);
    }

    // ----------------------------------------------------
    // LAYER 4: Groq/Gemini Final AI Verification via Friend Backend
    // ----------------------------------------------------
    if (callerSignal?.aborted) throw new TrustPipelineCancelledError();
    pipeline.currentStage = "l4";
    const l4Start = Date.now();
    this._setStage(pipeline, "l4", {
      operationStatus: OPERATION_STATUS.RUNNING,
      providerStatus: "RUNNING",
      summary: "Tổng hợp phán quyết bằng mô hình suy luận độc lập (Gemini/Groq)...",
      startedAt: new Date().toISOString(),
    });
    await this._emit(pipeline, "STAGE_STARTED", onTransition);

    let l4Result;
    try {
      l4Result = await this.friendBackendAdapter.verifyLayer4({
        input,
        layer3Result: l3Result,
        mode: input.mode || "user",
        requestId,
        signal: callerSignal,
      });
    } catch (error) {
      if (callerSignal?.aborted || error?.name === "AbortError") throw new TrustPipelineCancelledError();
      l4Result = unavailableLayer4(requestId, boundedCode(error, "L4_PROVIDER_ERROR"));
    }
    const l4Timing = { startedAt: new Date(l4Start).toISOString(), completedAt: new Date().toISOString(), latencyMs: Date.now() - l4Start };
    const l4RawVerdict = l4RawVerdictFor(l4Result);
    const l4ProviderStatus = providerStatusFor(l4Result);
    const l4Partial = providerIsBlocked(l4Result);
    const isMalicious = ["FALSE", "FAKE", "MALICIOUS", "DANGEROUS", "CONTRADICTED"].includes(l4RawVerdict);
    const isSuspicious = ["SUSPICIOUS", "MISLEADING", "MIXED"].includes(l4RawVerdict);
    const isSafe = ["TRUE", "SUPPORTED", "SAFE"].includes(l4RawVerdict);
    const l4Finding = l4Partial ? "UNKNOWN" : isMalicious ? "MALICIOUS" : isSuspicious ? "SUSPICIOUS" : isSafe ? "NO_KNOWN_THREAT" : "UNKNOWN";
    const activeModel = l4Result?.groqModel || l4Result?.geminiModel || null;
    this._setStage(pipeline, "l4", createStageEnvelope({
      stageId: "l4",
      requestId,
      operationStatus: l4Partial ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.COMPLETED,
      finding: l4Finding,
      severity: isMalicious ? "CRITICAL" : isSuspicious ? "HIGH" : "INFO",
      providerStatus: l4ProviderStatus,
      providerId: l4Result?.providerId || activeModel || "friend_backend_layer4",
      modelId: activeModel,
      confidence: typeof l4Result?.assessmentConfidence === "number"
        ? l4Result.assessmentConfidence
        : typeof l4Result?.confidence === "number" ? l4Result.confidence : null,
      summary: providerUnavailableReason(l4Result, "Layer 4 không trả về kết luận xác định."),
      reasons: [l4Result?.reason].filter(Boolean),
      signals: [
        signal("AI_MODEL_PRIMARY", activeModel || "UNKNOWN", "friend_backend_layer4", "INFO"),
        signal("DECISION_AUTHORITY", "FRIEND_BACKEND_AI", "friend_backend_layer4", "INFO"),
        signal("AI_VERDICT", l4RawVerdict, "friend_backend_layer4", isMalicious ? "CRITICAL" : "INFO"),
        ...(l4Partial ? [signal("PROVIDER_STATUS", l4ProviderStatus, "friend_backend_layer4", "WARN")] : []),
      ],
      evidenceRefs: evidenceRefsFor(l4Result),
      startedAt: l4Timing.startedAt,
      completedAt: l4Timing.completedAt,
      latencyMs: l4Timing.latencyMs,
      safeToContinue: false,
      rawMetadata: l4Result,
    }));
    rawResults.layer4 = l4Result;
    publishLayerResults();
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);

    return finalize(l4Partial ? PIPELINE_STATUS.PARTIAL : PIPELINE_STATUS.COMPLETED);
  }
}

export function createTrustOrchestrator(options = {}) {
  return new TrustOrchestrator(options);
}
