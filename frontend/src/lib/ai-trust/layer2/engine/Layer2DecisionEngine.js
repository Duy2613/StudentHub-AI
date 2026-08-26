/**
 * Layer 2 — Layer2DecisionEngine
 * 
 * Resolves the final Layer 2 Quad-State Verdict (BLOCK, SUSPICIOUS, NEEDS_VERIFICATION, PASS)
 * and generates transparent, evidence-based explainability summaries.
 */

import { LAYER_2_STATUS, SEMANTIC_CLASSIFICATION } from "../types.js";

export class Layer2DecisionEngine {
  /**
   * Resolves Layer 2 Status & Explanation
   * @param {object} params
   * @param {object} params.layer1Result
   * @param {object} params.semanticAnalysis
   * @param {number} params.confidence
   * @returns {object} { status, classification, decisionRationale, nextLayer }
   */
  static resolveDecision({ layer1Result = {}, semanticAnalysis = {}, confidence = 0.90 }) {
    const {
      contextSignals = [],
      consistencyFindings = [],
      crossModalFindings = [],
      claims = [],
      intent = {},
    } = semanticAnalysis;

    // 1. Educational Content Immunity Check (Must NOT Block unless Layer 1 has active hard BLOCK)
    const isEducational = contextSignals.some((s) => s.type === "educational_discussion") && layer1Result.status !== "BLOCK";
    if (isEducational) {
      return {
        status: LAYER_2_STATUS.PASS,
        classification: SEMANTIC_CLASSIFICATION.INFORMATIVE,
        decisionRationale: "Văn bản học thuật / giáo dục an toàn. Không chứa hành vi bẫy thông tin hay thao túng.",
        nextLayer: claims.some((c) => c.verificationRequired) ? 3 : null,
      };
    }

    // 2. Hard Contextual BLOCK Resolution
    const hasCriticalContext = contextSignals.some((s) => s.severity === "critical");
    const hasCriticalCrossModal = crossModalFindings.some((f) => f.severity === "critical");
    const isCoerciveCredDemand = intent.primary === "request_credentials" || intent.primary === "request_payment";
    const isCriticalScamContext = contextSignals.some(
      (s) =>
        s.type === "credential_harvesting_context" ||
        s.type === "financial_scam_context" ||
        s.type === "account_takeover_context"
    );

    if (
      isCriticalScamContext ||
      (hasCriticalContext && (isCoerciveCredDemand || hasCriticalCrossModal)) ||
      (layer1Result.status === "BLOCK" && isCoerciveCredDemand) ||
      (hasCriticalCrossModal && isCoerciveCredDemand)
    ) {
      return {
        status: LAYER_2_STATUS.BLOCK,
        classification: SEMANTIC_CLASSIFICATION.MALICIOUS,
        decisionRationale: "Phát hiện bằng chứng ngữ cảnh lừa đảo nguy hiểm: Kết hợp mạo danh cơ quan / ngân hàng với hành vi thu thập mã OTP / nạp cọc tài chính / bẫy sinh trắc học.",
        nextLayer: null, // Early exit STOP
      };
    }

    // 3. Contextual SUSPICIOUS Resolution
    const hasInternalContradiction = consistencyFindings.length > 0;
    const hasCrossModalWarning = crossModalFindings.length > 0;
    const isLayer1Suspicious = layer1Result.status === "SUSPICIOUS";
    const hasUrgencyManipulation = contextSignals.some((s) => s.type === "urgency_manipulation");

    if (hasInternalContradiction || hasCrossModalWarning || (isLayer1Suspicious && hasUrgencyManipulation)) {
      return {
        status: LAYER_2_STATUS.SUSPICIOUS,
        classification: SEMANTIC_CLASSIFICATION.DECEPTIVE,
        decisionRationale: "Phát hiện dấu hiệu bất thường về ngữ nghĩa: Tồn tại mâu thuẫn nội tại hoặc bất nhất liên phương thức (ảnh/domain). Chuyển tiếp Layer 3 để đối soát.",
        nextLayer: 3,
      };
    }

    // 4. NEEDS_VERIFICATION Resolution (Factual claims requiring Layer 3 proof)
    const unverifiedClaims = claims.filter((c) => c.verificationRequired);
    if (unverifiedClaims.length > 0 || isLayer1Suspicious) {
      return {
        status: LAYER_2_STATUS.NEEDS_VERIFICATION,
        classification: SEMANTIC_CLASSIFICATION.UNVERIFIED,
        decisionRationale: `Nội dung chứa ${unverifiedClaims.length} phát ngôn / thông cáo sự kiện quan trọng cần đối chiếu nguồn tin chính thống tại Layer 3.`,
        nextLayer: 3,
      };
    }

    // 5. Clean PASS Resolution
    return {
      status: LAYER_2_STATUS.PASS,
      classification: SEMANTIC_CLASSIFICATION.BENIGN,
      decisionRationale: "Ngữ nghĩa nội dung chuẩn xác, không có dấu hiệu thao túng, mạo danh hay mâu thuẫn.",
      nextLayer: 3,
    };
  }
}
