/**
 * Layer 2 — IntentAnalyzer
 * 
 * Determines what the content is trying to make the user believe or do.
 * Extracts primary and secondary intents and flags coercive or manipulative directives.
 */

import { INTENT_TYPES } from "../types.js";

const CREDENTIAL_INTENT_REGEX =
  /(?:nhập|cung cấp|điền|xác nhận|gửi|send|enter|input|provide|submit)\s+(?:mật khẩu|mat khau|password|mã otp|ma otp|otp|smart otp|mã pin|pin code|cvv|thẻ ngân hàng|seed phrase|private key)/i;

const PAYMENT_INTENT_REGEX =
  /(?:nạp cọc|đặt cọc|chuyển khoản|thanh toán phí|nop tien|chuyen tien|transfer money|pay fee|deposit|nạp tiền|phí xử lý|phí bảo hiểm nhiệm vụ)/i;

const DOWNLOAD_INTENT_REGEX =
  /(?:tải xuống|cài đặt|download|install|run script|chạy lệnh|mở powershell|execute|mở file)\s+(?:\.exe|\.apk|\.ps1|\.bat|\.zip|ứng dụng|phần mềm|cập nhật|patch)/i;

const IMPERSONATE_CLAIM_REGEX =
  /(?:chúng tôi là|đây là|thông báo từ|phòng an ninh|ban giám hiệu|bộ công an|ngân hàng thông báo|trung tâm hỗ trợ|chăm sóc khách hàng|official security team|support department)/i;

const EDUCATIONAL_INTENT_REGEX =
  /(?:bài tập|giáo trình|môn học|chương \d|khái niệm|nghiên cứu|lecture|tutorial|assignment|phân tích thuật toán|cơ chế|tìm hiểu|lý thuyết|định nghĩa)/i;

const ACTION_DIRECTIVE_REGEX =
  /(?:nhấp vào|bấm vào|click here|truy cập ngay|vào liên kết|quét mã qr|scan qr|xác thực ngay|liên hệ qua telegram|inbox zalo|đăng ký ngay)/i;

export class IntentAnalyzer {
  /**
   * Analyzes intent from normalized text and contextual metadata
   * @param {string} text
   * @param {object} context
   * @returns {object} { primary, secondary, allIntents, isCoercive, confidence }
   */
  static analyze(text, context = {}) {
    if (!text || typeof text !== "string") {
      return {
        primary: INTENT_TYPES.INFORM,
        secondary: null,
        allIntents: [INTENT_TYPES.INFORM],
        isCoercive: false,
        confidence: 0.5,
      };
    }

    const detected = new Set();

    // 1. Educational intent check
    if (EDUCATIONAL_INTENT_REGEX.test(text)) {
      detected.add(INTENT_TYPES.EDUCATE);
    }

    // 2. Credential acquisition intent
    if (CREDENTIAL_INTENT_REGEX.test(text)) {
      detected.add(INTENT_TYPES.REQUEST_CREDENTIALS);
    }

    // 3. Payment/Deposit demand intent
    if (PAYMENT_INTENT_REGEX.test(text)) {
      detected.add(INTENT_TYPES.REQUEST_PAYMENT);
    }

    // 4. Download / Execution intent
    if (DOWNLOAD_INTENT_REGEX.test(text)) {
      detected.add(INTENT_TYPES.REQUEST_DOWNLOAD);
    }

    // 5. Authority Claim / Impersonation intent
    if (IMPERSONATE_CLAIM_REGEX.test(text)) {
      detected.add(INTENT_TYPES.IMPERSONATE);
    }

    // 6. Action Directives
    if (ACTION_DIRECTIVE_REGEX.test(text)) {
      detected.add(INTENT_TYPES.REQUEST_ACTION);
    }

    // 7. General persuasion / Promotion
    if (/(?:cơ hội duy nhất|nhận ngay|hoa hồng|thưởng|khuyến mãi|miễn phí 100%)/i.test(text)) {
      detected.add(INTENT_TYPES.PERSUADE);
    }

    // Default fallback
    if (detected.size === 0) {
      detected.add(INTENT_TYPES.INFORM);
    }

    const intentsArray = Array.from(detected);

    // Prioritize high-risk intent as Primary
    let primary = INTENT_TYPES.INFORM;
    let secondary = null;

    if (detected.has(INTENT_TYPES.REQUEST_CREDENTIALS)) {
      primary = INTENT_TYPES.REQUEST_CREDENTIALS;
      secondary = detected.has(INTENT_TYPES.IMPERSONATE) ? INTENT_TYPES.IMPERSONATE : (intentsArray[1] || null);
    } else if (detected.has(INTENT_TYPES.REQUEST_PAYMENT)) {
      primary = INTENT_TYPES.REQUEST_PAYMENT;
      secondary = detected.has(INTENT_TYPES.PERSUADE) ? INTENT_TYPES.PERSUADE : (intentsArray[1] || null);
    } else if (detected.has(INTENT_TYPES.REQUEST_DOWNLOAD)) {
      primary = INTENT_TYPES.REQUEST_DOWNLOAD;
      secondary = intentsArray[1] || null;
    } else if (detected.has(INTENT_TYPES.IMPERSONATE)) {
      primary = INTENT_TYPES.IMPERSONATE;
      secondary = detected.has(INTENT_TYPES.REQUEST_ACTION) ? INTENT_TYPES.REQUEST_ACTION : (intentsArray[1] || null);
    } else if (detected.has(INTENT_TYPES.EDUCATE)) {
      primary = INTENT_TYPES.EDUCATE;
      secondary = detected.has(INTENT_TYPES.INFORM) ? INTENT_TYPES.INFORM : (intentsArray[1] || null);
    } else if (detected.has(INTENT_TYPES.REQUEST_ACTION)) {
      primary = INTENT_TYPES.REQUEST_ACTION;
      secondary = intentsArray[1] || null;
    } else {
      primary = intentsArray[0] || INTENT_TYPES.INFORM;
      secondary = intentsArray[1] || null;
    }

    const isCoercive =
      primary === INTENT_TYPES.REQUEST_CREDENTIALS ||
      primary === INTENT_TYPES.REQUEST_PAYMENT ||
      secondary === INTENT_TYPES.REQUEST_CREDENTIALS ||
      secondary === INTENT_TYPES.REQUEST_PAYMENT;

    return {
      primary,
      secondary: secondary === primary ? null : secondary,
      allIntents: intentsArray,
      isCoercive,
      confidence: isCoercive ? 0.95 : 0.85,
    };
  }
}
