/**
 * Layer 1 — Normalization Service
 * 
 * Safely normalizes input URLs, Text, and Binary headers before detection.
 * Defeats evasion techniques (zero-width spaces, leet-speak, spaced letters, mixed Unicode).
 */

import { LAYER_1_CONFIG } from "../config/Layer1Config.js";

// Zero-width & invisible Unicode characters used for evasion
const ZERO_WIDTH_REGEX = /[\u200B-\u200D\uFEFF\u2060\u00AD\u180E]/g;
const ZERO_WIDTH_TEST_REGEX = /[\u200B-\u200D\uFEFF\u2060\u00AD\u180E]/u;
const URL_SCHEME_REGEX = /^([a-z][a-z0-9+.-]*):/i;

// Leet-speak mapping table for secondary normalized stream
const LEET_MAP = {
  "@": "a",
  "4": "a",
  "8": "b",
  "3": "e",
  "1": "i",
  "!": "i",
  "0": "o",
  "5": "s",
  "$": "s",
  "7": "t",
  "+": "t",
};

export class NormalizationService {
  /**
   * Normalizes a URL safely
   * @param {string} rawUrl
   * @returns {object} { original, normalized, parsed, isValid, hasZeroWidthChars, isOverLength }
   */
  static normalizeUrl(rawUrl) {
    const original = typeof rawUrl === "string" ? rawUrl.trim() : "";
    if (!original) {
      return { original: "", normalized: "", parsed: null, isValid: false, invalidReason: "EMPTY_INPUT" };
    }

    const isOverLength = original.length > LAYER_1_CONFIG.LIMITS.MAX_URL_LENGTH;
    const hasZeroWidthChars = ZERO_WIDTH_TEST_REGEX.test(original);

    // Strip zero-width characters and normalize Unicode
    let cleaned = original.replace(ZERO_WIDTH_REGEX, "").normalize("NFKC").trim();

    const explicitScheme = cleaned.match(URL_SCHEME_REGEX)?.[1]?.toLowerCase() || null;
    const isUnsupportedScheme = Boolean(explicitScheme && !["http", "https"].includes(explicitScheme));

    if (isOverLength) {
      return {
        original,
        normalized: cleaned.slice(0, LAYER_1_CONFIG.LIMITS.MAX_URL_LENGTH),
        parsed: null,
        isValid: false,
        isOverLength: true,
        hasZeroWidthChars,
        explicitScheme,
        isUnsupportedScheme,
        invalidReason: "URL_TOO_LONG",
      };
    }

    if (isUnsupportedScheme) {
      return {
        original,
        normalized: cleaned,
        parsed: null,
        isValid: false,
        isOverLength: false,
        hasZeroWidthChars,
        explicitScheme,
        isUnsupportedScheme: true,
        invalidReason: "UNSUPPORTED_SCHEME",
      };
    }

    // Auto-prepend http:// if scheme is missing for structural parsing
    let workingUrl = cleaned;
    const hadExplicitHttpScheme = /^https?:\/\//i.test(workingUrl);
    if (!hadExplicitHttpScheme) {
      workingUrl = "http://" + workingUrl;
    }

    let parsed = null;
    let isValid = false;

    try {
      parsed = new URL(workingUrl);
      isValid = /^https?:$/.test(parsed.protocol) && Boolean(parsed.hostname);
    } catch {
      isValid = false;
    }

    return {
      original,
      normalized: cleaned,
      parsed,
      isValid,
      hasZeroWidthChars,
      isOverLength,
      explicitScheme,
      implicitScheme: !hadExplicitHttpScheme,
      isUnsupportedScheme: false,
      invalidReason: isValid ? null : "MALFORMED_URL",
    };
  }

  /**
   * Normalizes text content and creates an anti-evasion search stream
   * @param {string} rawText
   * @returns {object} { original, normalized, deobfuscated, hasZeroWidthChars, isOverLength }
   */
  static normalizeText(rawText) {
    const original = typeof rawText === "string" ? rawText : "";
    if (!original.trim()) {
      return { original: "", normalized: "", deobfuscated: "", isValid: false };
    }

    const isOverLength = original.length > LAYER_1_CONFIG.LIMITS.MAX_TEXT_LENGTH;
    const hasZeroWidthChars = ZERO_WIDTH_TEST_REGEX.test(original);

    // 1. Replace zero-width characters with spaces if between words, or strip them
    const normalized = original.replace(ZERO_WIDTH_REGEX, " ").normalize("NFKC");

    // 2. Anti-Evasion De-obfuscation Stream:
    // a) Collapse single-letter spaced words: e.g. "p a s s w o r d" -> "password", "N h ậ p" -> "Nhập"
    let deobfuscated = normalized.replace(/(\p{L})\s+(?=\p{L}(?:\s+|$))/gu, "$1");

    // b) De-leet characters (for regex scanning)
    let deLeet = "";
    for (let i = 0; i < deobfuscated.length; i++) {
      const ch = deobfuscated[i];
      deLeet += LEET_MAP[ch] || ch;
    }

    return {
      original,
      normalized,
      deobfuscated: deLeet.toLowerCase(),
      hasZeroWidthChars,
      isOverLength,
      isValid: true,
    };
  }

  /**
   * Normalizes binary byte array / buffer
   * @param {Uint8Array|Array|Buffer|string} bytesInput
   * @param {number} fileSize
   * @returns {object} { bytes, isOverSize, isValid }
   */
  static normalizeBytes(bytesInput, fileSize = 0) {
    const isOverSize = fileSize > LAYER_1_CONFIG.LIMITS.MAX_FILE_SIZE_BYTES;
    let uint8 = null;

    if (bytesInput instanceof Uint8Array) {
      uint8 = bytesInput.slice(0, LAYER_1_CONFIG.LIMITS.MAGIC_BYTES_INSPECT_LENGTH);
    } else if (Array.isArray(bytesInput)) {
      uint8 = new Uint8Array(bytesInput.slice(0, LAYER_1_CONFIG.LIMITS.MAGIC_BYTES_INSPECT_LENGTH));
    } else if (typeof bytesInput === "string" && bytesInput.startsWith("data:")) {
      try {
        const base64Data = bytesInput.split(",")[1];
        if (base64Data) {
          const binaryStr = atob(base64Data.slice(0, 128));
          uint8 = new Uint8Array(binaryStr.length);
          for (let i = 0; i < binaryStr.length; i++) {
            uint8[i] = binaryStr.charCodeAt(i);
          }
        }
      } catch {
        uint8 = null;
      }
    }

    return {
      bytes: uint8,
      isOverSize,
      isValid: Boolean(uint8 && uint8.length >= 4),
    };
  }
}
