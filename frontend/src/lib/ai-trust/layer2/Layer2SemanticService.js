/**
 * Layer 2 — Layer2SemanticService
 * 
 * Central Facade and Orchestrator for Layer 2: Semantic & Contextual Verification.
 * Coordinates Multimodal Reasoners -> Confidence Engines -> Verification Planners -> Decision Engines.
 */

import { createLayer2Result } from "./types.js";
import { LAYER_2_CONFIG } from "./config/Layer2Config.js";
import { DeterministicSemanticProvider } from "./providers/DeterministicSemanticProvider.js";
import { GeminiSemanticModelProvider } from "./providers/GeminiSemanticModelProvider.js";
import { AIGatewayModelProvider } from "./providers/AIGatewayModelProvider.js";
import { Layer2ConfidenceEngine } from "./engine/Layer2ConfidenceEngine.js";
import { VerificationPlanner } from "./engine/VerificationPlanner.js";
import { Layer2DecisionEngine } from "./engine/Layer2DecisionEngine.js";

export class Layer2SemanticService {
  /**
   * Evaluates content through Layer 2 Semantic Verification Pipeline
   * @param {object} params
   * @param {string} params.type - 'text' | 'url' | 'image' | 'file'
   * @param {string} params.content - Main payload or URL string
   * @param {object} params.metadata - OCR text, QR payload, file metadata
   * @param {object} params.layer1Result - Upstream Layer 1 Output DTO
   * @param {object} params.options - Custom model provider or requestId
   * @returns {Promise<object>} Layer 2 Result DTO
   */
  static async verify({
    type = "text",
    content = "",
    metadata = {},
    layer1Result = {},
    options = {},
  }) {
    const startTime = performance.now();
    const requestId = options.requestId || `req_l2_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    // 1. Multimodal normalization & bounding
    const boundedText = (type === "text" ? content : "").slice(0, LAYER_2_CONFIG.LIMITS.MAX_TEXT_CHARACTERS);
    const targetUrl = type === "url" ? content : (metadata.url || "");
    const ocrText = (metadata.ocrText || "").slice(0, LAYER_2_CONFIG.LIMITS.MAX_OCR_CHARACTERS);
    const qrPayload = metadata.qrContent || metadata.qrPayload || "";

    // 2. Provider Selection
    // Default remains the zero-LLM deterministic engine (test/CI reproducibility,
    // <15ms latency, offline resilience). AI enrichment is strictly opt-in:
    //   - options.useAIGateway: routes through the multi-vendor AI Gateway
    //     (docs/AI-MODEL-ROUTER.md), which capability-routes across every
    //     configured provider with automatic fallback — never a single
    //     hard-coded vendor.
    //   - options.useGemini: legacy single-vendor Gemini path, kept only for
    //     historical/backward compatibility with existing integrations.
    let provider = options.provider;
    if (!provider) {
      if (options.useAIGateway) {
        provider = new AIGatewayModelProvider();
      } else if (options.useGemini && process.env.GEMINI_API_KEY) {
        provider = new GeminiSemanticModelProvider();
      } else {
        provider = new DeterministicSemanticProvider();
      }
    }

    // 3. Execute Multimodal Semantic Analysis
    let semanticAnalysis;
    try {
      semanticAnalysis = await provider.analyzeSemantics({
        text: boundedText,
        url: targetUrl,
        ocrText,
        qrPayload,
        layer1Result,
        options,
      });
    } catch (err) {
      console.warn(`[Layer2 Service Fallback] Provider failed: ${err.message}`);
      const fallback = new DeterministicSemanticProvider();
      semanticAnalysis = await fallback.analyzeSemantics({
        text: boundedText,
        url: targetUrl,
        ocrText,
        qrPayload,
        layer1Result,
      });
      semanticAnalysis.modelStatus = "fallback_used";
      semanticAnalysis.fallbackReason = err.message;
    }

    // 4. Calibrate Confidence
    const confidence = Layer2ConfidenceEngine.calibrateConfidence({
      layer1Result,
      semanticAnalysis,
    });

    // 5. Build Layer 3 Verification Package
    const verificationPackage = VerificationPlanner.planVerification({
      claims: semanticAnalysis.claims || [],
      entities: semanticAnalysis.entities || [],
      consistencyFindings: semanticAnalysis.consistencyFindings || [],
      crossModalFindings: semanticAnalysis.crossModalFindings || [],
    });

    // 6. Resolve Final Layer 2 Decision
    const decision = Layer2DecisionEngine.resolveDecision({
      layer1Result,
      semanticAnalysis,
      confidence,
    });

    const executionTimeMs = Number((performance.now() - startTime).toFixed(2));

    // 7. Assemble Standardized Response DTO
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
      nextLayer: decision.nextLayer,
      requestId,
      details: {
        decisionRationale: decision.decisionRationale,
      },
      metrics: {
        executionTimeMs,
        modelUsed: provider.providerId || "deterministic_semantic_engine",
        providerStatus: semanticAnalysis.modelStatus || "healthy",
        timestamp: Date.now(),
      },
    });
  }
}
