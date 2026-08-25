/**
 * Layer 2 — ContextAnalyzer
 * 
 * Synthesizes compound social-engineering contexts and protects educational & benign discussions.
 */

import { CONTEXT_SIGNAL_TYPES, SIGNAL_SEVERITY } from "../types.js";

const EDUCATIONAL_CONTEXT_REGEX =
  /(?:bài tập môn|giáo trình|môn an toàn|tìm hiểu về|nghiên cứu cơ chế|khái niệm|lecture explains|in this tutorial|assignment on|academic study)/i;

const SATIRE_HUMOR_REGEX =
  /(?:banned exams forever|hủy bỏ thi cử vĩnh viễn|nghỉ học cả năm|😂|🤣|chuyện hài|meme|troll)/i;

export class ContextAnalyzer {
  /**
   * Evaluates context signals from text, entities, intents, and Layer 1 signals
   * @param {object} params
   * @param {string} params.text
   * @param {object} params.intent
   * @param {Array<object>} params.entities
   * @param {Array<object>} params.layer1Signals
   * @returns {Array<object>} Array of context signals
   */
  static analyze({ text = "", intent = {}, entities = [], layer1Signals = [] }) {
    const signals = [];
    const lower = text.toLowerCase();

    // 1. Educational Discussion Protection
    if (EDUCATIONAL_CONTEXT_REGEX.test(text)) {
      signals.push({
        type: CONTEXT_SIGNAL_TYPES.EDUCATIONAL_DISCUSSION,
        severity: "info",
        confidence: 0.95,
        details: "Nội dung thảo luận học thuật, nghiên cứu lý thuyết bảo mật hoặc bài tập giáo trình.",
      });
      return signals; // Early exit: Safe educational context
    }

    // 2. Satire / Parody / Humor Check
    if (SATIRE_HUMOR_REGEX.test(text)) {
      signals.push({
        type: CONTEXT_SIGNAL_TYPES.SATIRE_OR_HUMOR,
        severity: "info",
        confidence: 0.85,
        details: "Nội dung mang tính giải trí, châm biếm hoặc hài hước học đường.",
      });
    }

    // 3. Compounded Credential Harvesting Context
    // Pattern: Authority Claim + OTP/Password Demand (+ Optional Reward or Urgency)
    const hasAuthority = entities.length > 0 || /(?:ban giám hiệu|phòng an ninh|ngân hàng|bộ công an)/i.test(text);
    const requestsCreds = intent.primary === "request_credentials" || /(?:mật khẩu|password|mã otp|smart otp)/i.test(text);
    const hasUrgency = /(?:ngay|trong \d+ phút|gấp|tạm khóa|hết hạn|khẩn cấp|immediately)/i.test(text);

    if (hasAuthority && requestsCreds) {
      signals.push({
        type: CONTEXT_SIGNAL_TYPES.CREDENTIAL_HARVESTING_CONTEXT,
        severity: "critical",
        confidence: 0.98,
        details: "Bẫy chiếm đoạt tài khoản tinh vi: Mượn danh cơ quan/trường học/ngân hàng yêu cầu cung cấp OTP/mật khẩu.",
      });
    }

    // 4. Financial Task Deposit Scam Context
    const requestsDeposit = /(?:nạp cọc|đặt cọc|chuyển khoản cọc|nạp tiền kích hoạt)/i.test(text);
    const promisesReward = /(?:hoa hồng|lương ngày|500k|1tr|thu nhập khủng|hoàn tiền)/i.test(text);

    if (requestsDeposit && promisesReward) {
      signals.push({
        type: CONTEXT_SIGNAL_TYPES.FINANCIAL_SCAM_CONTEXT,
        severity: "critical",
        confidence: 0.97,
        details: "Bẫy tài chính CTV nhiệm vụ: Yêu cầu nạp tiền đặt cọc kèm lời hứa hoa hồng bất thường.",
      });
    }

    // 5. Account Takeover via Biometrics Lure
    const mentionsBiometrics = /(?:cập nhật sinh trắc học|đồng bộ cccd|định danh vneid|xác thực khuôn mặt)/i.test(text);
    if (mentionsBiometrics && (requestsCreds || hasUrgency || layer1Signals.some((s) => s.type.includes("impersonation")))) {
      signals.push({
        type: CONTEXT_SIGNAL_TYPES.ACCOUNT_TAKEOVER_CONTEXT,
        severity: "critical",
        confidence: 0.96,
        details: "Bẫy giả mạo sinh trắc học ngân hàng / VNeID nhằm đánh cắp quyền kiểm soát tài khoản.",
      });
    }

    // 6. Benign Brand Mention (Mere reference without coercion)
    if (entities.length > 0 && !requestsCreds && !requestsDeposit && !hasUrgency && signals.length === 0) {
      signals.push({
        type: CONTEXT_SIGNAL_TYPES.BENIGN_BRAND_MENTION,
        severity: "info",
        confidence: 0.90,
        details: "Đề cập thương hiệu hợp lệ trong ngữ cảnh thông tin trung tính không có hành vi lừa đảo.",
      });
    }

    // 7. Urgency & Coercion Standalone Marker
    if (hasUrgency && !signals.some((s) => s.type === CONTEXT_SIGNAL_TYPES.CREDENTIAL_HARVESTING_CONTEXT)) {
      signals.push({
        type: CONTEXT_SIGNAL_TYPES.URGENCY_MANIPULATION,
        severity: "medium",
        confidence: 0.75,
        details: "Ngữ cảnh tạo áp lực thời gian khẩn cấp nhằm thúc ép người dùng ra quyết định vội vàng.",
      });
    }

    return signals;
  }
}
