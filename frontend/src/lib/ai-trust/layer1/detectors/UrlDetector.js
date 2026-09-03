/**
 * Layer 1 — UrlDetector
 * 
 * Deep deterministic URL inspection:
 * - Structural decomposition (Scheme, Hostname, Registrable Domain, Subdomain, Port, Path, Query, Userinfo)
 * - Token-Boundary Brand Impersonation & Deceptive Subdomain Analysis
 * - Damerau-Levenshtein Typosquatting Analysis & Character Substitutions
 * - Unicode Homoglyph & Punycode Resolver
 * - SSRF Network Guard (Loopback, Decimal Dword, Hex, Octal, IPv6, Cloud Metadata, Localhost)
 * - Combosquatting & Hot Phishing Lures (Biometrics, VNeID, Scholarships, Student Task Scams)
 * - Dangerous Executable Extensions in Path
 * - Shortened URL detection & Unencrypted HTTP
 * - Userinfo Spoofing Detection (user@host)
 */

import { LAYER_1_CONFIG } from "../config/Layer1Config.js";
import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";
import {
  BrandRegistry,
  BRAND_REGISTRY,
  SUSPICIOUS_TLDS,
  KNOWN_URL_SHORTENERS,
  resolveHomoglyphText,
} from "../registry/BrandRegistry.js";
import { validateRemoteUrlSync } from "../../../security/hardening/SafeRemoteUrl.js";

const HOMOGLYPH_SCRIPTS_REGEX = /[\u0400-\u04FF\u0370-\u03FF]/; // Cyrillic & Greek

const HOT_PHISHING_PATH_REGEX = /(?:login|signin|verify|security|password|account|identity|otp|xac-nhan|nhan-thuong|nhan-hoc-bong|dat-coc|kich-hoat|cap-nhat-sinh-trac-hoc|sinh-trac-hoc|dinh-danh-vneid|dinh-danh|mo-khoa-tai-khoan|mo-khoa-the|nang-cap-smart-otp|dong-bo-du-lieu|tuyen-ctv|nhiem-vu-kiem-tien|nhan-qua)/i;

const CREDENTIAL_PARAM_REGEX = /^(password|passwd|pass|otp|verification_code|verify_code|token|security_code|pin|card|cvv|smart_otp)$/i;

const DANGEROUS_EXTENSIONS = [
  ".exe", ".scr", ".bat", ".cmd", ".ps1", ".apk", ".com", ".vbs",
  ".vbe", ".wsf", ".hta", ".msi", ".dll", ".pif", ".iso", ".dmg",
  ".sh", ".jar", ".bin", ".app", ".deb", ".rpm"
];

// Combosquatting action words commonly combined with brand names
const COMBOSQUAT_KEYWORDS = [
  "login", "signin", "verify", "auth", "security", "portal", "account",
  "otp", "sso", "ebanking", "smartbanking", "digibank", "online", "service",
  "support", "alert", "unlock", "biometric", "update", "xacnhan", "sinhtrachoc",
  "dinhdanh", "hocbong", "nhanthuong", "trocap", "sinhvien", "ctv", "tuyendung",
  "kiemtien", "nhiemvu", "claim", "free", "gift", "event", "direct"
];

// Damerau-Levenshtein Distance (includes adjacent character transpositions)
function damerauLevenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const al = a.length;
  const bl = b.length;
  const matrix = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));

  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,      // deletion
        matrix[i][j - 1] + 1,      // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + cost);
      }
    }
  }
  return matrix[al][bl];
}

/**
 * Checks if a string represents an obfuscated SSRF destination (Decimal, Hex, Octal, IPv6, Loopback)
 * @param {string} host
 * @returns {object|null}
 */
function checkSsrfTarget(host) {
  if (!host) return null;
  const clean = host.toLowerCase().trim();

  // 1. Direct keywords
  if (
    clean === "localhost" ||
    clean === "0.0.0.0" ||
    clean.endsWith(".localhost") ||
    clean.endsWith(".internal") ||
    clean.endsWith(".local") ||
    clean.endsWith(".onion")
  ) {
    return { type: "local_hostname", target: clean };
  }

  // 2. IPv4 Standard Regex Loopback & Link-Local / Metadata
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(clean)) {
    return { type: "loopback_ipv4", target: clean };
  }
  if (/^169\.254\.\d{1,3}\.\d{1,3}$/.test(clean)) {
    return { type: "cloud_metadata_ipv4", target: clean };
  }

  // 3. IPv6 Format ([::1], [::ffff:127.0.0.1], [fe80::...])
  if (clean.startsWith("[") && clean.endsWith("]")) {
    const rawIpv6 = clean.slice(1, -1);
    if (
      rawIpv6 === "::1" ||
      rawIpv6 === "::" ||
      rawIpv6.includes("127.0.0.1") ||
      rawIpv6.startsWith("fe80:") ||
      rawIpv6.startsWith("fc00:") ||
      rawIpv6.startsWith("fd00:")
    ) {
      return { type: "ipv6_private", target: clean };
    }
  }

  // 4. Integer / Dword representation of IPv4 (e.g. 2130706433 = 127.0.0.1, 2852039166 = 169.254.169.254, 0 = 0.0.0.0)
  if (/^\d+$/.test(clean)) {
    const intVal = Number(clean);
    if (intVal >= 0 && intVal <= 4294967295) {
      const b1 = (intVal >>> 24) & 255;
      const b2 = (intVal >>> 16) & 255;
      if (b1 === 127 || (b1 === 169 && b2 === 254) || intVal === 0) {
        return { type: "dword_ip_ssrf", target: `${b1}.${b2}...` };
      }
    }
  }

  // 5. Hexadecimal IP representation (e.g. 0x7f000001, 0x7f.0.0.1, 0xa9fea9fe)
  if (/^0x[0-9a-f]+$/i.test(clean)) {
    const intVal = parseInt(clean, 16);
    const b1 = (intVal >>> 24) & 255;
    const b2 = (intVal >>> 16) & 255;
    if (b1 === 127 || (b1 === 169 && b2 === 254) || intVal === 0) {
      return { type: "hex_ip_ssrf", target: clean };
    }
  }

  // 6. Octal IP representation (e.g. 0177.0.0.1, 017700000001)
  if (/^0[0-7]+$/i.test(clean)) {
    const intVal = parseInt(clean, 8);
    const b1 = (intVal >>> 24) & 255;
    const b2 = (intVal >>> 16) & 255;
    if (b1 === 127 || (b1 === 169 && b2 === 254) || intVal === 0) {
      return { type: "octal_ip_ssrf", target: clean };
    }
  }

  return null;
}

export class UrlDetector {
  /**
   * Evaluates normalized URL structure and returns generated signals
   * @param {object} normUrl - NormalizationService.normalizeUrl output
   * @returns {object} { signals, isWhitelisted, parsedStructure }
   */
  static detect(normUrl) {
    const signals = [];
    let isWhitelisted = false;

    if (!normUrl || !normUrl.isValid || !normUrl.parsed) {
      if (normUrl?.original) {
        const isUnsupportedScheme = normUrl.invalidReason === "UNSUPPORTED_SCHEME" || normUrl.isUnsupportedScheme;
        const isOversized = normUrl.invalidReason === "URL_TOO_LONG" || normUrl.isOverLength;
        signals.push(
          createSignal({
            type: isUnsupportedScheme
              ? LAYER_1_REASONS.UNSUPPORTED_SCHEME
              : (isOversized ? LAYER_1_REASONS.PAYLOAD_LIMIT_EXCEEDED : LAYER_1_REASONS.PHISHING_PATTERN),
            category: "url",
            severity: isUnsupportedScheme ? SIGNAL_SEVERITY.CRITICAL : (isOversized ? SIGNAL_SEVERITY.HIGH : SIGNAL_SEVERITY.MEDIUM),
            confidence: isUnsupportedScheme ? 0.99 : (isOversized ? 0.80 : 0.50),
            evidence: { snippet: normUrl.original.slice(0, 80), details: isUnsupportedScheme ? "Unsupported URL scheme" : (isOversized ? "URL exceeds the local inspection limit" : "Malformed URL syntax") },
            source: "UrlDetector",
          })
        );
      }
      return { signals, isWhitelisted: false, parsedStructure: null };
    }

    const parsed = normUrl.parsed;
    const hostname = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname.toLowerCase();
    const protocol = parsed.protocol.toLowerCase();
    const search = parsed.search;
    const port = parsed.port;
    const username = parsed.username;
    const registrableDomain = BrandRegistry.getRegistrableDomain(hostname);
    const tld = hostname.split(".").pop();

    const parsedStructure = {
      scheme: protocol.replace(":", ""),
      hostname,
      registrableDomain,
      port,
      path: pathname,
      query: search,
      username,
      tld,
      isPunycode: hostname.startsWith("xn--") || hostname.includes(".xn--"),
    };

    // Reuse the shared outbound boundary even though Layer 1 never performs
    // the request itself. This catches canonicalized private, loopback,
    // link-local, metadata, internal, credential-bearing, and unsupported
    // destinations before any later layer can treat them as ordinary URLs.
    const remoteValidation = validateRemoteUrlSync(parsed.toString());
    if (!remoteValidation.ok) {
      const isSsrf = remoteValidation.code === "SSRF_RESTRICTED";
      const isUnsupported = remoteValidation.code === "UNSUPPORTED_REMOTE_SCHEME";
      signals.push(
        createSignal({
          type: isSsrf ? LAYER_1_REASONS.SSRF_ATTEMPT : (isUnsupported ? LAYER_1_REASONS.UNSUPPORTED_SCHEME : LAYER_1_REASONS.PHISHING_PATTERN),
          category: isSsrf ? "network" : "url",
          severity: isSsrf || isUnsupported ? SIGNAL_SEVERITY.CRITICAL : SIGNAL_SEVERITY.HIGH,
          confidence: isSsrf || isUnsupported ? 0.99 : 0.90,
          evidence: { matchedText: hostname, details: `Remote URL boundary rejected: ${remoteValidation.code}` },
          source: "UrlDetector",
        })
      );
      return { signals, isWhitelisted: false, parsedStructure };
    }

    // 1. SSRF Network Protection Check (Loopback, Dword, Hex, Octal, Cloud Metadata, Localhost)
    const ssrfMatch = checkSsrfTarget(hostname);
    if (ssrfMatch) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.SSRF_ATTEMPT,
          category: "network",
          severity: SIGNAL_SEVERITY.CRITICAL,
          confidence: 0.99,
          evidence: { matchedText: hostname, details: `SSRF Target Detected (${ssrfMatch.type}: ${ssrfMatch.target})` },
          source: "UrlDetector",
        })
      );
      return { signals, isWhitelisted: false, parsedStructure };
    }

    // 2. Whitelist Verification (Authentic .edu.vn, .gov.vn, Banks, Tech Platforms)
    if (BrandRegistry.isWhitelistedDomain(hostname)) {
      isWhitelisted = true;
      const brand = BrandRegistry.getAuthenticBrand(hostname);
      const detailLabel = brand
        ? `Tên miền xác thực chính thống (${brand.name})`
        : "Tên miền cơ quan giáo dục đại học / chính phủ chính thống (.edu.vn / .gov.vn)";

      signals.push(
        createSignal({
          type: LAYER_1_REASONS.WHITELISTED_DOMAIN,
          category: "url",
          severity: SIGNAL_SEVERITY.INFO,
          confidence: LAYER_1_CONFIG.CONFIDENCE_BOUNDS.WHITELIST_PASS,
          evidence: { matchedText: hostname, details: detailLabel },
          source: "UrlDetector",
        })
      );
      // Whitelisting is only a scoped local hint. Continue inspecting path,
      // userinfo, query, port, and deception indicators before deciding.
    }

    // 3. Userinfo Spoofing Trick (e.g. http://google.com@evil.com)
    if (username || normUrl.original.includes("@")) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.PHISHING_PATTERN,
          category: "url",
          severity: SIGNAL_SEVERITY.HIGH,
          confidence: 0.85,
          evidence: { matchedText: username || "@", details: "Deceptive Userinfo embedding in URL authority (user@host spoofing)" },
          source: "UrlDetector",
        })
      );
    }

    // 4. Dangerous File Extension in URL Path
    for (const ext of DANGEROUS_EXTENSIONS) {
      if (pathname.endsWith(ext) || pathname.includes(ext + "?") || pathname.includes(ext + "/")) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
            category: "url",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.KNOWN_MALICIOUS_SIGNATURE,
            evidence: { matchedText: ext, details: `URL directly points to executable payload (${ext.toUpperCase()})` },
            source: "UrlDetector",
          })
        );
        break;
      }
    }

    // 5. Unicode Homoglyphs & Mixed Script / Punycode Deception
    const hasHomoglyphs = HOMOGLYPH_SCRIPTS_REGEX.test(hostname);
    const resolvedHost = resolveHomoglyphText(hostname);
    if (parsedStructure.isPunycode || hasHomoglyphs || resolvedHost !== hostname) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
          category: "url",
          severity: SIGNAL_SEVERITY.CRITICAL,
          confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.HOMOGLYPH_BRAND,
          evidence: {
            matchedText: hostname,
            resolvedHost,
            details: "Cyrillic/Greek Unicode homoglyph or Punycode deception detected",
          },
          source: "UrlDetector",
        })
      );
    }

    // 6. Token-Boundary Brand Impersonation in Subdomain / Domain
    const impersonation = BrandRegistry.checkBrandImpersonation(hostname);
    const isSuspiciousTLD = SUSPICIOUS_TLDS.has(tld);
    const hasPhishingPath = HOT_PHISHING_PATH_REGEX.test(pathname);
    const shouldFlagPhishingPath = hasPhishingPath && (!isWhitelisted || Boolean(impersonation) || isSuspiciousTLD);

    if (impersonation) {
      const isCriticalThreat =
        impersonation.isSubdomainHijack ||
        isSuspiciousTLD ||
        hasPhishingPath ||
        hasHomoglyphs;

      signals.push(
        createSignal({
          type: impersonation.isSubdomainHijack
            ? LAYER_1_REASONS.BRAND_IMPERSONATION_SUBDOMAIN
            : LAYER_1_REASONS.BRAND_IMPERSONATION,
          category: "url",
          severity: isCriticalThreat ? SIGNAL_SEVERITY.CRITICAL : SIGNAL_SEVERITY.HIGH,
          confidence: isCriticalThreat ? 0.98 : LAYER_1_CONFIG.DETECTOR_RELIABILITY.DECEPTIVE_SUBDOMAIN,
          evidence: {
            matchedText: hostname,
            brand: impersonation.brand,
            actualDomain: impersonation.registrableDomain,
            details: `Deceptive brand impersonation: '${impersonation.brand}' outside official domains`,
          },
          source: "UrlDetector",
        })
      );
    }

    // 7. Combosquatting Heuristics (Brand + Action Keyword on unauthorized domain)
    if (!impersonation && !isWhitelisted) {
      const hostTokens = BrandRegistry.extractTokens(hostname);
      const hostTokensSet = new Set(hostTokens);

      for (const brand of BRAND_REGISTRY) {
        let brandMatched = false;
        for (const alias of brand.aliases) {
          if (alias.length <= 4 && hostTokensSet.has(alias)) brandMatched = true;
          else if (alias.length > 4 && hostname.includes(alias)) brandMatched = true;
        }

        if (brandMatched) {
          const hasCombosquatWord = COMBOSQUAT_KEYWORDS.some((kw) =>
            hostTokensSet.has(kw) || hostname.includes(`-${kw}`) || hostname.includes(`${kw}-`)
          );

          if (hasCombosquatWord) {
            signals.push(
              createSignal({
                type: LAYER_1_REASONS.BRAND_IMPERSONATION,
                category: "url",
                severity: isSuspiciousTLD || hasPhishingPath ? SIGNAL_SEVERITY.CRITICAL : SIGNAL_SEVERITY.HIGH,
                confidence: 0.95,
                evidence: {
                  matchedText: hostname,
                  brand: brand.name,
                  details: `Combosquatting detected: brand '${brand.name}' combined with action keywords`,
                },
                source: "UrlDetector",
              })
            );
            break;
          }
        }
      }
    }

    // 8. Typosquatting Analysis (Damerau-Levenshtein distance for canonical domains)
    if (!impersonation && !isWhitelisted && !KNOWN_URL_SHORTENERS.has(hostname)) {
      const hostBase = registrableDomain.split(".")[0];
      if (hostBase && hostBase.length >= 4) {
        for (const brand of BRAND_REGISTRY) {
          for (const canonical of brand.canonicalDomains) {
            const canonicalBase = canonical.split(".")[0];
            if (canonicalBase.length >= 4 && hostBase !== canonicalBase) {
              const dist = damerauLevenshtein(hostBase, canonicalBase);
              const maxAllowedDist = canonicalBase.length <= 4 ? 1 : 2;
              if (dist >= 1 && dist <= maxAllowedDist) {
                signals.push(
                  createSignal({
                    type: LAYER_1_REASONS.TYPOSQUATTING,
                    category: "url",
                    severity: SIGNAL_SEVERITY.HIGH,
                    confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.TYPOSQUATTING_DOMAIN,
                    evidence: {
                      matchedText: hostname,
                      targetBrand: brand.name,
                      canonicalDomain: canonical,
                      details: `Typosquatting variant of '${canonical}' (Edit distance: ${dist})`,
                    },
                    source: "UrlDetector",
                  })
                );
                break;
              }
            }
          }
        }
      }
    }

    // 9. Raw IP Hostname (IPv4 / IPv6) -> SUSPICIOUS
    const isIPv4 = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname);
    if (isIPv4) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.IP_BASED_HOST,
          category: "url",
          severity: SIGNAL_SEVERITY.MEDIUM,
          confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.RAW_IP_HOST,
          evidence: { matchedText: hostname, details: "Raw IP address used as host" },
          source: "UrlDetector",
        })
      );
    }

    // 10. URL Shortener Detection
    if (KNOWN_URL_SHORTENERS.has(hostname)) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.SHORTENED_URL,
          category: "url",
          severity: SIGNAL_SEVERITY.MEDIUM,
          confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.SHORT_URL,
          evidence: { matchedText: hostname, details: "Known URL shortener service concealing final target" },
          source: "UrlDetector",
        })
      );
    }

    // 11. Unencrypted HTTP Transport
    if (protocol === "http:" && !hostname.startsWith("localhost")) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.UNENCRYPTED_TRANSPORT,
          category: "url",
          severity: SIGNAL_SEVERITY.MEDIUM,
          confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.UNENCRYPTED_HTTP,
          evidence: { matchedText: "http://", details: "Unencrypted transport without TLS" },
          source: "UrlDetector",
        })
      );
    }

    // 12. Hot Phishing Path Patterns (Biometrics, VNeID, OTP, Scholarship, Tasks)
    if (shouldFlagPhishingPath) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.PHISHING_PATH_PATTERN,
          category: "url",
          severity: isSuspiciousTLD || impersonation ? SIGNAL_SEVERITY.HIGH : SIGNAL_SEVERITY.MEDIUM,
          confidence: 0.65,
          evidence: { matchedText: pathname, details: "Path matches high-risk authentication/biometrics/reward phishing endpoint" },
          source: "UrlDetector",
        })
      );
    }

    // 13. Suspicious Query Parameters
    try {
      parsed.searchParams.forEach((val, key) => {
        if (CREDENTIAL_PARAM_REGEX.test(key)) {
          signals.push(
            createSignal({
              type: LAYER_1_REASONS.SUSPICIOUS_QUERY_PARAM,
              category: "url",
              severity: SIGNAL_SEVERITY.HIGH,
              confidence: 0.75,
              evidence: { matchedText: key, details: `Parameter '${key}' matches credential harvest pattern` },
              source: "UrlDetector",
            })
          );
        }
      });
    } catch {
      // ignore param parse errors
    }

    // 14. Suspicious TLD alone
    if (isSuspiciousTLD && !impersonation) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.SUSPICIOUS_TLD,
          category: "url",
          severity: SIGNAL_SEVERITY.LOW,
          confidence: 0.35,
          evidence: { matchedText: `.${tld}`, details: "Low-cost generic TLD frequently observed in spam/phishing campaigns" },
          source: "UrlDetector",
        })
      );
    }

    // 15. Unusual Network Port
    if (port && !["80", "443", ""].includes(port)) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.SUSPICIOUS_PORT,
          category: "url",
          severity: SIGNAL_SEVERITY.LOW,
          confidence: 0.30,
          evidence: { matchedText: `:${port}`, details: `Non-standard port (${port})` },
          source: "UrlDetector",
        })
      );
    }

    return { signals, isWhitelisted, parsedStructure };
  }
}
