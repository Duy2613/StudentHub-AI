/**
 * Canonical StudentHub-owned Trust pipeline.
 *
 * This is the only orchestrator used by the public /api/v1/trust V5 route.
 * Historical seven-slot V5 and legacy adapter code stays isolated in its own
 * module for compatibility. An explicitly configured legacy adapter may add
 * bounded Layer 2/3/4 observations; this path still has no public L5 and no
 * provider work after Final Predict.
 */

import { createHash } from "node:crypto";
import { createSecureId } from "../security/secureId.js";
import { Layer1ScreenService } from "./layer1/Layer1ScreenService.js";
import { Layer2AReputationService } from "./layer2a/Layer2AReputationService.js";
import { Layer2SemanticService } from "./layer2/Layer2SemanticService.js";
import { Layer3EvidenceService } from "./layer3/Layer3EvidenceService.js";
import { Layer4TrustService } from "./layer4/Layer4TrustService.js";
import { createLayer4Result } from "./layer4/types.js";
import { StudentDomainRiskModel } from "./v5/l2c/StudentDomainRiskModel.js";
import {
  FOUR_LAYER_MODEL,
  FOUR_LAYER_PIPELINE_VERSION,
  FOUR_LAYER_STAGE_IDS,
  OPERATION_STATUS,
  PIPELINE_STATUS,
  createInitialPipeline,
  createStageEnvelope,
  toPublicPipelineResult,
} from "./v5/contracts.js";
import {
  stageFromL1,
  stageFromL2A,
  stageFromL2B,
  stageFromL2C,
  stageFromL3,
  stageFromL4,
} from "./v5/stageAdapters.js";
import { TrustPipelineCancelledError } from "./v5/TrustPipelineOrchestrator.js";
import { buildCanonicalTrustProjection } from "./integrations/canonicalTrustProjection.js";

const TRANSIENT_L2_STATUS = new Set([
  "TIMEOUT", "RATE_LIMITED", "AUTH_FAILED", "MODEL_NOT_AVAILABLE", "NETWORK_ERROR",
  "NOT_CONFIGURED", "UNAVAILABLE", "INVALID_RESPONSE", "ERROR", "PARTIAL", "DEGRADED",
]);

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function boundedText(value, limit = 700) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").trim().slice(0, limit)
    : "";
}

function boundedArray(value, limit = 40) {
  return Array.isArray(value) ? value.slice(0, limit) : [];
}

function nowIso() {
  return new Date().toISOString();
}

function cloneSafe(value) {
  try {
    return JSON.parse(JSON.stringify(value));
  } catch {
    return value;
  }
}

function inputFingerprint(input) {
  return createHash("sha256").update(JSON.stringify(input), "utf8").digest("hex");
}

function normalizeInput(value) {
  const input = asObject(value);
  const type = ["text", "url", "image", "file", "qr"].includes(String(input.type || "text").toLowerCase())
    ? String(input.type || "text").toLowerCase()
    : "text";
  const metadata = asObject(input.metadata);
  const allowedMetadata = [
    "url", "ocrText", "qrContent", "qrPayload", "mimeType", "fileName", "fileSize", "extractionAuthority",
    "institutionContext", "mediaArtifactId", "imageHash", "width", "height", "bytes",
  ];
  const safeMetadata = Object.fromEntries(allowedMetadata
    .filter((key) => Object.hasOwn(metadata, key))
    .map((key) => {
      const item = metadata[key];
      if (key === "bytes" && (Buffer.isBuffer(item) || item instanceof Uint8Array || Array.isArray(item))) return [key, item];
      if (typeof item === "string") return [key, boundedText(item, key === "ocrText" || key === "qrContent" || key === "qrPayload" ? 32_000 : 2_048)];
      if (typeof item === "number" && Number.isFinite(item) && item >= 0) return [key, item];
      return [key, null];
    })
    .filter(([, item]) => item !== null));
  return {
    type,
    content: boundedText(input.content, 500_000),
    metadata: safeMetadata,
  };
}

function statusText(...values) {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value.trim().toUpperCase();
  }
  return "UNKNOWN";
}

function providerFailure(status) {
  return TRANSIENT_L2_STATUS.has(statusText(status)) || ["UNKNOWN", "NOT_CONFIGURED", "INVALID_INPUT"].includes(statusText(status));
}

function adapterIsEnabled(adapter) {
  if (!adapter || typeof adapter !== "object") return false;
  if (adapter.enabled === true || adapter.isConfigured === true) return true;
  try {
    return typeof adapter.isConfigured === "function" && adapter.isConfigured() === true;
  } catch {
    return false;
  }
}

function createUnknownLayer2A(requestId, errorCode = "LAYER2A_UNAVAILABLE") {
  return {
    provider: "StudentHub Threat Intelligence",
    providerStatus: "UNAVAILABLE",
    finding: "UNKNOWN",
    rawVerdict: "UNKNOWN",
    providerConfidence: null,
    providerResults: [],
    threatTypes: [],
    errorCode,
    message: "StudentHub threat intelligence did not return a usable result.",
    requestId,
  };
}

function createUnknownLayer2B(requestId, errorCode = "LAYER2B_UNAVAILABLE") {
  return {
    layer: 2,
    status: "UNKNOWN",
    classification: "UNKNOWN",
    confidence: 0,
    semanticSummary: "Semantic provider did not return a usable result.",
    intent: "UNKNOWN",
    claims: [],
    entities: [],
    contextSignals: [],
    verificationPackage: { status: "UNKNOWN", claims: [], candidateSources: [], candidateOnly: true },
    nextLayer: 3,
    requestId,
    details: { providerStatus: "UNAVAILABLE", providerErrorType: errorCode, providerIndependent: true },
    metrics: { providerStatus: "UNAVAILABLE", modelUsed: "semantic_boundary", providerIndependent: true },
  };
}

function createUnknownLayer2C(requestId, errorCode = "LAYER2C_UNAVAILABLE") {
  return {
    classification: "UNKNOWN_STUDENT_RISK",
    riskSignals: [],
    explanation: "Student context model did not return a usable result.",
    verificationPackage: { status: "UNKNOWN", verificationTasks: [], candidateOnly: true },
    modelStatus: "UNAVAILABLE",
    errorCode,
    requestId,
  };
}

function createUnknownLayer3(requestId, errorCode = "TAVILY_UNAVAILABLE") {
  return {
    status: "UNAVAILABLE",
    claims: [],
    claimStatuses: {},
    sources: [],
    evidence: [],
    conflicts: [],
    verificationCompleteness: 0,
    evidenceConfidence: 0,
    crossSourceAgreement: { agreementScore: 0, unresolved: true },
    retrievalStatus: "UNAVAILABLE",
    retrievalMode: "TAVILY_UNAVAILABLE",
    externalEvidence: false,
    limitations: ["Tavily did not return usable external evidence; no local corpus was substituted."],
    auditEvents: [{ type: "RETRIEVER_FAILURE", code: errorCode, at: nowIso() }],
    metrics: {
      queriesExecutedCount: 0,
      sourcesRetrievedCount: 0,
      evidenceItemsCount: 0,
      retrievalProvider: "tavily_evidence_retriever",
      retrievalStatus: "UNAVAILABLE",
      retrievalMode: "TAVILY_UNAVAILABLE",
      externalEvidence: false,
      providerCallCount: 0,
      providerAcceptedResultCount: 0,
      providerAcceptedHostCount: 0,
    },
    requestId,
  };
}

function createUnknownLayer4(requestId, errorCode = "LAYER4_UNAVAILABLE") {
  return createLayer4Result({
    classification: "INSUFFICIENT_EVIDENCE",
    status: "REVIEW",
    securityClassification: "UNKNOWN",
    truthStatus: "INSUFFICIENT_EVIDENCE",
    enforcement: "REVIEW",
    recommendedAction: "REVIEW",
    decisionConfidence: 0,
    verificationCompleteness: 0,
    keyReasons: ["Layer 4 did not return a usable synthesis."],
    limitations: ["Gemini synthesis was unavailable; the result remains conservative."],
    userExplanation: {
      verdictTitle: "Chưa đủ bằng chứng",
      why: "Layer 4 chưa thể tổng hợp một kết luận đủ tin cậy.",
      riskSummary: "Chưa thể phân loại chắc chắn.",
      recommendedActionNote: "Review trước khi hành động.",
      uncertainties: [errorCode],
    },
    aiVerificationStatus: "UNAVAILABLE",
    aiVerificationErrorType: errorCode,
    aiOperationStatus: "PARTIAL",
    auditTrail: { requestId, fusedEvidenceCount: 0, evidenceBound: true },
    metrics: { providerStatus: "UNAVAILABLE", modelUsed: "deterministic_policy" },
  });
}

function checksFromLayer1(result) {
  const detectors = [
    ...boundedArray(result?.metrics?.detectorsExecuted, 24),
    "DecisionEngine",
  ].filter((item, index, list) => typeof item === "string" && item && list.indexOf(item) === index);
  return detectors.map((check) => ({
    check,
    name: check,
    status: "EXECUTED",
    result: statusText(result?.status, "UNKNOWN"),
    details: "Detector đã được thực thi trong Layer 1 deterministic screen.",
    executedAt: result?.checkedAt || nowIso(),
  }));
}

function providerObservation(providerResult, fallbackProvider = "StudentHub provider") {
  const item = asObject(providerResult);
  return {
    provider: boundedText(item.provider, 160) || fallbackProvider,
    providerId: boundedText(item.providerId, 160) || boundedText(item.provider, 160) || fallbackProvider,
    status: statusText(item.status, item.success === true ? "SUCCESS" : "UNKNOWN"),
    finding: boundedText(item.finding || item.verdict, 120) || "UNKNOWN",
    verdict: boundedText(item.verdict, 80) || "UNKNOWN",
    success: item.success === true,
    confidence: typeof item.confidence === "number" && Number.isFinite(item.confidence) ? item.confidence : null,
    message: boundedText(item.message, 500) || "Provider returned no message.",
    latencyMs: Number.isFinite(Number(item.latencyMs)) ? Number(item.latencyMs) : null,
    errorCode: boundedText(item.errorCode, 120) || null,
    signals: boundedArray(item.signals || item.threatTypes, 12).map((signal) => boundedText(signal, 240)).filter(Boolean),
    executed: item.executed !== false,
    observedAt: item.observedAt || nowIso(),
  };
}

function combineLayer2({ layer2A, layer2B, layer2C, input, requestId }) {
  const l2aProviders = boundedArray(layer2A?.providerResults, 20).map((item) => providerObservation(item, layer2A?.provider || "StudentHub Threat Intelligence"));
  if (!l2aProviders.length && layer2A?.providerStatus) {
    l2aProviders.push(providerObservation({
      provider: layer2A.provider || "StudentHub Threat Intelligence",
      status: layer2A.providerStatus,
      verdict: layer2A.rawVerdict || "UNKNOWN",
      success: layer2A.providerStatus === "SUCCESS",
      message: layer2A.message || layer2A.errorCode || "No provider detail returned.",
      finding: layer2A.finding,
      executed: layer2A.finding !== "NOT_APPLICABLE",
    }, "StudentHub Threat Intelligence"));
  }
  const semanticStatus = statusText(layer2B?.details?.providerStatus, layer2B?.metrics?.providerStatus, "LOCAL_DETERMINISTIC");
  const domainStatus = statusText(layer2C?.modelStatus, "BASELINE_RULE_MODEL");
  const observations = [
    ...l2aProviders,
    providerObservation({
      provider: layer2B?.details?.providerId || layer2B?.metrics?.modelUsed || "StudentHub Semantic Engine",
      providerId: layer2B?.details?.providerId || layer2B?.metrics?.modelUsed || "studenthub_semantic_engine",
      status: semanticStatus,
      verdict: layer2B?.classification || layer2B?.status || "UNKNOWN",
      finding: layer2B?.classification || layer2B?.status,
      success: !providerFailure(semanticStatus),
      message: layer2B?.semanticSummary || layer2B?.details?.decisionRationale || "Semantic analysis completed.",
      latencyMs: layer2B?.details?.providerLatencyMs,
      signals: layer2B?.contextSignals,
      executed: true,
    }, "StudentHub Semantic Engine"),
    providerObservation({
      provider: "StudentHub Student Context Model",
      providerId: "studenthub_student_context_model",
      status: domainStatus,
      verdict: layer2C?.classification || "UNKNOWN_STUDENT_RISK",
      finding: layer2C?.classification || "UNKNOWN_STUDENT_RISK",
      success: domainStatus !== "UNAVAILABLE" && domainStatus !== "ERROR",
      message: layer2C?.explanation || "Student context analysis completed.",
      signals: layer2C?.riskSignals,
      executed: true,
    }, "StudentHub Student Context Model"),
  ];
  const threatMatch = layer2A?.finding === "THREAT_MATCH";
  const semanticSuspicious = ["DECEPTIVE", "SUSPICIOUS", "NEEDS_VERIFICATION", "REVIEW_REQUIRED"].includes(statusText(layer2B?.classification, layer2B?.status)) ||
    boundedArray(layer2B?.contextSignals).length > 0 || boundedArray(layer2C?.riskSignals).length > 0;
  const providerPartial = observations.some((item) => item.success !== true && item.executed !== false);
  const finding = threatMatch
    ? "THREAT_MATCH"
    : semanticSuspicious
      ? (boundedArray(layer2B?.contextSignals).some((item) => /credential|payment|urgency|impersonation/i.test(String(item?.type || item?.code || ""))) ? "MANIPULATION_DETECTED" : "SEMANTIC_SUSPICIOUS")
      : layer2A?.finding === "NOT_APPLICABLE" && layer2B?.status === "UNKNOWN"
        ? "UNKNOWN"
        : "NO_KNOWN_THREAT";
  const status = providerPartial || layer2B?.status === "UNKNOWN" || layer2C?.modelStatus === "UNAVAILABLE" ? "PARTIAL" : "COMPLETED";
  const reasons = [
    layer2A?.message,
    layer2B?.semanticSummary,
    layer2B?.details?.decisionRationale,
    layer2C?.explanation,
  ].map((item) => boundedText(item, 700)).filter(Boolean).slice(0, 16);
  return {
    layer: 2,
    status,
    finding,
    classification: layer2B?.classification || "UNKNOWN",
    provider: "StudentHub L2 composite",
    providerStatus: status,
    providerObservations: observations,
    providers: observations,
    threatTypes: boundedArray(layer2A?.threatTypes, 20),
    semanticSummary: boundedText(layer2B?.semanticSummary, 900),
    semanticSignals: boundedArray(layer2B?.contextSignals, 30),
    contextSignals: boundedArray(layer2B?.contextSignals, 30),
    riskSignals: boundedArray(layer2C?.riskSignals, 30),
    claims: boundedArray(layer2B?.claims, 40),
    entities: boundedArray(layer2B?.entities, 40),
    verificationPackage: layer2C?.verificationPackage || layer2B?.verificationPackage || null,
    confidence: typeof layer2B?.confidence === "number" ? layer2B.confidence : null,
    reasons,
    conclusion: threatMatch
      ? "Threat intelligence reported a matching threat; semantic and context signals cannot downgrade it."
      : providerPartial
        ? "One or more Layer 2 providers are partial or unavailable; the result remains unresolved."
        : semanticSuspicious
          ? "Semantic or student-context signals require external evidence before a final trust decision."
          : "Layer 2 did not find a known threat or material semantic/context signal in the executed checks.",
    continuation: "L3_EVIDENCE_RETRIEVAL",
    safeToContinue: true,
    requestId,
    details: {
      inputType: input.type,
      threatFinding: layer2A?.finding || "UNKNOWN",
      semanticProviderStatus: semanticStatus,
      studentContextModelStatus: domainStatus,
      providerPartial,
    },
  };
}

function makeCanonicalStage(stageId, raw, requestId, operationStatus, startedAt, completedAt) {
  let adapted = {};
  if (stageId === "l1") adapted = stageFromL1(raw, requestId, { startedAt, completedAt, operationStatus });
  if (stageId === "l3") adapted = stageFromL3(raw, requestId, { startedAt, completedAt, operationStatus });
  if (stageId === "l4") adapted = stageFromL4(raw, requestId, { startedAt, completedAt, operationStatus });
  if (stageId === "l2") {
    const l2a = stageFromL2A(raw?.layer2A || {}, requestId, { startedAt, completedAt, operationStatus }, false);
    const l2b = stageFromL2B(raw?.layer2B || {}, requestId, { startedAt, completedAt, operationStatus });
    const l2c = stageFromL2C(raw?.layer2C || {}, requestId, { startedAt, completedAt, operationStatus });
    adapted = {
      ...l2b,
      finding: raw.finding,
      providerStatus: raw.providerStatus,
      providerId: raw.provider,
      confidence: raw.confidence,
      summary: raw.conclusion,
      reasons: raw.reasons,
      signals: [...(l2a.signals || []), ...(l2b.signals || []), ...(l2c.signals || [])].slice(0, 40),
      evidenceRefs: [],
      meaning: "Layer 2 gộp quan sát threat, semantic và student context; đây chưa phải kết luận sự thật cuối cùng.",
      notProve: "Provider lỗi hoặc không có match không phải SAFE; semantic/domain signal không tự chứng minh claim.",
      userAction: "Chờ Layer 3 đối chiếu nguồn live và Layer 4 tổng hợp.",
      safeToContinue: true,
      rawMetadata: { providerObservations: raw.providerObservations, status: raw.status },
    };
  }
  return createStageEnvelope({
    ...adapted,
    ...raw,
    stageId,
    pipelineModel: FOUR_LAYER_MODEL,
    requestId,
    operationStatus,
    startedAt,
    completedAt,
    latencyMs: Math.max(0, new Date(completedAt).getTime() - new Date(startedAt).getTime()),
  });
}

function stageOperationStatus(stageId, raw) {
  if (stageId === "l1") return OPERATION_STATUS.COMPLETED;
  if (stageId === "l2") return raw.status === "PARTIAL" ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.COMPLETED;
  if (stageId === "l3") return ["UNAVAILABLE", "PARTIAL", "TIMEOUT", "RATE_LIMITED", "NOT_CONFIGURED", "ERROR", "INVALID_RESPONSE"].includes(statusText(raw.status, raw.retrievalStatus))
    ? OPERATION_STATUS.PARTIAL
    : OPERATION_STATUS.COMPLETED;
  const aiStatus = statusText(raw.aiVerificationStatus, raw.aiOperationStatus);
  return ["UNAVAILABLE", "PARTIAL", "DEGRADED", "ERROR", "INVALID_RESPONSE"].includes(aiStatus) ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.COMPLETED;
}

function finalPredict({ layer1, layer2, layer3, layer4 }) {
  const l1Blocked = layer1?.status === "BLOCK" || layer1?.finding === "LOCAL_BLOCK";
  const l2Threat = layer2?.finding === "THREAT_MATCH" || layer2?.securityClassification === "MALICIOUS";
  const sources = boundedArray(layer3?.sources, 40);
  const evidence = boundedArray(layer3?.evidence, 80);
  const usableSources = sources.filter((source) => source?.liveEvidence === true && source?.retrievalOutcome === "SUCCESS");
  const evidenceCount = evidence.length;
  const insufficientEvidence = usableSources.length === 0 || evidenceCount === 0 || layer3?.externalEvidence !== true;
  const securityClassification = l1Blocked || l2Threat
    ? "MALICIOUS"
    : layer4?.securityClassification || "UNKNOWN";
  const securityRisk = l1Blocked || l2Threat
    ? "CRITICAL"
    : layer4?.riskAssessment?.level || "UNKNOWN";
  const truthStatus = insufficientEvidence
    ? "INSUFFICIENT_EVIDENCE"
    : layer4?.truthStatus || layer4?.truthAssessment?.status || "INSUFFICIENT_EVIDENCE";
  const recommendedAction = l1Blocked || l2Threat
    ? "BLOCK"
    : insufficientEvidence
      ? "REVIEW"
      : layer4?.enforcement || layer4?.recommendedAction || "REVIEW";
  const decisionConfidence = insufficientEvidence
    ? Math.min(Number(layer4?.decisionConfidence) || 0, 0.35)
    : Number(layer4?.decisionConfidence) || 0;
  const evidenceAgreement = layer3?.crossSourceAgreement?.agreementScore ?? layer3?.crossSourceAgreement?.status ?? null;
  const sourceQuality = usableSources.length
    ? Number((usableSources.reduce((total, source) => total + (Number(source.authorityScore) || 0), 0) / usableSources.length).toFixed(4))
    : null;
  const reasons = [
    ...(l1Blocked ? ["Layer 1 phát hiện hard block kỹ thuật."] : []),
    ...(l2Threat ? ["Layer 2 threat intelligence có threat match; không bị hạ cấp bởi các lớp sau."] : []),
    ...boundedArray(layer4?.keyReasons, 8),
    ...(insufficientEvidence ? ["Không có đủ nguồn Tavily live usable để nâng kết luận sự thật."] : []),
  ].map((item) => boundedText(item, 700)).filter(Boolean).slice(0, 20);
  const uncertainty = [
    ...(insufficientEvidence ? ["Evidence sufficiency chưa đạt vì nguồn live usable bằng 0 hoặc evidence item bằng 0."] : []),
    ...boundedArray(layer4?.userExplanation?.uncertainties, 12),
    ...boundedArray(layer3?.limitations, 8),
  ].map((item) => boundedText(typeof item === "string" ? item : item?.details, 700)).filter(Boolean).slice(0, 20);
  const geminiCitationSources = boundedArray(layer4?.aiVerification?.citationsUsed, 20)
    .filter((citation) => typeof citation?.url === "string" && /^https?:\/\//i.test(citation.url))
    .map((citation, index) => ({
      sourceId: citation.id || `gemini-citation-${index + 1}`,
      url: citation.url,
      title: citation.title || citation.id || "Gemini validated citation",
      publisher: citation.retrievalOrigin === "GEMINI_GENERATED" ? "Gemini independent citation" : "Layer 3 validated source",
      domain: (() => {
        try { return new URL(citation.url).hostname; } catch { return null; }
      })(),
      sourceType: "AI_CITED_URL",
      retrievalOrigin: citation.retrievalOrigin || "GEMINI_GENERATED",
      validationStatus: citation.validationStatus || "REACHABLE",
      httpStatus: citation.httpStatus || null,
      requestedUrl: citation.requestedUrl || null,
    }));
  const keySources = Array.from(new Map([
    ...usableSources.slice(0, 8),
    ...geminiCitationSources,
  ].map((source) => [source?.url || source?.sourceId, source])).values()).slice(0, 16);
  return {
    status: "READY",
    verdict: truthStatus,
    truthVerdict: truthStatus,
    truthStatus,
    truthAssessment: layer4?.truthAssessment?.status || truthStatus,
    security: securityClassification,
    securityClassification,
    securityRisk,
    recommendedAction,
    action: recommendedAction,
    assessmentConfidence: Number(decisionConfidence.toFixed(4)),
    decisionConfidence: Number(decisionConfidence.toFixed(4)),
    evidenceAgreement,
    sourceQuality,
    evidenceSufficiency: insufficientEvidence ? "INSUFFICIENT" : "SUFFICIENT",
    independentSourceCount: usableSources.length,
    evidenceCount,
    sourceCount: sources.length,
    keyReasons: reasons,
    remainingUncertainty: uncertainty,
    keySources,
    evidenceRefs: boundedArray(layer4?.evidenceRefs, 40),
    derivedFrom: [...FOUR_LAYER_STAGE_IDS],
    traceability: [
      { source: "l1", stage: "l1", field: "status", reason: layer1?.status || "UNKNOWN", value: layer1?.status || "UNKNOWN" },
      { source: "l2", stage: "l2", field: "finding", reason: layer2?.finding || "UNKNOWN", value: layer2?.finding || "UNKNOWN" },
      { source: "l3", stage: "l3", field: "externalEvidence", reason: layer3?.externalEvidence === true ? "LIVE_EVIDENCE" : "NO_LIVE_EVIDENCE", value: layer3?.externalEvidence === true ? "true" : "false" },
      { source: "l4", stage: "l4", field: "aiExecutedModel", reason: layer4?.aiExecutedModel || "AI_UNAVAILABLE", value: layer4?.aiExecutedModel || "UNKNOWN" },
    ],
    calls: {
      tavily: Number(layer3?.metrics?.providerCallCount) || 0,
      ai: Array.isArray(layer4?.aiModelTrace) ? layer4.aiModelTrace.length : 0,
      gemini: Array.isArray(layer4?.aiModelTrace) ? layer4.aiModelTrace.length : 0,
      finalPredict: 0,
    },
  };
}

function finalDecisionFromPredict(predict) {
  return {
    security: predict.securityClassification,
    truth: predict.truthStatus,
    action: predict.recommendedAction,
    securityClassification: predict.securityClassification,
    truthStatus: predict.truthStatus,
    enforcement: predict.recommendedAction,
    decisionConfidence: predict.decisionConfidence,
    evidenceSufficiency: predict.evidenceSufficiency,
    decisionAuthority: "FINAL_PREDICT_DETERMINISTIC",
    aiOverride: false,
  };
}

export class OwnBackendTrustOrchestrator {
  constructor(options = {}) {
    const services = asObject(options.services);
    this.services = {
      l1: typeof services.l1 === "function" ? services.l1 : (params) => Layer1ScreenService.screen(params),
      l2a: typeof services.l2a === "function" ? services.l2a : (params) => Layer2AReputationService.verify(params),
      l2b: typeof services.l2b === "function" ? services.l2b : (params) => Layer2SemanticService.verify(params),
      l2c: typeof services.l2c === "function" ? services.l2c : (params) => StudentDomainRiskModel.analyze({ content: params.content, inputType: params.inputType }, { context: params.context }),
      l3: typeof services.l3 === "function" ? services.l3 : (params) => Layer3EvidenceService.verify(params),
      l4: typeof services.l4 === "function" ? services.l4 : (params) => Layer4TrustService.evaluate(params),
    };
    this.layer2AProvider = options.layer2AProvider || null;
    this.semanticProvider = options.semanticProvider || null;
    this.retriever = options.retriever || null;
    this.legacyVerificationAdapter = options.legacyVerificationAdapter || null;
    this.legacyVerificationEnabled = adapterIsEnabled(this.legacyVerificationAdapter);
    this._activeController = null;
    this._lastRun = null;
    this._lastInput = null;
  }

  _assertActive(signal) {
    if (signal?.aborted) throw new TrustPipelineCancelledError();
  }

  async _emit(pipeline, event, onTransition) {
    if (typeof onTransition !== "function") return;
    try {
      await onTransition({
        event,
        stageId: pipeline.currentStage,
        pipeline: toPublicPipelineResult(cloneSafe(pipeline)),
      });
    } catch {
      // A stream observer cannot change the canonical result.
    }
  }

  async _executeLayer(stageId, worker, pipeline, rawResults, signal, onTransition, options = {}) {
    this._assertActive(signal);
    const startedAt = nowIso();
    pipeline.currentStage = stageId;
    if (!pipeline.audit.stageSequence.includes(stageId)) pipeline.audit.stageSequence.push(stageId);
    pipeline.stages[stageId] = createStageEnvelope({
      ...pipeline.stages[stageId],
      stageId,
      pipelineModel: FOUR_LAYER_MODEL,
      operationStatus: OPERATION_STATUS.RUNNING,
      startedAt,
      completedAt: null,
      providerStatus: "RUNNING",
      summary: "Layer đang thực thi; chưa có finding cuối.",
      safeToContinue: false,
      requestId: pipeline.requestId,
    });
    await this._emit(pipeline, "STAGE_STARTED", onTransition);

    let raw;
    let errorCode = null;
    try {
      raw = await worker();
      this._assertActive(signal);
    } catch (error) {
      if (signal?.aborted || error?.name === "AbortError" || error?.code === "PIPELINE_CANCELLED") throw new TrustPipelineCancelledError();
      errorCode = boundedText(error?.code || error?.name || "STAGE_FAILURE", 120) || "STAGE_FAILURE";
      raw = options.fallback?.(error) || {};
    }
    const completedAt = nowIso();
    const operationStatus = errorCode ? OPERATION_STATUS.PARTIAL : stageOperationStatus(stageId, raw || {});
    const stage = makeCanonicalStage(stageId, raw || {}, pipeline.requestId, operationStatus, startedAt, completedAt);
    if (errorCode) {
      stage.providerErrorType = errorCode;
      stage.audit = { ...stage.audit, errorCode, transition: OPERATION_STATUS.PARTIAL };
    }
    pipeline.stages[stageId] = stage;
    rawResults[stageId] = raw || {};
    pipeline.layerResults[`layer${stageId === "l1" ? "1" : stageId === "l2" ? "2" : stageId === "l3" ? "3" : "4"}`] = raw || {};
    pipeline.audit.stageAttempts.push({
      stageId,
      attempt: 1,
      status: operationStatus,
      finding: stage.finding,
      errorCode,
      startedAt,
      completedAt,
    });
    if (stage.finding === "LOCAL_BLOCK" || stage.finding === "THREAT_MATCH") {
      pipeline.audit.hardNegativePropagation.push({ source: stageId, finding: stage.finding, destination: "final_predict", expected: "BLOCK/MALICIOUS" });
    }
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);
    if (stageId === "l1" && typeof options.onL1ClaimReady === "function") {
      try {
        options.onL1ClaimReady({ l1Result: rawResults.l1, input: options.input, pipeline, requestId: pipeline.requestId });
      } catch {
        // Expert dispatch is observational and never changes Trust output.
      }
    }
    return { raw: raw || {}, stage, partial: operationStatus === OPERATION_STATUS.PARTIAL };
  }

  async run(rawInput = {}, options = {}) {
    if (this._activeController) this._activeController.abort("superseded-by-new-run");
    const controller = new AbortController();
    this._activeController = controller;
    const callerSignal = options.signal;
    const forwardAbort = () => controller.abort(callerSignal?.reason || "caller-aborted");
    if (callerSignal?.aborted) forwardAbort();
    else callerSignal?.addEventListener("abort", forwardAbort, { once: true });

    const input = normalizeInput(rawInput);
    const requestId = boundedText(options.requestId, 160) || createSecureId("req_four_layer");
    const pipeline = createInitialPipeline({ requestId, startedAt: nowIso(), pipelineModel: FOUR_LAYER_MODEL });
    pipeline.pipelineVersion = FOUR_LAYER_PIPELINE_VERSION;
    pipeline.pipelineStatus = PIPELINE_STATUS.RUNNING;
    pipeline.audit.inputFingerprint = inputFingerprint(input);
    pipeline.layerResults = { layer1: null, layer2: null, layer3: null, layer4: null };
    const rawResults = {};
    let partial = false;

    try {
      await this._emit(pipeline, "PIPELINE_STARTED", options.onTransition);
      const l1 = await this._executeLayer(
        "l1",
        async () => {
          const result = await this.services.l1({ ...input, options: { requestId, signal: controller.signal } });
          return { ...asObject(result), checksPerformed: checksFromLayer1(result) };
        },
        pipeline,
        rawResults,
        controller.signal,
        options.onTransition,
        { input, onL1ClaimReady: options.onL1ClaimReady, fallback: () => ({ status: "UNKNOWN", reasons: ["Layer 1 failure"], signals: [], metrics: { detectorsExecuted: [] }, checksPerformed: [] }) },
      );
      partial ||= l1.partial;

      const l2 = await this._executeLayer(
        "l2",
        async () => {
          const url = input.type === "url" ? input.content || input.metadata.url || "" : "";
          const reputationProvider = this.layer2AProvider || (
            this.legacyVerificationEnabled && typeof this.legacyVerificationAdapter?.layer2Provider === "function"
              ? this.legacyVerificationAdapter.layer2Provider()
              : null
          );
          const [l2aSettled, l2bSettled] = await Promise.allSettled([
            this.services.l2a({ url, requestId, options: { ...(reputationProvider ? { provider: reputationProvider } : {}), signal: controller.signal } }),
            this.services.l2b({
              ...input,
              layer1Result: l1.raw,
              options: { requestId, signal: controller.signal, ...(this.semanticProvider ? { provider: this.semanticProvider } : {}) },
            }),
          ]);
          const layer2A = l2aSettled.status === "fulfilled" ? l2aSettled.value : createUnknownLayer2A(requestId, "LAYER2A_PROVIDER_FAILURE");
          const layer2B = l2bSettled.status === "fulfilled" ? l2bSettled.value : createUnknownLayer2B(requestId, "LAYER2B_PROVIDER_FAILURE");
          const layer2C = await Promise.resolve(this.services.l2c({
            content: input.content || input.metadata.ocrText || input.metadata.qrContent || "",
            inputType: input.type,
            context: { inputType: input.type, institutionContext: input.metadata.institutionContext },
            layer1Result: l1.raw,
            layer2BResult: layer2B,
            signal: controller.signal,
          })).catch(() => createUnknownLayer2C(requestId, "LAYER2C_PROVIDER_FAILURE"));
          const combined = combineLayer2({ layer2A, layer2B, layer2C, input, requestId });
          rawResults.l2Internal = { layer2A, layer2B, layer2C };
          return { ...combined, layer2A, layer2B, layer2C };
        },
        pipeline,
        rawResults,
        controller.signal,
        options.onTransition,
        { input, fallback: () => ({ ...combineLayer2({ layer2A: createUnknownLayer2A(requestId), layer2B: createUnknownLayer2B(requestId), layer2C: createUnknownLayer2C(requestId), input, requestId }), layer2A: createUnknownLayer2A(requestId), layer2B: createUnknownLayer2B(requestId), layer2C: createUnknownLayer2C(requestId) }) },
      );
      rawResults.l2 = l2.raw;
      partial ||= l2.partial;

      const l3 = await this._executeLayer(
        "l3",
        async () => {
          const internal = rawResults.l2Internal || {};
          const layer3Params = {
            claims: internal.layer2B?.claims || rawResults.l2?.claims || [],
            candidateSources: internal.layer2B?.verificationPackage?.candidateSources || [],
            layer2Result: internal.layer2B || null,
            layer2CResult: internal.layer2C || null,
            layer2CVerificationPackage: internal.layer2C?.verificationPackage || null,
            input,
            requestId,
            signal: controller.signal,
            options: { requestId, signal: controller.signal, allowLocalFallback: false, ...(this.retriever ? { retriever: this.retriever } : {}) },
          };
          if (this.legacyVerificationEnabled && typeof this.legacyVerificationAdapter?.verifyLayer3 === "function") {
            return this.legacyVerificationAdapter.verifyLayer3(layer3Params);
          }
          return this.services.l3(layer3Params);
        },
        pipeline,
        rawResults,
        controller.signal,
        options.onTransition,
        { input, fallback: () => createUnknownLayer3(requestId) },
      );
      partial ||= l3.partial;

      const l4 = await this._executeLayer(
        "l4",
        async () => {
          const internal = rawResults.l2Internal || {};
          const localResult = await this.services.l4({
            layer1Result: rawResults.l1 || null,
            layer2AResult: internal.layer2A || null,
            layer2Result: internal.layer2B || null,
            layer2CResult: internal.layer2C || null,
            layer3Result: rawResults.l3 || null,
            input,
            options: {
              requestId,
              signal: controller.signal,
              // Canonical Layer 4 always executes the StudentHub local policy
              // and Gemini gateway first. A configured legacy adapter is
              // attached later as bounded advisory metadata only.
              useAIGateway: true,
              aiMode: "GEMINI_ONLY",
              retrieveSupplementalEvidence: async ({ gaps = [], requestId: gapRequestId, signal } = {}) => {
                const currentLayer3 = rawResults.l3 || null;
                const supplementalRequestId = gapRequestId || requestId;
                const supplementalSignal = signal || controller.signal;
                const supplemental = await this.services.l3({
                  claims: internal.layer2B?.claims || rawResults.l2?.claims || [],
                  candidateSources: internal.layer2B?.verificationPackage?.candidateSources || [],
                  layer2Result: internal.layer2B || null,
                  layer2CResult: internal.layer2C || null,
                  layer2CVerificationPackage: internal.layer2C?.verificationPackage || null,
                  input,
                  requestId: supplementalRequestId,
                  signal: supplementalSignal,
                  options: {
                    requestId: supplementalRequestId,
                    signal: supplementalSignal,
                    allowLocalFallback: false,
                    retrievalStage: "SUPPLEMENTAL",
                    supplementalQueries: gaps.slice(0, 2),
                    previousEvidencePackage: currentLayer3,
                    ...(this.retriever ? { retriever: this.retriever } : {}),
                  },
                });
                rawResults.l3 = supplemental;
                pipeline.layerResults.layer3 = supplemental;
                const previousL3Stage = pipeline.stages.l3 || {};
                pipeline.stages.l3 = makeCanonicalStage(
                  "l3",
                  supplemental || {},
                  requestId,
                  stageOperationStatus("l3", supplemental || {}),
                  previousL3Stage.startedAt || nowIso(),
                  nowIso(),
                );
                partial ||= stageOperationStatus("l3", supplemental || {}) === OPERATION_STATUS.PARTIAL;
                return {
                  layer3Result: supplemental,
                  phaseSummary: supplemental?.retrievalPhases?.supplementalSearch || null,
                };
              },
            },
          });
          if (!this.legacyVerificationEnabled || typeof this.legacyVerificationAdapter?.verifyLayer4 !== "function") return localResult;

          const legacyLayer3 = rawResults.l3?.legacyIntegration;
          const canRunIndependentSynthesis = !legacyLayer3 || (
            legacyLayer3.status === "COMPLETED" &&
            legacyLayer3.stop !== true &&
            legacyLayer3.canContinueToLayer4 !== false
          );
          if (!canRunIndependentSynthesis) {
            return {
              ...localResult,
              legacyIntegration: {
                status: "SKIPPED",
                providerStatus: "SKIPPED",
                providerId: "legacy_verification_layer4",
                requestId,
                rawVerdict: null,
                assessmentConfidence: null,
                evidenceAgreement: null,
                sourceQuality: null,
                stop: true,
                canContinueToLayer4: false,
                reason: "Legacy Layer 3 continuation policy did not authorize independent Layer 4 synthesis.",
                contradictoryEvidence: [],
                sources: [],
                sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
                limitations: ["Layer 4 legacy synthesis was skipped by validated server-side continuation policy."],
              },
            };
          }

          const independent = await this.legacyVerificationAdapter.verifyLayer4({
            input,
            layer1Result: rawResults.l1 || null,
            layer2AResult: internal.layer2A || null,
            layer2Result: internal.layer2B || null,
            layer2CResult: internal.layer2C || null,
            layer3Result: rawResults.l3 || null,
            unresolvedSignals: rawResults.l3?.legacyIntegration?.unresolvedSignals || [],
            requestId,
            signal: controller.signal,
          });
          return {
            ...localResult,
            legacyIntegration: independent || {
              status: "UNAVAILABLE",
              providerStatus: "UNAVAILABLE",
              providerId: "legacy_verification_layer4",
              requestId,
              rawVerdict: null,
              assessmentConfidence: null,
              evidenceAgreement: null,
              sourceQuality: null,
              stop: true,
              canContinueToLayer4: false,
              reason: "Legacy Layer 4 returned no usable result.",
              contradictoryEvidence: [],
              sources: [],
              sourceOrigin: "LAYER_4_INDEPENDENT_RESEARCH",
              limitations: ["No independent legacy synthesis was used by the canonical policy."],
            },
          };
        },
        pipeline,
        rawResults,
        controller.signal,
        options.onTransition,
        { input, fallback: () => createUnknownLayer4(requestId) },
      );
      partial ||= l4.partial;

      this._assertActive(controller.signal);
      pipeline.currentStage = null;
      const predict = finalPredict({ layer1: rawResults.l1, layer2: rawResults.l2, layer3: rawResults.l3, layer4: rawResults.l4 });
      pipeline.finalPredict = predict;
      pipeline.finalDecision = finalDecisionFromPredict(predict);
      pipeline.pipelineStatus = partial ? PIPELINE_STATUS.PARTIAL : PIPELINE_STATUS.COMPLETED;
      pipeline.completedAt = nowIso();
      const projection = buildCanonicalTrustProjection({
        requestId,
        input,
        pipeline,
        layers: {
          layer1: rawResults.l1,
          layer2A: rawResults.l2Internal?.layer2A || null,
          layer2: rawResults.l2,
          layer2C: rawResults.l2Internal?.layer2C || null,
          layer3: rawResults.l3,
          layer4: rawResults.l4,
        },
        finalDecision: pipeline.finalDecision,
      });
      pipeline.verificationId = projection.verificationId;
      pipeline.mode = projection.mode;
      pipeline.state = projection.state;
      pipeline.input = projection.input;
      pipeline.layers = projection.layers;
      pipeline.decision = projection.decision;
      pipeline.evidence = projection.evidence;
      pipeline.graph = projection.graph;
      pipeline.passport = projection.passport;
      pipeline.audit.stageAttempts = pipeline.audit.stageAttempts.slice(-24);
      await this._emit(pipeline, "FINAL_PREDICT_READY", options.onTransition);
      await this._emit(pipeline, "PIPELINE_COMPLETED", options.onTransition);
      const publicResult = toPublicPipelineResult(cloneSafe(pipeline));
      this._lastRun = cloneSafe(pipeline);
      this._lastInput = input;
      return publicResult;
    } catch (error) {
      if (error instanceof TrustPipelineCancelledError || controller.signal.aborted) {
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
      callerSignal?.removeEventListener("abort", forwardAbort);
      if (this._activeController === controller) this._activeController = null;
    }
  }
}

export function createOwnBackendTrustOrchestrator(options = {}) {
  return new OwnBackendTrustOrchestrator(options);
}
