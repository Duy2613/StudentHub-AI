/**
 * Retired URL-rules compatibility adapter.
 *
 * URL screening is implemented by NormalizationService + UrlDetector.  The
 * old rule file used a whitelist early return and emitted a SAFE signal; both
 * behaviours are unsafe at a trust boundary.  Keep the historical export
 * shape for older imports while returning canonical, non-final signals.
 */

import { NormalizationService } from "../normalization/NormalizationService.js";
import { UrlDetector } from "../detectors/UrlDetector.js";
import { SIGNAL_SEVERITY } from "../types.js";

export const WHITELISTED_DOMAINS = Object.freeze([
  "vnuhcm.edu.vn", "hcmute.edu.vn", "hust.edu.vn", "uit.edu.vn", "hcmut.edu.vn", "vnu.edu.vn",
  "neu.edu.vn", "ftu.edu.vn", "ueh.edu.vn", "ctu.edu.vn", "chinhphu.vn", "monre.gov.vn",
  "moet.gov.vn", "bocongan.gov.vn", "github.com", "google.com", "microsoft.com", "facebook.com",
]);

export const URL_SHORTENERS = Object.freeze([
  "bit.ly", "tinyurl.com", "t.co", "cutt.ly", "is.gd", "shorturl.at", "gg.gg", "rb.gy",
  "buff.ly", "ow.ly", "rebrand.ly", "s.id",
]);

export const SUSPICIOUS_TLDS = Object.freeze([
  ".xyz", ".top", ".site", ".online", ".club", ".work", ".vip", ".click", ".buzz", ".cam",
  ".live", ".monster", ".rest", ".bar", ".cfd", ".sbs",
]);

export const DANGEROUS_EXTENSIONS = Object.freeze([
  ".exe", ".scr", ".bat", ".cmd", ".ps1", ".apk", ".vbs", ".msi", ".jar", ".iso", ".dmg",
  ".pif", ".hta", ".wsf", ".sh",
]);

export const TARGET_BRANDS = Object.freeze([
  { name: "facebook", canonical: "facebook.com" }, { name: "google", canonical: "google.com" },
  { name: "gmail", canonical: "mail.google.com" }, { name: "hcmute", canonical: "hcmute.edu.vn" },
  { name: "vnuhcm", canonical: "vnuhcm.edu.vn" }, { name: "bachkhoa", canonical: "hcmut.edu.vn" },
  { name: "vietcombank", canonical: "vietcombank.com.vn" }, { name: "mbbank", canonical: "mbbank.com.vn" },
  { name: "techcombank", canonical: "techcombank.com" }, { name: "vnpay", canonical: "vnpay.vn" },
  { name: "shopee", canonical: "shopee.vn" }, { name: "lazada", canonical: "lazada.vn" },
  { name: "tiktok", canonical: "tiktok.com" }, { name: "momo", canonical: "momo.vn" },
  { name: "paypal", canonical: "paypal.com" }, { name: "apple", canonical: "apple.com" },
]);

export const PHISHING_PATH_PATTERNS = Object.freeze([
  /\/login/i, /\/signin/i, /\/verify/i, /\/otp/i, /\/xac-nhan/i, /\/nhan-thuong/i,
  /\/nhan-hoc-bong/i, /\/update-security/i, /\/banking/i, /\/auth/i, /\/claim/i,
  /\/kich-hoat/i, /\/dat-coc/i,
]);

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function toLegacyShape(signal) {
  const evidence = isRecord(signal?.evidence) ? signal.evidence : {};
  return {
    ...signal,
    // Kept as metadata only. Consumers must use the canonical severity/type;
    // this field is never a final safety verdict.
    legacyType: signal?.severity === SIGNAL_SEVERITY.CRITICAL || signal?.severity === SIGNAL_SEVERITY.HIGH
      ? "danger"
      : signal?.severity === SIGNAL_SEVERITY.MEDIUM
        ? "warning"
        : "info",
    id: signal?.signalId,
    weight: signal?.confidence,
    snippet: evidence.matchedText || evidence.snippet || "",
  };
}

export function inspectURL(urlString) {
  const normalized = NormalizationService.normalizeUrl(urlString);
  const result = UrlDetector.detect(normalized);
  const signals = Array.isArray(result.signals) ? result.signals.map(toLegacyShape) : [];
  const hardTriggers = signals
    .filter((signal) => signal.severity === SIGNAL_SEVERITY.CRITICAL)
    .map((signal) => ({ reason: signal.type, signal }));

  return {
    signals,
    hardTriggers,
    isWhitelisted: result.isWhitelisted === true,
    parsedInfo: result.parsedStructure || null,
  };
}
