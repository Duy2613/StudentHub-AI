/**
 * AI Trust & Scam Detection Pipeline — Layer 1 URL Rules
 * 
 * Deterministic URL inspection:
 * - Protocol check (HTTP vs HTTPS)
 * - Domain / Host dissection & Raw IP detection
 * - Typosquatting, Deceptive Subdomains & Impersonation
 * - Punycode & Homoglyph Unicode Attack Detection
 * - URL Shorteners detection
 * - Dangerous Executable Extensions in path
 * - Academic / Government Whitelist Verification
 */

import { LAYER_1_REASONS, SIGNAL_TYPE, SIGNAL_WEIGHTS } from "../types.js";

// Whitelisted authentic domains for VN higher education & verified platforms
export const WHITELISTED_DOMAINS = [
  "vnuhcm.edu.vn",
  "hcmute.edu.vn",
  "hust.edu.vn",
  "uit.edu.vn",
  "hcmut.edu.vn",
  "vnu.edu.vn",
  "neu.edu.vn",
  "ftu.edu.vn",
  "ueh.edu.vn",
  "ctu.edu.vn",
  "chinhphu.vn",
  "monre.gov.vn",
  "moet.gov.vn",
  "bocongan.gov.vn",
  "github.com",
  "google.com",
  "microsoft.com",
  "facebook.com",
];

export const URL_SHORTENERS = [
  "bit.ly",
  "tinyurl.com",
  "t.co",
  "cutt.ly",
  "is.gd",
  "shorturl.at",
  "gg.gg",
  "rb.gy",
  "buff.ly",
  "ow.ly",
  "rebrand.ly",
  "s.id",
];

export const SUSPICIOUS_TLDS = [
  ".xyz",
  ".top",
  ".site",
  ".online",
  ".club",
  ".work",
  ".vip",
  ".click",
  ".buzz",
  ".cam",
  ".live",
  ".monster",
  ".rest",
  ".bar",
  ".cfd",
  ".sbs",
];

export const DANGEROUS_EXTENSIONS = [
  ".exe",
  ".scr",
  ".bat",
  ".cmd",
  ".ps1",
  ".apk",
  ".vbs",
  ".msi",
  ".jar",
  ".iso",
  ".dmg",
  ".pif",
  ".hta",
  ".wsf",
  ".sh",
];

export const TARGET_BRANDS = [
  { name: "facebook", canonical: "facebook.com" },
  { name: "google", canonical: "google.com" },
  { name: "gmail", canonical: "mail.google.com" },
  { name: "hcmute", canonical: "hcmute.edu.vn" },
  { name: "vnuhcm", canonical: "vnuhcm.edu.vn" },
  { name: "bachkhoa", canonical: "hcmut.edu.vn" },
  { name: "vietcombank", canonical: "vietcombank.com.vn" },
  { name: "mbbank", canonical: "mbbank.com.vn" },
  { name: "techcombank", canonical: "techcombank.com" },
  { name: "vnpay", canonical: "vnpay.vn" },
  { name: "shopee", canonical: "shopee.vn" },
  { name: "lazada", canonical: "lazada.vn" },
  { name: "tiktok", canonical: "tiktok.com" },
  { name: "momo", canonical: "momo.vn" },
  { name: "paypal", canonical: "paypal.com" },
  { name: "apple", canonical: "apple.com" },
];

export const PHISHING_PATH_PATTERNS = [
  /\/login/i,
  /\/signin/i,
  /\/verify/i,
  /\/otp/i,
  /\/xac-nhan/i,
  /\/nhan-thuong/i,
  /\/nhan-hoc-bong/i,
  /\/update-security/i,
  /\/banking/i,
  /\/auth/i,
  /\/claim/i,
  /\/kich-hoat/i,
  /\/dat-coc/i,
];

// Cyrillic & Greek homoglyph characters often used to spoof Latin letters
const HOMOGLYPH_REGEX = /[\u0400-\u04FF\u0370-\u03FF]/;

/**
 * Parses and screens a URL string deterministically
 * @param {string} urlString 
 * @returns {object} { signals, hardTriggers, isWhitelisted, parsedInfo }
 */
export function inspectURL(urlString) {
  const signals = [];
  const hardTriggers = [];
  let isWhitelisted = false;

  let raw = String(urlString || "").trim();
  if (!raw) {
    return { signals, hardTriggers, isWhitelisted, parsedInfo: null };
  }

  // Prepend http:// if user pasted domain only
  let workingUrl = raw;
  if (!/^https?:\/\//i.test(workingUrl)) {
    workingUrl = "http://" + workingUrl;
  }

  let parsed;
  try {
    parsed = new URL(workingUrl);
  } catch {
    signals.push({
      id: "SIG_MALFORMED_URL",
      type: SIGNAL_TYPE.WARNING,
      category: "url",
      title: "Cấu trúc URL không hợp lệ hoặc dị thường",
      weight: 0.5,
      snippet: raw.slice(0, 60),
    });
    return { signals, hardTriggers, isWhitelisted, parsedInfo: { raw } };
  }

  const hostname = parsed.hostname.toLowerCase();
  const pathname = parsed.pathname.toLowerCase();
  const protocol = parsed.protocol.toLowerCase();
  const port = parsed.port;

  // 1. Whitelist Check
  const isEduVn = hostname.endsWith(".edu.vn") || hostname.endsWith(".gov.vn");
  const isDirectWhitelist = WHITELISTED_DOMAINS.some(
    (w) => hostname === w || hostname.endsWith("." + w)
  );

  if (isEduVn || isDirectWhitelist) {
    isWhitelisted = true;
    signals.push({
      id: "SIG_WHITELIST_VERIFIED",
      type: SIGNAL_TYPE.SAFE,
      category: "url",
      title: isEduVn
        ? "Tên miền thuộc cổng giáo dục / chính phủ quốc gia (.edu.vn / .gov.vn)"
        : "Tên miền nằm trong danh mục xác thực chính thống",
      weight: 0.99,
      snippet: hostname,
    });
    return {
      signals,
      hardTriggers,
      isWhitelisted,
      parsedInfo: { hostname, protocol, pathname },
    };
  }

  // 2. Dangerous File Extensions (HARD BLOCK)
  for (const ext of DANGEROUS_EXTENSIONS) {
    if (pathname.endsWith(ext) || pathname.includes(ext + "?") || raw.toLowerCase().includes(ext)) {
      const sig = {
        id: "SIG_DANGEROUS_EXECUTABLE",
        type: SIGNAL_TYPE.DANGER,
        category: "url",
        title: `Đường dẫn trỏ trực tiếp đến tệp thực thi nguy hiểm (${ext.toUpperCase()})`,
        weight: SIGNAL_WEIGHTS.HARD_DANGEROUS_FILE,
        snippet: ext,
      };
      signals.push(sig);
      hardTriggers.push({
        reason: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
        signal: sig,
      });
      break;
    }
  }

  // 3. Homoglyph / Punycode Attack (HARD BLOCK)
  const isPunycode = hostname.startsWith("xn--") || hostname.includes(".xn--");
  const hasHomoglyphs = HOMOGLYPH_REGEX.test(hostname);
  if (isPunycode || hasHomoglyphs) {
    const sig = {
      id: "SIG_HOMOGLYPH_PUNYCODE",
      type: SIGNAL_TYPE.DANGER,
      category: "url",
      title: "Ký tự Unicode giả mạo / Punycode đánh lừa người dùng (Homoglyph Attack)",
      weight: SIGNAL_WEIGHTS.HARD_HOMOGLYPH_BRAND,
      snippet: hostname,
    };
    signals.push(sig);
    hardTriggers.push({
      reason: LAYER_1_REASONS.HOMOGLYPH_ATTACK,
      signal: sig,
    });
  }

  // 4. Deceptive Subdomain & Brand Spoofing
  let detectedBrandSpoof = null;
  for (const brand of TARGET_BRANDS) {
    const brandInHost = hostname.includes(brand.name) || hostname.includes(brand.name.replace(".", "-"));
    const isCanonical = hostname === brand.canonical || hostname.endsWith("." + brand.canonical);

    if (brandInHost && !isCanonical) {
      detectedBrandSpoof = brand;
      const isSubdomainTrick = hostname.includes(brand.canonical) || hostname.startsWith(brand.name + ".");
      const isSuspiciousTLD = SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld));

      const sig = {
        id: "SIG_DECEPTIVE_BRAND_DOMAIN",
        type: SIGNAL_TYPE.DANGER,
        category: "url",
        title: `Tên miền giả danh tổ chức / dịch vụ uy tín: "${brand.name.toUpperCase()}"`,
        weight: isSuspiciousTLD || isSubdomainTrick ? SIGNAL_WEIGHTS.HARD_HOMOGLYPH_BRAND : SIGNAL_WEIGHTS.SOFT_SUBDOMAIN_DECEPTION,
        snippet: hostname,
      };
      signals.push(sig);

      if (isSubdomainTrick || isSuspiciousTLD) {
        hardTriggers.push({
          reason: LAYER_1_REASONS.DECEPTIVE_SUBDOMAIN,
          signal: sig,
        });
      }
      break;
    }
  }

  // 5. Raw IP as Hostname
  const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
  if (isIPv4) {
    signals.push({
      id: "SIG_RAW_IP_HOST",
      type: SIGNAL_TYPE.WARNING,
      category: "url",
      title: "Truy cập trực tiếp qua địa chỉ IP máy chủ thô thay vì tên miền chuẩn",
      weight: SIGNAL_WEIGHTS.SOFT_RAW_IP,
      snippet: hostname,
    });
  }

  // 6. Suspicious Ports
  if (port && !["80", "443", ""].includes(port)) {
    signals.push({
      id: "SIG_SUSPICIOUS_PORT",
      type: SIGNAL_TYPE.WARNING,
      category: "url",
      title: `Sử dụng cổng mạng bất thường (Port: ${port})`,
      weight: 0.35,
      snippet: `:${port}`,
    });
  }

  // 7. URL Shorteners
  if (URL_SHORTENERS.includes(hostname)) {
    signals.push({
      id: "SIG_SHORTENED_URL",
      type: SIGNAL_TYPE.WARNING,
      category: "url",
      title: "Đường link rút gọn che giấu đích đến thực tế",
      weight: SIGNAL_WEIGHTS.SOFT_SHORTENER,
      snippet: hostname,
    });
  }

  // 8. Suspicious TLD alone
  const hasSuspiciousTLD = SUSPICIOUS_TLDS.some((tld) => hostname.endsWith(tld));
  if (hasSuspiciousTLD && !detectedBrandSpoof) {
    signals.push({
      id: "SIG_SUSPICIOUS_TLD",
      type: SIGNAL_TYPE.WARNING,
      category: "url",
      title: "Sử dụng đuôi tên miền chi phí thấp thường dùng trong chiến dịch spam/lừa đảo",
      weight: SIGNAL_WEIGHTS.SOFT_SUSPICIOUS_TLD,
      snippet: hostname.split(".").slice(-1)[0],
    });
  }

  // 9. Unencrypted HTTP (Soft Warning alone)
  if (protocol === "http:" && !raw.startsWith("localhost")) {
    signals.push({
      id: "SIG_UNENCRYPTED_HTTP",
      type: SIGNAL_TYPE.WARNING,
      category: "url",
      title: "Giao thức không mã hóa (HTTP) — Không có chứng chỉ SSL/TLS",
      weight: SIGNAL_WEIGHTS.SOFT_HTTP,
      snippet: "http://",
    });
  }

  // 10. Phishing path patterns
  for (const pattern of PHISHING_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      signals.push({
        id: "SIG_PHISHING_PATH",
        type: SIGNAL_TYPE.WARNING,
        category: "url",
        title: "Cấu trúc đường dẫn chứa từ khóa xác thực nhạy cảm / nhận thưởng",
        weight: 0.35,
        snippet: pathname.slice(0, 30),
      });
      break;
    }
  }

  // 11. Excessive Length / High Entropy
  if (raw.length > 200) {
    signals.push({
      id: "SIG_EXCESSIVE_LENGTH",
      type: SIGNAL_TYPE.INFO,
      category: "url",
      title: "Độ dài URL bất thường (> 200 ký tự)",
      weight: 0.15,
      snippet: `${raw.length} ký tự`,
    });
  }

  return {
    signals,
    hardTriggers,
    isWhitelisted,
    parsedInfo: { hostname, protocol, pathname, port },
  };
}
