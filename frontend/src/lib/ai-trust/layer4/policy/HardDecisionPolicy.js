/**
 * Layer 4 — HardDecisionPolicy
 * 
 * Deterministic hard rules for decisive risk overrides:
 * Rule 1: Layer 1 hard malicious signals + no valid educational immunity -> BLOCK (CRITICAL)
 * Rule 2: Credential harvesting + institutional impersonation -> BLOCK (CRITICAL)
 * Rule 3: Malicious binary / executable payload -> BLOCK (CRITICAL)
 * Rule 4: Compound financial task deposit scam -> BLOCK (HIGH/CRITICAL)
 */

import { FINAL_CLASSIFICATION, SECURITY_RISK_LEVEL, RECOMMENDED_ACTION } from "../types.js";

export class HardDecisionPolicy {
  /**
   * Evaluates deterministic hard rules across fused evidence
   * @param {object} fusedGraph
   * @returns {object|null} Hard rule decision or null if no hard rule triggered
   */
  static evaluate(fusedGraph) {
    const isEducational =
      fusedGraph.layer2ContextSignals.some((s) => s.type === "educational_discussion") ||
      fusedGraph.layer2Classification === "INFORMATIVE";

    // 1. Rule 1: Layer 1 BLOCK
    if (fusedGraph.layer1Status === "BLOCK" && !isEducational) {
      return {
        ruleId: "HARD_RULE_1_LAYER1_BLOCK",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.99,
        reason: "Phát hiện chỉ dấu tấn công độc hại / lừa đảo trực tiếp từ Layer 1.",
      };
    }

    // 1b. Rule 1b: Layer 2 Semantic & Neural BLOCK
    if (fusedGraph.layer2Status === "BLOCK" && !isEducational) {
      return {
        ruleId: "HARD_RULE_1B_LAYER2_BLOCK",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.98,
        reason: "Phát hiện mối đe dọa lừa đảo / thao túng tâm lý nguy hiểm từ phân tích ngữ nghĩa và mô hình AI Tầng 2.",
      };
    }

    // 2. Rule 2: Credential Harvesting + Impersonation
    const hasCredentialDemand =
      fusedGraph.layer1Signals.some((s) => s.type === "credential_request" || s.type === "otp_request") ||
      fusedGraph.layer2ContextSignals.some((s) => s.type === "credential_harvesting_context" || s.type === "account_takeover_context");

    const hasImpersonation =
      fusedGraph.layer2CrossModalFindings.some((f) => f.type === "impersonation_mismatch") ||
      fusedGraph.layer2ContextSignals.some((s) => s.type === "credential_harvesting_context");

    if (hasCredentialDemand && !isEducational) {
      return {
        ruleId: "HARD_RULE_2_CREDENTIAL_PHISHING",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.98,
        reason: "Nội dung yêu cầu cung cấp thông tin đăng nhập / mã xác thực OTP trái phép.",
      };
    }

    // 3. Rule 3: Financial Scam / Deposit Task Demand
    const hasFinancialScam =
      fusedGraph.layer2ContextSignals.some((s) => s.type === "financial_scam_context");

    if (hasFinancialScam && !isEducational) {
      return {
        ruleId: "HARD_RULE_4_FINANCIAL_FRAUD",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.HIGH,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.96,
        reason: "Phát hiện dấu hiệu bẫy tài chính nạp tiền đặt cọc / tuyển cộng tác viên lừa đảo.",
      };
    }

    // 4. Rule 4: Academic Project / Lab / Club Advance Deposit Trap
    const hasAcademicDepositTrap =
      fusedGraph.layer1Signals.some((s) => s.type === "advance_reservation_deposit_demand") ||
      fusedGraph.layer2ContextSignals.some((s) => s.type === "unauthorized_academic_deposit_trap");

    if (hasAcademicDepositTrap && !isEducational) {
      return {
        ruleId: "HARD_RULE_5_ACADEMIC_DEPOSIT_TRAP",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.98,
        reason: "Phát hiện bẫy đóng cọc giữ chỗ / nộp phí tham gia dự án NCKH, Lab nghiên cứu hoặc CLB sinh viên trái quy chế.",
      };
    }

    return null;
  }
}
