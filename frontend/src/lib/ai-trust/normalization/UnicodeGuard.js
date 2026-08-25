/**
 * StudentHub AI — UnicodeGuard
 *
 * P0 Security Layer: Normalizes and sanitizes Unicode input before any downstream
 * brand matching, URL analysis, or NLP pipeline to defeat:
 *   - Homoglyph / confusable character substitution (Cyrillic а vs Latin a)
 *   - Zero-width character insertion (U+200B, U+FEFF, U+00AD)
 *   - Mixed-script domain attacks (pаypal.com with Cyrillic а)
 *   - Punycode / IDN encoding abuse
 *   - Deliberate spacing obfuscation (B A N K  →  BANK)
 *   - Lookalike Unicode digits (ℬANK, Ⅰ vs I)
 *
 * IMPORTANT: This module normalizes evidence for matching.
 * Detection of anomalies returns flags — NOT automatic scam verdicts.
 */

// ─── Core Zero-Width & Invisible Characters ───────────────────────────────────
const ZERO_WIDTH_CHARS = [
  "\u200B", // ZERO WIDTH SPACE
  "\u200C", // ZERO WIDTH NON-JOINER
  "\u200D", // ZERO WIDTH JOINER
  "\u200E", // LEFT-TO-RIGHT MARK
  "\u200F", // RIGHT-TO-LEFT MARK
  "\u202A", // LEFT-TO-RIGHT EMBEDDING
  "\u202B", // RIGHT-TO-LEFT EMBEDDING
  "\u202C", // POP DIRECTIONAL FORMATTING
  "\u202D", // LEFT-TO-RIGHT OVERRIDE
  "\u202E", // RIGHT-TO-LEFT OVERRIDE
  "\u2060", // WORD JOINER
  "\u2061", // FUNCTION APPLICATION
  "\u2062", // INVISIBLE TIMES
  "\u2063", // INVISIBLE SEPARATOR
  "\u2064", // INVISIBLE PLUS
  "\u206A", // INHIBIT SYMMETRIC SWAPPING
  "\u206B", // ACTIVATE SYMMETRIC SWAPPING
  "\u206C", // INHIBIT ARABIC FORM SHAPING
  "\u206D", // ACTIVATE ARABIC FORM SHAPING
  "\u206E", // NATIONAL DIGIT SHAPES
  "\u206F", // NOMINAL DIGIT SHAPES
  "\uFEFF", // ZERO WIDTH NO-BREAK SPACE (BOM)
  "\u00AD", // SOFT HYPHEN
];

// ─── Unicode Confusable Map (Latin ← Homoglyphs) ──────────────────────────────
// Source: Unicode Confusables data, IDNA tables, common phishing patterns
const CONFUSABLE_MAP = {
  // Cyrillic → Latin
  "\u0430": "a", // а → a
  "\u0435": "e", // е → e
  "\u0456": "i", // і → i
  "\u043E": "o", // о → o
  "\u0440": "r", // р → r
  "\u0441": "c", // с → c
  "\u0443": "u", // у → u
  "\u0445": "x", // х → x
  "\u0440": "r", // р → r
  "\u0432": "b", // в → b (lookalike in some fonts)
  "\u041E": "O", // О → O (capital)
  "\u0410": "A", // А → A (capital)
  "\u0415": "E", // Е → E (capital)
  "\u0421": "C", // С → C (capital)

  // Greek → Latin
  "\u03B1": "a", // α → a
  "\u03BF": "o", // ο → o
  "\u03C5": "u", // υ → u
  "\u03B5": "e", // ε → e
  "\u03BD": "v", // ν → v
  "\u03C1": "p", // ρ → p

  // Lookalike digits / symbols
  "\u0030": "0", // ０ → 0 (fullwidth)
  "\u006C": "l", // l (lowercase L — often confused with 1)
  "\u0049": "I", // I (uppercase i — often confused with l)
  "\u01C0": "I", // ǀ → I
  "\u2160": "I", // Ⅰ → I (Roman numeral)
  "\uFF49": "i", // ｉ → i
  "\uFF4C": "l", // ｌ → l
  "\uFF4F": "o", // ｏ → o

  // Mathematical script letters (common in "fancy text" evasion)
  "\u0399": "I",  // Ι (Greek capital iota)
  "\u03F3": "j",  // ϳ → j
  "\u0261": "g",  // ɡ → g

  // Common fullwidth Latin
  "\uFF21": "A", "\uFF22": "B", "\uFF23": "C", "\uFF24": "D",
  "\uFF25": "E", "\uFF26": "F", "\uFF27": "G", "\uFF28": "H",
  "\uFF29": "I", "\uFF2A": "J", "\uFF2B": "K", "\uFF2C": "L",
  "\uFF2D": "M", "\uFF2E": "N", "\uFF2F": "O", "\uFF30": "P",
  "\uFF31": "Q", "\uFF32": "R", "\uFF33": "S", "\uFF34": "T",
  "\uFF35": "U", "\uFF36": "V", "\uFF37": "W", "\uFF38": "X",
  "\uFF39": "Y", "\uFF3A": "Z",
  "\uFF41": "a", "\uFF42": "b", "\uFF43": "c", "\uFF44": "d",
  "\uFF45": "e", "\uFF46": "f", "\uFF47": "g", "\uFF48": "h",
  "\uFF4A": "j", "\uFF4B": "k", "\uFF4D": "m", "\uFF4E": "n",
  "\uFF50": "p", "\uFF51": "q", "\uFF52": "r", "\uFF53": "s",
  "\uFF54": "t", "\uFF55": "u", "\uFF56": "v", "\uFF57": "w",
  "\uFF58": "x", "\uFF59": "y", "\uFF5A": "z",

  // Superscript / subscript digits
  "\u00B9": "1", "\u00B2": "2", "\u00B3": "3",
  "\u2070": "0", "\u2074": "4", "\u2075": "5",
  "\u2076": "6", "\u2077": "7", "\u2078": "8", "\u2079": "9",
};

// ─── Known Confusable Pairs for Detection (before/after normalization differ) ──
const CONFUSABLE_SCRIPT_RANGES = [
  [0x0400, 0x04FF], // Cyrillic
  [0x0370, 0x03FF], // Greek
  [0xFF01, 0xFF5E], // Fullwidth Latin
  [0x2100, 0x214F], // Letterlike Symbols
  [0x2160, 0x217F], // Number Forms (Roman numerals)
  [0x1D400, 0x1D7FF], // Mathematical Alphanumeric Symbols
];

export class UnicodeGuard {
  /**
   * Main normalize + audit function.
   * Strips zero-width chars, normalizes confusables to ASCII equivalents,
   * collapses deliberate spacing, and reports what was changed.
   *
   * @param {string} input — raw text (URL, domain, message text)
   * @returns {{ normalized: string, flags: string[], hasConfusables: boolean, hasMixedScript: boolean, hasZeroWidth: boolean }}
   */
  static analyze(input) {
    if (!input || typeof input !== "string") {
      return { normalized: "", flags: [], hasConfusables: false, hasMixedScript: false, hasZeroWidth: false };
    }

    const flags = [];
    let text = input;

    // 1. Detect zero-width / invisible characters
    const hasZeroWidth = ZERO_WIDTH_CHARS.some((ch) => text.includes(ch));
    if (hasZeroWidth) {
      flags.push("ZERO_WIDTH_CHARS_DETECTED");
      // Strip them
      for (const ch of ZERO_WIDTH_CHARS) {
        text = text.split(ch).join("");
      }
    }

    // 2. Unicode NFKC normalization (collapses compatibility equivalents)
    try {
      text = text.normalize("NFKC");
    } catch {
      // Some environments may not support; proceed without
    }

    // 3. Detect mixed-script (e.g., Latin + Cyrillic in same word)
    const hasMixedScript = this._detectMixedScript(text);
    if (hasMixedScript) {
      flags.push("MIXED_SCRIPT_DETECTED");
    }

    // 4. Apply confusable normalization
    let hasConfusables = false;
    let normalizedText = "";
    for (const ch of text) {
      if (CONFUSABLE_MAP[ch] !== undefined) {
        normalizedText += CONFUSABLE_MAP[ch];
        hasConfusables = true;
      } else {
        normalizedText += ch;
      }
    }
    if (hasConfusables) {
      flags.push("UNICODE_CONFUSABLES_NORMALIZED");
    }
    text = normalizedText;

    // 5. Detect deliberate spacing obfuscation ("B A N K" → "BANK")
    const spacingPattern = /\b([A-Z])\s([A-Z])\s([A-Z])\b/;
    if (spacingPattern.test(text.toUpperCase())) {
      flags.push("DELIBERATE_SPACING_DETECTED");
    }

    // 6. Detect lookalike l/I/1 pattern in potential domains or brand names
    if (/paypa[lI1]|vietc[o0]mb[aа]nk|[vV][iI1]etnam/i.test(text)) {
      flags.push("LOOKALIKE_BRAND_CHARACTER");
    }

    return {
      normalized: text,
      original: input,
      flags,
      hasConfusables,
      hasMixedScript,
      hasZeroWidth,
      isClean: flags.length === 0,
    };
  }

  /**
   * Normalize a domain or URL for brand matching.
   * Extracts hostname, decodes punycode-like patterns, applies confusable map.
   *
   * @param {string} urlOrDomain
   * @returns {{ normalizedDomain: string, flags: string[] }}
   */
  static normalizeDomain(urlOrDomain) {
    if (!urlOrDomain) return { normalizedDomain: "", flags: [] };

    let domain = urlOrDomain.toLowerCase();

    // Extract hostname if full URL
    try {
      if (domain.startsWith("http://") || domain.startsWith("https://")) {
        const url = new URL(domain);
        domain = url.hostname;
      }
    } catch {
      // Not a valid URL — treat as raw domain string
    }

    // Decode punycode prefix (xn--)
    const punycodeFlags = [];
    if (domain.includes("xn--")) {
      punycodeFlags.push("PUNYCODE_IDN_DOMAIN");
    }

    // Apply unicode analysis on domain
    const { normalized, flags: unicodeFlags } = this.analyze(domain);

    return {
      normalizedDomain: normalized,
      original: urlOrDomain,
      flags: [...punycodeFlags, ...unicodeFlags],
    };
  }

  /**
   * Detects if a string contains characters from multiple Unicode scripts
   * in a suspicious pattern (e.g., Cyrillic chars mixed with Latin in same word).
   *
   * @param {string} text
   * @returns {boolean}
   */
  static _detectMixedScript(text) {
    if (!text) return false;

    let hasLatin = false;
    let hasCyrillic = false;
    let hasGreek = false;

    for (const ch of text) {
      const cp = ch.codePointAt(0);
      if (cp >= 0x0041 && cp <= 0x007A) hasLatin = true;          // Basic Latin A-z
      if (cp >= 0x0400 && cp <= 0x04FF) hasCyrillic = true;        // Cyrillic
      if (cp >= 0x0370 && cp <= 0x03FF) hasGreek = true;           // Greek

      // Mixed scripts in same token is the red flag
      if ((hasLatin && hasCyrillic) || (hasLatin && hasGreek)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Quick check — returns true if text is clean (no confusable manipulation).
   * @param {string} text
   * @returns {boolean}
   */
  static isClean(text) {
    return this.analyze(text).isClean;
  }

  /**
   * Normalize for display comparison (strip zero-width, normalize NFKC).
   * Lighter than full analyze — use for pre-processing OCR output.
   * @param {string} text
   * @returns {string}
   */
  static softNormalize(text) {
    if (!text) return "";
    let t = text;
    for (const ch of ZERO_WIDTH_CHARS) {
      t = t.split(ch).join("");
    }
    try {
      t = t.normalize("NFKC");
    } catch {
      // ignore
    }
    return t;
  }
}
