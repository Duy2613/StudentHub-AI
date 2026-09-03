/**
 * StudentHub AI — Cross-Modal Contradiction Engine (AI-15 & AI-17)
 * 
 * Reconciles multi-modal signals across Text Claims, OCR, Brand Logos, URL Domains, and QR Payloads.
 * Pinpoints cross-modal contradictions with surgical precision (Zero Fake Data).
 */

/**
 * Checks for contradictions across multimodal inputs
 */
export function evaluateCrossModalContradictions({
  textClaim = "",
  claimedBrand = "",
  urlDomain = "",
  qrPayload = {},
  ocrText = "",
}) {
  const contradictions = [];

  const textLower = (textClaim + " " + ocrText).toLowerCase();
  const domainLower = urlDomain.toLowerCase();

  // 1. Check Brand vs Domain Mismatch (Phishing Attack)
  if (claimedBrand && urlDomain) {
    const brandLower = claimedBrand.toLowerCase();
    const isOfficialDomain = (
      (brandLower.includes("hcmute") && domainLower.endsWith("hcmute.edu.vn")) ||
      (brandLower.includes("vietcombank") && domainLower.endsWith("vietcombank.com.vn")) ||
      (brandLower.includes("mbbank") && domainLower.endsWith("mbbank.com.vn")) ||
      (brandLower.includes("shopee") && domainLower.endsWith("shopee.vn"))
    );

    if (!isOfficialDomain) {
      contradictions.push({
        id: "CONTRADICTION_BRAND_DOMAIN",
        type: "CROSS_MODAL_MISMATCH",
        severity: "CRITICAL",
        title: "MÂU THUẪN: Thương Hiệu Tự Xưng Khác Tên Miền Thực Tế",
        description: `Thông điệp tự xưng là '${claimedBrand}' nhưng liên kết trỏ tới tên miền lạ '${urlDomain}' không thuộc quyền sở hữu của đơn vị này.`,
        signals: { claimedBrand, actualDomain: urlDomain },
      });
    }
  }

  // 2. Check QR Code Recipient vs Claimed Purpose (QR Fraud)
  if (qrPayload && qrPayload.accountHolder) {
    const recipient = qrPayload.accountHolder.toUpperCase();
    const isUniversityOfficial = recipient.includes("TRUONG") || recipient.includes("DAI HOC") || recipient.includes("HCMUTE");

    if (textLower.includes("học phí") || textLower.includes("hồ sơ nhập học")) {
      if (!isUniversityOfficial) {
        contradictions.push({
          id: "CONTRADICTION_QR_INDIVIDUAL",
          type: "QR_PAYLOAD_MISMATCH",
          severity: "CRITICAL",
          title: "MÂU THUẪN: Nộp Học Phí Nhưng Mã QR Vào Tài Khoản Cá Nhân",
          description: `Thông báo yêu cầu nộp học phí trường nhưng mã QR thụ hưởng lại là tài khoản cá nhân '${recipient}'. Nhà trường không bao giờ thu học phí qua STK cá nhân.`,
          signals: { claimedPurpose: "Nộp Học Phí", qrRecipient: recipient },
        });
      }
    }
  }

  // 3. Check Police / Court Video Call vs Chat Request (Police Impersonation)
  if ((textLower.includes("công an") || textLower.includes("viện kiểm sát")) && (textLower.includes("telegram") || textLower.includes("zalo") || textLower.includes("gọi video"))) {
    contradictions.push({
      id: "CONTRADICTION_POLICE_TELECOM",
      type: "PROCEDURAL_CONTRADICTION",
      severity: "CRITICAL",
      title: "MÂU THUẪN: Quy Trình Làm Việc Của Cơ Quan Công An",
      description: "Cơ quan Công an và Viện kiểm sát chỉ làm việc trực tiếp tại trụ sở có giấy triệu tập bằng văn bản; TUYỆT ĐỐI không làm việc, lấy lời khai hay yêu cầu chuyển tiền qua Zalo/Telegram/Video call.",
      signals: { channel: "Online Chat/Video", authorityClaim: "Công An / VKSND" },
    });
  }

  const hasContradiction = contradictions.length > 0;
  const overallRiskScore = hasContradiction ? 95 : 10;

  return {
    hasContradiction,
    contradictionsCount: contradictions.length,
    overallRiskScore,
    verdict: hasContradiction ? "PHÁT HIỆN MÂU THUẪN NGUY HIỂM" : "KHÔNG PHÁT HIỆN MÂU THUẪN CHÉO",
    contradictions,
  };
}
