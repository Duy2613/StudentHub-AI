/**
 * Layer 2 — ConsistencyAnalyzer
 * 
 * Detects internal narrative conflicts and logical contradictions:
 * - Temporal contradictions (e.g. "Bắt đầu vào thứ Hai" vs "Bắt đầu vào thứ Sáu")
 * - Numerical contradictions (e.g. Discrepancies in fees, discounts, or dates)
 * - Instruction contradictions (e.g. "Không chia sẻ OTP" vs "Nhập OTP vào link bên dưới")
 */

import { CONSISTENCY_TYPES } from "../types.js";

const DAYS_OF_WEEK = [
  { id: "mon", names: ["thứ hai", "thứ 2", "monday"] },
  { id: "tue", names: ["thứ ba", "thứ 3", "tuesday"] },
  { id: "wed", names: ["thứ tư", "thứ 4", "wednesday"] },
  { id: "thu", names: ["thứ năm", "thứ 5", "thursday"] },
  { id: "fri", names: ["thứ sáu", "thứ 6", "friday"] },
  { id: "sat", names: ["thứ bảy", "thứ 7", "saturday"] },
  { id: "sun", names: ["chủ nhật", "sunday"] },
];

export class ConsistencyAnalyzer {
  /**
   * Analyzes internal consistency across text
   * @param {string} text
   * @returns {Array<object>} Array of consistency findings
   */
  static analyze(text) {
    if (!text || typeof text !== "string") return [];

    const findings = [];
    const lower = text.toLowerCase();

    // 1. Temporal Day-of-Week Contradiction
    // E.g. "Sự kiện diễn ra vào thứ Hai ... Sau đó: Sự kiện bắt đầu vào thứ Sáu"
    const matchedDays = [];
    for (const d of DAYS_OF_WEEK) {
      for (const name of d.names) {
        if (lower.includes(`bắt đầu vào ${name}`) || lower.includes(`starts on ${name}`) || lower.includes(`diễn ra vào ${name}`)) {
          matchedDays.push({ id: d.id, name });
          break;
        }
      }
    }

    if (matchedDays.length >= 2 && matchedDays[0].id !== matchedDays[1].id) {
      findings.push({
        type: CONSISTENCY_TYPES.TEMPORAL_CONTRADICTION,
        severity: "medium",
        confidence: 0.95,
        evidence: [
          `Khẳng định 1: ${matchedDays[0].name}`,
          `Khẳng định 2: ${matchedDays[1].name}`,
        ],
        details: `Mâu thuẫn thời gian nội tại: Văn bản khẳng định hai ngày bắt đầu sự kiện khác nhau (${matchedDays[0].name} vs ${matchedDays[1].name}).`,
      });
    }

    // 2. Instruction Contradiction (Security Notice vs Credential Demand)
    const hasSecurityWarning = /(?:tuyệt đối không chia sẻ mã otp|ngân hàng không bao giờ yêu cầu otp|never share your password)/i.test(text);
    const hasCredDemand = /(?:nhập mật khẩu|điền mã otp|gửi mã xác thực|enter your otp)/i.test(text);

    if (hasSecurityWarning && hasCredDemand) {
      findings.push({
        type: CONSISTENCY_TYPES.INSTRUCTION_CONTRADICTION,
        severity: "high",
        confidence: 0.92,
        evidence: [
          "Cảnh báo: Tuyệt đối không chia sẻ OTP",
          "Chỉ thị: Nhập/gửi mã OTP vào biểu mẫu",
        ],
        details: "Mâu thuẫn chỉ thị bảo mật: Văn bản vừa cảnh báo không chia sẻ OTP, vừa yêu cầu người dùng nhập OTP.",
      });
    }

    // 3. Numerical / Fee Contradiction
    const feeMatches = text.match(/(?:phí|cọc|tiền|amount)[:\s]+(\d+[\d,.]*)\s*(?:k|vnđ|đ|vnd)/gi);
    if (feeMatches && feeMatches.length >= 2) {
      const nums = feeMatches.map((m) => m.replace(/[^\d]/g, ""));
      if (nums[0] !== nums[1] && nums[0].length > 0 && nums[1].length > 0) {
        // Only trigger if both reference the same fee context
        if (lower.includes("nạp cọc") || lower.includes("phí xử lý")) {
          findings.push({
            type: CONSISTENCY_TYPES.NUMERICAL_CONTRADICTION,
            severity: "medium",
            confidence: 0.85,
            evidence: [feeMatches[0], feeMatches[1]],
            details: `Bất nhất số liệu tài chính trong cùng văn bản (${feeMatches[0]} vs ${feeMatches[1]}).`,
          });
        }
      }
    }

    return findings;
  }
}
