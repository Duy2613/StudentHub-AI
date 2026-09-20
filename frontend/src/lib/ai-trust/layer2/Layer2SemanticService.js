/**
 * Layer 2B — Semantic & Contextual Verification Facade.
 *
 * The facade owns the provider boundary. Providers receive bounded data and
 * their response is normalized before confidence, planning, or decision code
 * can consume it. A provider can enrich semantic context, but it cannot
 * replace deterministic hard negatives or create a safety assertion.
 */

import { createLayer2Result, LAYER_2_STATUS, SEMANTIC_CLASSIFICATION, SEMANTIC_PROVIDER_STATUS } from "./types.js";
import { DeterministicSemanticProvider } from "./providers/DeterministicSemanticProvider.js";
import { AIGatewayModelProvider } from "./providers/AIGatewayModelProvider.js";
import { Layer2ConfidenceEngine } from "./engine/Layer2ConfidenceEngine.js";
import { VerificationPlanner } from "./engine/VerificationPlanner.js";
import { Layer2DecisionEngine } from "./engine/Layer2DecisionEngine.js";
import { createSecureId } from "../../security/secureId.js";
import { ImageForensicsOrchestrator } from "../forensics/ImageForensicsOrchestrator.js";
import {
  SEMANTIC_BOUNDARY_LIMITS,
  createUnknownSemanticAnalysis,
  normalizeSemanticAnalysis,
  sanitizeLayer1ForSemantic,
} from "./guards/SemanticBoundary.js";

// QR is a first-class multimodal input.  It shares the bounded semantic
// boundary with image OCR while keeping the decoded payload explicit for
// cross-modal analysis and downstream evidence retrieval.
const INPUT_TYPES = new Set(["text", "url", "image", "file", "qr", "link"]);

function nowMs() {
  return typeof performance !== "undefined" ? performance.now() : Date.now();
}
function boundedString(value, maxLength) {
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function safeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = ["url", "ocrText", "qrContent", "qrPayload", "mimeType", "fileName", "fileSize", "exif", "senderDomain", "mediaArtifactId", "imageHash", "bytes"];
  return Object.fromEntries(allowed.filter((key) => Object.hasOwn(value, key)).map((key) => {
    const item = value[key];
    if (typeof item === "string") {
      const max = key === "ocrText" ? SEMANTIC_BOUNDARY_LIMITS.OCR : key === "qrContent" || key === "qrPayload" ? SEMANTIC_BOUNDARY_LIMITS.QR : 2_048;
      return [key, boundedString(item, max)];
    }
    if (typeof item === "number" && Number.isFinite(item)) return [key, item];
    if (item && typeof item === "object" && !Array.isArray(item) && key === "exif") {
      return [key, Object.fromEntries(Object.entries(item).slice(0, 12).map(([childKey, childValue]) => [
        boundedString(childKey, 80), boundedString(childValue, 200),
      ]))];
    }
    if (key === "bytes" && (Buffer.isBuffer(item) || item instanceof Uint8Array || Array.isArray(item))) {
      return [key, item];
    }
    return [key, null];
  }).filter(([, item]) => item !== null));
}

function hasPayload({ content, metadata }) {
  return Boolean(content || metadata.ocrText || metadata.qrContent || metadata.qrPayload || metadata.url || metadata.mediaArtifactId || metadata.bytes);
}

function providerStatusFor(analysis, fallbackUsed = false) {
  if (fallbackUsed) return SEMANTIC_PROVIDER_STATUS.FALLBACK_USED;
  return analysis?.upstreamProviderStatus || analysis?.modelStatus || SEMANTIC_PROVIDER_STATUS.LOCAL_DETERMINISTIC;
}

function emptyVerificationPackage() {
  return { claims: [], entities: [], candidateSources: [], verificationTasks: [], totalTasksCount: 0 };
}

export class Layer2SemanticService {
  /**
   * Evaluates content through the bounded Layer 2B semantic pipeline.
   * @param {object} params
   * @returns {Promise<object>} Layer 2 result DTO
   */
  static async verify(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const startedAt = nowMs();
    const rawType = typeof input.type === "string" ? input.type.toLowerCase() : "text";
    const type = INPUT_TYPES.has(rawType) ? rawType : "text";
    const content = boundedString(input.content, SEMANTIC_BOUNDARY_LIMITS.TEXT);
    const metadata = safeMetadata(input.metadata);
    const layer1Result = sanitizeLayer1ForSemantic(input.layer1Result);
    const options = input.options && typeof input.options === "object" && !Array.isArray(input.options) ? input.options : {};
    const requestId = boundedString(options.requestId, 160) || createSecureId("req_l2");

    if (!INPUT_TYPES.has(rawType) || !hasPayload({ content, metadata })) {
      const unknown = createUnknownSemanticAnalysis(!INPUT_TYPES.has(rawType) ? "INVALID_INPUT_TYPE" : "EMPTY_SEMANTIC_INPUT");
      return createLayer2Result({
        status: LAYER_2_STATUS.UNKNOWN,
        classification: SEMANTIC_CLASSIFICATION.UNKNOWN,
        confidence: 0,
        semanticSummary: unknown.semanticSummary,
        intent: unknown.intent,
        verificationPackage: emptyVerificationPackage(),
        nextLayer: 3,
        requestId,
        details: {
          decisionRationale: "Đầu vào không đủ hoặc không hợp lệ để phân tích ngữ nghĩa.",
          providerIndependent: true,
          inputTrust: "UNTRUSTED_CONTENT_ISOLATED",
          semanticBoundaryStatus: unknown.modelStatus,
        },
        metrics: {
          executionTimeMs: Number((nowMs() - startedAt).toFixed(2)),
          modelUsed: "semantic_boundary",
          providerStatus: SEMANTIC_PROVIDER_STATUS.INVALID_INPUT,
          providerIndependent: true,
          confidenceKind: "unknown_no_confidence",
        },
      });
    }

    const semanticParams = {
      type,
      text: type === "text" ? content : "",
      url: type === "url" ? content : boundedString(metadata.url, SEMANTIC_BOUNDARY_LIMITS.URL),
      ocrText: boundedString(metadata.ocrText, SEMANTIC_BOUNDARY_LIMITS.OCR),
      qrPayload: boundedString(metadata.qrContent || metadata.qrPayload, SEMANTIC_BOUNDARY_LIMITS.QR),
      layer1Result,
      options: { requestId, signal: options.signal },
    };

    // Layer 2 Media Forensics Orchestration for Image Inputs
    let mediaForensics = null;
    if (type === "image" || metadata.mediaArtifactId || metadata.bytes) {
      try {
        const forensicsOrchestrator = new ImageForensicsOrchestrator({
          specialistAdapter: options.specialistAdapter,
          advisoryService: options.advisoryService,
        });
        const forensicsRes = await forensicsOrchestrator.analyze({
          mediaArtifactId: metadata.mediaArtifactId || null,
          bytes: metadata.bytes || (typeof content === "string" && content.startsWith("data:image/") ? content : null),
          metadata,
          options: {
            requestId,
            signal: options.signal,
            useAIGateway: options.useAIGateway !== false,
            useCache: options.useCache !== false,
            ownerUserId: options.ownerUserId || null,
            caseId: options.caseId || null,
          },
        });
        mediaForensics = forensicsRes.mediaForensics;
        if (mediaForensics?.ocr?.text && !semanticParams.ocrText) {
          semanticParams.ocrText = mediaForensics.ocr.text;
        }
      } catch (forensicsErr) {
        console.warn("[Layer2SemanticService] Image forensics notice:", forensicsErr?.name || "forensics_warning");
      }
    }

    let provider = options.provider;
    if (!provider || typeof provider.analyzeSemantics !== "function") {
      if (options.useAIGateway === true || (options.useGemini === true && typeof process !== "undefined" && process.env?.GEMINI_API_KEY)) {
        provider = new AIGatewayModelProvider();
      } else {
        provider = new DeterministicSemanticProvider();
      }
    }

    let semanticAnalysis;
    let fallbackUsed = false;
    try {
      const rawAnalysis = await provider.analyzeSemantics(semanticParams);
      semanticAnalysis = normalizeSemanticAnalysis(rawAnalysis, { source: provider.providerId || "provider" });
      if (!semanticAnalysis) throw new Error("SEMANTIC_PROVIDER_INVALID_RESPONSE");
    } catch (error) {
      if (options.signal?.aborted) throw error;
      fallbackUsed = true;
      const fallback = new DeterministicSemanticProvider();
      try {
        const rawFallback = await fallback.analyzeSemantics(semanticParams);
        semanticAnalysis = normalizeSemanticAnalysis(rawFallback, { source: fallback.providerId }) ||
          createUnknownSemanticAnalysis("DETERMINISTIC_FALLBACK_INVALID");
      } catch (fallbackError) {
        if (options.signal?.aborted) throw fallbackError;
        semanticAnalysis = createUnknownSemanticAnalysis("DETERMINISTIC_FALLBACK_FAILURE");
      }
      semanticAnalysis.modelStatus = error?.name === "AbortError"
        ? SEMANTIC_PROVIDER_STATUS.TIMEOUT
        : SEMANTIC_PROVIDER_STATUS.FALLBACK_USED;
      semanticAnalysis.fallbackReason = error?.message === "SEMANTIC_PROVIDER_INVALID_RESPONSE"
        ? "INVALID_RESPONSE"
        : "PROVIDER_UNAVAILABLE";
      semanticAnalysis.providerIndependent = true;
      semanticAnalysis.aiCannotOverrideSecurity = true;
      semanticAnalysis.deterministicFallbackAvailable = semanticAnalysis.classification !== SEMANTIC_CLASSIFICATION.UNKNOWN;
    }

    if (!semanticAnalysis) semanticAnalysis = createUnknownSemanticAnalysis("SEMANTIC_BOUNDARY_FAILURE");

    const confidence = Layer2ConfidenceEngine.calibrateConfidence({
      layer1Result,
      semanticAnalysis,
    });

    let verificationPackage;
    try {
      verificationPackage = VerificationPlanner.planVerification({
        claims: semanticAnalysis.claims,
        entities: semanticAnalysis.entities,
        consistencyFindings: semanticAnalysis.consistencyFindings,
        crossModalFindings: semanticAnalysis.crossModalFindings,
      });
    } catch {
      verificationPackage = emptyVerificationPackage();
      semanticAnalysis.modelStatus = semanticAnalysis.modelStatus || SEMANTIC_PROVIDER_STATUS.INVALID_RESPONSE;
    }

    const decision = Layer2DecisionEngine.resolveDecision({
      layer1Result,
      semanticAnalysis,
      confidence,
    });

    const executionTimeMs = Number((nowMs() - startedAt).toFixed(2));
    const providerStatus = providerStatusFor(semanticAnalysis, fallbackUsed);

    return createLayer2Result({
      status: decision.status,
      classification: decision.classification,
      confidence,
      semanticSummary: semanticAnalysis.semanticSummary,
      intent: semanticAnalysis.intent,
      entities: semanticAnalysis.entities,
      claims: semanticAnalysis.claims,
      contextSignals: semanticAnalysis.contextSignals,
      consistencyFindings: semanticAnalysis.consistencyFindings,
      crossModalFindings: semanticAnalysis.crossModalFindings,
      verificationPackage,
      mediaForensics,
      nextLayer: decision.nextLayer,
      requestId,
      details: {
        decisionRationale: decision.decisionRationale,
        manipulationResult: semanticAnalysis.manipulation,
        providerId: semanticAnalysis.providerId,
        modelProvider: semanticAnalysis.modelProvider,
        modelUsed: semanticAnalysis.modelUsed,
        fallbackReason: semanticAnalysis.fallbackReason,
        providerStatus,
        upstreamProviderStatus: semanticAnalysis.upstreamProviderStatus,
        deterministicFallbackAvailable: semanticAnalysis.deterministicFallbackAvailable === true,
        providerErrorType: semanticAnalysis.providerErrorType,
        providerHttpStatus: semanticAnalysis.providerHttpStatus,
        providerLatencyMs: semanticAnalysis.providerLatencyMs,
        gatewayAttempts: semanticAnalysis.gatewayAttempts,
        promptInjectionDetected: semanticAnalysis.promptInjectionDetected === true,
        candidateClassification: semanticAnalysis.candidateClassification || null,
        confidenceKind: semanticAnalysis.confidenceKind || "semantic_candidate_only",
        confidenceSource: semanticAnalysis.confidenceSource || semanticAnalysis.providerId,
        providerIndependent: semanticAnalysis.providerIndependent !== false,
        aiCannotOverrideSecurity: true,
        inputTrust: "UNTRUSTED_CONTENT_ISOLATED",
      },
      metrics: {
        executionTimeMs,
        modelUsed: semanticAnalysis.modelUsed || semanticAnalysis.providerId || provider.providerId || "semantic_boundary",
        providerStatus,
        upstreamProviderStatus: semanticAnalysis.upstreamProviderStatus || null,
        deterministicFallbackAvailable: semanticAnalysis.deterministicFallbackAvailable === true,
        providerIndependent: semanticAnalysis.providerIndependent !== false,
        confidenceKind: semanticAnalysis.confidenceKind || "semantic_candidate_only",
        timestamp: Date.now(),
      },
    });
  }
}
