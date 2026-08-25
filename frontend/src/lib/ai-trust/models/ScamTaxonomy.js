/**
 * StudentHub AI — ScamTaxonomy
 *
 * Comprehensive, machine-readable taxonomy codifying:
 *   - 40+ scam type categories
 *   - 26 psychological manipulation tactics
 *   - 14 attack lifecycle stages
 *   - Target asset types
 *   - Requested action types
 *   - Behavioral & transactional red flags
 *   - Multi-label output schema
 *
 * Design Principle:
 *   Every constant here is an EVIDENCE label, not an automatic verdict.
 *   A single tactic or signal does NOT equal "scam."
 *   The Evidence Fusion Engine combines them to produce risk assessment.
 *
 * Based on: NIST SP 800-63B, OWASP, common Vietnamese fraud landscape,
 * and the comprehensive taxonomy documented in StudentHub AI Knowledge Vault.
 */

// ═══════════════════════════════════════════════════════════════════════════════
// 1. SCAM TYPE TAXONOMY (40+ categories, multi-label)
// ═══════════════════════════════════════════════════════════════════════════════

export const SCAM_TYPES = {
  // ── Identity / Authority Impersonation ──────────────────────────────────────
  BANK_IMPERSONATION: "BANK_IMPERSONATION",                   // Giả danh ngân hàng
  FINTECH_IMPERSONATION: "FINTECH_IMPERSONATION",             // Giả danh ví điện tử / fintech
  GOVERNMENT_IMPERSONATION: "GOVERNMENT_IMPERSONATION",       // Giả danh cơ quan nhà nước
  POLICE_IMPERSONATION: "POLICE_IMPERSONATION",               // Giả danh công an / cảnh sát
  COURT_IMPERSONATION: "COURT_IMPERSONATION",                 // Giả danh tòa án / viện kiểm sát
  TAX_IMPERSONATION: "TAX_IMPERSONATION",                     // Giả danh cơ quan thuế / hải quan
  SCHOOL_IMPERSONATION: "SCHOOL_IMPERSONATION",               // Giả danh trường học / đại học
  HOSPITAL_IMPERSONATION: "HOSPITAL_IMPERSONATION",           // Giả danh bệnh viện / y tế
  INSURANCE_IMPERSONATION: "INSURANCE_IMPERSONATION",         // Giả danh bảo hiểm xã hội
  ECOMMERCE_IMPERSONATION: "ECOMMERCE_IMPERSONATION",         // Giả danh sàn TMĐT
  TELECOM_IMPERSONATION: "TELECOM_IMPERSONATION",             // Giả danh nhà mạng
  UTILITY_IMPERSONATION: "UTILITY_IMPERSONATION",             // Giả danh điện lực / nước
  LOGISTICS_IMPERSONATION: "LOGISTICS_IMPERSONATION",         // Giả danh công ty chuyển phát
  TECH_SUPPORT_IMPERSONATION: "TECH_SUPPORT_IMPERSONATION",   // Giả danh Microsoft / Apple / ISP
  EMPLOYER_IMPERSONATION: "EMPLOYER_IMPERSONATION",           // Giả danh công ty / cấp trên
  FAMILY_IMPERSONATION: "FAMILY_IMPERSONATION",               // Giả danh người thân
  FRIEND_IMPERSONATION: "FRIEND_IMPERSONATION",               // Giả danh bạn bè (tài khoản bị hack)
  CELEBRITY_IMPERSONATION: "CELEBRITY_IMPERSONATION",         // Giả danh người nổi tiếng
  CRYPTO_EXCHANGE_IMPERSONATION: "CRYPTO_EXCHANGE_IMPERSONATION", // Giả danh sàn crypto

  // ── Phishing Variants ───────────────────────────────────────────────────────
  PHISHING: "PHISHING",                                       // Phishing tổng quát
  SMISHING: "SMISHING",                                       // Phishing qua SMS
  VISHING: "VISHING",                                         // Phishing qua điện thoại
  EMAIL_PHISHING: "EMAIL_PHISHING",                           // Phishing qua email
  QR_PHISHING: "QR_PHISHING",                                 // Phishing qua QR code
  OTP_THEFT: "OTP_THEFT",                                     // Đánh cắp mã OTP
  CREDENTIAL_THEFT: "CREDENTIAL_THEFT",                       // Đánh cắp thông tin đăng nhập

  // ── Financial Fraud ─────────────────────────────────────────────────────────
  ADVANCE_FEE_SCAM: "ADVANCE_FEE_SCAM",                       // Thu phí trước / lừa cọc
  FAKE_REFUND: "FAKE_REFUND",                                  // Hoàn tiền giả
  FAKE_PAYMENT_CONFIRMATION: "FAKE_PAYMENT_CONFIRMATION",      // Xác nhận thanh toán giả
  FAKE_DELIVERY_FEE: "FAKE_DELIVERY_FEE",                     // Phí vận chuyển / hải quan giả
  OVERPAYMENT_SCAM: "OVERPAYMENT_SCAM",                       // Chuyển nhầm tiền
  MONEY_MULE: "MONEY_MULE",                                   // Rửa tiền qua tài khoản nạn nhân
  INVOICE_FRAUD: "INVOICE_FRAUD",                             // Hóa đơn giả / thay tài khoản thụ hưởng
  SUBSCRIPTION_SCAM: "SUBSCRIPTION_SCAM",                     // Gia hạn dịch vụ giả
  RECOVERY_SCAM: "RECOVERY_SCAM",                             // Lừa đảo thu hồi tiền (lừa lần 2)

  // ── Investment & Crypto Fraud ────────────────────────────────────────────────
  INVESTMENT_SCAM: "INVESTMENT_SCAM",                         // Đầu tư giả
  CRYPTO_SCAM: "CRYPTO_SCAM",                                 // Crypto / NFT / airdrop giả
  PIG_BUTCHERING: "PIG_BUTCHERING",                           // Sha Zhu Pan — đầu tư tình cảm + crypto
  FOREX_SCAM: "FOREX_SCAM",                                   // Forex / bot trading giả
  PONZI_SCHEME: "PONZI_SCHEME",                               // Mô hình Ponzi / đa cấp

  // ── Social Engineering ───────────────────────────────────────────────────────
  ROMANCE_SCAM: "ROMANCE_SCAM",                               // Lừa đảo tình cảm
  JOB_SCAM: "JOB_SCAM",                                       // Việc làm giả / việc nhẹ lương cao
  TASK_SCAM: "TASK_SCAM",                                     // Nhiệm vụ / chốt đơn / like-share
  CHARITY_SCAM: "CHARITY_SCAM",                               // Từ thiện giả
  LOTTERY_SCAM: "LOTTERY_SCAM",                               // Trúng thưởng giả
  GIVEAWAY_SCAM: "GIVEAWAY_SCAM",                             // Giveaway / quà tặng giả
  FAMILY_EMERGENCY_SCAM: "FAMILY_EMERGENCY_SCAM",             // Người thân gặp cấp cứu giả

  // ── Account & Device Takeover ────────────────────────────────────────────────
  ACCOUNT_TAKEOVER: "ACCOUNT_TAKEOVER",                       // Chiếm đoạt tài khoản
  REMOTE_ACCESS_SCAM: "REMOTE_ACCESS_SCAM",                   // Yêu cầu truy cập từ xa
  MALWARE_DELIVERY: "MALWARE_DELIVERY",                       // Phân phối mã độc / APK
  SIM_SWAP_SCAM: "SIM_SWAP_SCAM",                             // SIM swap / khóa SIM

  // ── E-commerce & Marketplace ─────────────────────────────────────────────────
  FAKE_PRODUCT_SCAM: "FAKE_PRODUCT_SCAM",                     // Sản phẩm giả / shop giả
  FAKE_ESCROW: "FAKE_ESCROW",                                  // Escrow giả (mua bán online)
  COD_FRAUD: "COD_FRAUD",                                      // Gian lận COD
  TICKET_SCAM: "TICKET_SCAM",                                  // Vé giả / vé sự kiện

  // ── High-Tech / AI Scams ─────────────────────────────────────────────────────
  DEEPFAKE_SCAM: "DEEPFAKE_SCAM",                             // Deepfake voice/video
  SYNTHETIC_IDENTITY: "SYNTHETIC_IDENTITY",                   // Danh tính tổng hợp AI
  AI_VOICE_CLONE: "AI_VOICE_CLONE",                           // Clone giọng nói AI

  // ── Extortion / Blackmail ────────────────────────────────────────────────────
  SEXTORTION: "SEXTORTION",                                   // Tống tiền bằng ảnh/video riêng tư
  BLACKMAIL: "BLACKMAIL",                                      // Tống tiền thông tin cá nhân

  // ── Business Email & Corporate ───────────────────────────────────────────────
  BEC: "BEC",                                                  // Business Email Compromise
  CEO_FRAUD: "CEO_FRAUD",                                      // Giả danh CEO yêu cầu chuyển tiền
  SUPPLIER_FRAUD: "SUPPLIER_FRAUD",                           // Giả nhà cung cấp đổi tài khoản

  // ── Document Fraud ───────────────────────────────────────────────────────────
  DOCUMENT_FRAUD: "DOCUMENT_FRAUD",                           // Tài liệu giả (CCCD, hợp đồng, phán quyết)
  IDENTITY_FRAUD: "IDENTITY_FRAUD",                           // Gian lận danh tính

  // ── Disaster / Crisis Exploitation ───────────────────────────────────────────
  DISASTER_EXPLOITATION: "DISASTER_EXPLOITATION",             // Lợi dụng thiên tai / dịch bệnh
};

// ═══════════════════════════════════════════════════════════════════════════════
// 2. PSYCHOLOGICAL MANIPULATION TACTICS (26 tactics)
// ═══════════════════════════════════════════════════════════════════════════════

export const PSYCH_TACTICS = {
  // Core Emotional Levers
  FEAR: "FEAR",                       // Đe dọa bị bắt, phạt, mất tài khoản
  GREED: "GREED",                     // Hứa hẹn lợi nhuận, quà tặng, phần thưởng
  URGENCY: "URGENCY",                 // Áp lực thời gian ("trong 10 phút")
  FOMO: "FOMO",                       // Fear of Missing Out — sợ bỏ lỡ cơ hội
  LOVE: "LOVE",                       // Khai thác tình cảm (romance scam)
  GUILT: "GUILT",                     // Tạo cảm giác có lỗi, trách nhiệm
  SHAME: "SHAME",                     // Sử dụng xấu hổ / hình ảnh riêng tư
  ANGER: "ANGER",                     // Kích thích tức giận (tài khoản bị xâm nhập)
  SYMPATHY: "SYMPATHY",               // Thao túng lòng trắc ẩn (từ thiện, cấp cứu)
  PANIC: "PANIC",                     // Gây hoảng loạn tức thời
  CURIOSITY: "CURIOSITY",             // Kích thích tò mò ("Bạn có tin nhắn bí ẩn")
  EXCITEMENT: "EXCITEMENT",           // Tạo hưng phấn (trúng thưởng, cơ hội lớn)
  HELPLESSNESS: "HELPLESSNESS",       // Làm nạn nhân cảm thấy không thể xử lý một mình

  // Social & Authority Dynamics
  AUTHORITY: "AUTHORITY",             // Mượn danh nghĩa cơ quan, chức vụ
  TRUST: "TRUST",                     // Xây dựng lòng tin giả tạo
  SOCIAL_PROOF: "SOCIAL_PROOF",       // "Hàng nghìn người đã tham gia"
  RECIPROCITY: "RECIPROCITY",         // Cho trước rồi lấy sau — quà, tiền miễn phí trước
  COMMITMENT: "COMMITMENT",           // Khai thác sự nhất quán — "bạn đã đồng ý..."
  FLATTERY: "FLATTERY",              // Tâng bốc — "anh/chị rất thông minh..."
  EXCLUSIVITY: "EXCLUSIVITY",         // "Chỉ dành riêng cho bạn"
  STATUS: "STATUS",                   // Khai thác địa vị xã hội / danh tiếng

  // Cognitive & Behavioral
  ISOLATION: "ISOLATION",             // Cô lập — "đừng nói với ai", "đừng gọi ngân hàng"
  CONFUSION: "CONFUSION",             // Gây rối loạn thông tin
  COGNITIVE_OVERLOAD: "COGNITIVE_OVERLOAD", // Quá tải nhận thức — hướng dẫn phức tạp
  SCARCITY: "SCARCITY",               // Tạo khan hiếm giả tạo
  LOSS_AVERSION: "LOSS_AVERSION",     // "Bạn sắp mất..." (mạnh hơn "bạn có thể nhận...")
};

// ═══════════════════════════════════════════════════════════════════════════════
// 3. ATTACK LIFECYCLE STAGES (14 stages)
// ═══════════════════════════════════════════════════════════════════════════════

export const ATTACK_STAGES = {
  CONTACT: "CONTACT",                         // Tiếp cận lần đầu (cold message, call, email)
  RAPPORT_BUILDING: "RAPPORT_BUILDING",       // Xây dựng mối quan hệ / lòng tin
  PRETEXT_ESTABLISHMENT: "PRETEXT_ESTABLISHMENT", // Dựng kịch bản / lý do giả
  AUTHORITY_ESTABLISHMENT: "AUTHORITY_ESTABLISHMENT", // Tuyên bố thẩm quyền / danh tính
  EMOTIONAL_TRIGGER: "EMOTIONAL_TRIGGER",     // Kích hoạt cảm xúc (fear, greed, love)
  URGENCY_ESCALATION: "URGENCY_ESCALATION",   // Tạo áp lực thời gian
  INFORMATION_COLLECTION: "INFORMATION_COLLECTION", // Thu thập thông tin cá nhân
  CREDENTIAL_COLLECTION: "CREDENTIAL_COLLECTION", // Thu thập OTP / mật khẩu / PIN
  PAYMENT_REQUEST: "PAYMENT_REQUEST",         // Yêu cầu thanh toán / chuyển tiền
  REMOTE_ACCESS: "REMOTE_ACCESS",             // Yêu cầu truy cập thiết bị
  MONEY_EXTRACTION: "MONEY_EXTRACTION",       // Rút tiền / chuyển tài sản
  WITHDRAWAL_BLOCK: "WITHDRAWAL_BLOCK",       // Chặn rút tiền (investment scam) + yêu cầu thêm
  ESCALATION: "ESCALATION",                   // Leo thang đòi hỏi / đe dọa nếu không tuân thủ
  RECOVERY_EXPLOITATION: "RECOVERY_EXPLOITATION", // Lợi dụng nạn nhân đã mất tiền (lừa lần 2)
};

// ═══════════════════════════════════════════════════════════════════════════════
// 4. TARGET ASSETS (what attacker wants to obtain)
// ═══════════════════════════════════════════════════════════════════════════════

export const TARGET_ASSETS = {
  MONEY: "MONEY",                             // Tiền mặt / chuyển khoản
  BANK_ACCOUNT: "BANK_ACCOUNT",               // Tài khoản ngân hàng
  CREDIT_CARD: "CREDIT_CARD",                 // Thẻ tín dụng
  OTP: "OTP",                                 // Mã OTP
  PASSWORD: "PASSWORD",                       // Mật khẩu
  RECOVERY_CODE: "RECOVERY_CODE",             // Mã khôi phục tài khoản
  IDENTITY_DOCUMENT: "IDENTITY_DOCUMENT",     // CCCD / hộ chiếu / giấy tờ
  PERSONAL_INFO: "PERSONAL_INFO",             // Thông tin cá nhân
  PHONE_NUMBER: "PHONE_NUMBER",               // Số điện thoại
  EMAIL_ACCOUNT: "EMAIL_ACCOUNT",             // Tài khoản email
  SOCIAL_ACCOUNT: "SOCIAL_ACCOUNT",           // Tài khoản mạng xã hội
  CRYPTO: "CRYPTO",                           // Tiền mã hóa
  GIFT_CARD: "GIFT_CARD",                     // Thẻ quà tặng
  REMOTE_DEVICE_ACCESS: "REMOTE_DEVICE_ACCESS", // Quyền kiểm soát thiết bị từ xa
  SIM: "SIM",                                 // Tài khoản SIM / eSIM
  BIOMETRIC_DATA: "BIOMETRIC_DATA",           // Dữ liệu sinh trắc học (khuôn mặt, vân tay)
};

// ═══════════════════════════════════════════════════════════════════════════════
// 5. REQUESTED ACTIONS (what attacker wants victim to do)
// ═══════════════════════════════════════════════════════════════════════════════

export const REQUESTED_ACTIONS = {
  CLICK_LINK: "CLICK_LINK",                   // Bấm vào đường dẫn
  OPEN_ATTACHMENT: "OPEN_ATTACHMENT",         // Mở tệp đính kèm
  SCAN_QR: "SCAN_QR",                         // Quét mã QR
  TRANSFER_MONEY: "TRANSFER_MONEY",           // Chuyển tiền
  PAY_FEE: "PAY_FEE",                         // Đóng phí (xác minh, hải quan, thuế...)
  SHARE_OTP: "SHARE_OTP",                     // Chia sẻ mã OTP
  SHARE_PASSWORD: "SHARE_PASSWORD",           // Chia sẻ mật khẩu
  INSTALL_APP: "INSTALL_APP",                 // Cài ứng dụng (qua link / APK)
  INSTALL_APK: "INSTALL_APK",                 // Cài APK bên ngoài store
  ENABLE_REMOTE_ACCESS: "ENABLE_REMOTE_ACCESS", // Bật truy cập từ xa
  SCREEN_SHARE: "SCREEN_SHARE",               // Chia sẻ màn hình
  CALL_PHONE_NUMBER: "CALL_PHONE_NUMBER",     // Gọi số điện thoại được cung cấp
  VISIT_WEBSITE: "VISIT_WEBSITE",             // Truy cập website
  ENTER_CREDENTIALS: "ENTER_CREDENTIALS",     // Nhập thông tin đăng nhập
  UPLOAD_DOCUMENT: "UPLOAD_DOCUMENT",         // Tải lên tài liệu cá nhân
  SEND_ID: "SEND_ID",                         // Gửi ảnh CCCD / giấy tờ
  SEND_SELFIE: "SEND_SELFIE",                 // Gửi ảnh chân dung / selfie
  SHARE_SCREENSHOT: "SHARE_SCREENSHOT",       // Chụp màn hình và gửi
  BUY_CRYPTO: "BUY_CRYPTO",                   // Mua tiền mã hóa
  BUY_GIFT_CARD: "BUY_GIFT_CARD",             // Mua thẻ quà tặng
  KEEP_SECRET: "KEEP_SECRET",                 // Giữ bí mật, không nói với ai
  DEPOSIT_INVESTMENT: "DEPOSIT_INVESTMENT",   // Nạp tiền đầu tư
};

// ═══════════════════════════════════════════════════════════════════════════════
// 6. BEHAVIORAL RED FLAGS
// ═══════════════════════════════════════════════════════════════════════════════

export const BEHAVIORAL_RED_FLAGS = {
  // Linguistic patterns
  UNUSUAL_URGENCY: "UNUSUAL_URGENCY",
  THREAT_LANGUAGE: "THREAT_LANGUAGE",
  AUTHORITY_LANGUAGE: "AUTHORITY_LANGUAGE",
  PAYMENT_VOCABULARY: "PAYMENT_VOCABULARY",
  CREDENTIAL_VOCABULARY: "CREDENTIAL_VOCABULARY",
  SECRECY_INSTRUCTION: "SECRECY_INSTRUCTION",
  REWARD_VOCABULARY: "REWARD_VOCABULARY",
  LEGAL_TERMINOLOGY: "LEGAL_TERMINOLOGY",
  UNUSUAL_GRAMMAR: "UNUSUAL_GRAMMAR",          // Poor grammar / machine translation artifacts

  // Social engineering patterns
  ISOLATION_INSTRUCTION: "ISOLATION_INSTRUCTION", // "Đừng nói với ai"
  EXTERNAL_VERIFICATION_BLOCK: "EXTERNAL_VERIFICATION_BLOCK", // "Đừng gọi ngân hàng"
  NO_HANGUP_INSTRUCTION: "NO_HANGUP_INSTRUCTION", // "Không được ngắt máy"
  FOLLOW_IMMEDIATELY_INSTRUCTION: "FOLLOW_IMMEDIATELY_INSTRUCTION",

  // Transactional red flags
  UNKNOWN_RECIPIENT: "UNKNOWN_RECIPIENT",
  NEW_BANK_ACCOUNT: "NEW_BANK_ACCOUNT",
  CRYPTO_PAYMENT_REQUESTED: "CRYPTO_PAYMENT_REQUESTED",
  GIFT_CARD_PAYMENT: "GIFT_CARD_PAYMENT",
  UNUSUAL_PAYMENT_METHOD: "UNUSUAL_PAYMENT_METHOD",
  SMALL_TEST_PAYMENT_BEFORE_LARGE: "SMALL_TEST_PAYMENT_BEFORE_LARGE",
  MULTIPLE_SEQUENTIAL_TRANSFERS: "MULTIPLE_SEQUENTIAL_TRANSFERS",

  // Identity red flags
  SENDER_DOMAIN_MISMATCH: "SENDER_DOMAIN_MISMATCH",
  LOGO_BUT_PERSONAL_EMAIL: "LOGO_BUT_PERSONAL_EMAIL",
  CLAIMED_OFFICIAL_BUT_INFORMAL_CHANNEL: "CLAIMED_OFFICIAL_BUT_INFORMAL_CHANNEL",
};

// ═══════════════════════════════════════════════════════════════════════════════
// 7. FINAL VERDICT LABELS (multi-label output)
// ═══════════════════════════════════════════════════════════════════════════════

export const SCAM_VERDICTS = {
  SAFE: "SAFE",                               // Nội dung hợp pháp, không có dấu hiệu
  SUSPICIOUS: "SUSPICIOUS",                   // Có dấu hiệu đáng ngờ, cần kiểm tra
  HIGH_RISK: "HIGH_RISK",                     // Nhiều dấu hiệu lừa đảo rõ ràng
  SCAM: "SCAM",                               // Bằng chứng mạnh về lừa đảo
  INSUFFICIENT_EVIDENCE: "INSUFFICIENT_EVIDENCE", // Không đủ bằng chứng để kết luận
  // Contextual labels (hard negatives)
  LEGITIMATE: "LEGITIMATE",                   // Nội dung hợp pháp có từ vựng nguy hiểm (cảnh báo)
  EDUCATIONAL: "EDUCATIONAL",                 // Nội dung giáo dục / nhận thức
  NEWS: "NEWS",                               // Bài báo / tin tức về lừa đảo
  SCAM_WARNING: "SCAM_WARNING",               // Cảnh báo scam chính thức
  AMBIGUOUS: "AMBIGUOUS",                     // Không đủ context để phán quyết
};

// ═══════════════════════════════════════════════════════════════════════════════
// 8. RISK INTERACTION TERMS (compound evidence — stronger than sum of parts)
// ═══════════════════════════════════════════════════════════════════════════════
// When multiple signals co-occur, risk should be amplified.

export const RISK_INTERACTION_TERMS = [
  {
    id: "AUTHORITY_URGENCY_COMBO",
    signals: ["AUTHORITY", "URGENCY"],
    multiplier: 1.4,
    description: "Authority claim + time pressure: classic compliance exploitation",
  },
  {
    id: "BANK_IMPERSONATION_OTP",
    signals: ["BANK_IMPERSONATION", "OTP_THEFT"],
    multiplier: 1.6,
    description: "Bank impersonation + OTP request: credential harvesting attack",
  },
  {
    id: "PAYMENT_SUSPICIOUS_URL",
    signals: ["PAYMENT_REQUEST", "SUSPICIOUS_URL"],
    multiplier: 1.5,
    description: "Payment request + suspicious URL: financial phishing",
  },
  {
    id: "REMOTE_ACCESS_FINANCIAL",
    signals: ["REMOTE_ACCESS", "PAYMENT_REQUEST"],
    multiplier: 1.7,
    description: "Remote access + financial context: device takeover scam",
  },
  {
    id: "ISOLATION_AUTHORITY_URGENCY",
    signals: ["ISOLATION", "AUTHORITY", "URGENCY"],
    multiplier: 1.8,
    description: "Isolation + authority + urgency: highest-risk compliance trap",
  },
  {
    id: "DOCUMENT_IDENTITY_MISMATCH",
    signals: ["DOCUMENT_FRAUD", "IDENTITY_FRAUD"],
    multiplier: 1.4,
    description: "Fake document + identity inconsistency: synthetic identity attack",
  },
  {
    id: "RECOVERY_FEE_AFTER_SCAM",
    signals: ["RECOVERY_SCAM", "PAYMENT_REQUEST"],
    multiplier: 1.6,
    description: "Recovery service + fee request: victim targeted twice",
  },
  {
    id: "BRAND_MISMATCH_PAYMENT",
    signals: ["BRAND_IMPERSONATION", "PAYMENT_REQUEST"],
    multiplier: 1.5,
    description: "Impersonated brand + payment: classic wire fraud",
  },
  {
    id: "LOVE_FINANCIAL_REQUEST",
    signals: ["ROMANCE_SCAM", "PAYMENT_REQUEST"],
    multiplier: 1.5,
    description: "Emotional bonding + money request: romance scam extraction",
  },
  {
    id: "FEAR_OTP_REQUEST",
    signals: ["FEAR", "OTP_THEFT"],
    multiplier: 1.5,
    description: "Fear trigger + OTP request: panic-driven credential theft",
  },
  {
    id: "TASK_DEPOSIT_TRAP",
    signals: ["TASK_SCAM", "ADVANCE_FEE_SCAM"],
    multiplier: 1.4,
    description: "Task/job + deposit requirement: classic task scam pattern",
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// 9. LEGITIMATE / HARD NEGATIVE MARKERS
// Hard negatives — content that LOOKS like scam but IS legitimate
// ═══════════════════════════════════════════════════════════════════════════════

export const HARD_NEGATIVE_CONTEXTS = {
  SCAM_AWARENESS_CONTENT: "SCAM_AWARENESS_CONTENT",   // Cảnh báo chính thức về scam
  EDUCATIONAL_DISCUSSION: "EDUCATIONAL_DISCUSSION",   // Thảo luận giáo dục về phishing
  NEWS_REPORTING: "NEWS_REPORTING",                   // Báo cáo tin tức về lừa đảo
  OFFICIAL_BANK_WARNING: "OFFICIAL_BANK_WARNING",     // Ngân hàng cảnh báo chính thức
  RESEARCH_CONTEXT: "RESEARCH_CONTEXT",               // Ngữ cảnh nghiên cứu / học thuật
  SATIRE: "SATIRE",                                   // Nội dung châm biếm / hài hước
  HELP_SEEKING: "HELP_SEEKING",                       // Người dùng hỏi về cách nhận biết scam
};

// ═══════════════════════════════════════════════════════════════════════════════
// 10. CHANNEL TAXONOMY
// ═══════════════════════════════════════════════════════════════════════════════

export const CHANNELS = {
  SMS: "SMS",
  PHONE_CALL: "PHONE_CALL",
  EMAIL: "EMAIL",
  ZALO: "ZALO",
  FACEBOOK_MESSENGER: "FACEBOOK_MESSENGER",
  TELEGRAM: "TELEGRAM",
  WHATSAPP: "WHATSAPP",
  INSTAGRAM_DM: "INSTAGRAM_DM",
  DISCORD: "DISCORD",
  WEB_FORM: "WEB_FORM",
  QR_CODE: "QR_CODE",
  LETTER: "LETTER",
  UNKNOWN: "UNKNOWN",
};

// ═══════════════════════════════════════════════════════════════════════════════
// 11. STANDARD MULTI-LABEL OUTPUT SCHEMA (factory function)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Creates a standardized multi-label scam analysis output.
 * This is the Output Contract for the Evidence Fusion Engine.
 */
export function createScamAnalysisOutput({
  verdict = SCAM_VERDICTS.AMBIGUOUS,
  confidence = 0.5,
  severity = "MEDIUM",

  scamTypes = [],
  psychTactics = [],
  attackStage = null,
  requestedActions = [],
  targetAssets = [],
  behavioralRedFlags = [],

  evidence = [],        // [{type, confidence, source, detail}]
  contradictions = [],  // [{type, field_a, field_b, detail}]
  entities = [],        // [{name, type, officialDomains, confidence}]

  ocrAnalysis = null,   // {text, confidence, documentType, ocrUncertainty}
  documentAnalysis = null, // {anomalies, forensicFlags}
  urlAnalysis = null,   // {domain, flags, brandMismatch}
  qrAnalysis = null,    // {payload, payloadType, recipientMismatch}
  conversationAnalysis = null, // {stage, escalationPattern, messageCount}

  uncertainty = {
    ocr: 0,
    identity: 0,
    url: 0,
    document: 0,
  },

  verificationGuidance = [], // string[] — safe independent verification steps

  // Hard negative context override
  hardNegativeContext = null,
}) {
  return {
    verdict,
    confidence: Number(Math.max(0, Math.min(1, confidence)).toFixed(2)),
    severity,

    scamTypes: [...new Set(scamTypes)],
    psychTactics: [...new Set(psychTactics)],
    attackStage,
    requestedActions: [...new Set(requestedActions)],
    targetAssets: [...new Set(targetAssets)],
    behavioralRedFlags: [...new Set(behavioralRedFlags)],

    evidence,
    contradictions,
    entities,

    ocrAnalysis,
    documentAnalysis,
    urlAnalysis,
    qrAnalysis,
    conversationAnalysis,

    uncertainty,
    verificationGuidance,
    hardNegativeContext,

    meta: {
      schemaVersion: "2.0.0",
      taxonomy: "studenthub-ai-scam-taxonomy-v2",
      generatedAt: new Date().toISOString(),
    },
  };
}
