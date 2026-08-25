/**
 * Layer 1 — TextDetector
 * 
 * High-confidence deterministic text screening:
 * - Credential Harvesting (Password, OTP, PIN)
 * - Authority / Bank / University Impersonation
 * - Advance-Fee & Student Job Deposit Scams
 * - Urgency & Coercive Social Engineering
 * - Obvious Shell & Script Execution Payloads
 * - False-Positive Guard for Educational / Academic Content
 * - AI Tone Guard (Strictly low-severity informative signal)
 */

import { LAYER_1_CONFIG } from "../config/Layer1Config.js";
import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";

// 1. Direct Credential & OTP Demands
const CREDENTIAL_DEMAND_REGEX = /(?:nhập\s*mật\s*khẩu|cung\s*cấp\s*mật\s*khẩu|gửi\s*password|enter\s*(?:your\s*)?(?:gmail\s*)?password|provide\s*(?:your\s*)?password|send\s*(?:your\s*)?password|tên\s*đăng\s*nhập\s*và\s*mật\s*khẩu|mật\s*khẩu\s*(?:gmail|icloud|ngân\s*hàng|tài\s*khoản|cá\s*nhân)|\bpassword\b|\bmật\s*khẩu\b)/i;
const OTP_DEMAND_REGEX = /(?:gửi\s*(?:mã\s*)?otp|nhập\s*(?:mã\s*)?otp|cung\s*cấp\s*mã\s*xác\s*(?:thực|nhận)|provide\s*(?:your\s*)?otp|send\s*verification\s*code|smart\s*otp|mã\s*otp|verification\s*code|\botp\b)/i;
const PIN_DEMAND_REGEX = /(?:mã\s*pin\s*ngân\s*hàng|bank\s*pin|give\s*us\s*your\s*pin|nhập\s*mã\s*pin|\bpin\s*code\b)/i;

// Action verbs indicating command/directive to submit or transfer
const ACTION_VERB_REGEX = /(?:nhập|gửi|cung\s*cấp|chuyển|nạp|enter|send|provide|input|submit|verify|xác\s*(?:minh|thực)|kích\s*hoạt)/i;

// Educational / Academic Context Whitelist Guards (Prevent False Positives)
const BENIGN_EDUCATIONAL_PATTERNS = [
  /(?:bài\s+giảng|giáo\s+trình|lecture|assignment|bài\s+tập|môn\s+học|nghiên\s+cứu|khái\s+niệm|lý\s+thuyết|cấu\s+trúc\s+dữ\s+liệu|thuật\s+toán)/i,
  /(?:explains\s+how|discusses\s+otp|password\s+authentication\s+works|mô\s+hình\s+bảo\s+mật|phương\s+thức\s+xác\s+thực)/i,
  /(?:hướng\s+dẫn\s+thực\s+hành|slide\s+bài\s+giảng|tài\s+liệu\s+học\s+tập)/i,
];

// 2. Task Deposit & Student Job Scams
const TASK_DEPOSIT_PATTERNS = [
  /(?:tuyển.*(?:ctv|cộng\s*tác\s*viên)|ctv|cộng\s*tác\s*viên).*(?:shopee|lazada|tiktok|đơn\s*hàng|xử\s*lý\s*đơn)/i,
  /(?:nạp\s*cọc|đặt\s*cọc|chuyển\s*khoản\s*cọc|nạp\s*tiền|nạp\s*phí).*(?:làm\s*nhiệm\s*vụ|kích\s*hoạt|nhiệm\s*vụ)/i,
  /(?:hoa\s*hồng\s*(?:1[0-9]|[2-9]\d)%|hoàn\s*tiền\s*\d+%|hoàn\s*tiền\s*kèm\s*hoa\s*hồng)/i,
  /(?:việc\s*nhẹ\s*lương\s*cao|thu\s*nhập\s*\d+00k|kiếm\s*\d+00k\s*\/\s*(?:ngày|giờ|ca)|nhận\s*tiền\s*sau\s*\d+\s*phút)/i,
  /(?:nạp\s*tiền\s*vào\s*app|nạp\s*phí\s*kích\s*hoạt|nạp\s*cọc\s*kích\s*hoạt)/i,
];

// 3. Impersonation of Authority / Institutions
const IMPERSONATION_PATTERNS = [
  /(?:phòng\s*đào\s*tạo|ban\s*giám\s*hiệu|phòng\s*ctsv|đoàn\s*thanh\s*niên|bộ\s*công\s*an|cục\s*thuế|ngân\s*hàng\s*nhà\s*nước).*(?:thông\s*báo\s*khẩn|yêu\s*cầu\s*xác\s*minh|cảnh\s*báo\s*khóa)/i,
  /(?:vietcombank|mbbank|techcombank|bidv|agribank|vnpay|momo).*(?:xác\s*thực\s*tài\s*khoản|bảo\s*trì\s*khẩn|khóa\s*thẻ|thông\s*báo)/i,
  /(?:hcmute|vnuhcm|bách\s*khoa|kinh\s*tế).*(?:học\s*bổng\s*khẩn|đóng\s*học\s*phí\s*gấp|truy\s*cập\s*link\s*để\s*nhận)/i,
];

// 4. Urgency & Coercive Social Engineering
const URGENCY_PATTERNS = [
  /(?:trong\s*vòng\s*(?:5|10|15|30)\s*phút|hết\s*hạn\s*sau\s*\d+\s*giờ|nếu\s*không\s*sẽ\s*bị\s*khóa)/i,
  /(?:your\s*account\s*will\s*be\s*closed|immediately\s*verify|last\s*warning|urgent\s*security\s*action|you\s*have\s*10\s*minutes)/i,
  /(?:truy\s*cứu\s*trách\s*nhiệm\s*hình\s*sự|lệnh\s*bắt\s*tạm\s*giam|khởi\s*tố)/i,
];

// 5. Reward / Lottery Scams
const REWARD_SCAM_PATTERNS = [
  /(?:bạn\s*đã\s*trúng\s*thưởng|nhận\s*quà\s*tri\s*ân|nhận\s*học\s*bổng\s*quốc\s*tế\s*miễn\s*phí|nhận\s*học\s*bổng)/i,
  /(?:you\s*won|claim\s*your\s*reward|scholarship\s*approved|click\s*to\s*receive|receive\s*reward)/i,
];

// 6. Malicious Shell & Script Payloads
const MALICIOUS_SHELL_PATTERNS = [
  /(?:powershell(?:\.exe)?\s+-[a-zA-Z]*enc|powershell.*-[nN]op|IEX\s*\(|Invoke-Expression)/i,
  /(?:cmd(?:\.exe)?\s+\/c|rundll32(?:\.exe)?|certutil.*-urlcache)/i,
  /(?:curl.*\|\s*(?:bash|sh)|wget.*\|\s*(?:bash|sh)|base64\s+-d\s*\|\s*sh)/i,
  /(?:mshta\s+https?:\/\/|regsvr32.*\/s\s*\/u\s*\/i:)/i,
];

// 7. AI Style Signatures
const AI_STYLE_PATTERNS = [
  /(?:as\s+an\s+ai\s+language\s+model|tôi\s+là\s+mô\s+hình\s+ngôn\s+ngữ\s+ai)/i,
  /(?:in\s+conclusion,\s+it\s+is\s+important\s+to|nhìn\s+chung,\s+có\s+thể\s+thấy\s+rằng)/i,
];

export class TextDetector {
  /**
   * Scans normalized text content and generates structured signals
   * @param {object} normText - Output from NormalizationService.normalizeText
   * @returns {object} { signals, isEducational }
   */
  static detect(normText) {
    const signals = [];
    if (!normText || !normText.isValid || !normText.normalized) {
      return { signals, isEducational: false };
    }

    const text = normText.normalized;
    const deobfuscated = normText.deobfuscated || text.toLowerCase();

    // False Positive Guard: Check if text is strictly educational/academic context
    const isEducational = BENIGN_EDUCATIONAL_PATTERNS.some((pat) => pat.test(text));

    // 1. Malicious Shell / Script Payload (Highest Severity)
    for (const pat of MALICIOUS_SHELL_PATTERNS) {
      if (pat.test(text) || pat.test(deobfuscated)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.MALICIOUS_SHELL_PAYLOAD,
            category: "malware",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.MALICIOUS_SHELL_PAYLOAD,
            evidence: { snippet: text.slice(0, 100), details: "Obvious command execution / shell injection payload" },
            source: "TextDetector",
          })
        );
        break;
      }
    }

    // 2. Credential Demands (Password / PIN / OTP)
    const hasCredentialDemand = CREDENTIAL_DEMAND_REGEX.test(text) || CREDENTIAL_DEMAND_REGEX.test(deobfuscated);
    const hasOTPDemand = OTP_DEMAND_REGEX.test(text) || OTP_DEMAND_REGEX.test(deobfuscated);
    const hasPinDemand = PIN_DEMAND_REGEX.test(text) || PIN_DEMAND_REGEX.test(deobfuscated);
    const hasActionVerb = ACTION_VERB_REGEX.test(text) || ACTION_VERB_REGEX.test(deobfuscated);

    if (!isEducational) {
      if (hasCredentialDemand && (hasOTPDemand || hasPinDemand)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.CREDENTIAL_REQUEST,
            category: "social_engineering",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.CREDENTIAL_PHISHING_PATTERN,
            evidence: { snippet: text.slice(0, 120), details: "Explicit demand for both account password and OTP/PIN token" },
            source: "TextDetector",
          })
        );
        signals.push(
          createSignal({
            type: hasPinDemand ? LAYER_1_REASONS.PIN_REQUEST : LAYER_1_REASONS.OTP_REQUEST,
            category: "social_engineering",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.CREDENTIAL_PHISHING_PATTERN,
            evidence: { snippet: hasPinDemand ? "PIN requested" : "OTP / Verification code requested", details: "OTP/PIN harvesting directive" },
            source: "TextDetector",
          })
        );
      } else if (hasCredentialDemand && hasActionVerb) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.CREDENTIAL_REQUEST,
            category: "social_engineering",
            severity: SIGNAL_SEVERITY.HIGH,
            confidence: 0.85,
            evidence: { snippet: text.slice(0, 90), details: "Account password requested" },
            source: "TextDetector",
          })
        );
      } else if (hasOTPDemand && hasActionVerb) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.OTP_REQUEST,
            category: "social_engineering",
            severity: SIGNAL_SEVERITY.MEDIUM,
            confidence: 0.65,
            evidence: { snippet: "OTP requested", details: "OTP verification code mentioned" },
            source: "TextDetector",
          })
        );
      } else if (hasPinDemand) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.PIN_REQUEST,
            category: "social_engineering",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: 0.95,
            evidence: { snippet: text.slice(0, 80), details: "Bank PIN / Security code demanded" },
            source: "TextDetector",
          })
        );
      }
    }

    // 3. Task Deposit & Student Job Scam
    let taskDepositMatches = 0;
    for (const pat of TASK_DEPOSIT_PATTERNS) {
      if (pat.test(text) || pat.test(deobfuscated)) {
        taskDepositMatches++;
      }
    }

    if (taskDepositMatches >= 2) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.TASK_DEPOSIT_SCAM,
          category: "social_engineering",
          severity: SIGNAL_SEVERITY.CRITICAL,
          confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.TASK_DEPOSIT_SCAM,
          evidence: { snippet: text.slice(0, 120), details: "Matches task deposit & affiliate commission scam signature" },
          source: "TextDetector",
        })
      );
    } else if (taskDepositMatches === 1) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.ADVANCE_FEE_SCAM,
          category: "social_engineering",
          severity: SIGNAL_SEVERITY.MEDIUM,
          confidence: 0.50,
          evidence: { snippet: "Online task deposit / fee trigger", details: "Suspicious task/commission pattern" },
          source: "TextDetector",
        })
      );
    }

    // 4. Authority / School / Bank Impersonation
    for (const pat of IMPERSONATION_PATTERNS) {
      if (pat.test(text)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.IMPERSONATION_AUTHORITY,
            category: "social_engineering",
            severity: SIGNAL_SEVERITY.HIGH,
            confidence: 0.70,
            evidence: { snippet: text.slice(0, 90), details: "Impersonating university office, bank, or government authority" },
            source: "TextDetector",
          })
        );
        break;
      }
    }

    // 5. Urgency & Coercive Pressure
    for (const pat of URGENCY_PATTERNS) {
      if (pat.test(text)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.URGENCY_PATTERN,
            category: "social_engineering",
            severity: SIGNAL_SEVERITY.LOW,
            confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.URGENT_WORDING,
            evidence: { snippet: "Artificial urgency trigger", details: "Time pressure coercing immediate action" },
            source: "TextDetector",
          })
        );
        break;
      }
    }

    // 6. Reward & Scholarship Bait
    for (const pat of REWARD_SCAM_PATTERNS) {
      if (pat.test(text)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.REWARD_SCAM_PATTERN,
            category: "social_engineering",
            severity: SIGNAL_SEVERITY.MEDIUM,
            confidence: 0.50,
            evidence: { snippet: "Prize/scholarship reward claim", details: "Unsolicited reward / scholarship bait" },
            source: "TextDetector",
          })
        );
        break;
      }
    }

    // 7. AI Style Signatures (Strictly Informational)
    for (const pat of AI_STYLE_PATTERNS) {
      if (pat.test(text)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.AI_LIKE_TEXT,
            category: "text",
            severity: SIGNAL_SEVERITY.INFO,
            confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.AI_STYLE_WORDING,
            evidence: { snippet: "AI style marker", details: "Matches structural AI response template (Informational only)" },
            source: "TextDetector",
          })
        );
        break;
      }
    }

    return { signals, isEducational };
  }
}
