/**
 * AI Trust & Scam Detection Pipeline — Layer 1 Text Rules
 * 
 * Deterministic Text Screening:
 * - Credential & OTP Harvesting detection (Hard Block)
 * - Task Deposit & Student Job Scams (Bẫy nạp cọc CTV) (Hard Block)
 * - Authority & Educational / Banking Impersonation
 * - Urgency, Lottery, & Threat Coercion patterns
 * - Malicious Shell & Script Payloads (Hard Block)
 * - AI Tone Safety Guard (Strictly informational, never triggers BLOCK)
 */

import { LAYER_1_REASONS, SIGNAL_TYPE, SIGNAL_WEIGHTS } from "../types.js";

// 1. Credential & OTP Theft Patterns
const OTP_REGEX = /(?:mã\s+otp|smart\s+otp|otp\s+ngân\s+hàng|mã\s+xác\s+(?:thực|nhận)|mã\s+bảo\s+mật|verification\s+code|otp\s+code)/i;
const CREDENTIAL_REGEX = /(?:nhập\s+mật\s+khẩu|cung\s+cấp\s+mật\s+khẩu|gửi\s+password|pass\s+gmail|mật\s+khẩu\s+icloud|nhập\s+pass|mật\s+khẩu\s+ngân\s+hàng|tên\s+đăng\s+nhập\s+và\s+mật\s+khẩu|login\s+credentials)/i;

// 2. Task Deposit & Student Job Scam Patterns
const TASK_DEPOSIT_PATTERNS = [
  /(?:tuyển.*(?:ctv|cộng\s+tác\s+viên)|ctv|cộng\s+tác\s+viên).*(?:shopee|lazada|tiktok|đơn\s+hàng|xử\s+lý\s+đơn)/i,
  /(?:nạp\s+cọc|đặt\s+cọc|chuyển\s+khoản|nạp\s+tiền|nạp\s+phí).*(?:làm\s+nhiệm\s+vụ|kích\s+hoạt|nhiệm\s+vụ)/i,
  /(?:hoa\s+hồng\s+(?:1[0-9]|[2-9]\d)%|hoàn\s+tiền\s+\d+%|hoàn\s+tiền\s+kèm\s+hoa\s+hồng)/i,
  /(?:việc\s+nhẹ\s+lương\s+cao|thu\s+nhập\s+\d+00k|kiếm\s+\d+00k\s*\/\s*(?:ngày|giờ|ca)|nhận\s+tiền\s+sau\s+\d+\s+phút)/i,
  /(?:nạp\s+tiền\s+vào\s+app|nạp\s+phí\s+kích\s+hoạt|nạp\s+cọc\s+kích\s+hoạt)/i,
];

// Direct Hard Scam Keywords Combination
const DEPOSIT_KEYWORD_REGEX = /(?:nạp\s+cọc|chuyển\s+khoản\s+nạp\s+cọc|phí\s+kích\s+hoạt|nạp\s+phí|đặt\s+cọc\s+giữ\s+chỗ)/i;
const TASK_REWARD_REGEX = /(?:nhiệm\s+vụ|hoa\s+hồng|hoàn\s+tiền\s+\d+%|giật\s+đơn)/i;

// 3. Authority & University Impersonation
const IMPERSONATION_PATTERNS = [
  /(?:phòng\s+đào\s+tạo|ban\s+giám\s+hiệu|phòng\s+ctsv|đoàn\s+thanh\s+niên|bộ\s+công\s+an|cục\s+thuế|ngân\s+hàng\s+nhà\s+nước).*(?:thông\s+báo\s+khẩn|yêu\s+cầu\s+xác\s+minh|cảnh\s+báo\s+khóa)/i,
  /(?:vietcombank|mbbank|techcombank|bidv|agribank|vnpay|momo).*(?:xác\s+thực\s+tài\s+khoản|bảo\s+trì\s+khẩn|khóa\s+thẻ)/i,
  /(?:hcmute|vnuhcm|bách\s+khoa|kinh\s+tế).*(?:học\s+bổng\s+khẩn|đóng\s+học\s+phí\s+gấp|truy\s+cập\s+link\s+để\s+nhận)/i,
];

// 4. Urgency & Coercion Patterns
const URGENCY_PATTERNS = [
  /(?:bạn\s+đã\s+trúng\s+thưởng|nhận\s+quà\s+tri\s+ân|nhận\s+học\s+bổng\s+quốc\s+tế\s+miễn\s+phí)/i,
  /(?:trong\s+vòng\s+(?:5|10|15|30)\s+phút|hết\s+hạn\s+sau\s+\d+\s+giờ|nếu\s+không\s+sẽ\s+bị\s+khóa)/i,
  /(?:truy\s+cứu\s+trách\s+nhiệm\s+hình\s+sự|lệnh\s+bắt\s+tạm\s+giam|khởi\s+tố)/i,
];

// 5. Malicious Shell & Script Payloads
const MALICIOUS_SHELL_PATTERNS = [
  /(?:powershell(?:\.exe)?\s+-[a-zA-Z]*enc|powershell.*-[nN]op|IEX\s*\(|Invoke-Expression)/i,
  /(?:cmd(?:\.exe)?\s+\/c|rundll32(?:\.exe)?|certutil.*-urlcache)/i,
  /(?:curl.*\|\s*(?:bash|sh)|wget.*\|\s*(?:bash|sh)|base64\s+-d\s*\|\s*sh)/i,
  /(?:mshta\s+https?:\/\/|regsvr32.*\/s\s*\/u\s*\/i:)/i,
];

// 6. AI Tone Signatures (Informational Only)
const AI_TONE_PATTERNS = [
  /(?:as\s+an\s+ai\s+language\s+model|tôi\s+là\s+mô\s+hình\s+ngôn\s+ngữ\s+ai)/i,
  /(?:in\s+conclusion,\s+it\s+is\s+important\s+to|nhìn\s+chung,\s+có\s+thể\s+thấy\s+rằng)/i,
];

/**
 * Deterministically inspects text content for scams, phishing, and malware signatures
 * @param {string} textContent 
 * @returns {object} { signals, hardTriggers }
 */
export function inspectText(textContent) {
  const signals = [];
  const hardTriggers = [];

  const raw = String(textContent || "").trim();
  if (!raw) {
    return { signals, hardTriggers };
  }

  const hasOTP = OTP_REGEX.test(raw);
  const hasCredential = CREDENTIAL_REGEX.test(raw);

  // 1. Credential / OTP Theft (HARD BLOCK if both or strong credential demand)
  if (hasCredential && hasOTP) {
    const sig = {
      id: "SIG_CREDENTIAL_AND_OTP_THEFT",
      type: SIGNAL_TYPE.DANGER,
      category: "text",
      title: "Yêu cầu đồng thời mật khẩu đăng nhập và mã bảo mật OTP (Hành vi lừa đảo tài khoản trực diện)",
      weight: SIGNAL_WEIGHTS.HARD_CREDENTIAL_OTP,
      snippet: raw.slice(0, 100),
    };
    signals.push(sig);
    hardTriggers.push({
      reason: LAYER_1_REASONS.CREDENTIAL_REQUEST,
      signal: sig,
    });
  } else if (hasCredential) {
    const sig = {
      id: "SIG_CREDENTIAL_THEFT",
      type: SIGNAL_TYPE.DANGER,
      category: "text",
      title: "Yêu cầu nhập mật khẩu cá nhân / tài khoản liên kết",
      weight: 0.85,
      snippet: raw.slice(0, 80),
    };
    signals.push(sig);
    hardTriggers.push({
      reason: LAYER_1_REASONS.CREDENTIAL_REQUEST,
      signal: sig,
    });
  } else if (hasOTP) {
    signals.push({
      id: "SIG_OTP_REQUEST",
      type: SIGNAL_TYPE.WARNING,
      category: "text",
      title: "Văn bản có chứa yêu cầu gửi hoặc cung cấp mã xác thực OTP",
      weight: 0.60,
      snippet: "mã OTP / mã xác thực",
    });
  }

  // 2. Task Deposit & Student Job Scams (HARD BLOCK candidate)
  let taskDepositMatches = 0;
  for (const pat of TASK_DEPOSIT_PATTERNS) {
    if (pat.test(raw)) {
      taskDepositMatches += 1;
    }
  }

  const hasDepositKeyword = DEPOSIT_KEYWORD_REGEX.test(raw);
  const hasTaskReward = TASK_REWARD_REGEX.test(raw);

  if (taskDepositMatches >= 2 || (hasDepositKeyword && hasTaskReward)) {
    const sig = {
      id: "SIG_TASK_DEPOSIT_SCAM_CONFIRMED",
      type: SIGNAL_TYPE.DANGER,
      category: "text",
      title: "Chiêu trò lừa đảo 'Nạp cọc làm nhiệm vụ / CTV giật đơn Shopee-Lazada' điển hình",
      weight: SIGNAL_WEIGHTS.HARD_TASK_DEPOSIT_SCAM,
      snippet: "Khớp từ khóa bẫy nạp cọc + hoa hồng bất thường",
    };
    signals.push(sig);
    hardTriggers.push({
      reason: LAYER_1_REASONS.TASK_DEPOSIT_SCAM,
      signal: sig,
    });
  } else if (taskDepositMatches === 1 || hasDepositKeyword || hasTaskReward) {
    signals.push({
      id: "SIG_TASK_DEPOSIT_SUSPICIOUS",
      type: SIGNAL_TYPE.WARNING,
      category: "text",
      title: "Nghi vấn bẫy việc làm CTV trực tuyến hoặc yêu cầu đóng phí/nạp tiền",
      weight: 0.50,
      snippet: "CTV đơn hàng / nạp cọc / hoa hồng cao",
    });
  }

  // 3. Impersonation of Authority / School / Bank
  for (const pat of IMPERSONATION_PATTERNS) {
    if (pat.test(raw)) {
      signals.push({
        id: "SIG_IMPERSONATION_AUTHORITY",
        type: SIGNAL_TYPE.WARNING,
        category: "text",
        title: "Dấu hiệu mạo danh phòng ban nhà trường / tổ chức tín dụng / cơ quan chức năng",
        weight: 0.65,
        snippet: raw.slice(0, 90),
      });
      break;
    }
  }

  // 4. Urgency & Coercion
  for (const pat of URGENCY_PATTERNS) {
    if (pat.test(raw)) {
      signals.push({
        id: "SIG_URGENCY_COERCION",
        type: SIGNAL_TYPE.WARNING,
        category: "text",
        title: "Tạo áp lực thời gian gấp gáp / đe dọa xử lý hoặc mồi nhử trúng thưởng",
        weight: SIGNAL_WEIGHTS.SOFT_URGENCY_TRIGGER,
        snippet: "Áp lực thời gian / trúng thưởng",
      });
      break;
    }
  }

  // 5. Malicious Shell / Script Payloads (HARD BLOCK)
  for (const pat of MALICIOUS_SHELL_PATTERNS) {
    if (pat.test(raw)) {
      const sig = {
        id: "SIG_MALICIOUS_SHELL_PAYLOAD",
        type: SIGNAL_TYPE.DANGER,
        category: "text",
        title: "Phát hiện câu lệnh thực thi hệ thống hoặc mã độc tự động (PowerShell / Shell Injection)",
        weight: SIGNAL_WEIGHTS.HARD_MALICIOUS_SHELL,
        snippet: raw.slice(0, 80),
      };
      signals.push(sig);
      hardTriggers.push({
        reason: LAYER_1_REASONS.MALICIOUS_SHELL_PAYLOAD,
        signal: sig,
      });
      break;
    }
  }

  // 6. AI Tone Guard (Never BLOCK, only info signal)
  for (const pat of AI_TONE_PATTERNS) {
    if (pat.test(raw)) {
      signals.push({
        id: "SIG_AI_TONE_MARKER",
        type: SIGNAL_TYPE.INFO,
        category: "text",
        title: "Văn phong có cấu trúc tương đồng với mẫu phản hồi của mô hình ngôn ngữ AI",
        weight: SIGNAL_WEIGHTS.SOFT_AI_TONE,
        snippet: "AI style marker",
      });
      break;
    }
  }

  return { signals, hardTriggers };
}
