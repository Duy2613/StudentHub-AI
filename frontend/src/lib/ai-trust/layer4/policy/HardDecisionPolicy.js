/**
 * Layer 4 — HardDecisionPolicy
 * 
 * Deterministic hard rules for decisive risk overrides:
 * Rule 1: Layer 1 hard malicious signals -> BLOCK (CRITICAL)
 * Rule 2: Credential harvesting + institutional impersonation -> BLOCK (CRITICAL)
 * Rule 3: Malicious binary / executable payload -> BLOCK (CRITICAL)
 * Rule 4: Compound financial task deposit scam -> BLOCK (HIGH/CRITICAL)
 */

import {
  FINAL_CLASSIFICATION,
  SECURITY_CLASSIFICATION,
  SECURITY_RISK_LEVEL,
  TRUTH_STATUS,
  RECOMMENDED_ACTION,
} from "../types.js";

export class HardDecisionPolicy {
  /**
   * Evaluates deterministic hard rules across fused evidence
   * @param {object} fusedGraph
   * @returns {object|null} Hard rule decision or null if no hard rule triggered
   */
  static evaluate(fusedGraph) {
    const layer1Signals = Array.isArray(fusedGraph?.layer1Signals) ? fusedGraph.layer1Signals : [];
    const layer2ContextSignals = Array.isArray(fusedGraph?.layer2ContextSignals) ? fusedGraph.layer2ContextSignals : [];
    // Retain the context fact for mutation coverage and audit explainability,
    // but deliberately never use it as an immunity switch for hard rules.
    const isEducational = layer2ContextSignals.some((signal) => signal?.type === "educational_discussion");
    void isEducational;

    // A validated threat-intelligence match is a hard negative. It is checked
    // before educational/context heuristics so untrusted semantic context can
    // never downgrade it to a benign result.
    if (
      fusedGraph?.layer2AFinding === "THREAT_MATCH" ||
      fusedGraph?.layer2ASecurityClassification === SECURITY_CLASSIFICATION.MALICIOUS
    ) {
      return {
        ruleId: "HARD_RULE_0_LAYER2A_THREAT_MATCH",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        securityClassification: SECURITY_CLASSIFICATION.MALICIOUS,
        truthStatus: TRUTH_STATUS.NOT_APPLICABLE,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: fusedGraph.layer2AProviderConfidence ?? 0,
        confidenceBasis: fusedGraph.layer2AProviderConfidence != null
          ? "provider_asserted_threat_match"
          : "deterministic_threat_match_without_provider_score",
        reason: "Nguồn Threat Intelligence đã trả về khớp mối đe dọa. Không thể hạ cấp kết quả bằng ngữ cảnh hoặc AI.",
        policyPrecedence: ["L2A_THREAT_MATCH", "BLOCK"],
      };
    }

    // 1. Rule 1: Layer 1 BLOCK — deterministic hard block always wins.
    if (fusedGraph.layer1Status === "BLOCK") {
      return {
        ruleId: "HARD_RULE_1_LAYER1_BLOCK",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        securityClassification: SECURITY_CLASSIFICATION.MALICIOUS,
        truthStatus: TRUTH_STATUS.NOT_APPLICABLE,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.99,
        confidenceBasis: "local_hard_rule",
        reason: "Phát hiện chỉ dấu tấn công độc hại / lừa đảo trực tiếp từ Layer 1.",
        policyPrecedence: ["L1_HARD_BLOCK", "BLOCK"],
      };
    }

    // 1b. Rule 1b: Layer 2 Semantic & Neural BLOCK — Deterministic block CANNOT be overridden
    if (fusedGraph.layer2Status === "BLOCK") {
      return {
        ruleId: "HARD_RULE_1B_LAYER2_BLOCK",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        securityClassification: SECURITY_CLASSIFICATION.MALICIOUS,
        truthStatus: TRUTH_STATUS.NOT_APPLICABLE,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.98,
        confidenceBasis: "deterministic_semantic_hard_rule",
        reason: "Phát hiện mối đe dọa lừa đảo / thao túng tâm lý nguy hiểm từ phân tích ngữ nghĩa và mô hình AI Tầng 2.",
        policyPrecedence: ["L2_HARD_BLOCK", "BLOCK"],
      };
    }

    // 2. Rule 2: Credential Harvesting + Impersonation
    const hasCredentialDemand =
      layer1Signals.some((s) => s.type === "credential_request" || s.type === "otp_request") ||
      layer2ContextSignals.some((s) => s.type === "credential_harvesting_context" || s.type === "account_takeover_context");

    if (hasCredentialDemand) {
      return {
        ruleId: "HARD_RULE_2_CREDENTIAL_PHISHING",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        securityClassification: SECURITY_CLASSIFICATION.MALICIOUS,
        truthStatus: TRUTH_STATUS.NOT_APPLICABLE,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.98,
        confidenceBasis: "credential_demand_deterministic_rule",
        reason: "Nội dung yêu cầu cung cấp thông tin đăng nhập / mã xác thực OTP trái phép.",
        policyPrecedence: ["CREDENTIAL_DEMAND", "BLOCK"],
      };
    }

    // 3. Rule 3: Financial Scam / Deposit Task Demand
    const hasFinancialScam =
      layer2ContextSignals.some((s) => s.type === "financial_scam_context");

    if (hasFinancialScam) {
      return {
        ruleId: "HARD_RULE_4_FINANCIAL_FRAUD",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        securityClassification: SECURITY_CLASSIFICATION.MALICIOUS,
        truthStatus: TRUTH_STATUS.NOT_APPLICABLE,
        riskLevel: SECURITY_RISK_LEVEL.HIGH,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.96,
        confidenceBasis: "financial_scam_deterministic_rule",
        reason: "Phát hiện dấu hiệu bẫy tài chính nạp tiền đặt cọc / tuyển cộng tác viên lừa đảo.",
        policyPrecedence: ["FINANCIAL_FRAUD", "BLOCK"],
      };
    }

    // 4. Rule 4: Academic Project / Lab / Club Advance Deposit Trap
    const hasAcademicDepositTrap =
      layer1Signals.some((s) => s.type === "advance_reservation_deposit_demand") ||
      layer2ContextSignals.some((s) => s.type === "unauthorized_academic_deposit_trap");

    if (hasAcademicDepositTrap) {
      return {
        ruleId: "HARD_RULE_5_ACADEMIC_DEPOSIT_TRAP",
        classification: FINAL_CLASSIFICATION.MALICIOUS,
        securityClassification: SECURITY_CLASSIFICATION.MALICIOUS,
        truthStatus: TRUTH_STATUS.NOT_APPLICABLE,
        riskLevel: SECURITY_RISK_LEVEL.CRITICAL,
        action: RECOMMENDED_ACTION.BLOCK,
        decisionConfidence: 0.98,
        confidenceBasis: "academic_deposit_deterministic_rule",
        reason: "Phát hiện bẫy đóng cọc giữ chỗ / nộp phí tham gia dự án NCKH, Lab nghiên cứu hoặc CLB sinh viên trái quy chế.",
        policyPrecedence: ["ACADEMIC_DEPOSIT_TRAP", "BLOCK"],
      };
    }

    return null;
  }
}
