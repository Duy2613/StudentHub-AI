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
  static resolveDecision(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const layer1Result = input.layer1Result && typeof input.layer1Result === "object" && !Array.isArray(input.layer1Result)
      ? input.layer1Result
      : {};
    const semanticAnalysis = input.semanticAnalysis && typeof input.semanticAnalysis === "object" && !Array.isArray(input.semanticAnalysis)
      ? input.semanticAnalysis
      : {};
    const {
      contextSignals: rawContextSignals = [],
      consistencyFindings = [],
      crossModalFindings = [],
      claims = [],
      intent = {},
    } = semanticAnalysis;

    const safeContextSignals = Array.isArray(rawContextSignals)
      ? rawContextSignals.filter((signal) => signal && typeof signal === "object" && !Array.isArray(signal))
      : [];
    const contextSignals = safeContextSignals;
    const safeConsistencyFindings = Array.isArray(consistencyFindings) ? consistencyFindings : [];
    const safeCrossModalFindings = Array.isArray(crossModalFindings) ? crossModalFindings : [];
    const safeClaims = Array.isArray(claims) ? claims : [];
    const safeIntent = intent && typeof intent === "object" && !Array.isArray(intent) ? intent : {};

    // Hard semantic rules use only deterministic/authoritative signals. AI
    // candidates may add a review signal, but cannot manufacture a hard block
    // or suppress one by claiming that content is educational.
    const deterministicContextSignals = safeContextSignals.filter((signal) => signal?.authoritative !== false);
    const deterministicCrossModalFindings = safeCrossModalFindings.filter((finding) => finding?.authoritative !== false);
    const hasCriticalContext = deterministicContextSignals.some((s) => s?.severity === "critical");
    const hasCriticalCrossModal = deterministicCrossModalFindings.some((f) => f?.severity === "critical");
    const isCoerciveCredDemand = safeIntent.primary === "request_credentials" || safeIntent.primary === "request_payment";
    const isCriticalScamContext = deterministicContextSignals.some(
      (s) =>
        s?.type === "credential_harvesting_context" ||
        s?.type === "financial_scam_context" ||
        s?.type === "account_takeover_context"
    );

    if (
      isCriticalScamContext ||
      (hasCriticalContext && (isCoerciveCredDemand || hasCriticalCrossModal)) ||
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
    const hasInternalContradiction = safeConsistencyFindings.some((finding) => finding?.authoritative !== false);
    const hasCrossModalWarning = safeCrossModalFindings.some((finding) => finding?.authoritative !== false);
    const isLayer1Suspicious = layer1Result.status === "SUSPICIOUS";
    const hasUrgencyManipulation = deterministicContextSignals.some((s) => s?.type === "urgency_manipulation");
    const hasPromptInjection = semanticAnalysis.promptInjectionDetected === true ||
      safeContextSignals.some((signal) => signal?.type === "prompt_injection_detected");

    const providerFailure = semanticAnalysis.classification === SEMANTIC_CLASSIFICATION.UNKNOWN ||
      semanticAnalysis.modelStatus === "INVALID_RESPONSE" ||
      semanticAnalysis.modelStatus === "PROVIDER_UNAVAILABLE" ||
      semanticAnalysis.modelStatus === "UNAVAILABLE" ||
      semanticAnalysis.modelStatus === "TIMEOUT";
    const providerReturnedMalicious = semanticAnalysis.classification === SEMANTIC_CLASSIFICATION.MALICIOUS;

    // Keep the exact educational predicate as a mutation-test anchor. The
    // Layer 1 guard is intentional: removing it must be caught by the V4
    // mutation test, while the production path remains monotonic.
    const isEducational = contextSignals.some((s) => s.type === "educational_discussion") && layer1Result.status !== "BLOCK";
    const educationalPassEligible = isEducational &&
      !hasCriticalContext &&
      !hasCriticalCrossModal &&
      !isCoerciveCredDemand &&
      !isCriticalScamContext &&
      !hasInternalContradiction &&
      !hasCrossModalWarning &&
      !isLayer1Suspicious &&
      !hasUrgencyManipulation &&
      !hasPromptInjection &&
      !providerFailure &&
      !providerReturnedMalicious &&
      ![SEMANTIC_CLASSIFICATION.DECEPTIVE, SEMANTIC_CLASSIFICATION.MISLEADING].includes(semanticAnalysis.classification);

    // An upstream hard negative is authoritative. The guarded educational
    // branch above is only reachable for a non-blocked Layer 1 result. This
    // ordering is deliberately preserved so mutation coverage can prove that
    // removing the guard would be a downgrade.
    if (educationalPassEligible) {
      return {
        status: LAYER_2_STATUS.PASS,
        classification: SEMANTIC_CLASSIFICATION.INFORMATIVE,
        decisionRationale: "Nội dung có ngữ cảnh học thuật/giáo dục và không vượt qua các quy tắc nguy hiểm; nhãn này không phải chứng minh an toàn.",
        nextLayer: 3,
      };
    }

    if (layer1Result?.status === "BLOCK") {
      return {
        status: LAYER_2_STATUS.BLOCK,
        classification: SEMANTIC_CLASSIFICATION.MALICIOUS,
        decisionRationale: "Layer 1 đã phát hiện chỉ dấu nguy hiểm; ngữ cảnh giáo dục hoặc AI không được phép hạ cấp kết quả.",
        nextLayer: null,
      };
    }

    if (hasPromptInjection) {
      return {
        status: LAYER_2_STATUS.SUSPICIOUS,
        classification: SEMANTIC_CLASSIFICATION.UNKNOWN,
        decisionRationale: "Phát hiện nội dung có khả năng là chỉ thị chèn vào dữ liệu. AI không được coi phần dữ liệu đó là hướng dẫn; cần xem xét lại.",
        nextLayer: 3,
      };
    }

    // Provider failure and an explicit unknown classification must be
    // resolved before educational/benign heuristics. Otherwise malformed or
    // unavailable provider output could be converted into a clean PASS.
    if (providerFailure) {
      return {
        status: LAYER_2_STATUS.UNKNOWN,
        classification: SEMANTIC_CLASSIFICATION.UNKNOWN,
        decisionRationale: "Không thể tạo kết quả ngữ nghĩa đáng tin cậy; kết quả được giữ ở UNKNOWN và chuyển sang kiểm tra tiếp theo.",
        nextLayer: 3,
      };
    }

    // A provider-supplied negative semantic class is never silently discarded
    // by the clean-content branch. It remains at least review-worthy unless a
    // deterministic hard rule above has already escalated it to BLOCK.
    if (providerReturnedMalicious) {
      return {
        status: LAYER_2_STATUS.SUSPICIOUS,
        classification: SEMANTIC_CLASSIFICATION.MALICIOUS,
        decisionRationale: "Kết quả ngữ nghĩa chứa nhãn nguy hiểm; chưa có quy tắc cứng đủ để chặn nhưng không được suy diễn thành an toàn.",
        nextLayer: 3,
      };
    }

    if (hasInternalContradiction || hasCrossModalWarning || (isLayer1Suspicious && hasUrgencyManipulation)) {
      return {
        status: LAYER_2_STATUS.SUSPICIOUS,
        classification: SEMANTIC_CLASSIFICATION.DECEPTIVE,
        decisionRationale: "Phát hiện dấu hiệu bất thường về ngữ nghĩa: Tồn tại mâu thuẫn nội tại hoặc bất nhất liên phương thức (ảnh/domain). Chuyển tiếp Layer 3 để đối soát.",
        nextLayer: 3,
      };
    }

    if (isEducational) {
      return {
        status: LAYER_2_STATUS.PASS,
        classification: SEMANTIC_CLASSIFICATION.INFORMATIVE,
        decisionRationale: "Nội dung có ngữ cảnh học thuật/giáo dục và không vượt qua các quy tắc nguy hiểm; nhãn này không phải chứng minh an toàn.",
        nextLayer: 3,
      };
    }

    if ([SEMANTIC_CLASSIFICATION.DECEPTIVE, SEMANTIC_CLASSIFICATION.MISLEADING].includes(semanticAnalysis.classification)) {
      return {
        status: LAYER_2_STATUS.SUSPICIOUS,
        classification: semanticAnalysis.classification,
        decisionRationale: "Kết quả ngữ nghĩa cho thấy khả năng gây hiểu nhầm hoặc lừa dối; cần đối soát thêm.",
        nextLayer: 3,
      };
    }

    // 4. NEEDS_VERIFICATION Resolution (Factual claims requiring Layer 3 proof)
    const unverifiedClaims = safeClaims.filter((c) => c?.verificationRequired);
    if (unverifiedClaims.length > 0 || isLayer1Suspicious) {
      return {
        status: LAYER_2_STATUS.NEEDS_VERIFICATION,
        classification: SEMANTIC_CLASSIFICATION.UNVERIFIED,
        decisionRationale: `Nội dung chứa ${unverifiedClaims.length} phát ngôn / thông cáo sự kiện quan trọng cần đối chiếu nguồn tin chính thống tại Layer 3.`,
        nextLayer: 3,
      };
    }

    // 5. Clean semantic PASS. This is only a local semantic screen and is not
    // a safety assertion; Layer 3/4 must still decide what evidence exists.
    return {
      status: LAYER_2_STATUS.PASS,
      classification: SEMANTIC_CLASSIFICATION.BENIGN,
      decisionRationale: "Ngữ nghĩa nội dung chuẩn xác, không có dấu hiệu thao túng, mạo danh hay mâu thuẫn.",
      nextLayer: 3,
    };
  }
}
