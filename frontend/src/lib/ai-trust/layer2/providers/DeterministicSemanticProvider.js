/**
 * Layer 2 — DeterministicSemanticProvider
 * 
 * High-performance, zero-LLM deterministic semantic heuristic provider.
 * Guarantees instantaneous (< 15ms) execution, offline resilience, and 100% deterministic test reproducibility.
 */

import { ISemanticVerificationProvider } from "./ISemanticVerificationProvider.js";
import { IntentAnalyzer } from "../analyzers/IntentAnalyzer.js";
import { EntityExtractor } from "../analyzers/EntityExtractor.js";
import { ClaimExtractor } from "../analyzers/ClaimExtractor.js";
import { ContextAnalyzer } from "../analyzers/ContextAnalyzer.js";
import { ConsistencyAnalyzer } from "../analyzers/ConsistencyAnalyzer.js";
import { CrossModalAnalyzer } from "../analyzers/CrossModalAnalyzer.js";
import { ManipulationAnalyzer } from "../analyzers/ManipulationAnalyzer.js";
import { StudentHubNeuralModel } from "../../models/StudentHubNeuralModel.js";
import { StudentHubMultiLabelNeuralModel } from "../../models/StudentHubMultiLabelNeuralModel.js";
import { SEMANTIC_CLASSIFICATION, SEMANTIC_PROVIDER_STATUS } from "../types.js";
import { SEMANTIC_BOUNDARY_LIMITS } from "../guards/SemanticBoundary.js";

export class DeterministicSemanticProvider extends ISemanticVerificationProvider {
  constructor() {
    super("deterministic_neural_semantic_engine");
  }

  /**
   * Executes local semantic analysis pipeline with StudentHub Neural Model
   */
  async analyzeSemantics({ text = "", url = "", ocrText = "", qrPayload = "", layer1Result = {}, options = {} } = {}) {
    const safeText = typeof text === "string" ? text.slice(0, SEMANTIC_BOUNDARY_LIMITS.TEXT) : "";
    const safeUrl = typeof url === "string" ? url.slice(0, SEMANTIC_BOUNDARY_LIMITS.URL) : "";
    const safeOcrText = typeof ocrText === "string" ? ocrText.slice(0, SEMANTIC_BOUNDARY_LIMITS.OCR) : "";
    const safeQrPayload = typeof qrPayload === "string" ? qrPayload.slice(0, SEMANTIC_BOUNDARY_LIMITS.QR) : "";
    const safeLayer1Result = layer1Result && typeof layer1Result === "object" && !Array.isArray(layer1Result)
      ? { ...layer1Result, signals: Array.isArray(layer1Result.signals) ? layer1Result.signals.slice(0, 40) : [] }
      : { status: "UNKNOWN", signals: [] };
    const combinedText = `${safeText} ${safeOcrText}`.trim();

    // 0. StudentHub Multi-Head & Single-Head Neural Model Prediction
    const neuralPrediction = StudentHubNeuralModel.predict(combinedText, { url: safeUrl, ocrText: safeOcrText, qrPayload: safeQrPayload });
    const multiLabelPrediction = StudentHubMultiLabelNeuralModel.predict(combinedText, { url: safeUrl, ocrText: safeOcrText, qrPayload: safeQrPayload });

    // 1. Intent Analysis
    const intent = IntentAnalyzer.analyze(combinedText, { url: safeUrl, qrPayload: safeQrPayload });
    const hasConcreteScamType = multiLabelPrediction.scam_types && multiLabelPrediction.scam_types.length > 0;
    // The neural heads are advisory only.  In particular, never mutate the
    // deterministic intent from a model prediction: short opinions and
    // ordinary URLs have historically been misread as payment/credential
    // requests by the local model.

    // 2. Entity Extraction & Claim Extraction
    const entities = EntityExtractor.extract(combinedText, { url: safeUrl });
    const claims = ClaimExtractor.extract(combinedText, entities, { url: safeUrl });

    // 3. Context Analysis & Social Engineering Synthesizer
    const contextSignals = ContextAnalyzer.analyze({
      text: combinedText,
      intent,
      entities,
      layer1Signals: safeLayer1Result.signals,
    });

    // Augment contextSignals with Neural Model detections only when concrete category exists
    const hasHighNeuralThreat = !neuralPrediction.primaryCategory?.startsWith("AUTHENTIC") && neuralPrediction.threatScore > 0.75;
    if ((multiLabelPrediction.verdict === "SCAM" && hasConcreteScamType) || hasHighNeuralThreat) {
      contextSignals.push({
        type: `neural_${(multiLabelPrediction.scam_types[0] || neuralPrediction.primaryCategory || "scam").toLowerCase()}`,
        category: "neural_trust_model",
        severity: multiLabelPrediction.severity ? multiLabelPrediction.severity.toLowerCase() : neuralPrediction.riskLevel.toLowerCase(),
        confidence: multiLabelPrediction.confidence || neuralPrediction.confidence,
        evidence: {
          scamTypes: multiLabelPrediction.scam_types,
          psychologicalTactics: multiLabelPrediction.psychological_tactics,
          attackStage: multiLabelPrediction.attack_stage,
          requestedActions: multiLabelPrediction.requested_actions,
          targetAssets: multiLabelPrediction.target_assets,
          redFlags: multiLabelPrediction.red_flags,
          threatScore: multiLabelPrediction.confidence || neuralPrediction.threatScore,
        },
        source: "neural_advisory_signal",
        authoritative: false,
      });
    }

    // 4. Internal Narrative Consistency
    const consistencyFindings = ConsistencyAnalyzer.analyze(combinedText);

    // 5. Multi-modal Cross Referencing
    const crossModalFindings = CrossModalAnalyzer.analyze({
      text: safeText,
      url: safeUrl,
      ocrText: safeOcrText,
      qrPayload: safeQrPayload,
      entities,
      layer1Result: safeLayer1Result,
    });

    const deterministicContextSignals = contextSignals.filter((signal) =>
      signal?.authoritative !== false && !String(signal?.type || "").toLowerCase().startsWith("neural_"));
    const deterministicCrossModalFindings = crossModalFindings.filter((finding) => finding?.authoritative !== false);
    const hasDeterministicCriticalContext = deterministicContextSignals.some((signal) => signal?.severity === "critical");
    const hasDeterministicCriticalCrossModal = deterministicCrossModalFindings.some((finding) => finding?.severity === "critical");

    // 6. Psychological Manipulation Scoring
    const manipulation = ManipulationAnalyzer.analyze(combinedText);

    // 7. Semantic Summary Synthesis
    let semanticSummary = "";
    if (deterministicContextSignals.some((s) => s.type === "credential_harvesting_context")) {
      semanticSummary = "Nội dung mạo danh đơn vị uy tín nhằm yêu cầu cung cấp thông tin bảo mật / mã OTP.";
    } else if (deterministicContextSignals.some((s) => s.type === "financial_scam_context")) {
      semanticSummary = "Nội dung tuyển dụng / cộng tác viên yêu cầu nạp tiền đặt cọc kèm cam kết hoa hồng bất thường.";
    } else if (deterministicContextSignals.some((s) => s.type === "educational_discussion")) {
      semanticSummary = "Văn bản thông tin chính thống / thảo luận học thuật an toàn, không phát hiện dấu hiệu gian lận.";
    } else if (hasDeterministicCriticalCrossModal) {
      semanticSummary = "Phát hiện bất nhất liên phương thức cần đối soát thêm giữa văn bản, hình ảnh và đích URL.";
    } else if (claims.length > 0) {
      semanticSummary = `Phát hiện ${claims.length} phát ngôn / tuyên bố sự kiện cần kiểm chứng nguồn tin chính thức tại Layer 3.`;
    } else {
      semanticSummary = "Văn bản thông tin thông thường, không phát hiện dấu hiệu bất thường về ngữ nghĩa hay thao túng tâm lý.";
    }

    // 8. Provisional Semantic Classification
    let classification = SEMANTIC_CLASSIFICATION.BENIGN;
    if (hasDeterministicCriticalContext || hasDeterministicCriticalCrossModal) {
      classification = SEMANTIC_CLASSIFICATION.MALICIOUS;
    } else if (consistencyFindings.length > 0) {
      classification = SEMANTIC_CLASSIFICATION.DECEPTIVE;
    } else if (deterministicContextSignals.some((s) => s.type === "urgency_manipulation")) {
      classification = SEMANTIC_CLASSIFICATION.MISLEADING;
    } else if (claims.some((c) => c.verificationRequired)) {
      classification = SEMANTIC_CLASSIFICATION.UNVERIFIED;
    } else if (deterministicContextSignals.some((s) => s.type === "educational_discussion")) {
      classification = SEMANTIC_CLASSIFICATION.INFORMATIVE;
    }

    return {
      semanticSummary,
      intent,
      entities,
      claims,
      contextSignals,
      consistencyFindings,
      crossModalFindings,
      manipulation,
      classification,
      modelStatus: SEMANTIC_PROVIDER_STATUS.LOCAL_DETERMINISTIC,
      confidenceKind: "deterministic_heuristic_candidate_only",
      confidenceSource: this.providerId,
      providerIndependent: true,
      aiCannotOverrideSecurity: true,
      inputTrust: "UNTRUSTED_CONTENT_ISOLATED",
      neuralModel: {
        primaryCategory: neuralPrediction.primaryCategory,
        threatScore: neuralPrediction.threatScore,
        confidence: neuralPrediction.confidence,
        probabilities: neuralPrediction.probabilities,
        latencyMs: neuralPrediction.latencyMs,
      },
      multiLabelModel: multiLabelPrediction,
      providerId: this.providerId,
    };
  }
}
