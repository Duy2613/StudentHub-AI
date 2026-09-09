/**
 * StudentHub AI — VerdictPolicyEngine
 *
 * Implements Layer 5 Decision Intelligence Policy:
 * Final verdict is decided by DETERMINISTIC POLICY over:
 * - Claim assessments
 * - Evidence sufficiency (SUFFICIENT, INSUFFICIENT, CONFLICTED)
 * - Claim relations (SUPPORTS, CONTRADICTS)
 * - Critic findings & model disagreement
 * - Domain specialist fraud alerts
 * NOT by an unchecked single LLM completion!
 */

export const TRUST_FINAL_VERDICTS = {
  SUPPORTED: "SUPPORTED",
  CONTRADICTED: "CONTRADICTED",
  PARTIALLY_SUPPORTED: "PARTIALLY_SUPPORTED",
  HIGH_RISK: "HIGH_RISK",
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE",
  CONFLICTED_EVIDENCE: "CONFLICTED_EVIDENCE",
  NEEDS_EXPERT_REVIEW: "NEEDS_EXPERT_REVIEW",
};

export class VerdictPolicyEngine {
  /**
   * Adjudicates final verdict deterministically based on evidence, relations, and signals.
   */
  static adjudicate({
    claims = [],
    evidence = [],
    relationships = [],
    sufficiency = null,
    multiModelResult = null,
    domainSpecialistFinding = null,
  } = {}) {
    // 1. Hard negative / Scam check from Domain Specialist & Evidence
    const hasContradiction = relationships.some((r) => r.relation === "CONTRADICTS");
    const hasSupport = relationships.some((r) => r.relation === "SUPPORTS");
    const hasContext = relationships.some((r) => r.relation === "CONTEXTUALIZES");
    const isHighFraudRisk =
      domainSpecialistFinding?.decision === "HIGH_RISK" ||
      domainSpecialistFinding?.decision === "BLOCKED";

    const hasOfficial = evidence.some((s) => s.isPrimary || s.isOfficial);
    const uniqueDomains = new Set(evidence.map((s) => s.domain).filter(Boolean));
    const isMultiSource = uniqueDomains.size >= 2;

    const hasScamPattern = claims.some((c) =>
      /(?:chuyển tiền|nạp tiền|mã otp|\botp\b|đặt cọc|làm bằng|nâng điểm|trúng thưởng|bảo lãnh.*phí|cộng tác viên.*nạp|mở hộ thẻ|quay video.*khỏa thân|phí giữ chỗ|nhận làm.*vstep|google form|ví điện tử.*cá nhân)/i.test(c.text || "")
    );

    if (isHighFraudRisk || (hasContradiction && hasScamPattern)) {
      return {
        verdict: TRUST_FINAL_VERDICTS.HIGH_RISK,
        headline: "CẢNH BÁO NGUY CƠ GIAN LẬN CAO",
        explanation: "Phát hiện dấu hiệu lừa đảo/yêu cầu chuyển tiền không trùng khớp với quy chế học thuật chính thức.",
        confidenceScore: 0.95,
        evidenceSufficiency: sufficiency?.status || "SUFFICIENT",
        sourceAgreement: "CONTRADICTED",
        uncertainty: "LOW",
        policyApplied: "POLICY_HARD_SAFETY_FRAUD_DEFENSE",
      };
    }

    // 2. Conflicted Evidence (Both supports and contradicts, or contradiction alongside context)
    if (sufficiency?.status === "CONFLICTED" || (hasContradiction && (hasSupport || hasContext))) {
      return {
        verdict: TRUST_FINAL_VERDICTS.CONFLICTED_EVIDENCE,
        headline: "DỮ LIỆU CÓ MÂU THUẪN GIỮA CÁC NGUỒN",
        explanation: "Tồn tại các nguồn thông tin đưa ra kết luận hoặc điều kiện áp dụng trái ngược nhau.",
        confidenceScore: 0.91,
        evidenceSufficiency: "CONFLICTED",
        sourceAgreement: "CONTRADICTED",
        uncertainty: "HIGH",
        policyApplied: "POLICY_CONFLICTED_EVIDENCE_HOLD",
      };
    }

    // 3. Pure Contradiction
    if (hasContradiction) {
      return {
        verdict: TRUST_FINAL_VERDICTS.CONTRADICTED,
        headline: "THÔNG TIN BỊ BÁC BỎ BỞI VĂN BẢN CHÍNH THỨC",
        explanation: "Nội dung nhận định mâu thuẫn trực tiếp với văn bản quy chế hoặc cảnh báo từ nhà trường.",
        confidenceScore: hasOfficial ? 0.93 : 0.89,
        evidenceSufficiency: sufficiency?.status || "SUFFICIENT",
        sourceAgreement: "CONTRADICTED",
        uncertainty: hasOfficial ? "LOW" : "MEDIUM",
        policyApplied: "POLICY_OFFICIAL_CONTRADICTION",
      };
    }

    // 3. Insufficient Evidence
    if (sufficiency?.status === "INSUFFICIENT" || evidence.length === 0) {
      return {
        verdict: TRUST_FINAL_VERDICTS.INSUFFICIENT_EVIDENCE,
        headline: "CHƯA ĐỦ BẰNG CHỨNG XÁC MINH",
        explanation: "Hệ thống chưa tìm thấy văn bản pháp quy hoặc thông báo chính thức để đối chiếu đầy đủ.",
        confidenceScore: 0.93,
        evidenceSufficiency: "INSUFFICIENT",
        sourceAgreement: "UNKNOWN",
        uncertainty: "HIGH",
        policyApplied: "POLICY_EVIDENCE_ABSTENTION",
      };
    }

    // 4. Model Disagreement
    if (multiModelResult?.hasDisagreement) {
      return {
        verdict: TRUST_FINAL_VERDICTS.NEEDS_EXPERT_REVIEW,
        headline: "CẦN CHUYÊN GIA HỌC VỤ ĐỐI SOÁT",
        explanation: multiModelResult.disagreementNote || "Có bất đồng giữa mô hình phân tích và kiểm chứng độc lập.",
        confidenceScore: 0.89,
        evidenceSufficiency: sufficiency?.status || "INSUFFICIENT",
        sourceAgreement: "DISAGREEMENT",
        uncertainty: "HIGH",
        policyApplied: "POLICY_MODEL_DISAGREEMENT_ESCALATION",
      };
    }

    // 5. Supported Evidence
    const hasSupports = relationships.some((r) => r.relation === "SUPPORTS");

    if (hasSupports && !hasContext) {
      const conf = hasOfficial && isMultiSource ? 0.96 : (hasOfficial ? 0.94 : 0.90);
      return {
        verdict: TRUST_FINAL_VERDICTS.SUPPORTED,
        headline: "XÁC NHẬN CHÍNH THỨC TỪ CƠ QUAN BAN HÀNH",
        explanation: "Các nhận định trọng yếu đều được đối chiếu trùng khớp với văn bản chính thức.",
        confidenceScore: conf,
        evidenceSufficiency: "SUFFICIENT",
        sourceAgreement: "CONSISTENT",
        uncertainty: "LOW",
        policyApplied: "POLICY_OFFICIAL_CORROBORATION",
      };
    }

    return {
      verdict: TRUST_FINAL_VERDICTS.PARTIALLY_SUPPORTED,
      headline: "ĐƯỢC XÁC THỰC MỘT PHẦN",
      explanation: "Một số nhận định được xác nhận, nhưng có các chi tiết chưa thể chứng minh trọn vẹn.",
      confidenceScore: 0.88,
      evidenceSufficiency: "PARTIAL",
      sourceAgreement: "PARTIAL",
      uncertainty: "MEDIUM",
      policyApplied: "POLICY_PARTIAL_SUPPORT",
    };
  }
}
