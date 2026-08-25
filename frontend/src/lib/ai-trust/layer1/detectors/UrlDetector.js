/**
 * Layer 1 — UrlDetector
 * 
 * Deep deterministic URL inspection:
 * - Structural decomposition (Scheme, Hostname, Registrable Domain, Subdomain, Port, Path, Query, Userinfo)
 * - Brand Impersonation & Deceptive Subdomain Analysis
 * - Levenshtein Typosquatting Analysis
 * - Unicode Homoglyph & Punycode Detection
 * - Credential Harvesting Paths & Suspicious Parameters
 * - Dangerous Executable Extensions in Path
 * - Shortened URL detection
 * - SSRF Network Guard (Loopback, Cloud Metadata, Localhost)
 */

import { LAYER_1_CONFIG } from "../config/Layer1Config.js";
import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";
import { BrandRegistry, BRAND_REGISTRY, SUSPICIOUS_TLDS, KNOWN_URL_SHORTENERS } from "../registry/BrandRegistry.js";

const HOMOGLYPH_SCRIPTS_REGEX = /[\u0400-\u04FF\u0370-\u03FF]/; // Cyrillic & Greek
const CREDENTIAL_PATH_REGEX = /(?:login|signin|verify|security|password|account|identity|otp|xac-nhan|nhan-thuong|nhan-hoc-bong|dat-coc|kich-hoat)/i;

const CREDENTIAL_PARAM_REGEX = /^(password|passwd|pass|otp|verification_code|verify_code|token|security_code|pin|card|cvv)$/i;

const DANGEROUS_EXTENSIONS = [
  ".exe", ".scr", ".bat", ".cmd", ".ps1", ".apk", ".com", ".vbs",
  ".vbe", ".wsf", ".hta", ".msi", ".dll", ".pif", ".iso", ".dmg"
];

// Critical SSRF Destinations (Loopback & Cloud Metadata)
const HARD_SSRF_TARGETS = [
  /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,         // Loopback
  /^169\.254\.\d{1,3}\.\d{1,3}$/,             // Link-local / Cloud Metadata
  /^0\.0\.0\.0$/,
  /^localhost$/i,
  /\.internal$/i,
  /\.local$/i,
  /\.onion$/i,
];

// Levenshtein Distance Calculator
function levenshtein(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
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
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.PHISHING_PATTERN,
            category: "url",
            severity: SIGNAL_SEVERITY.MEDIUM,
            confidence: 0.50,
            evidence: { snippet: normUrl.original.slice(0, 80), details: "Malformed URL syntax" },
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
    const registrableDomain = BrandRegistry.getRegistrableDomain(hostname);
    const tld = hostname.split(".").pop();

    const parsedStructure = {
      scheme: protocol.replace(":", ""),
      hostname,
      registrableDomain,
      port,
      path: pathname,
      query: search,
      tld,
      isPunycode: hostname.startsWith("xn--") || hostname.includes(".xn--"),
    };

    // 1. SSRF Network Protection Check (Loopback, Cloud Metadata, Localhost)
    for (const pattern of HARD_SSRF_TARGETS) {
      if (pattern.test(hostname)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.SSRF_ATTEMPT,
            category: "network",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: 0.99,
            evidence: { matchedText: hostname, details: "Targeting blocked loopback or cloud metadata endpoint" },
            source: "UrlDetector",
          })
        );
        return { signals, isWhitelisted: false, parsedStructure };
      }
    }

    // 2. Whitelist Verification
    if (BrandRegistry.isWhitelistedDomain(hostname)) {
      isWhitelisted = true;
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.WHITELISTED_DOMAIN,
          category: "url",
          severity: SIGNAL_SEVERITY.INFO,
          confidence: LAYER_1_CONFIG.CONFIDENCE_BOUNDS.WHITELIST_PASS,
          evidence: { matchedText: hostname, details: "Verified authentic higher education / government domain" },
          source: "UrlDetector",
        })
      );
      return { signals, isWhitelisted: true, parsedStructure };
    }

    // 3. Dangerous File Extension in URL Path
    for (const ext of DANGEROUS_EXTENSIONS) {
      if (pathname.endsWith(ext) || pathname.includes(ext + "?")) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.DANGEROUS_EXECUTABLE,
            category: "url",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.KNOWN_MALICIOUS_SIGNATURE,
            evidence: { matchedText: ext, details: `URL directly points to executable payload (${ext})` },
            source: "UrlDetector",
          })
        );
        break;
      }
    }

    // 4. Unicode Homoglyphs & Mixed Script / Punycode
    const hasHomoglyphs = HOMOGLYPH_SCRIPTS_REGEX.test(hostname);
    if (parsedStructure.isPunycode || hasHomoglyphs) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.UNICODE_HOMOGLYPH,
          category: "url",
          severity: SIGNAL_SEVERITY.CRITICAL,
          confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.HOMOGLYPH_BRAND,
          evidence: { matchedText: hostname, details: "Cyrillic/Greek Unicode homoglyph or Punycode deception detected" },
          source: "UrlDetector",
        })
      );
    }

    // 5. Brand Impersonation in Subdomain / Domain
    const impersonation = BrandRegistry.checkBrandImpersonation(hostname);
    if (impersonation) {
      const isSuspiciousTLD = SUSPICIOUS_TLDS.has(tld);
      signals.push(
        createSignal({
          type: impersonation.isSubdomainHijack
            ? LAYER_1_REASONS.BRAND_IMPERSONATION_SUBDOMAIN
            : LAYER_1_REASONS.BRAND_IMPERSONATION,
          category: "url",
          severity: impersonation.isSubdomainHijack || isSuspiciousTLD ? SIGNAL_SEVERITY.CRITICAL : SIGNAL_SEVERITY.HIGH,
          confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.DECEPTIVE_SUBDOMAIN,
          evidence: {
            matchedText: hostname,
            brand: impersonation.brand,
            actualDomain: impersonation.registrableDomain,
            details: `Deceptive brand use: '${impersonation.brand}' outside official domains`,
          },
          source: "UrlDetector",
        })
      );
    }

    // 6. Typosquatting Analysis (Levenshtein distance <= 2 for major domains)
    if (!impersonation) {
      for (const brand of BRAND_REGISTRY) {
        for (const canonical of brand.canonicalDomains) {
          const canonicalBase = canonical.split(".")[0];
          const hostBase = registrableDomain.split(".")[0];
          if (hostBase.length >= 4 && canonicalBase.length >= 4) {
            const dist = levenshtein(hostBase, canonicalBase);
            if (dist >= 1 && dist <= 2) {
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

    // 7. Raw IP Hostname (IPv4 / IPv6) -> SUSPICIOUS
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

    // 8. URL Shortener Detection
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

    // 9. Unencrypted HTTP Transport
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

    // 10. Credential Harvesting Paths
    if (CREDENTIAL_PATH_REGEX.test(pathname)) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.PHISHING_PATH_PATTERN,
          category: "url",
          severity: SIGNAL_SEVERITY.MEDIUM,
          confidence: 0.50,
          evidence: { matchedText: pathname, details: "Path matches sensitive credential/auth endpoint" },
          source: "UrlDetector",
        })
      );
    }

    // 11. Suspicious Query Parameters
    try {
      parsed.searchParams.forEach((val, key) => {
        if (CREDENTIAL_PARAM_REGEX.test(key)) {
          signals.push(
            createSignal({
              type: LAYER_1_REASONS.SUSPICIOUS_QUERY_PARAM,
              category: "url",
              severity: SIGNAL_SEVERITY.HIGH,
              confidence: 0.70,
              evidence: { matchedText: key, details: `Parameter '${key}' matches credential harvest pattern` },
              source: "UrlDetector",
            })
          );
        }
      });
    } catch {
      // searchParams parsing fallback
    }

    // 12. Suspicious TLD alone
    if (SUSPICIOUS_TLDS.has(tld) && !impersonation) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.SUSPICIOUS_TLD,
          category: "url",
          severity: SIGNAL_SEVERITY.LOW,
          confidence: 0.35,
          evidence: { matchedText: `.${tld}`, details: "Low-cost generic TLD frequently observed in spam campaigns" },
          source: "UrlDetector",
        })
      );
    }

    // 13. Unusual Network Port
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
