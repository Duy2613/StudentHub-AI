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
    if (multiLabelPrediction.verdict === "SCAM" && hasConcreteScamType && intent.primary === "inform") {
      if (multiLabelPrediction.requested_actions.includes("OTP") || multiLabelPrediction.requested_actions.includes("PASSWORD")) {
        intent.primary = "request_credentials";
      } else if (multiLabelPrediction.requested_actions.includes("TRANSFER_MONEY")) {
        intent.primary = "request_payment";
      } else if (multiLabelPrediction.scam_types.some((s) => s.includes("IMPERSONATION"))) {
        intent.primary = "impersonate";
      }
    }

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

    // 6. Psychological Manipulation Scoring
    const manipulation = ManipulationAnalyzer.analyze(combinedText);
    if (neuralPrediction.urgencyScore > 0.5) {
      manipulation.urgencyScore = Math.max(manipulation.urgencyScore, neuralPrediction.urgencyScore);
    }

    // 7. Semantic Summary Synthesis
    let semanticSummary = "";
    if (neuralPrediction.threatScore > 0.80) {
      const catDescriptions = {
        OTP_CREDENTIAL_PHISHING: "Phát hiện dấu hiệu mạo danh đánh cắp tài khoản, mã OTP hoặc thông tin sinh trắc học.",
        OTP_PHISHING: "Phát hiện dấu hiệu mạo danh đánh cắp tài khoản, mã OTP hoặc thông tin sinh trắc học.",
        FAKE_PARTTIME_JOB_TASK: "Phát hiện bẫy tuyển dụng CTV nạp tiền đặt cọc / làm nhiệm vụ nhận hoa hồng lừa đảo.",
        FAKE_PARTTIME_JOB: "Phát hiện bẫy tuyển dụng CTV nạp tiền đặt cọc / làm nhiệm vụ nhận hoa hồng lừa đảo.",
        SCHOLARSHIP_TUITION_FRAUD: "Phát hiện bẫy học bổng ảo / trợ cấp yêu cầu nộp lệ phí hồ sơ hoặc thông tin thẻ ngân hàng.",
        SCHOLARSHIP_SCAM: "Phát hiện bẫy học bổng ảo / trợ cấp yêu cầu nộp lệ phí hồ sơ hoặc thông tin thẻ ngân hàng.",
        ACADEMIC_CHEATING_LEAK: "Phát hiện nội dung gian lận học thuật, mua bán đề thi hoặc chứng chỉ giả mạo.",
        DORM_HOUSING_RENTAL_SCAM: "Phát hiện bẫy thuê phòng trọ yêu cầu chuyển tiền cọc giữ chỗ trước khi gặp mặt.",
        DORM_RENTAL_FRAUD: "Phát hiện bẫy thuê phòng trọ yêu cầu chuyển tiền cọc giữ chỗ trước khi gặp mặt.",
        FACULTY_AUTHORITY_IMPERSONATION: "Phát hiện hành vi mạo danh giảng viên/cán bộ trường học yêu cầu chuyển tiền/mua thẻ cào.",
        FACULTY_IMPERSONATION: "Phát hiện hành vi mạo danh giảng viên/cán bộ trường học yêu cầu chuyển tiền/mua thẻ cào.",
        MALICIOUS_APP_PAYLOAD: "Phát hiện đường link phát tán tệp tin cài đặt ứng dụng (.apk / .exe) nguy hiểm.",
        MALICIOUS_APK_PAYLOAD: "Phát hiện đường link phát tán tệp tin cài đặt ứng dụng (.apk / .exe) nguy hiểm.",
        STUDENT_LOAN_CREDIT_TRAP: "Phát hiện bẫy tín dụng đen / vay tiền sinh viên kèm phí bảo lãnh và đe dọa đòi nợ.",
        LOAN_CREDIT_TRAP: "Phát hiện bẫy tín dụng đen / vay tiền sinh viên kèm phí bảo lãnh và đe dọa đòi nợ.",
        COMBOSQUAT_DECEPTIVE_DOMAIN: "Phát hiện đường link mạo danh thương hiệu trường đại học hoặc tổ chức tài chính.",
        COMBOSQUAT_DOMAIN: "Phát hiện đường link mạo danh thương hiệu trường đại học hoặc tổ chức tài chính.",
        FAKE_CHARITY_EMERGENCY_FUND: "Phát hiện kêu gọi quyên góp từ thiện bất thường không qua kênh kiểm chứng chính thức.",
        FAKE_CHARITY_EMERGENCY: "Phát hiện kêu gọi quyên góp từ thiện bất thường không qua kênh kiểm chứng chính thức.",
        PYRAMID_MLM_CRYPTO_PONZI: "Phát hiện mô hình đa cấp Ponzi / khóa học làm giàu lôi kéo sinh viên.",
        PYRAMID_MLM_TRAP: "Phát hiện mô hình đa cấp Ponzi / khóa học làm giàu lôi kéo sinh viên.",
        ROMANCE_PIG_BUTCHERING: "Phát hiện bẫy lừa tình cảm kết hợp rủ rê đầu tư tài chính / tiền ảo.",
        DEEPFAKE_EXTORTION: "Phát hiện thủ đoạn sử dụng Deepfake cắt ghép hình ảnh/video để tống tiền.",
        FAKE_FANPAGE_STUDENT_CLUB: "Phát hiện trang mạng xã hội mạo danh câu lạc bộ / sự kiện sinh viên.",
        ACADEMIC_LAB_PROJECT_DEPOSIT_FRAUD: "Phát hiện bẫy đóng cọc giữ chỗ tham gia dự án NCKH / Đồ án / Lab Robot vi phạm quy chế.",
        CAMPUS_SURVEY_IDENTITY_THEFT: "Phát hiện form khảo sát NCKH giả mạo nhằm thu thập hình ảnh CCCD và mã OTP.",
        BANK_ACCOUNT_RENTAL_TRAP: "Phát hiện bẫy lôi kéo sinh viên mở / cho thuê tài khoản ngân hàng trái pháp luật.",
        ITEM_BORROWING_EMBEZZLEMENT: "Phát hiện dấu hiệu lợi dụng lòng tin mượn tài sản / laptop đồ án để chiếm đoạt.",
      };
      semanticSummary = catDescriptions[neuralPrediction.primaryCategory] || "Phát hiện các dấu hiệu bất thường có độ rủi ro cao từ mô hình phân tích.";
    } else if (contextSignals.some((s) => s.type === "credential_harvesting_context")) {
      semanticSummary = "Nội dung mạo danh đơn vị uy tín nhằm yêu cầu cung cấp thông tin bảo mật / mã OTP.";
    } else if (contextSignals.some((s) => s.type === "financial_scam_context")) {
      semanticSummary = "Nội dung tuyển dụng / cộng tác viên yêu cầu nạp tiền đặt cọc kèm cam kết hoa hồng bất thường.";
    } else if (contextSignals.some((s) => s.type === "educational_discussion") || neuralPrediction.primaryCategory === "AUTHENTIC_ACADEMIC") {
      semanticSummary = "Văn bản thông tin chính thống / thảo luận học thuật an toàn, không phát hiện dấu hiệu gian lận.";
    } else if (claims.length > 0) {
      semanticSummary = `Phát hiện ${claims.length} phát ngôn / tuyên bố sự kiện cần kiểm chứng nguồn tin chính thức tại Layer 3.`;
    } else {
      semanticSummary = "Văn bản thông tin thông thường, không phát hiện dấu hiệu bất thường về ngữ nghĩa hay thao túng tâm lý.";
    }

    // 8. Provisional Semantic Classification
    let classification = SEMANTIC_CLASSIFICATION.BENIGN;
    if (hasHighNeuralThreat || (multiLabelPrediction.verdict === "SCAM" && hasConcreteScamType) || contextSignals.some((s) => s.severity === "critical") || crossModalFindings.some((f) => f.severity === "critical")) {
      classification = SEMANTIC_CLASSIFICATION.MALICIOUS;
    } else if (consistencyFindings.length > 0) {
      classification = SEMANTIC_CLASSIFICATION.DECEPTIVE;
    } else if (contextSignals.some((s) => s.type === "urgency_manipulation") || (!neuralPrediction.primaryCategory?.startsWith("AUTHENTIC") && neuralPrediction.threatScore >= 0.45)) {
      classification = SEMANTIC_CLASSIFICATION.MISLEADING;
    } else if (claims.some((c) => c.verificationRequired)) {
      classification = SEMANTIC_CLASSIFICATION.UNVERIFIED;
    } else if (contextSignals.some((s) => s.type === "educational_discussion") || neuralPrediction.primaryCategory === "AUTHENTIC_ACADEMIC") {
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
