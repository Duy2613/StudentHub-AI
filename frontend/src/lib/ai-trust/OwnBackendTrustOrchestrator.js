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
import { WebSearchRetriever } from "./layer3/retrieval/WebSearchRetriever.js";
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
import { MediaArtifactService } from "../server/media/MediaArtifactService.js";
import { buildLegacyPipelineResponse } from "./legacy/LegacyResponseProjector.js";
import { isTrustedLayer2AResult } from "./layer2a/TrustBoundary.js";
import { isTrustedLayer3Result } from "./layer3/TrustBoundary.js";

const TRANSIENT_L2_STATUS = new Set([
  "TIMEOUT", "RATE_LIMITED", "AUTH_FAILED", "MODEL_NOT_AVAILABLE", "NETWORK_ERROR",
  "NOT_CONFIGURED", "UNAVAILABLE", "INVALID_RESPONSE", "ERROR", "PARTIAL", "DEGRADED",
  "COOLDOWN", "BUDGET_EXHAUSTED", "MODEL_INCOMPATIBLE", "PERMISSION_DENIED", "INVALID_REQUEST",
  "SERVICE_UNAVAILABLE", "UPSTREAM_ERROR", "NETWORK_TIMEOUT",
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
    "institutionContext", "mediaArtifactId", "imageHash", "width", "height", "bytes", "inputKind", "fileType", "qrIntake",
  ];
  const safeMetadata = Object.fromEntries(allowedMetadata
    .filter((key) => Object.hasOwn(metadata, key))
    .map((key) => {
      const item = metadata[key];
      if (key === "bytes" && (Buffer.isBuffer(item) || item instanceof Uint8Array || Array.isArray(item))) return [key, item];
      if (key === "qrIntake" && item && typeof item === "object" && !Array.isArray(item)) {
        return [key, {
          status: boundedText(item.status, 40).toUpperCase() || null,
          securityStatus: boundedText(item.securityStatus, 40).toUpperCase() || null,
          kind: boundedText(item.kind, 80) || null,
          normalizedValue: boundedText(item.normalizedValue, 500_000) || null,
          reason: boundedText(item.reason, 500) || null,
        }];
      }
      if (typeof item === "string") return [key, boundedText(item, key === "ocrText" || key === "qrContent" || key === "qrPayload" ? 500_000 : 2_048)];
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

const MAX_MULTIMODAL_BYTES = 8 * 1024 * 1024;

function multimodalInputParts(input) {
  const source = asObject(input);
  if (!(["image", "qr"].includes(source.type))) return null;
  const artifactId = boundedText(source.metadata?.mediaArtifactId, 180);
  if (!artifactId) return null;
  const artifact = MediaArtifactService.getArtifact(artifactId);
  const bytes = artifact?.buffer;
  const mimeType = boundedText(artifact?.mimeType || source.metadata?.mimeType, 80).toLowerCase();
  if (!bytes || !Buffer.isBuffer(bytes) || bytes.length === 0 || bytes.length > MAX_MULTIMODAL_BYTES) return null;
  if (!/^image\/(jpeg|png|webp)$/.test(mimeType)) return null;
  return [{ type: "image", mime_type: mimeType, data: bytes.toString("base64") }];
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

const FINAL_SAFE_REPUTATION_VERDICTS = new Set(["SAFE", "NO_KNOWN_THREAT"]);

function hasFinalReputationClearance(layer2A) {
  if (!layer2A || typeof layer2A !== "object" || !isTrustedLayer2AResult(layer2A)) return false;
  if (statusText(layer2A.providerStatus) !== "SUCCESS" || layer2A.finding !== "NO_KNOWN_THREAT") return false;
  if (layer2A.provenance?.noMatchIsSafetyProof !== false) return false;
  const providerResults = Array.isArray(layer2A.providerResults) ? layer2A.providerResults : [];
  if (providerResults.length === 0) return true;
  return providerResults.every((provider) => provider?.success === true && FINAL_SAFE_REPUTATION_VERDICTS.has(statusText(provider.verdict, provider.finding)));
}

function hasFinalLiveExternalTarget(layer3) {
  if (!layer3 || typeof layer3 !== "object" || !isTrustedLayer3Result(layer3) || layer3.externalEvidence !== true) return false;
  const candidates = [
    ...(Array.isArray(layer3.sources) ? layer3.sources : []),
    ...(Array.isArray(layer3.evidence) ? layer3.evidence : []),
  ];
  return candidates.some((item) => {
    const url = item?.url || item?.sourceUrl || item?.canonicalUrl;
    const httpStatus = item?.httpStatus;
    return item?.liveEvidence === true &&
      statusText(item?.providerStatus) === "SUCCESS" &&
      item?.retrievalOutcome === "SUCCESS" &&
      typeof item?.sourceFingerprint === "string" && item.sourceFingerprint.trim().length > 0 &&
      typeof url === "string" && /^https?:\/\//i.test(url) &&
      (httpStatus == null || Number(httpStatus) === 200);
  });
}

function hasFinalStrongSecurityNegative(layer1, layer2, layer4) {
  if (["HIGH", "CRITICAL"].includes(statusText(layer4?.riskAssessment?.level))) return true;
  if (["MALICIOUS", "DECEPTIVE", "MISLEADING"].includes(statusText(layer2?.classification))) return true;
  const signals = [
    ...(Array.isArray(layer1?.signals) ? layer1.signals : []),
    ...(Array.isArray(layer2?.contextSignals) ? layer2.contextSignals : []),
    ...(Array.isArray(layer2?.semanticSignals) ? layer2.semanticSignals : []),
    ...(Array.isArray(layer2?.riskSignals) ? layer2.riskSignals : []),
  ];
  return signals.some((signal) => /credential|password|otp|account[\s_-]*takeover|phish|malware|ransom|payment|financial|bank|remote[\s_-]*access|executable|apk|install|impersonat|social[\s_-]*engineer|prompt[\s_-]*injection|ssrf|dangerous|download[\s_-]*file|secret|cvv|credit[\s_-]*card|gift[\s_-]*card|open[\s_-]*redirect|homograph|punycode|obfuscat|shortener|suspicious[\s_-]*query/i.test(
    [signal?.type, signal?.code, signal?.classification, signal?.asset].filter((value) => typeof value === "string").join(" "),
  ));
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
    status: "INSUFFICIENT_EVIDENCE",
    executionStatus: "COMPLETED_WITH_PROVIDER_FAILURE",
    retrievalExecuted: true,
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
    limitations: ["Tavily did not return usable external evidence; no local corpus was substituted. L3 vẫn hoàn tất gói kết quả với provider failure được công bố."],
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
    executionStatus: "COMPLETED_WITH_FALLBACK",
    aiVerification: {
      verdictSignal: "UNCERTAIN",
      supportReasons: [],
      contradictionReasons: [],
      missingEvidence: ["Gemini không trả về synthesis usable trong ngân sách lần chạy."],
      uncertainty: "Kết quả policy deterministic vẫn có hiệu lực; AI synthesis đã fallback sau khi thử route model.",
      citationsUsed: [],
      provider: null,
      model: null,
    },
    aiVerificationStatus: "FALLBACK_DETERMINISTIC",
    aiVerificationErrorType: errorCode,
    aiRequestedPrimaryModel: null,
    aiExecutedModel: null,
    aiFallbackUsed: true,
    aiFallbackReason: errorCode,
    aiProviderStatus: "FALLBACK_DETERMINISTIC",
    aiOperationStatus: "COMPLETED",
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
  const semanticFallbackAvailable = layer2B?.details?.deterministicFallbackAvailable === true ||
    layer2B?.metrics?.deterministicFallbackAvailable === true;
  const domainStatus = statusText(layer2C?.modelStatus, "BASELINE_RULE_MODEL");
  const observations = [
    ...l2aProviders,
    providerObservation({
      provider: layer2B?.details?.providerId || layer2B?.metrics?.modelUsed || "StudentHub Semantic Engine",
      providerId: layer2B?.details?.providerId || layer2B?.metrics?.modelUsed || "studenthub_semantic_engine",
      status: semanticStatus,
      verdict: layer2B?.classification || layer2B?.status || "UNKNOWN",
      finding: layer2B?.classification || layer2B?.status,
      success: semanticFallbackAvailable || !providerFailure(semanticStatus),
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
  const semanticProviderPartial = !semanticFallbackAvailable && (providerFailure(semanticStatus) || semanticStatus === "FALLBACK_USED" ||
    ["UNKNOWN", "PARTIAL"].includes(statusText(layer2B?.status)));
  const domainProviderPartial = providerFailure(domainStatus);
  const threatProviderPartial = l2aProviders.some((item) => item.success !== true && item.executed !== false);
  const semanticContextRisk = boundedArray(layer2B?.contextSignals).some((item) =>
    item?.authoritative !== false && /credential|financial|account_takeover|malware|social_engineering|impersonation|urgency|authority|scarcity|prompt_injection/i.test(
      String(item?.type || item?.code || ""),
    ),
  );
  const semanticClassificationRisk = ["DECEPTIVE", "MISLEADING", "MALICIOUS"].includes(statusText(layer2B?.classification));
  // SUSPICIOUS is not itself an independent security finding.  It can be a
  // provider-side operational fallback or a candidate-model label.  Content
  // risk must come from a hard BLOCK, an authoritative classification, or an
  // authoritative signal with a concrete security vector.
  const semanticDecisionRisk = statusText(layer2B?.status) === "BLOCK";
  const domainRisk = Boolean(layer2C?.classification) && ![
    "NO_MATERIAL_STUDENT_RISK", "UNKNOWN_STUDENT_RISK", "UNKNOWN",
  ].includes(statusText(layer2C.classification)) && !domainProviderPartial;
  const semanticSuspicious = semanticClassificationRisk || semanticDecisionRisk || semanticContextRisk || domainRisk;
  // L2C and external threat-provider outages are provider-health metadata,
  // not a failed L2 operation. Every L2 branch above has settled and the
  // deterministic semantic baseline can still be audited and passed to L3.
  // Keep providerPartial in details/providerObservations, but do not turn the
  // whole four-layer pipeline PARTIAL solely because an optional provider did
  // not respond.
  const providerPartial = threatProviderPartial || semanticProviderPartial;
  const semanticPackage = asObject(layer2B?.verificationPackage);
  const domainPackage = asObject(layer2C?.verificationPackage);
  const verificationTasks = [
    ...boundedArray(semanticPackage.verificationTasks, 40),
    ...boundedArray(domainPackage.verificationTasks, 40),
  ].slice(0, 80);
  const semanticBaselineCompleted = semanticFallbackAvailable ||
    layer2B?.status === "PASS" ||
    ["BENIGN", "INFORMATIVE"].includes(statusText(layer2B?.classification));
  const finding = threatMatch
    ? "THREAT_MATCH"
    : semanticSuspicious
      ? (boundedArray(layer2B?.contextSignals).some((item) => /credential|payment|urgency|impersonation/i.test(String(item?.type || item?.code || ""))) ? "MANIPULATION_DETECTED" : "SEMANTIC_SUSPICIOUS")
      : layer2A?.finding === "NOT_APPLICABLE" && layer2B?.status === "UNKNOWN"
          ? "UNKNOWN"
          : semanticBaselineCompleted
            ? "SEMANTIC_NORMAL"
            : "NO_KNOWN_THREAT";
  const status = "COMPLETED";
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
    providerStatus: "COMPLETED",
    providerObservations: observations,
    providers: observations,
    threatTypes: boundedArray(layer2A?.threatTypes, 20),
    semanticSummary: boundedText(layer2B?.semanticSummary, 900),
    semanticSignals: boundedArray(layer2B?.contextSignals, 30),
    contextSignals: boundedArray(layer2B?.contextSignals, 30),
    riskSignals: boundedArray(layer2C?.riskSignals, 30),
    mediaForensics: layer2B?.mediaForensics || null,
    secondaryClassifications: boundedArray(layer2C?.secondaryClassifications, 12),
    limitations: [
      ...boundedArray(layer2B?.limitations, 8),
      ...boundedArray(layer2C?.limitations, 8),
    ].map((item) => boundedText(item, 700)).filter(Boolean).slice(0, 16),
    claims: boundedArray(layer2B?.claims, 40),
    entities: boundedArray(layer2B?.entities, 40),
    verificationPackage: Object.keys(domainPackage).length ? domainPackage : (Object.keys(semanticPackage).length ? semanticPackage : null),
    verificationTasks,
    verificationTaskSummary: {
      totalTasks: verificationTasks.length,
      l2bTaskCount: boundedArray(semanticPackage.verificationTasks, 40).length,
      l2cTaskCount: boundedArray(domainPackage.verificationTasks, 40).length,
    },
    modelStatus: layer2B?.modelStatus || layer2B?.details?.providerStatus || layer2B?.metrics?.providerStatus || "UNKNOWN",
    modelType: layer2B?.modelType || layer2B?.details?.modelProvider || "SEMANTIC_PROVIDER",
    modelVersion: layer2B?.modelVersion || layer2B?.details?.modelUsed || layer2B?.metrics?.modelUsed || null,
    confidenceKind: layer2B?.details?.confidenceKind || layer2B?.metrics?.confidenceKind || "NOT_DISCLOSED",
    classificationSource: layer2B?.details?.confidenceSource || layer2B?.details?.providerId || null,
    inputLength: layer2B?.inputLength || null,
    promptInjectionDetected: layer2B?.details?.promptInjectionDetected === true,
    confidence: typeof layer2B?.confidence === "number" ? layer2B.confidence : null,
    reasons,
    conclusion: threatMatch
      ? "Threat intelligence reported a matching threat; semantic and context signals cannot downgrade it."
      : threatProviderPartial
        ? semanticFallbackAvailable
          ? "Layer 2 đã hoàn tất baseline deterministic; provider threat bên ngoài chưa phản hồi được ghi riêng trong provider observations."
          : "Layer 2 đã hoàn tất các nhánh kiểm tra; một provider threat bên ngoài chưa phản hồi được giữ trong audit details."
        : domainProviderPartial
          ? "Layer 2 đã hoàn tất threat và semantic checks; student-context advisory chưa phản hồi và không bị coi là content risk."
          : semanticFallbackAvailable
            ? "Layer 2 đã hoàn tất deterministic semantic baseline; Gemini enrichment chưa phản hồi được ghi trong provider observations."
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
      semanticFallbackAvailable,
      studentContextModelStatus: domainStatus,
      studentContextAdvisoryPartial: domainProviderPartial,
      providerPartial,
    },
  };
}

function makeCanonicalStage(stageId, raw, requestId, operationStatus, startedAt, completedAt, context = {}) {
  let adapted = {};
  if (stageId === "l1") adapted = stageFromL1(raw, requestId, { startedAt, completedAt, operationStatus });
  if (stageId === "l3") adapted = stageFromL3(raw, requestId, { startedAt, completedAt, operationStatus });
  if (stageId === "l4") {
    adapted = stageFromL4(raw, requestId, { startedAt, completedAt, operationStatus });
    const layer3 = asObject(context.layer3);
    const layer3Sources = Array.isArray(layer3.sources) ? layer3.sources : [];
    const layer3Evidence = Array.isArray(layer3.evidence) ? layer3.evidence : [];
    const validatedLayer3Sources = layer3Sources.filter((source) => source?.liveEvidence === true && source?.retrievalOutcome === "SUCCESS" && source?.providerStatus === "SUCCESS" && typeof (source?.sourceUrl || source?.url) === "string");
    const layer3SourceQuality = validatedLayer3Sources.length
      ? Number((validatedLayer3Sources.reduce((total, source) => total + (Number(source.authorityScore) || 0), 0) / validatedLayer3Sources.length).toFixed(4))
      : null;
    const supplementalSources = (Array.isArray(raw?.independentResearchSources) ? raw.independentResearchSources : []).map((source) => ({
      ...source,
      retrievalOrigin: source?.retrievalOrigin || "LAYER_4_SUPPLEMENTAL",
    }));
    const sourceSet = [...layer3Sources, ...supplementalSources];
    const supportingEvidence = layer3Evidence.filter((item) => /SUPPORT/i.test(String(item?.relation || "")));
    const contradictoryEvidence = layer3Evidence.filter((item) => /CONTRADICT/i.test(String(item?.relation || "")));
    adapted = {
      ...adapted,
      sources: sourceSet,
      evidence: layer3Evidence,
      supportingEvidence,
      contradictoryEvidence,
      sourceQuality: layer3SourceQuality ?? adapted.sourceQuality ?? null,
      evidenceAgreement: layer3.crossSourceAgreement?.agreementScore ?? adapted.evidenceAgreement ?? null,
      verificationCompleteness: layer3.verificationCompleteness ?? adapted.verificationCompleteness ?? null,
      evidenceSummary: layer3.evidenceSummary || `${layer3Evidence.length} evidence item(s) from ${layer3Sources.length} source(s); source quality is calculated only from validated live sources.`,
      crossSourceAgreement: layer3.crossSourceAgreement || null,
      sourceIndependence: layer3.sourceIndependence || null,
      temporalAssessment: layer3.temporalAssessment || null,
    };
  }
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
  const stageInput = {
    ...adapted,
    ...raw,
    ...(stageId === "l4" ? {
      sources: adapted.sources,
      evidence: adapted.evidence,
      supportingEvidence: adapted.supportingEvidence,
      contradictoryEvidence: adapted.contradictoryEvidence,
      sourceQuality: adapted.sourceQuality,
      evidenceAgreement: adapted.evidenceAgreement,
      verificationCompleteness: adapted.verificationCompleteness,
      evidenceSummary: adapted.evidenceSummary,
      crossSourceAgreement: adapted.crossSourceAgreement,
      sourceIndependence: adapted.sourceIndependence,
      temporalAssessment: adapted.temporalAssessment,
    } : {}),
    ...(stageId === "l2" && /semantic|candidate/i.test(String(raw?.confidenceKind || "")) ? {
      confidenceKind: "SEMANTIC_CANDIDATE_SCORE_NON_PROBABILISTIC",
    } : {}),
  };
  return createStageEnvelope({
    ...stageInput,
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
  if (stageId === "l3") return String(raw?.executionStatus || "").toUpperCase().startsWith("COMPLETED") || raw?.fallbackApplied === true
    ? OPERATION_STATUS.COMPLETED
    : ["UNAVAILABLE", "PARTIAL", "TIMEOUT", "RATE_LIMITED", "NOT_CONFIGURED", "ERROR", "INVALID_RESPONSE"].includes(statusText(raw.status, raw.retrievalStatus))
    ? OPERATION_STATUS.PARTIAL
    : OPERATION_STATUS.COMPLETED;
  if (String(raw?.executionStatus || "").toUpperCase().startsWith("COMPLETED") || raw?.fallbackApplied === true) return OPERATION_STATUS.COMPLETED;
  const aiStatus = statusText(raw.aiVerificationStatus, raw.aiOperationStatus);
  return ["UNAVAILABLE", "PARTIAL", "DEGRADED", "ERROR", "INVALID_RESPONSE"].includes(aiStatus) ? OPERATION_STATUS.PARTIAL : OPERATION_STATUS.COMPLETED;
}

function finalPredict({ layer1, layer2, layer2A, layer3, layer4 }) {
  const l1Blocked = layer1?.status === "BLOCK" || layer1?.finding === "LOCAL_BLOCK";
  const l2Threat = layer2?.finding === "THREAT_MATCH" || layer2?.securityClassification === "MALICIOUS" || layer2A?.finding === "THREAT_MATCH" || layer2A?.securityClassification === "MALICIOUS";
  const layer4Security = statusText(layer4?.securityClassification, "UNKNOWN");
  const layer4Action = statusText(layer4?.enforcement, layer4?.recommendedAction, "REVIEW");
  const geminiVerification = layer4?.aiVerification && typeof layer4.aiVerification === "object" && !Array.isArray(layer4.aiVerification)
    ? layer4.aiVerification
    : null;
  const geminiSignal = statusText(geminiVerification?.verdictSignal, "UNCERTAIN");
  const geminiCitationValidation = geminiVerification?.citationValidation && typeof geminiVerification.citationValidation === "object"
    ? geminiVerification.citationValidation
    : {};
  const geminiCitationCount = Array.isArray(geminiVerification?.citationsUsed)
    ? geminiVerification.citationsUsed.filter((citation) => typeof citation?.url === "string" && /^https?:\/\//i.test(citation.url)).length
    : 0;
  const geminiCitationsValidated = geminiCitationCount > 0 &&
    geminiCitationValidation.allLinksValidated === true &&
    Number(geminiCitationValidation.acceptedCount) >= geminiCitationCount &&
    Number(geminiCitationValidation.rejectedCount || 0) === 0;
  const geminiSupportsWithValidatedEvidence = layer4?.aiVerificationStatus === "VERIFIED" &&
    geminiSignal === "SUPPORTS" && geminiCitationsValidated;
  const geminiTruthSignal = layer4?.aiVerificationStatus === "VERIFIED" && geminiCitationsValidated &&
    ["SUPPORTS", "CONTRADICTS", "MIXED"].includes(geminiSignal)
    ? geminiSignal
    : null;
  const layer4HardNegative = layer4Security === "MALICIOUS" || layer4Action === "BLOCK";
  const layer4PolicyAllows = !layer4HardNegative &&
    ["SAFE", "NO_KNOWN_THREAT"].includes(layer4Security) &&
    ["ALLOW", "ALLOW_WITH_CAUTION"].includes(layer4Action);
  const l2ReputationClearance = hasFinalReputationClearance(layer2A);
  const l3LiveExternalTarget = hasFinalLiveExternalTarget(layer3);
  const truthConflict = ["CONTRADICTED", "MIXED"].includes(statusText(layer4?.truthStatus, layer4?.truthAssessment?.status));
  const reputationAndLiveSafeTarget = !l1Blocked &&
    !l2Threat &&
    !layer4HardNegative &&
    l2ReputationClearance &&
    l3LiveExternalTarget &&
    !truthConflict &&
    !hasFinalStrongSecurityNegative(layer1, layer2, layer4);
  // Final Predict consumes the complete L4 package. A validated Gemini
  // citation can resolve an otherwise unresolved safe-target check, but it
  // can never downgrade an L1/L2/L4 hard negative or turn reachability alone
  // into proof that a factual claim is true. A multi-provider Layer 2A
  // clearance plus a trusted live Layer 3 fetch is a separate security-target
  // path, so a soft semantic warning cannot hide that verified URL result.
  const geminiBackedSafeTarget = !l1Blocked && !l2Threat && !layer4HardNegative && geminiSupportsWithValidatedEvidence;
  const securityDecisionBacked = layer4PolicyAllows || geminiBackedSafeTarget || reputationAndLiveSafeTarget;
  const sources = Array.isArray(layer3?.sources) ? layer3.sources : [];
  const evidence = Array.isArray(layer3?.evidence) ? layer3.evidence : [];
  const claimSpecificEvidence = evidence.filter((item) => item?.evidenceScope !== "input_context" && Boolean(item?.claimId));
  const usableSources = sources.filter((source) => source?.liveEvidence === true && source?.retrievalOutcome === "SUCCESS");
  const evidenceCount = evidence.length;
  const insufficientEvidence = usableSources.length === 0 || claimSpecificEvidence.length === 0 || layer3?.externalEvidence !== true;
  const validatedSecuritySourceCount = l3LiveExternalTarget
    ? sources.filter((source) => source?.liveEvidence === true && statusText(source?.providerStatus) === "SUCCESS" && source?.retrievalOutcome === "SUCCESS").length
    : 0;
  const deterministicTruthStatus = statusText(layer4?.truthStatus, layer4?.truthAssessment?.status, "INSUFFICIENT_EVIDENCE");
  const claimlessInput = deterministicTruthStatus === "NOT_APPLICABLE";
  const geminiTruthRefinement = !insufficientEvidence && !l1Blocked && !l2Threat && !layer4HardNegative &&
    ["UNKNOWN", "INSUFFICIENT_EVIDENCE"].includes(deterministicTruthStatus) && Boolean(geminiTruthSignal);
  const securityClassification = l1Blocked || l2Threat
    ? "MALICIOUS"
    : reputationAndLiveSafeTarget
      ? "SAFE"
      : geminiBackedSafeTarget
      ? "NO_KNOWN_THREAT"
      : layer4Security;
  const securityRisk = l1Blocked || l2Threat
    ? "CRITICAL"
    : reputationAndLiveSafeTarget
      ? "LOW"
      : layer4?.riskAssessment?.level || "UNKNOWN";
  const truthStatus = claimlessInput
    ? "NOT_APPLICABLE"
    : insufficientEvidence
    ? "INSUFFICIENT_EVIDENCE"
    : geminiTruthRefinement
      ? ({ SUPPORTS: "SUPPORTED", CONTRADICTS: "CONTRADICTED", MIXED: "MIXED" }[geminiTruthSignal] || deterministicTruthStatus)
      : deterministicTruthStatus;
  const truthEvidenceGap = insufficientEvidence && !claimlessInput;
  const recommendedAction = l1Blocked || l2Threat
    ? "BLOCK"
    : securityDecisionBacked
      ? (reputationAndLiveSafeTarget ? "ALLOW" : layer4PolicyAllows ? layer4Action : "ALLOW_WITH_CAUTION")
      : insufficientEvidence
      ? "REVIEW"
      : layer4Action;
  const decisionConfidence = insufficientEvidence
    ? securityDecisionBacked
      ? Math.min(Number(layer4?.decisionConfidence) || 0, 0.65)
      : Math.min(Number(layer4?.decisionConfidence) || 0, 0.35)
    : Number(layer4?.decisionConfidence) || 0;
  const evidenceAgreement = layer3?.crossSourceAgreement?.agreementScore ?? layer3?.crossSourceAgreement?.status ?? null;
  const sourceQuality = usableSources.length
    ? Number((usableSources.reduce((total, source) => total + (Number(source.authorityScore) || 0), 0) / usableSources.length).toFixed(4))
    : null;
  const reasons = [
    ...(l1Blocked ? ["Layer 1 phát hiện hard block kỹ thuật."] : []),
    ...(l2Threat ? ["Layer 2 threat intelligence có threat match; không bị hạ cấp bởi các lớp sau."] : []),
    ...(reputationAndLiveSafeTarget ? ["Layer 2A đã được các provider reputation trả về SAFE/NO_KNOWN_THREAT và Layer 3 đã xác minh URL live; Final Predict gỡ cảnh báo mềm cho security target."] : []),
    ...(geminiBackedSafeTarget ? ["Gemini Layer 4 đã đối chiếu bằng chứng URL và các liên kết đã được server xác thực; Final Predict cho phép tiếp tục có điều kiện."] : []),
    ...(geminiTruthRefinement ? [`Gemini Layer 4 đã tổng hợp claim-specific evidence của Layer 3 và bổ sung kết luận sự thật: ${truthStatus}.`] : []),
    ...boundedArray(layer4?.keyReasons, 8),
    ...(truthEvidenceGap
      ? [claimSpecificEvidence.length > 0
        ? "Có nguồn live nhưng chưa đủ claim-specific evidence để nâng kết luận sự thật."
        : "Có thể có nguồn ngữ cảnh, nhưng chưa có claim-specific evidence để nâng kết luận sự thật."]
      : []),
  ].map((item) => boundedText(item, 700)).filter(Boolean).slice(0, 20);
  const uncertainty = [
    ...(truthEvidenceGap
      ? [claimSpecificEvidence.length > 0
        ? "Evidence sufficiency chưa đạt vì claim-specific evidence chưa đủ."
        : "Evidence hiện có chỉ là contextual reference hoặc chưa đủ để xác minh factual claim."]
      : []),
    ...boundedArray(layer4?.userExplanation?.uncertainties, 12),
    ...boundedArray(layer3?.limitations, 8),
  ].map((item) => boundedText(typeof item === "string" ? item : item?.details, 700)).filter(Boolean).slice(0, 20);
  const geminiCitationSources = (Array.isArray(layer4?.aiVerification?.citationsUsed) ? layer4.aiVerification.citationsUsed : [])
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
    ...sources,
    ...geminiCitationSources,
  ].map((source) => [source?.url || source?.sourceId, source])).values());
  const confidenceKind = "DETERMINISTIC_POLICY_SCORE_NON_PROBABILISTIC";
  return {
    status: "READY",
    verdict: truthStatus,
    truthVerdict: truthStatus,
    truthStatus,
    truthAssessment: geminiTruthRefinement ? truthStatus : (layer4?.truthAssessment?.status || truthStatus),
    security: securityClassification,
    securityClassification,
    securityRisk,
    recommendedAction,
    action: recommendedAction,
    assessmentConfidence: Number(decisionConfidence.toFixed(4)),
    decisionConfidence: Number(decisionConfidence.toFixed(4)),
    confidence: Number(decisionConfidence.toFixed(4)),
    confidenceKind,
    confidenceExplanation: "Điểm này là score của policy tất định trên signal/evidence hiện có, không phải xác suất claim đúng.",
    evidenceAgreement,
    sourceQuality,
    verificationCompleteness: layer3?.verificationCompleteness ?? null,
    evidenceSufficiency: claimlessInput ? "NOT_APPLICABLE" : insufficientEvidence ? "INSUFFICIENT" : "SUFFICIENT",
    securityEvidenceStatus: securityDecisionBacked
      ? (reputationAndLiveSafeTarget
        ? "L2_REPUTATION_L3_LIVE"
        : geminiBackedSafeTarget ? "GEMINI_VALIDATED" : "LAYER4_POLICY")
      : "INSUFFICIENT",
    geminiVerdictSignal: geminiSignal,
    geminiCitationCount,
    geminiCitationsValidated,
    independentSourceCount: usableSources.length,
    validatedSecuritySourceCount,
    evidenceCount,
    claimSpecificEvidenceCount: claimSpecificEvidence.length,
    sourceCount: sources.length,
    keyReasons: reasons,
    reason: reasons[0] || "Final Predict giữ REVIEW vì chưa có đủ dữ liệu để kết luận an toàn.",
    remainingUncertainty: uncertainty,
    uncertainties: uncertainty,
    keySources,
    sources: keySources,
    topEvidence: keySources,
    authoritativeComponent: "STUDENTHUB_DETERMINISTIC_FINAL_PREDICT",
    evidenceRefs: boundedArray(layer4?.evidenceRefs, 40),
    derivedFrom: [...FOUR_LAYER_STAGE_IDS],
    traceability: [
      { source: "l1", stage: "l1", field: "status", reason: layer1?.status || "UNKNOWN", value: layer1?.status || "UNKNOWN" },
      { source: "l2a", stage: "l2", field: "finding", reason: layer2A?.finding || "UNKNOWN", value: layer2A?.finding || "UNKNOWN" },
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
    confidenceKind: predict.confidenceKind,
    evidenceSufficiency: predict.evidenceSufficiency,
    decisionAuthority: "FINAL_PREDICT_DETERMINISTIC",
    authoritativeComponent: "FINAL_PREDICT_DETERMINISTIC",
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
      const publicPipeline = toPublicPipelineResult(cloneSafe(pipeline));
      const stageId = pipeline.currentStage;
      await onTransition({
        event,
        stageId,
        stage: stageId ? publicPipeline?.stages?.[stageId] || null : (event === "FINAL_PREDICT_READY" ? publicPipeline?.finalPredict || null : null),
        pipeline: publicPipeline,
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
    await this._emit(pipeline, "STAGE_PROGRESS", onTransition);

    let raw;
    let errorCode = null;
    let fallbackApplied = false;
    try {
      raw = await worker();
      this._assertActive(signal);
    } catch (error) {
      if (signal?.aborted || error?.name === "AbortError" || error?.code === "PIPELINE_CANCELLED") throw new TrustPipelineCancelledError();
      errorCode = boundedText(error?.code || error?.name || "STAGE_FAILURE", 120) || "STAGE_FAILURE";
      raw = options.fallback?.(error) || {};
      fallbackApplied = raw?.fallbackApplied === true || String(raw?.executionStatus || "").toUpperCase().startsWith("COMPLETED");
    }
    const completedAt = nowIso();
    const operationStatus = errorCode && !fallbackApplied ? OPERATION_STATUS.PARTIAL : stageOperationStatus(stageId, raw || {});
    const stage = makeCanonicalStage(stageId, raw || {}, pipeline.requestId, operationStatus, startedAt, completedAt, {
      layer3: rawResults.l3 || null,
    });
    if (errorCode) {
      stage.providerErrorType = errorCode;
      stage.audit = { ...stage.audit, errorCode, transition: operationStatus, fallbackApplied };
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
              options: {
                requestId,
                signal: controller.signal,
                useAIGateway: true,
                aiMode: "GEMINI_ONLY",
                ...(this.semanticProvider ? { provider: this.semanticProvider } : {}),
              },
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
          // Canonical StudentHub evidence is authoritative for Layer 3. The
          // optional legacy adapter may still contribute an explicitly
          // labelled advisory report, but it must never replace the
          // canonical source/evidence/provenance set.
          const canonicalLayer3 = await this.services.l3(layer3Params);
          if (!this.legacyVerificationEnabled || typeof this.legacyVerificationAdapter?.verifyLayer3 !== "function") {
            return canonicalLayer3;
          }
          let legacyIntegration;
          try {
            legacyIntegration = await this.legacyVerificationAdapter.verifyLayer3(layer3Params);
          } catch (error) {
            legacyIntegration = {
              status: "UNAVAILABLE",
              providerStatus: "UNAVAILABLE",
              providerId: "legacy_verification_layer3",
              requestId,
              rawVerdict: null,
              assessmentConfidence: null,
              evidenceAgreement: null,
              sourceQuality: null,
              stop: true,
              canContinueToLayer4: false,
              reason: boundedText(error?.code || error?.name || "LEGACY_LAYER3_FAILURE", 240),
              contradictoryEvidence: [],
              sources: [],
              sourceOrigin: "LAYER_3_LEGACY_ADVISORY",
              limitations: ["Legacy Layer 3 advisory failed; canonical StudentHub evidence was preserved."],
            };
          }
          const nestedLegacyAdvisory = asObject(legacyIntegration?.legacyIntegration);
          const boundedLegacyAdvisory = Object.keys(nestedLegacyAdvisory).length
            ? { ...asObject(legacyIntegration), ...nestedLegacyAdvisory }
            : legacyIntegration;
          return { ...canonicalLayer3, legacyIntegration: boundedLegacyAdvisory || null };
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
              allowQaExtended: true,
              inputParts: multimodalInputParts(input),
              inputContext: {
                type: input.type,
                // Preserve the complete normalized text/URL/OCR/QR context.
                // Provider prompt/token safety is enforced at the gateway;
                // this orchestration layer must not silently discard input.
                content: typeof input.content === "string" ? input.content : "",
                url: typeof input.metadata?.url === "string" ? input.metadata.url : "",
                ocrText: typeof input.metadata?.ocrText === "string" ? input.metadata.ocrText : "",
                qrPayload: typeof (input.metadata?.qrContent || input.metadata?.qrPayload) === "string"
                  ? (input.metadata.qrContent || input.metadata.qrPayload)
                  : "",
              },
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
      const predict = finalPredict({
        layer1: rawResults.l1,
        layer2: rawResults.l2,
        layer2A: rawResults.l2Internal?.layer2A || null,
        layer3: rawResults.l3,
        layer4: rawResults.l4,
      });
      pipeline.finalPredict = predict;
      pipeline.legacyResponse = buildLegacyPipelineResponse({
        input,
        layerResults: {
          layer1: rawResults.l1,
          layer2A: rawResults.l2Internal?.layer2A || null,
          layer2: rawResults.l2,
          layer3: rawResults.l3,
          layer4: rawResults.l4,
        },
        finalPredict: predict,
      });
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
