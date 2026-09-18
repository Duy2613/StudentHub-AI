/**
 * StudentHub AI — OcrForensicsExtractor (Deterministic Forensics)
 * 
 * Extracts visible text, text bounding regions (when available), and candidate URLs:
 * - Scans visible text for candidate web links, emails, and phone numbers.
 * - Passes candidate URLs through SafeRemoteUrl normalization & SSRF checks.
 * - CRITICAL: Never automatically navigates to extracted URLs!
 * - Candidate URLs become structured inputs for downstream Layer 3 evidence retrieval.
 */

import { validateRemoteUrlSync } from "../../../security/hardening/SafeRemoteUrl.js";

const URL_REGEX = /https?:\/\/[^\s)\]}>,;"]+/gi;

export class OcrForensicsExtractor {
  /**
   * Extracts visible text and validated URL candidates from OCR text or metadata.
   * 
   * @param {object} params
   * @param {string} [params.ocrText=""]
   * @param {Array} [params.regions=[]]
   * @returns {object} { status, text, regions, visibleUrls, signals, warnings }
   */
  static extract({ ocrText = "", regions = [] } = {}) {
    const text = String(ocrText || "").trim();
    const warnings = [];
    const signals = [];
    const visibleUrls = [];

    if (!text) {
      return {
        status: "NO_TEXT_DETECTED",
        text: "",
        regions: [],
        visibleUrls: [],
        signals: [],
        warnings: [],
      };
    }

    // Extract URL candidates
    const matches = [...text.matchAll(URL_REGEX)].map(m => m[0]);
    const uniqueCandidates = Array.from(new Set(matches)).slice(0, 20);

    for (const rawUrl of uniqueCandidates) {
      const val = validateRemoteUrlSync(rawUrl);
      if (val.ok) {
        visibleUrls.push({
          rawUrl,
          normalizedUrl: val.url,
          hostname: val.hostname,
          isSafeForEvidenceSearch: true,
          securityCode: "SAFE",
        });
      } else {
        visibleUrls.push({
          rawUrl,
          normalizedUrl: null,
          hostname: null,
          isSafeForEvidenceSearch: false,
          securityCode: val.code || "INVALID_URL",
        });
        warnings.push(`URL nhìn thấy trong ảnh (${rawUrl.slice(0, 40)}...) không an toàn hoặc bị chặn (${val.code}).`);
        signals.push({
          code: "VISIBLE_URL_SSRF_OR_INVALID",
          severity: "HIGH",
          source: "OcrForensicsExtractor",
          details: `URL '${rawUrl.slice(0, 60)}' bị hạn chế bảo mật: ${val.code}.`,
        });
      }
    }

    if (visibleUrls.length > 0) {
      signals.push({
        code: "VISIBLE_URLS_EXTRACTED",
        severity: "INFO",
        source: "OcrForensicsExtractor",
        details: `Trích xuất được ${visibleUrls.length} liên kết URL từ nội dung ảnh; chuyển tiếp làm dữ liệu kiểm chứng Layer 3.`,
      });
    }

    return {
      status: "COMPLETED",
      text,
      regions: Array.isArray(regions) ? regions.slice(0, 40) : [],
      visibleUrls,
      signals,
      warnings,
    };
  }
}
