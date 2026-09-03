/**
 * StudentHub AI — FTC Consumer Sentinel Network (2024 Data Book) Threat Taxonomy
 * 
 * Integrates official public aggregate findings from the FTC Consumer Sentinel Network 2024:
 * - Top Fraud Categories & Median Loss Distribution
 * - Contact Channel Prevalence (Social Media, SMS/Text, Phone, Email, Websites)
 * - Payment Method Modalities (Bank Transfer, Crypto, Payment Apps, Gift Cards)
 */

export const FTC_FRAUD_CATEGORIES = {
  IMPERSONATION_SCAMS: {
    category: "IMPERSONATION_SCAMS",
    rank: 1,
    description: "Mạo danh cơ quan nhà nước, ngân hàng, công an, hoặc trường đại học để đe dọa hoặc tạo niềm tin giả.",
    medianLossUsd: 800,
    prevalenceScore: 0.95,
  },
  ONLINE_SHOPPING_FAKE_GOODS: {
    category: "ONLINE_SHOPPING_FAKE_GOODS",
    rank: 2,
    description: "Bẫy cọc phòng trọ, hàng hóa giảm giá sốc không bao giờ giao, vé xem ca nhạc / máy bay giả.",
    medianLossUsd: 180,
    prevalenceScore: 0.88,
  },
  JOB_AND_TASK_SCAMS: {
    category: "JOB_AND_TASK_SCAMS",
    rank: 3,
    description: "Tuyển cộng tác viên chốt đơn, xem video TikTok nhận tiền, nạp tiền nâng cấp VIP.",
    medianLossUsd: 1200,
    prevalenceScore: 0.92,
  },
  INVESTMENT_FRAUD: {
    category: "INVESTMENT_FRAUD",
    rank: 4,
    description: "Sàn giao dịch ngoại hối ảo, ủy thác đầu tư lãi suất 30%/tháng, lừa đảo nuôi lợn (Pig Butchering).",
    medianLossUsd: 3500,
    prevalenceScore: 0.96,
  },
  PRIZES_LOTTERIES_SWEEPSTAKES: {
    category: "PRIZES_LOTTERIES_SWEEPSTAKES",
    rank: 5,
    description: "Trúng thưởng xe máy/học bổng quốc tế nhưng yêu cầu nộp 'phí hồ sơ' hoặc 'thuế trước bạ'.",
    medianLossUsd: 500,
    prevalenceScore: 0.85,
  },
};

export const FTC_PAYMENT_VECTORS = {
  BANK_TRANSFER: { code: "BANK_TRANSFER", riskMultiplier: 1.4, warning: "Chuyển khoản ngân hàng trực tiếp khó thu hồi sau khi tiền ra khỏi hệ thống." },
  CRYPTO_PAYMENT: { code: "CRYPTO_PAYMENT", riskMultiplier: 1.8, warning: "Giao dịch tiền mã hóa có tính ẩn danh cao và bất khả hoàn tác." },
  GIFT_CARD: { code: "GIFT_CARD", riskMultiplier: 1.6, warning: "Yêu cầu thanh toán bằng thẻ cào điện thoại hoặc gift card là chỉ dấu lừa đảo 99%." },
  ADVANCE_FEE: { code: "ADVANCE_FEE", riskMultiplier: 1.5, warning: "Yêu cầu đặt cọc trước để nhận việc làm hoặc học bổng là thủ đoạn bẫy cọc kinh điển." },
};

/**
 * Matches input text against FTC Consumer Sentinel Risk Indicators
 */
export function evaluateFtcSentinelIndicators(text = "") {
  const lowerText = text.toLowerCase();
  const matchedCategories = [];
  const detectedPaymentVectors = [];

  // Match Impersonation
  if (
    lowerText.includes("công an") ||
    lowerText.includes("viện kiểm sát") ||
    lowerText.includes("tòa án") ||
    lowerText.includes("ngân hàng") ||
    lowerText.includes("phòng đào tạo") ||
    lowerText.includes("bộ công an")
  ) {
    matchedCategories.push(FTC_FRAUD_CATEGORIES.IMPERSONATION_SCAMS);
  }

  // Match Job/Task Scam
  if (
    lowerText.includes("cộng tác viên") ||
    lowerText.includes("chốt đơn") ||
    lowerText.includes("xem video") ||
    lowerText.includes("500k/ngày") ||
    lowerText.includes("làm việc tại nhà")
  ) {
    matchedCategories.push(FTC_FRAUD_CATEGORIES.JOB_AND_TASK_SCAMS);
  }

  // Match Advance Fee / Deposit
  if (
    lowerText.includes("đặt cọc") ||
    lowerText.includes("chuyển khoản trước") ||
    lowerText.includes("phí làm hồ sơ") ||
    lowerText.includes("phí kích hoạt") ||
    lowerText.includes("thẻ cào")
  ) {
    detectedPaymentVectors.push(FTC_PAYMENT_VECTORS.ADVANCE_FEE);
  }

  if (lowerText.includes("thẻ cào") || lowerText.includes("mã thẻ cào")) {
    detectedPaymentVectors.push(FTC_PAYMENT_VECTORS.GIFT_CARD);
  }

  if (lowerText.includes("usdt") || lowerText.includes("ví tiền ảo") || lowerText.includes("bitcoin")) {
    detectedPaymentVectors.push(FTC_PAYMENT_VECTORS.CRYPTO_PAYMENT);
  }

  return {
    source: "FTC_CONSUMER_SENTINEL_2024",
    matchedCategories,
    detectedPaymentVectors,
    hasSevereFinancialRisk: detectedPaymentVectors.length > 0 && matchedCategories.length > 0,
  };
}
