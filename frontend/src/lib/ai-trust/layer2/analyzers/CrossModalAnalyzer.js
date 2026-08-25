/**
 * Layer 2 — CrossModalAnalyzer
 * 
 * Performs joint multimodal cross-referencing:
 * - Compares Text claims vs Image OCR vs Actual URL destination
 * - Compares Claimed Entity vs URL Domain ownership
 * - Compares QR Code destination vs Text promise
 * - Catches cross-modal brand impersonation & deceptive visual framing
 */

import { CROSS_MODAL_TYPES } from "../types.js";
import { TrustedEntityRegistry } from "../registry/TrustedEntityRegistry.js";

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
   * @returns {Array<object>} Array of cross-modal findings
   */
  static analyze({
    text = "",
    url = "",
    ocrText = "",
    qrPayload = "",
    entities = [],
    layer1Result = {},
  }) {
    const findings = [];
    const combinedText = `${text} ${ocrText}`.trim();

    // 1. Text / OCR Entity Claim vs Actual URL Domain Mismatch
    // Example: Text/OCR claims "Vietcombank" or "HCMUTE", but URL points to "verify-portal.xyz"
    const targetUrl = url || qrPayload || (layer1Result.signals?.find((s) => s.type.includes("url"))?.evidence?.matchedText);

    if (targetUrl && entities.length > 0) {
      for (const ent of entities) {
        if (ent.officialDomains && ent.officialDomains.length > 0) {
          const isUrlOfficial = ent.officialDomains.some((official) => targetUrl.includes(official));

          if (!isUrlOfficial) {
            // Check if this is an explicit authority claim
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

    // 2. OCR Phishing vs File Type Mismatch (e.g., Image contains Login UI / Fake SMS)
    if (ocrText && (ocrText.includes("OTP") || ocrText.includes("mật khẩu") || ocrText.includes("Smart OTP"))) {
      if (layer1Result.status === "BLOCK" || layer1Result.signals?.some((s) => s.type.includes("phishing"))) {
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

    // 3. QR Code Destination vs Text Promise Mismatch
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

    return findings;
  }
}
