/**
 * StudentHub AI — QrIntakeService (Layer 1 QR Intake & Security Boundary)
 * 
 * Performs server-owned, authoritative QR code screening:
 * - Server independently normalizes, classifies, and validates QR content.
 * - Client decoding exists for immediate UX only; server NEVER trusts browser-supplied
 *   `decodedType`, `normalizedValue`, or `securityStatus`.
 * - Deep URL Security & SSRF defenses using SafeRemoteUrl:
 *   * Disallows non-HTTP schemes (javascript:, data:, file:, vbscript: -> BLOCKED)
 *   * Rejects localhost, 127.0.0.1, private RFC1918 subnets, IPv6 loopback, link-local, cloud metadata
 *   * Rejects embedded credentials (user:pass@host)
 *   * Detects punycode & IDN homograph attack patterns (e.g. mixed Cyrillic lookalikes xn--...)
 *   * Flags open-redirect candidates
 * - Returns canonical QR intake DTO without truth verdict:
 *   { inputType: "QR", decodedType: "URL"|"TEXT"|"OTHER", decodedValue, normalizedValue, securityStatus, warnings, signals }
 * - Routes safe URLs to URL Trust Pipeline, safe text to Text Trust Pipeline.
 */

import { validateRemoteUrlSync, isBlockedHostname, isPrivateAddress, normalizeHostname } from "../../../security/hardening/SafeRemoteUrl.js";
import { NormalizationService } from "../normalization/NormalizationService.js";
import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";

const DANGEROUS_SCHEMES = new Set([
  "javascript:",
  "data:",
  "file:",
  "vbscript:",
  "blob:",
  "about:",
]);

const SUSPICIOUS_REDIRECT_PARAMS = [
  "url=", "redirect=", "next=", "target=", "dest=", "destination=", "r=", "u="
];

function isPunycodeOrHomograph(hostname) {
  if (!hostname) return false;
  const lower = hostname.toLowerCase();
  if (lower.startsWith("xn--") || lower.includes(".xn--")) {
    return true;
  }
  // Mixed latin and cyrillic lookalike characters check
  const cyrillicMatch = /[\u0400-\u04FF]/;
  const latinMatch = /[a-zA-Z]/;
  if (cyrillicMatch.test(hostname) && latinMatch.test(hostname)) {
    return true;
  }
  return false;
}

export class QrIntakeService {
  /**
   * Authoritative server intake for decoded or uploaded QR payload.
   * 
   * @param {string|object} rawInput - Raw QR string or container object
   * @returns {object} Canonical QR intake result DTO
   */
  static intake(rawInput) {
    const rawPayload = typeof rawInput === "string"
      ? rawInput
      : typeof rawInput?.content === "string"
      ? rawInput.content
      : typeof rawInput?.qrPayload === "string"
      ? rawInput.qrPayload
      : typeof rawInput?.qrContent === "string"
      ? rawInput.qrContent
      : "";

    const trimmed = String(rawPayload || "").trim();
    const warnings = [];
    const signals = [];

    if (!trimmed) {
      return {
        inputType: "QR",
        decodedType: "EMPTY",
        decodedValue: "",
        normalizedValue: "",
        securityStatus: "BLOCKED",
        warnings: ["Nội dung mã QR rỗng hoặc không đọc được."],
        signals: [
          createSignal({
            type: "QR_EMPTY_PAYLOAD",
            category: "image",
            severity: SIGNAL_SEVERITY.HIGH,
            confidence: 1.0,
            evidence: { details: "Mã QR không chứa dữ liệu văn bản hợp lệ." },
            source: "QrIntakeService",
          }),
        ],
      };
    }

    // 1. Check for immediate dangerous non-HTTP URI schemes (javascript:, data:, file:)
    const lower = trimmed.toLowerCase();
    for (const scheme of DANGEROUS_SCHEMES) {
      if (lower.startsWith(scheme) || lower.includes(scheme)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.MALICIOUS_SCRIPT_PAYLOAD,
            category: "security",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: 0.99,
            evidence: {
              scheme,
              rawPayload: trimmed.slice(0, 200),
              details: `Mã QR chứa URI scheme nguy hiểm (${scheme}) bị cấm hoàn toàn.`,
            },
            source: "QrIntakeService",
          })
        );
        warnings.push(`Phát hiện mã độc/lệnh thực thi nguy hiểm (${scheme}) trong mã QR.`);
        return {
          inputType: "QR",
          decodedType: "OTHER",
          decodedValue: trimmed,
          normalizedValue: "",
          securityStatus: "BLOCKED",
          warnings,
          signals,
        };
      }
    }

    // 2. Classify: URL vs Plain Text vs Structured Scheme
    const isExplicitUrl = /^https?:\/\//i.test(trimmed);
    const isDomainLike = /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}(:\d+)?(\/.*)?$/i.test(trimmed);

    if (isExplicitUrl || isDomainLike) {
      const candidateUrl = isExplicitUrl ? trimmed : `https://${trimmed}`;
      let parsedUrl;
      try {
        parsedUrl = new URL(candidateUrl);
      } catch {
        signals.push(
          createSignal({
            type: "QR_MALFORMED_URL",
            category: "url",
            severity: SIGNAL_SEVERITY.HIGH,
            confidence: 0.85,
            evidence: { rawPayload: trimmed.slice(0, 200), details: "URL trong mã QR có cấu trúc sai cú pháp." },
            source: "QrIntakeService",
          })
        );
        warnings.push("Liên kết URL trong mã QR không hợp lệ hoặc sai định dạng.");
        return {
          inputType: "QR",
          decodedType: "URL",
          decodedValue: trimmed,
          normalizedValue: "",
          securityStatus: "BLOCKED",
          warnings,
          signals,
        };
      }

      // Check scheme strictly
      if (!/^https?:$/i.test(parsedUrl.protocol)) {
        signals.push(
          createSignal({
            type: "QR_UNSUPPORTED_SCHEME",
            category: "security",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: 0.95,
            evidence: { protocol: parsedUrl.protocol },
            source: "QrIntakeService",
          })
        );
        warnings.push(`Giao thức ${parsedUrl.protocol} không được hỗ trợ để mở an toàn.`);
        return {
          inputType: "QR",
          decodedType: "OTHER",
          decodedValue: trimmed,
          normalizedValue: "",
          securityStatus: "BLOCKED",
          warnings,
          signals,
        };
      }

      // Check embedded credentials (http://user:pass@host)
      if (parsedUrl.username || parsedUrl.password) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.CREDENTIAL_LEAK_IN_URL,
            category: "security",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: 0.95,
            evidence: { username: parsedUrl.username, details: "URL chứa thông tin đăng nhập nhúng trực tiếp." },
            source: "QrIntakeService",
          })
        );
        warnings.push("URL chứa thông tin xác thực nhúng (user:pass), có nguy cơ lừa đảo chiếm quyền.");
        return {
          inputType: "QR",
          decodedType: "URL",
          decodedValue: trimmed,
          normalizedValue: "",
          securityStatus: "BLOCKED",
          warnings,
          signals,
        };
      }

      // Check SSRF & blocked hostnames (localhost, private RFC1918, link-local, cloud metadata)
      const hostname = normalizeHostname(parsedUrl.hostname);
      const isBlocked = isBlockedHostname(hostname) || isPrivateAddress(hostname);
      if (isBlocked) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.SSRF_TARGET_BLOCKED,
            category: "security",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: 0.99,
            evidence: { hostname, details: "Đích đến là địa chỉ mạng nội bộ hoặc cloud metadata (SSRF)." },
            source: "QrIntakeService",
          })
        );
        warnings.push("URL trỏ tới máy chủ nội bộ hoặc địa chỉ mạng cục bộ bị cấm.");
        return {
          inputType: "QR",
          decodedType: "URL",
          decodedValue: trimmed,
          normalizedValue: "",
          securityStatus: "BLOCKED",
          warnings,
          signals,
        };
      }

      // Check Punycode & IDN homograph attack
      if (isPunycodeOrHomograph(hostname)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.HOMOGRAPH_ATTACK,
            category: "url",
            severity: SIGNAL_SEVERITY.HIGH,
            confidence: 0.85,
            evidence: { hostname, details: "Tên miền sử dụng ký tự quốc tế hóa (IDN/Punycode) dễ giả mạo thương hiệu." },
            source: "QrIntakeService",
          })
        );
        warnings.push("Tên miền có dấu hiệu giả mạo ký tự (Punycode / Homograph).");
      }

      // Check open redirect candidate
      const search = parsedUrl.search.toLowerCase();
      if (SUSPICIOUS_REDIRECT_PARAMS.some(param => search.includes(param))) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.OPEN_REDIRECT_SUSPECTED,
            category: "url",
            severity: SIGNAL_SEVERITY.MEDIUM,
            confidence: 0.65,
            evidence: { query: parsedUrl.search, details: "Tham số URL chứa chỉ thị chuyển hướng tiếp theo." },
            source: "QrIntakeService",
          })
        );
        warnings.push("URL chứa tham số chuyển hướng; cần đối chiếu đích đến thực tế.");
      }

      const normalized = NormalizationService.normalizeUrl(candidateUrl);
      const securityStatus = signals.some(s => s.severity === SIGNAL_SEVERITY.CRITICAL)
        ? "BLOCKED"
        : signals.some(s => s.severity === SIGNAL_SEVERITY.HIGH)
        ? "SUSPICIOUS"
        : "SAFE";

      return {
        inputType: "QR",
        decodedType: "URL",
        decodedValue: trimmed,
        normalizedValue: normalized.normalized || candidateUrl,
        securityStatus,
        warnings,
        signals,
      };
    }

    // 3. Plain Text Payload
    const normalizedText = NormalizationService.normalizeText(trimmed);
    return {
      inputType: "QR",
      decodedType: "TEXT",
      decodedValue: trimmed,
      normalizedValue: normalizedText.normalized || trimmed,
      securityStatus: "SAFE",
      warnings,
      signals,
    };
  }
}
