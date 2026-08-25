/**
 * StudentHub AI — APWG (Anti-Phishing Working Group) Threat Taxonomy & Trend Metrics
 * 
 * Integrates quarterly research from APWG Phishing Activity Trends Reports:
 * - Targeted Industry Sectors & Prevalence
 * - Specialized Vectors: Quishing (QR Phishing), BEC, Mobile Phishing, Social Engineering
 * - Obfuscation & Combosquatting Indicators
 */

export const APWG_SECTOR_TAXONOMY = {
  FINANCIAL_INSTITUTIONS: {
    sector: "FINANCIAL_INSTITUTIONS",
    sharePercentage: 27.8,
    primaryVectors: ["LOGIN_HARVESTING", "OTP_INTERCEPTION", "FAKE_SECURITY_UPDATE"],
    highRiskKeywords: ["vietcombank", "bidv", "mbbank", "techcombank", "vpbank", "tpbank", "acb", "sacombank", "otp", "smart otp", "khóa tài khoản"],
  },
  SOCIAL_MEDIA: {
    sector: "SOCIAL_MEDIA",
    sharePercentage: 22.4,
    primaryVectors: ["ACCOUNT_TAKEOVER", "IMPERSONATION_MESSAGING", "FAKE_BLUE_BADGE", "GIVEAWAY_SCAM"],
    highRiskKeywords: ["facebook", "zalo", "telegram", "tiktok", "instagram", "bình chọn", "lấy lại nick", "hack nick"],
  },
  SAAS_WEBMAIL: {
    sector: "SAAS_WEBMAIL",
    sharePercentage: 17.5,
    primaryVectors: ["CREDENTIAL_HARVESTING", "SESSION_COOKIE_THEFT", "STORAGE_QUOTA_NOTICE"],
    highRiskKeywords: ["microsoft", "office365", "google drive", "quota exceeded", "hết dung lượng", "xác minh email trường"],
  },
  ECOMMERCE_LOGISTICS: {
    sector: "ECOMMERCE_LOGISTICS",
    sharePercentage: 12.1,
    primaryVectors: ["FAKE_TRACKING_PAGE", "DELIVERY_FEE_SCAM", "CUSTOMS_DUTY_FEE", "ORDER_CONFIRMATION"],
    highRiskKeywords: ["shopee", "lazada", "tiki", "giao hàng tiết kiệm", "viettel post", "bưu phẩm bị giữ", "phí hải quan"],
  },
  CRYPTO_INVESTMENT: {
    sector: "CRYPTO_INVESTMENT",
    sharePercentage: 8.9,
    primaryVectors: ["PIG_BUTCHERING", "FAKE_TRADING_BOT", "AIRDROP_SCAM", "SEED_PHRASE_THEFT"],
    highRiskKeywords: ["binance", "metamask", "usdt", "lợi nhuận 20%", "đầu tư hoa hồng", "nạp tiền nhận thưởng"],
  },
};

export const APWG_ATTACK_VECTORS = {
  QUISHING: {
    code: "VECTOR_QUISHING",
    name: "QR Code Phishing (Quishing)",
    description: "Mã QR nhúng trong ảnh hoặc tài liệu nhằm vượt qua bộ lọc email/tin nhắn văn bản truyền thống.",
    indicators: ["QR dẫn tới trang đăng nhập", "QR nộp học phí không khớp tên trường", "QR yêu cầu quét xác thực bảo mật"],
  },
  BEC_IMPERSONATION: {
    code: "VECTOR_BEC_IMPERSONATION",
    name: "Business / Faculty Email Compromise",
    description: "Mạo danh lãnh đạo khoa, phòng đào tạo hoặc đối tác yêu cầu chuyển tiền hoặc thông tin gấp.",
    indicators: ["Yêu cầu giữ bí mật tuyệt đối", "Đổi số tài khoản thụ hưởng đột xuất", "Giả mạo bí danh người quen"],
  },
  COMBOSQUATTING: {
    code: "VECTOR_COMBOSQUATTING",
    name: "Deceptive Brand Combosquatting",
    description: "Ghép tên thương hiệu uy tín với các từ khóa tạo lòng tin giả (ví dụ: hcmute-online.top, vietcombank-otp.vip).",
    indicators: ["Tên miền chứa từ khóa thương hiệu kèm -online, -xacnhan, -portal, -edu"],
  },
};

/**
 * Matches input text and indicators against APWG Threat Vectors
 */
export function evaluateApwgThreatVectors({ text = "", qrUrl = null, domain = "" }) {
  const detectedVectors = [];
  const lowerText = text.toLowerCase();
  const lowerDomain = domain.toLowerCase();

  // 1. Check Quishing
  if (qrUrl) {
    detectedVectors.push({
      vector: APWG_ATTACK_VECTORS.QUISHING.code,
      name: APWG_ATTACK_VECTORS.QUISHING.name,
      confidence: 0.88,
      evidence: `Phát hiện tải trọng mã QR: ${qrUrl}`,
    });
  }

  // 2. Check Combosquatting
  const combosquatSuffixes = ["-online", "-xacnhan", "-otp", "-portal", "-edu", "-kiemtien", "-ctv", "-support"];
  if (combosquatSuffixes.some((s) => lowerDomain.includes(s))) {
    detectedVectors.push({
      vector: APWG_ATTACK_VECTORS.COMBOSQUATTING.code,
      name: APWG_ATTACK_VECTORS.COMBOSQUATTING.name,
      confidence: 0.92,
      evidence: `Tên miền '${domain}' sử dụng kỹ thuật Combosquatting lừa đảo thị giác.`,
    });
  }

  // 3. Match Targeted Sector
  let matchedSector = null;
  for (const [key, sector] of Object.entries(APWG_SECTOR_TAXONOMY)) {
    const hits = sector.highRiskKeywords.filter((kw) => lowerText.includes(kw));
    if (hits.length >= 2 || (hits.length === 1 && hits[0] === "otp")) {
      matchedSector = {
        sector: sector.sector,
        sharePercentage: sector.sharePercentage,
        matchedKeywords: hits,
      };
      break;
    }
  }

  return {
    source: "APWG_TREND_REPORTS",
    matchedSector,
    detectedVectors,
    hasHighRiskVector: detectedVectors.length > 0,
  };
}
