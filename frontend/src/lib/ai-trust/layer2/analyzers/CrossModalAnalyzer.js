/**
 * Layer 2 — CrossModalAnalyzer (v2.0)
 *
 * Performs joint multimodal cross-referencing across ALL input modalities.
 *
 * NEW DETECTIONS (v2.0):
 *   4. Text amount ↔ OCR amount contradiction (500k vs 5M in same message)
 *   5. Message brand (text) ↔ Sender domain mismatch (Vietcombank in text, from gmail.com)
 *   6. QR recipient ↔ Claimed organization mismatch (QR pays Person A, text says "Bank B")
 *   7. OCR brand logo ↔ URL brand mismatch (image shows Bank A logo, URL is bank-b-secure.xyz)
 *
 * Original detections (preserved):
 *   1. Text/OCR Entity Claim vs Actual URL Domain Mismatch
 *   2. OCR Phishing content in image (OTP/password trap in screenshot)
 *   3. QR Code Destination vs Text Promise Mismatch
 */

import { CROSS_MODAL_TYPES } from "../types.js";
import { TrustedEntityRegistry } from "../registry/TrustedEntityRegistry.js";

// ─── Additional Cross-Modal Finding Types (v2 extensions) ────────────────────
export const CROSS_MODAL_TYPES_V2 = {
  // Inherited from v1
  ...CROSS_MODAL_TYPES,

  // New in v2
  AMOUNT_CONTRADICTION: "amount_contradiction",         // Text amount ≠ OCR amount
  SENDER_BRAND_MISMATCH: "sender_brand_mismatch",       // Brand in text ≠ sender email domain
  QR_RECIPIENT_MISMATCH: "qr_recipient_mismatch",       // QR payee ≠ claimed org in text
  VISUAL_BRAND_URL_MISMATCH: "visual_brand_url_mismatch", // Image logo ≠ URL brand
  OCR_AUTHORITY_NOT_OFFICIAL: "ocr_authority_not_official", // OCR claims official org but on unofficial medium
};

// ─── Vietnamese Amount Parsing ─────────────────────────────────────────────────

const VI_MAGNITUDES = [
  { pattern: /(\d[\d,.]*)\s*tỷ/i, mult: 1_000_000_000 },
  { pattern: /(\d[\d,.]*)\s*triệu/i, mult: 1_000_000 },
  { pattern: /(\d[\d,.]*)\s*nghìn/i, mult: 1_000 },
  { pattern: /(\d[\d,.]*)\s*k\b/i, mult: 1_000 },
  { pattern: /(\d[\d,.]*)\s*(đ|đồng|vnd)\b/i, mult: 1 },
];

function extractAmounts(text) {
  if (!text) return [];
  const found = [];

  // Vietnamese magnitude parsing
  for (const { pattern, mult } of VI_MAGNITUDES) {
    const regex = new RegExp(pattern.source, "gi");
    let m;
    while ((m = regex.exec(text)) !== null) {
      const raw = m[1].replace(/,/g, "").replace(/\./g, "");
      const val = parseFloat(raw);
      if (!isNaN(val) && val > 0) {
        found.push({ value: val * mult, raw: m[0], position: m.index });
      }
    }
  }

  // Plain numeric (at least 5 digits = 10,000+ VND)
  const plainPattern = /\b(\d{5,}(?:[.,]\d{3})*)\b/g;
  let m;
  while ((m = plainPattern.exec(text)) !== null) {
    const raw = m[1].replace(/,/g, "").replace(/\./g, "");
    const val = parseFloat(raw);
    if (!isNaN(val) && val >= 10_000) {
      // Avoid duplicate of already found magnitudes
      const alreadyFound = found.some((f) => Math.abs(f.value - val) / Math.max(f.value, val) < 0.01);
      if (!alreadyFound) {
        found.push({ value: val, raw: m[0], position: m.index });
      }
    }
  }

  return found;
}

// ─── Email / Sender Domain Extraction ────────────────────────────────────────

function extractEmailDomain(text) {
  const emailPattern = /\b[\w.+-]+@([\w.-]+\.[a-z]{2,})\b/i;
  const m = emailPattern.exec(text);
  return m ? m[1].toLowerCase() : null;
}

// ─── Bank brand → VietQR format recipient extraction ─────────────────────────

function extractQRRecipient(qrPayload) {
  if (!qrPayload) return null;
  // VietQR format often contains bank code + account number
  // Pattern: bank code (3-10 chars) + account (8-16 digits)
  const vietqrPattern = /^(vietcombank|techcombank|mbbank|vpbank|bidv|agribank|tpbank|acb|hdbank|\w{3,8})[_\-\s]?(\d{8,16})/i;
  const m = vietqrPattern.exec(qrPayload);
  if (m) {
    return { bankCode: m[1].toUpperCase(), accountNumber: m[2] };
  }
  return null;
}

export class CrossModalAnalyzer {
  /**
   * Cross-references all available modalities together
   * @param {object} params
   * @param {string} params.text - Main input text
   * @param {string} params.url - URL if provided or extracted
   * @param {string} params.ocrText - OCR extracted text from image
   * @param {string} params.qrPayload - QR decoded payload
   * @param {Array<object>} params.entities - Entities detected in text/OCR
   * @param {object} params.layer1Result - Prior Layer 1 result package
   * @param {string} [params.senderEmail] - Email sender address (if from email context)
   * @param {string} [params.senderDomain] - Domain of sender (if extractable)
   * @param {object} [params.documentClassification] - From DocumentClassifier
   * @returns {Array<object>} Array of cross-modal findings
   */
  static analyze({
    text = "",
    url = "",
    ocrText = "",
    qrPayload = "",
    entities = [],
    layer1Result = {},
    senderEmail = "",
    senderDomain = "",
    documentClassification = null,
  }) {
    const findings = [];
    const combinedText = `${text} ${ocrText}`.trim();

    const targetUrl = url || qrPayload ||
      (layer1Result.signals?.find((s) => s.type?.includes("url"))?.evidence?.matchedText) || "";

    // ── 1. Text / OCR Entity Claim vs Actual URL Domain Mismatch ─────────────
    // Original v1 check: preserved exactly
    if (targetUrl && entities.length > 0) {
      for (const ent of entities) {
        if (ent.officialDomains && ent.officialDomains.length > 0) {
          const isUrlOfficial = ent.officialDomains.some((official) => targetUrl.includes(official));

          if (!isUrlOfficial) {
            const isInstitutionalOrBank = ent.type === "university" || ent.type === "bank" || ent.type === "government";
            if (isInstitutionalOrBank) {
              findings.push({
                type: CROSS_MODAL_TYPES.URL_DESTINATION_MISMATCH,
                severity: "critical",
                confidence: 0.96,
                evidence: {
                  claimedEntity: ent.name,
                  expectedOfficialDomains: ent.officialDomains,
                  actualDestination: targetUrl,
                },
                details: `Bất nhất liên phương thức: Văn bản tự xưng '${ent.name}', nhưng đường dẫn đích thực tế (${targetUrl}) không thuộc danh sách tên miền chính thức (${ent.officialDomains.join(", ")}).`,
              });
            }
          }
        }
      }
    }

    // ── 2. OCR Phishing Content in Image ─────────────────────────────────────
    // Original v1 check: preserved exactly
    if (ocrText && (ocrText.includes("OTP") || ocrText.includes("mật khẩu") || ocrText.includes("Smart OTP"))) {
      if (layer1Result.status === "BLOCK" || layer1Result.signals?.some((s) => s.type?.includes("phishing"))) {
        findings.push({
          type: CROSS_MODAL_TYPES.OCR_TEXT_CONTRADICTION,
          severity: "high",
          confidence: 0.94,
          evidence: {
            ocrSnippet: ocrText.slice(0, 150),
          },
          details: "Hình ảnh chứa văn bản bẫy xác thực OTP/mật khẩu được ngụy trang dưới dạng ảnh chụp thông báo.",
        });
      }
    }

    // ── 3. QR Code Destination vs Text Promise Mismatch ──────────────────────
    // Original v1 check: preserved exactly
    if (qrPayload && text) {
      const qrEntity = TrustedEntityRegistry.findEntity(qrPayload);
      const textEntities = TrustedEntityRegistry.extractAllEntities(text);

      if (textEntities.length > 0 && qrEntity && textEntities[0].id !== qrEntity.id) {
        findings.push({
          type: CROSS_MODAL_TYPES.QR_DESTINATION_MISMATCH,
          severity: "high",
          confidence: 0.90,
          evidence: {
            textEntity: textEntities[0].name,
            qrEntity: qrEntity.name,
            qrPayload,
          },
          details: `Mã QR dẫn tới đơn vị khác biệt (${qrEntity.name}) so với nội dung văn bản quảng bá (${textEntities[0].name}).`,
        });
      }
    }

    // ── 4. NEW: Text Amount ↔ OCR Amount Contradiction ────────────────────────
    // Example: Text says "chuyển 500,000đ" but image receipt shows "5,000,000đ"
    if (text && ocrText) {
      const textAmounts = extractAmounts(text);
      const ocrAmounts = extractAmounts(ocrText);

      if (textAmounts.length > 0 && ocrAmounts.length > 0) {
        for (const textAmt of textAmounts) {
          for (const ocrAmt of ocrAmounts) {
            if (textAmt.value > 0 && ocrAmt.value > 0) {
              const ratio = Math.max(textAmt.value, ocrAmt.value) / Math.min(textAmt.value, ocrAmt.value);
              // Ratio > 5x → significant discrepancy (e.g. 500k vs 5M or 50k vs 5M)
              if (ratio >= 5) {
                const confidence = ratio >= 100 ? 0.90 : ratio >= 10 ? 0.82 : 0.72;
                findings.push({
                  type: CROSS_MODAL_TYPES_V2.AMOUNT_CONTRADICTION,
                  severity: ratio >= 100 ? "critical" : "high",
                  confidence,
                  evidence: {
                    textAmount: { value: textAmt.value, raw: textAmt.raw },
                    ocrAmount: { value: ocrAmt.value, raw: ocrAmt.raw },
                    ratio: Number(ratio.toFixed(1)),
                  },
                  details: `Bất nhất số tiền: Văn bản đề cập "${textAmt.raw}" nhưng hình ảnh/biên lai cho thấy "${ocrAmt.raw}" (chênh lệch ${ratio.toFixed(0)}×).`,
                });
              }
            }
          }
        }
      }
    }

    // ── 5. NEW: Message Brand (Text) ↔ Sender Domain Mismatch ────────────────
    // Example: Email body claims "Vietcombank" but sender is "support@gmail.com"
    const effectiveSenderDomain = senderDomain ||
      (senderEmail ? extractEmailDomain(senderEmail) : null);

    if (effectiveSenderDomain && entities.length > 0) {
      const personalEmailDomains = ["gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "ymail.com"];
      const isPersonalEmail = personalEmailDomains.some((d) => effectiveSenderDomain.endsWith(d));

      for (const ent of entities) {
        if (ent.type === "bank" || ent.type === "government" || ent.type === "university") {
          if (isPersonalEmail) {
            // Official org claimed, but sent from personal email
            findings.push({
              type: CROSS_MODAL_TYPES_V2.SENDER_BRAND_MISMATCH,
              severity: "critical",
              confidence: 0.95,
              evidence: {
                claimedOrganization: ent.name,
                senderDomain: effectiveSenderDomain,
                isPersonalEmailDomain: true,
              },
              details: `Tổ chức chính thức '${ent.name}' được đề cập trong nội dung, nhưng người gửi dùng địa chỉ email cá nhân (${effectiveSenderDomain}) thay vì tên miền chính thức.`,
            });
          } else if (ent.officialDomains?.length > 0) {
            // Check if sender domain matches official domain
            const matchesOfficial = ent.officialDomains.some((od) =>
              effectiveSenderDomain.endsWith(od) || od.endsWith(effectiveSenderDomain)
            );
            if (!matchesOfficial) {
              findings.push({
                type: CROSS_MODAL_TYPES_V2.SENDER_BRAND_MISMATCH,
                severity: "high",
                confidence: 0.87,
                evidence: {
                  claimedOrganization: ent.name,
                  senderDomain: effectiveSenderDomain,
                  officialDomains: ent.officialDomains,
                },
                details: `Người gửi từ "${effectiveSenderDomain}" không khớp với tên miền chính thức của '${ent.name}'.`,
              });
            }
          }
        }
      }
    }

    // ── 6. NEW: QR Recipient ↔ Claimed Organization Mismatch ─────────────────
    // Example: QR payload routes payment to "Nguyen Van A" but text says "Vietcombank"
    if (qrPayload && entities.length > 0) {
      const qrRecipient = extractQRRecipient(qrPayload);
      if (qrRecipient) {
        for (const ent of entities) {
          if (ent.type === "bank" && ent.officialDomains?.length > 0) {
            const bankCode = qrRecipient.bankCode.toLowerCase();
            const entityName = ent.normalizedName?.toLowerCase() || ent.name.toLowerCase();

            // If QR bank code doesn't match claimed entity
            if (!entityName.includes(bankCode) && !bankCode.includes(entityName.slice(0, 5))) {
              findings.push({
                type: CROSS_MODAL_TYPES_V2.QR_RECIPIENT_MISMATCH,
                severity: "high",
                confidence: 0.85,
                evidence: {
                  claimedBank: ent.name,
                  qrBankCode: qrRecipient.bankCode,
                  qrAccountNumber: qrRecipient.accountNumber,
                },
                details: `Mã QR thanh toán đến ngân hàng "${qrRecipient.bankCode}" trong khi văn bản đề cập "${ent.name}".`,
              });
            }
          }
        }
      }
    }

    // ── 7. NEW: OCR Brand ↔ URL Brand Mismatch ────────────────────────────────
    // Example: Image shows "VCB" / "Vietcombank" logo, but URL is "vietcom-bank-security.xyz"
    if (ocrText && targetUrl && entities.length > 0) {
      for (const ent of entities) {
        if (ent.type === "bank" || ent.type === "university") {
          // Entity was found in OCR (image contains the brand)
          const ocrEntities = TrustedEntityRegistry.extractAllEntities(ocrText);
          const inOcr = ocrEntities.some((e) => e.id === ent.id);

          if (inOcr && ent.officialDomains?.length > 0) {
            const isUrlOfficial = ent.officialDomains.some((od) => targetUrl.includes(od));
            if (!isUrlOfficial) {
              findings.push({
                type: CROSS_MODAL_TYPES_V2.VISUAL_BRAND_URL_MISMATCH,
                severity: "critical",
                confidence: 0.92,
                evidence: {
                  brandInImage: ent.name,
                  expectedDomains: ent.officialDomains,
                  actualUrl: targetUrl,
                },
                details: `Hình ảnh chứa logo/nhận diện thương hiệu '${ent.name}', nhưng đường dẫn thực tế (${targetUrl}) không thuộc tên miền chính thức.`,
              });
            }
          }
        }
      }
    }

    return findings;
  }
}
