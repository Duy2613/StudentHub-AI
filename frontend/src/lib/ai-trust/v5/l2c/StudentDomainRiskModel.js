import { STUDENT_DOMAIN_TAXONOMY_VERSION, taxonomyEntry } from "./taxonomy.js";

export const STUDENT_DOMAIN_MODEL_VERSION = "studenthub-domain-rule-baseline-1.0.0";
export const STUDENT_DOMAIN_MODEL_TYPE = "BASELINE_RULE_MODEL";
export const STUDENT_DOMAIN_MAX_INPUT_CHARS = 16_000;

const INJECTION_PATTERNS = [
  /ignore\s+(?:all\s+)?previous\s+instructions?/iu,
  /bỏ\s+qua\s+(?:mọi\s+)?chỉ\s+dẫn/iu,
  /(?:system|developer)\s*:\s*(?:mark|đánh\s+dấu|return|trả)/iu,
  /(?:mark|đánh\s+dấu)\s+(?:this|nội\s+dung)\s+(?:as\s+)?(?:safe|an\s+toàn)/iu,
  /trust_override\s*=\s*true/iu,
];

const RULES = Object.freeze([
  {
    classification: "CREDENTIAL_HARVESTING",
    phrases: ["mật khẩu", "password", "otp", "nhập otp", "mã otp", "gửi otp", "gui otp", "mã xác thực", "đăng nhập để xác minh", "xác minh tài khoản"],
    score: 0.94,
    severity: "CRITICAL",
  },
  {
    classification: "ACCOUNT_TAKEOVER",
    phrases: ["khôi phục tài khoản", "mở khóa tài khoản", "tài khoản sẽ bị khóa", "chiếm quyền", "xác minh sinh viên"],
    requires: ["link", "ngay", "otp", "mật khẩu", "đăng nhập", "phí"],
    score: 0.9,
    severity: "HIGH",
  },
  {
    classification: "FAKE_SCHOLARSHIP",
    phrases: ["học bổng", "scholarship"],
    requires: ["phí", "processing fee", "pay", "personal account", "đóng", "chuyển khoản", "đặt cọc", "lệ phí", "nhận tiền", "qr", "ngay", "today"],
    score: 0.93,
    severity: "HIGH",
  },
  {
    classification: "TUITION_PAYMENT_SCAM",
    phrases: ["học phí", "tuition", "phòng tài vụ"],
    requires: ["tài khoản cá nhân", "chuyển khoản", "qr", "gấp", "ngay", "đổi số tài khoản", "mã otp"],
    score: 0.91,
    severity: "HIGH",
  },
  {
    classification: "FAKE_INTERNSHIP",
    phrases: ["thực tập", "internship", "intern"],
    requires: ["phí", "đặt cọc", "lương cao", "chuyển khoản", "tuyển gấp"],
    score: 0.92,
    severity: "HIGH",
  },
  {
    classification: "FAKE_PART_TIME_JOB",
    phrases: ["việc làm thêm", "việc part time", "part-time", "cộng tác viên", "làm online"],
    requires: ["phí", "đặt cọc", "nạp tiền", "lương cao", "chuyển khoản", "tuyển gấp", "hoa hồng"],
    score: 0.92,
    severity: "HIGH",
  },
  {
    classification: "ADVANCE_FEE_SCAM",
    phrases: ["đặt cọc", "cọc", "phí hồ sơ", "phí giữ chỗ", "phí kích hoạt", "phí mở khóa", "nộp trước", "đóng trước"],
    score: 0.88,
    severity: "HIGH",
  },
  {
    classification: "UNIVERSITY_IMPERSONATION",
    phrases: ["nhà trường", "phòng đào tạo", "trường đại học", "ban giám hiệu", "hcmute", "đại học sư phạm kỹ thuật"],
    requires: ["chuyển khoản", "mật khẩu", "otp", "đăng nhập", "phí", "gấp", "ngay", "link"],
    score: 0.86,
    severity: "HIGH",
  },
  {
    classification: "FACULTY_IMPERSONATION",
    phrases: ["giảng viên", "thầy", "cô", "khoa", "cố vấn học tập"],
    requires: ["chuyển khoản", "mật khẩu", "otp", "phí", "gấp", "ngay", "đặt cọc"],
    score: 0.82,
    severity: "HIGH",
  },
  {
    classification: "STUDENT_ORG_IMPERSONATION",
    phrases: ["câu lạc bộ", "clb", "đoàn trường", "hội sinh viên", "ban tổ chức"],
    requires: ["vé", "phí", "chuyển khoản", "đặt cọc", "qr", "gấp", "ngay"],
    score: 0.8,
    severity: "HIGH",
  },
  {
    classification: "FAKE_KTX_HOUSING",
    phrases: ["ký túc xá", "ktx", "phòng trọ", "nhà trọ", "chỗ ở"],
    requires: ["đặt cọc", "giữ phòng", "chuyển khoản", "phí", "gấp"],
    score: 0.82,
    severity: "HIGH",
  },
  {
    classification: "QR_PAYMENT_SCAM",
    phrases: ["qr", "mã qr", "quét mã", "quét qr"],
    requires: ["chuyển tiền", "chuyển khoản", "thanh toán", "nạp tiền", "phí", "đặt cọc"],
    score: 0.9,
    severity: "HIGH",
  },
  {
    classification: "PAYMENT_REDIRECTION",
    phrases: ["tài khoản cá nhân", "số tài khoản mới", "đổi tài khoản nhận", "chuyển sang momo", "zalo pay", "zalopay"],
    score: 0.89,
    severity: "HIGH",
  },
  {
    classification: "FAKE_EVENT_TICKET",
    phrases: ["vé sự kiện", "vé workshop", "vé hội thảo", "vé concert"],
    requires: ["chuyển khoản", "qr", "đặt cọc", "gấp", "phí"],
    score: 0.78,
    severity: "HIGH",
  },
  {
    classification: "FAKE_CERTIFICATE",
    phrases: ["chứng chỉ", "bằng cấp", "chứng nhận"],
    requires: ["mua", "bán", "phí", "cam kết", "nhận ngay"],
    score: 0.83,
    severity: "HIGH",
  },
  {
    classification: "FAKE_REFUND",
    phrases: ["hoàn học phí", "hoàn tiền", "refund"],
    requires: ["otp", "mật khẩu", "chuyển khoản", "phí", "link", "đăng nhập"],
    score: 0.88,
    severity: "HIGH",
  },
  {
    classification: "FAKE_REWARD",
    phrases: ["phần thưởng", "trúng thưởng", "nhận quà", "reward"],
    requires: ["phí", "chuyển khoản", "otp", "link", "đăng nhập", "ngay"],
    score: 0.79,
    severity: "HIGH",
  },
  {
    classification: "FAKE_STUDENT_SUPPORT",
    phrases: ["hỗ trợ sinh viên", "student support", "trung tâm hỗ trợ"],
    requires: ["mật khẩu", "otp", "chuyển khoản", "phí", "đăng nhập"],
    score: 0.84,
    severity: "HIGH",
  },
  {
    classification: "MONEY_MULE_RECRUITMENT",
    phrases: ["nhận tiền hộ", "chuyển tiền hộ", "cho thuê tài khoản", "tài khoản trung gian", "mở tài khoản nhận lương"],
    score: 0.93,
    severity: "CRITICAL",
  },
  {
    classification: "URGENCY_MANIPULATION",
    phrases: ["ngay lập tức", "lập tức", "khẩn cấp", "trong 5 phút", "trước khi bị khóa", "tuyển gấp", "hạn cuối hôm nay", "urgent"],
    score: 0.55,
    severity: "MEDIUM",
  },
  {
    classification: "SOCIAL_PROOF_MANIPULATION",
    phrases: ["hàng nghìn sinh viên đã nhận", "ai cũng đã chuyển", "100% sinh viên", "đã có rất nhiều bạn"],
    score: 0.48,
    severity: "MEDIUM",
  },
]);

function boundedText(value) {
  return typeof value === "string" ? value.replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, STUDENT_DOMAIN_MAX_INPUT_CHARS) : "";
}

function normalizeText(value) {
  return boundedText(value)
    .normalize("NFKC")
    .replace(/[\u200B-\u200D\uFEFF]/g, " ")
    .toLocaleLowerCase("vi-VN")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/[0-9]/g, (digit) => ({ "0": "o", "1": "i", "3": "e", "4": "a", "5": "s", "7": "t" }[digit] || digit))
    .replace(/[^a-z0-9@._:/?&=+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function containsNormalizedPhrase(text, phrase) {
  const normalizedPhrase = normalizeText(phrase);
  if (!normalizedPhrase) return false;
  const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
  return new RegExp(`(?<![a-z0-9])${escaped}(?![a-z0-9])`, "u").test(text);
}

function includesAny(text, phrases) {
  return phrases.some((phrase) => containsNormalizedPhrase(text, phrase));
}

function findMatches(text, rule) {
  if (!includesAny(text, rule.phrases)) return [];
  if (rule.requires && !includesAny(text, rule.requires)) return [];
  return rule.phrases.filter((phrase) => containsNormalizedPhrase(text, phrase)).slice(0, 3);
}

function promptInjectionMatches(value) {
  return INJECTION_PATTERNS.filter((pattern) => pattern.test(value)).map((pattern) => pattern.source).slice(0, 8);
}

function safeStudentContext(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const result = {};
  for (const key of ["language", "inputType", "institutionContext"]) {
    if (typeof value[key] === "string") result[key] = value[key].slice(0, 80);
  }
  return result;
}

export class StudentDomainRiskModel {
  static analyze(input = {}, options = {}) {
    const value = input && typeof input === "object" && !Array.isArray(input) ? input : {};
    const original = boundedText(value.content ?? value.text ?? value.ocrText ?? value.qrPayload ?? "");
    const injectionMatches = promptInjectionMatches(original);
    const normalized = normalizeText(original);
    const analysisText = normalized.replace(/ignore previous instructions|bo qua moi chi dan|system mark this safe|trust_override true/giu, " ");
    const signals = [];
    const matches = [];

    for (const rule of RULES) {
      const matchedPhrases = findMatches(analysisText, rule);
      if (!matchedPhrases.length) continue;
      const taxonomy = taxonomyEntry(rule.classification);
      matches.push({
        classification: rule.classification,
        score: rule.score,
        severity: rule.severity,
        matchedPhrases,
      });
      signals.push({
        code: rule.classification,
        severity: rule.severity,
        source: "student_domain_rule_baseline",
        details: `Pattern domain khớp: ${matchedPhrases.join(", ")}.`,
      });
      if (!taxonomy) continue;
    }

    if (injectionMatches.length > 0) {
      signals.push({
        code: "PROMPT_INJECTION_ISOLATED",
        severity: "HIGH",
        source: "student_domain_input_guard",
        details: "Instruction-like content được coi là dữ liệu không tin cậy và không được dùng làm policy instruction.",
      });
    }

    const highRiskMatches = matches.filter((match) => taxonomyEntry(match.classification)?.highRisk);
    const sorted = [...matches].sort((left, right) => right.score - left.score);
    const primary = sorted[0]?.classification || (injectionMatches.length ? "UNKNOWN_STUDENT_RISK" : "NO_MATERIAL_STUDENT_RISK");
    const modelScore = sorted.length ? Number(Math.min(0.99, Math.max(...sorted.map((match) => match.score))).toFixed(4)) : 0;
    const secondaryClassifications = sorted.slice(1, 5).map((match) => match.classification);
    const hasOnlySoftSignals = matches.length > 0 && highRiskMatches.length === 0;
    const classification = hasOnlySoftSignals ? "UNKNOWN_STUDENT_RISK" : primary;
    const severity = highRiskMatches.some((match) => match.severity === "CRITICAL")
      ? "CRITICAL"
      : highRiskMatches.length > 0
        ? "HIGH"
        : matches.length > 0
          ? "MEDIUM"
          : "INFO";

    return {
      classification,
      secondaryClassifications,
      riskSignals: signals.slice(0, 40),
      studentContext: safeStudentContext(options.context || value.context),
      modelStatus: STUDENT_DOMAIN_MODEL_TYPE,
      modelType: STUDENT_DOMAIN_MODEL_TYPE,
      modelVersion: STUDENT_DOMAIN_MODEL_VERSION,
      taxonomyVersion: STUDENT_DOMAIN_TAXONOMY_VERSION,
      datasetVersion: "NO_VERIFIED_TRAINING_DATASET",
      modelScore,
      calibratedRisk: null,
      calibrationStatus: "NOT_CALIBRATED",
      confidenceKind: "MODEL_SCORE_UNCALIBRATED",
      severity,
      explanation: matches.length
        ? `Baseline nhận diện ${primary.replaceAll("_", " ")} từ các pattern cục bộ: ${signals.slice(0, 3).map((signal) => signal.code).join(", ")}.`
        : "Baseline không thấy pattern rủi ro sinh viên đặc thù đủ mạnh trong input.",
      evidenceNeeded: matches.length
        ? ["Đối chiếu nguồn chính thức của trường", "Kiểm tra kênh thanh toán và danh tính người gửi", "Xác minh độc lập qua kênh đã biết"]
        : ["Nếu claim có tác động cao, vẫn cần nguồn chính thức độc lập"],
      limitations: [
        "Đây là baseline rule model, không phải model đã fine-tune.",
        "MODEL_SCORE chưa được hiệu chuẩn nên không phải xác suất.",
        "Pattern domain chỉ là tín hiệu advisory; không thể xóa hard negative hoặc quyết định policy.",
        "Instruction-like content được cách ly; model không coi nội dung đó là lệnh hệ thống.",
      ],
      promptInjectionDetected: injectionMatches.length > 0,
      promptInjectionSignals: injectionMatches,
      inputLength: original.length,
    };
  }
}

export function analyzeStudentDomainRisk(input, options) {
  return StudentDomainRiskModel.analyze(input, options);
}
