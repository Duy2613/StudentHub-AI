/**
 * Canonical server-side Trust entrypoint.
 *
 * Implements the FriendBackendAdapter as the PRIMARY execution path when configured,
 * sequentially calling:
 *   - Layer 1: Local screen / offline regex (Layer1ScreenService)
 *   - Layer 2: POST /api/verify/layer2 (Google Safe Browsing)
 *   - Layer 3: POST /api/verify/layer3 (Tavily Search Web Evidence)
 *   - Layer 4: POST /api/verify/layer4 (Groq/Gemini Final AI Verification)
 *
 * If the friend backend adapter is not configured, it preserves and falls back
 * cleanly to the native StudentHub trust.v5 pipeline (super.run).
 */

import { createFriendBackendAdapter } from "./integrations/friendBackend/FriendBackendAdapter.js";
import { createLegacyVerificationAdapter } from "./integrations/legacyVerification/LegacyVerificationAdapter.js";
import { createProviderGateway } from "./providerGateway/ProviderGateway.js";
import { TrustPipelineOrchestrator, TrustPipelineCancelledError } from "./v5/TrustPipelineOrchestrator.js";
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

export class TrustOrchestrator extends TrustPipelineOrchestrator {
  constructor(options = {}) {
    const friendBackendAdapter = options.friendBackendAdapter || options.legacyVerificationAdapter || createFriendBackendAdapter();
    const legacyVerificationAdapter = friendBackendAdapter;
    const providerGateway = options.providerGateway || createProviderGateway({ legacyVerificationAdapter, friendBackendAdapter });
    super({
      ...options,
      providerGateway,
    });
    this.friendBackendAdapter = friendBackendAdapter;
  }

  async run(rawInput = {}, options = {}) {
    // If friend backend is configured and enabled, execute the friend's 4-layer sequential pipeline as PRIMARY
    if (this.friendBackendAdapter && this.friendBackendAdapter.isConfigured) {
      return this.runFriendSequentialPipeline(rawInput, options);
    }
    // Otherwise fallback cleanly to native StudentHub trust.v5
    return super.run(rawInput, options);
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
    await this._emit(pipeline, "PIPELINE_STARTED", onTransition);

    const rawResults = {};

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
    const l1Stage = stageFromL1(l1Result, requestId, l1Timing);
    this._setStage(pipeline, "l1", l1Stage);
    rawResults.layer1 = l1Result;
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);

    // ----------------------------------------------------
    // LAYER 2: Google Safe Browsing via Friend Backend
    // (POST /api/verify/layer2)
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

    const l2Result = await this.friendBackendAdapter.verifyLayer2({
      url: input.type === "url" ? input.content : input.metadata?.url,
      input,
      requestId,
      signal: callerSignal,
    });
    const l2Timing = { startedAt: new Date(l2Start).toISOString(), completedAt: new Date().toISOString(), latencyMs: Date.now() - l2Start };

    const l2RawVerdict = (l2Result.rawVerdict || "UNKNOWN").toUpperCase();
    const l2Finding = l2RawVerdict === "DANGEROUS" ? "THREAT_MATCH" : (l2RawVerdict === "SAFE" ? "NO_KNOWN_THREAT" : "NOT_APPLICABLE");
    const l2Severity = l2RawVerdict === "DANGEROUS" ? "CRITICAL" : "INFO";

    const l2Stage = createStageEnvelope({
      stageId: "l2a",
      requestId,
      operationStatus: OPERATION_STATUS.COMPLETED,
      finding: l2Finding,
      severity: l2Severity,
      providerStatus: l2Result.providerStatus || "SUCCESS",
      providerId: "google-safe-browsing",
      confidence: l2Result.confidence || 0.8,
      summary: l2Result.reason || l2Result.message || "Google Safe Browsing URL threat check.",
      reasons: [l2Result.reason, l2Result.message].filter(Boolean),
      signals: [
        signal("URL_THREAT_VERDICT", l2RawVerdict, "google-safe-browsing", l2Severity),
        ...(l2Result.threatTypes?.length ? [signal("THREAT_TYPES", l2Result.threatTypes.join(", "), "google-safe-browsing", "CRITICAL")] : []),
      ],
      startedAt: l2Timing.startedAt,
      completedAt: l2Timing.completedAt,
      latencyMs: l2Timing.latencyMs,
      rawMetadata: l2Result,
    });
    this._setStage(pipeline, "l2a", l2Stage);
    this._setStage(pipeline, "l2b", {
      ...l2Stage,
      stageId: "l2b",
      providerId: "friend_backend_layer2",
    });
    rawResults.layer2A = l2Result;
    rawResults.layer2B = l2Result;
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);

    // ----------------------------------------------------
    // LAYER 3: Tavily Web Evidence via Friend Backend
    // (POST /api/verify/layer3)
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

    const l3Result = await this.friendBackendAdapter.verifyLayer3({
      input,
      claims: l1Result.claims || [],
      requestId,
      signal: callerSignal,
    });
    const l3Timing = { startedAt: new Date(l3Start).toISOString(), completedAt: new Date().toISOString(), latencyMs: Date.now() - l3Start };

    const l3Integration = l3Result.legacyIntegration || {};
    const l3RawVerdict = (l3Integration.rawVerdict || l3Result.verdict || "UNKNOWN").toUpperCase();
    const l3Finding = l3RawVerdict === "TRUE" ? "SUPPORTED" : (l3RawVerdict === "FALSE" ? "CONTRADICTED" : "INSUFFICIENT");

    const l3Stage = createStageEnvelope({
      stageId: "l3",
      requestId,
      operationStatus: OPERATION_STATUS.COMPLETED,
      finding: l3Finding,
      severity: l3Finding === "CONTRADICTED" ? "HIGH" : "INFO",
      providerStatus: l3Integration.providerStatus || l3Result.retrievalStatus || "SUCCESS",
      providerId: "tavily_web_retriever",
      confidence: l3Integration.legacyAssessmentConfidence ?? 0.5,
      summary: l3Integration.reason || "Tavily web evidence retrieval.",
      reasons: [l3Integration.reason].filter(Boolean),
      signals: [
        signal("SOURCES_CHECKED", `${l3Result.sources?.length || 0} source(s), ${l3Result.evidence?.length || 0} evidence item(s).`, "tavily_retriever", "INFO"),
        signal("TAVILY_VERDICT", l3RawVerdict, "friend_backend_layer3", "INFO"),
      ],
      sources: l3Result.sources || [],
      evidence: l3Result.evidence || [],
      startedAt: l3Timing.startedAt,
      completedAt: l3Timing.completedAt,
      latencyMs: l3Timing.latencyMs,
      rawMetadata: l3Result,
    });
    this._setStage(pipeline, "l3", l3Stage);
    rawResults.layer3 = l3Result;
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);

    // ----------------------------------------------------
    // LAYER 4: Groq/Gemini Final AI Verification via Friend Backend
    // (POST /api/verify/layer4)
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

    const l4Result = await this.friendBackendAdapter.verifyLayer4({
      input,
      layer3Result: l3Result,
      mode: "user",
      requestId,
      signal: callerSignal,
    });
    const l4Timing = { startedAt: new Date(l4Start).toISOString(), completedAt: new Date().toISOString(), latencyMs: Date.now() - l4Start };

    const l4RawVerdict = (l4Result.rawVerdict || "UNKNOWN").toUpperCase();
    const isHardBlock = l1Result.status === "BLOCK" || l2RawVerdict === "DANGEROUS";
    const isMalicious = isHardBlock || ["FALSE", "FAKE", "MALICIOUS", "DANGEROUS"].includes(l4RawVerdict);
    const isSuspicious = !isMalicious && ["SUSPICIOUS", "MISLEADING", "MIXED"].includes(l4RawVerdict);
    const isSafe = !isMalicious && !isSuspicious && ["TRUE", "SUPPORTED", "SAFE"].includes(l4RawVerdict);

    const l4Finding = isMalicious ? "MALICIOUS" : (isSuspicious ? "SUSPICIOUS" : (isSafe ? "CLEAN" : "UNKNOWN"));
    const activeModel = l4Result.groqModel || l4Result.geminiModel || "Groq/Gemini";

    const l4Stage = createStageEnvelope({
      stageId: "l4",
      requestId,
      operationStatus: OPERATION_STATUS.COMPLETED,
      finding: l4Finding,
      severity: isMalicious ? "CRITICAL" : (isSuspicious ? "HIGH" : "INFO"),
      providerStatus: l4Result.providerStatus || "COMPLETED",
      providerId: activeModel,
      modelId: activeModel,
      confidence: l4Result.assessmentConfidence ?? l4Result.confidence ?? 0.85,
      summary: l4Result.reason || `Friend AI (${activeModel}) verification completed: ${l4RawVerdict}.`,
      reasons: [l4Result.reason].filter(Boolean),
      signals: [
        signal("AI_MODEL_PRIMARY", activeModel, "friend_backend_layer4", "INFO"),
        signal("DECISION_AUTHORITY", "FRIEND_BACKEND_AI", "friend_backend_layer4", "INFO"),
        signal("AI_VERDICT", l4RawVerdict, "friend_backend_layer4", isMalicious ? "CRITICAL" : "INFO"),
      ],
      startedAt: l4Timing.startedAt,
      completedAt: l4Timing.completedAt,
      latencyMs: l4Timing.latencyMs,
      rawMetadata: {
        ...l4Result,
        actualModel: activeModel,
        decisionAuthority: "FRIEND_BACKEND_AI",
      },
    });
    this._setStage(pipeline, "l4", l4Stage);
    rawResults.layer4 = l4Result;
    await this._emit(pipeline, "STAGE_COMPLETED", onTransition);

    // ----------------------------------------------------
    // FINAL PIPELINE ASSEMBLY & EMIT
    // ----------------------------------------------------
    const finalSecurity = isMalicious ? "MALICIOUS" : (isSuspicious ? "SUSPICIOUS" : (isSafe ? "SAFE" : "SUSPICIOUS"));
    const finalTruth = isSafe ? "VERIFIED_TRUE" : (isMalicious ? "CONTRADICTED" : "INSUFFICIENT_EVIDENCE");
    const finalAction = isMalicious ? "BLOCK" : (isSuspicious ? "WARN" : (isSafe ? "ALLOW_WITH_CAUTION" : "REVIEW"));

    pipeline.finalDecision = {
      security: finalSecurity,
      truth: finalTruth,
      action: finalAction,
      securityClassification: finalSecurity,
      truthStatus: finalTruth,
      enforcement: finalAction,
      presentedTruthStatus: finalTruth,
      presentedEnforcement: finalAction,
      decisionAuthority: "FRIEND_BACKEND_AI",
      actualModel: activeModel,
      geminiModel: l4Result.geminiModel || "none",
      groqModel: l4Result.groqModel || null,
      reason: l4Result.reason,
      l4Decision: {
        verdict: l4RawVerdict,
        confidence: l4Result.confidence,
        reason: l4Result.reason,
        model: activeModel,
      },
      isHardNegative: isMalicious,
    };

    pipeline.layerResults = {
      layer1: l1Result,
      layer2A: l2Result,
      layer2B: l2Result,
      layer3: l3Result,
      layer4: l4Result,
    };
    pipeline.pipelineStatus = PIPELINE_STATUS.COMPLETED;
    pipeline.completedAt = new Date().toISOString();

    await this._emit(pipeline, "PIPELINE_COMPLETED", onTransition);
    return toPublicPipelineResult(cloneSafe(pipeline));
  }
}

export function createTrustOrchestrator(options = {}) {
  return new TrustOrchestrator(options);
}
