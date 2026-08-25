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
import { SEMANTIC_CLASSIFICATION } from "../types.js";

export class DeterministicSemanticProvider extends ISemanticVerificationProvider {
  constructor() {
    super("deterministic_semantic_engine");
  }

  /**
   * Executes local semantic analysis pipeline
   */
  async analyzeSemantics({ text = "", url = "", ocrText = "", qrPayload = "", layer1Result = {}, options = {} }) {
    const combinedText = `${text} ${ocrText}`.trim();

    // 1. Intent Analysis
    const intent = IntentAnalyzer.analyze(combinedText, { url, qrPayload });

    // 2. Entity Extraction & Claim Extraction
    const entities = EntityExtractor.extract(combinedText, { url });
    const claims = ClaimExtractor.extract(combinedText, entities, { url });

    // 3. Context Analysis & Social Engineering Synthesizer
    const contextSignals = ContextAnalyzer.analyze({
      text: combinedText,
      intent,
      entities,
      layer1Signals: layer1Result.signals || [],
    });

    // 4. Internal Narrative Consistency
    const consistencyFindings = ConsistencyAnalyzer.analyze(combinedText);

    // 5. Multi-modal Cross Referencing
    const crossModalFindings = CrossModalAnalyzer.analyze({
      text,
      url,
      ocrText,
      qrPayload,
      entities,
      layer1Result,
    });

    // 6. Psychological Manipulation Scoring
    const manipulation = ManipulationAnalyzer.analyze(combinedText);

    // 7. Semantic Summary Synthesis
    let semanticSummary = "";
    if (contextSignals.some((s) => s.type === "credential_harvesting_context")) {
      semanticSummary = "Nội dung mạo danh đơn vị uy tín nhằm yêu cầu cung cấp thông tin bảo mật / mã OTP.";
    } else if (contextSignals.some((s) => s.type === "financial_scam_context")) {
      semanticSummary = "Nội dung tuyển dụng / cộng tác viên yêu cầu nạp tiền đặt cọc kèm cam kết hoa hồng bất thường.";
    } else if (contextSignals.some((s) => s.type === "educational_discussion")) {
      semanticSummary = "Văn bản học thuật thảo luận về nguyên lý bảo mật, bài tập môn học hoặc nghiên cứu lý thuyết.";
    } else if (claims.length > 0) {
      semanticSummary = `Phát hiện ${claims.length} phát ngôn / tuyên bố sự kiện cần kiểm chứng nguồn tin chính thức tại Layer 3.`;
    } else {
      semanticSummary = "Văn bản thông tin thông thường, không phát hiện dấu hiệu bất thường về ngữ nghĩa hay thao túng tâm lý.";
    }

    // 8. Provisional Semantic Classification
    let classification = SEMANTIC_CLASSIFICATION.BENIGN;
    if (contextSignals.some((s) => s.severity === "critical") || crossModalFindings.some((f) => f.severity === "critical")) {
      classification = SEMANTIC_CLASSIFICATION.MALICIOUS;
    } else if (contextSignals.some((s) => s.type === "urgency_manipulation") || consistencyFindings.length > 0) {
      classification = SEMANTIC_CLASSIFICATION.MISLEADING;
    } else if (claims.some((c) => c.verificationRequired)) {
      classification = SEMANTIC_CLASSIFICATION.UNVERIFIED;
    } else if (contextSignals.some((s) => s.type === "educational_discussion")) {
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
      providerId: this.providerId,
    };
  }
}
