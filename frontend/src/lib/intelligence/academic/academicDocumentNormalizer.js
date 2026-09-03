/**
 * StudentHub AI — Canonical Academic Document Normalizer
 * 
 * Enforces Normalization Constitution:
 * - NFKC Unicode normalization & zero-width character stripping.
 * - HTML tag cleaning & structural paragraph preservation.
 * - Computes deterministic rawContentHash and normalizedContentHash via SHA-256.
 * - Extracts structural academic clauses and dates.
 */

import crypto from "node:crypto";

export class AcademicDocumentNormalizer {
  /**
   * Computes deterministic SHA-256 hash of a string
   * @param {string} content 
   * @returns {string} Hex SHA-256 string
   */
  static computeSha256(content = "") {
    if (typeof content !== "string") return "";
    return crypto.createHash("sha256").update(content, "utf-8").digest("hex");
  }

  /**
   * Normalizes document text for change detection and rule extraction
   * @param {string} rawText 
   * @param {object} metadata 
   * @returns {object} NormalizedDocument
   */
  static normalizeDocument(rawText = "", metadata = {}) {
    if (typeof rawText !== "string") {
      rawText = "";
    }

    const rawContentHash = this.computeSha256(rawText);

    // 1. Unicode NFKC Normalization
    let text = rawText.normalize("NFKC");

    // 2. Strip zero-width characters (anti-evasion)
    text = text.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, "");

    // 3. Strip HTML / XML formatting while preserving line breaks
    text = text
      .replace(/<br\s*[\/]?>/gi, "\n")
      .replace(/<\/p>/gi, "\n\n")
      .replace(/<\/div>/gi, "\n")
      .replace(/<\/li>/gi, "\n")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">");

    // 4. Normalize structural whitespace (keep paragraph breaks, collapse intra-line spaces)
    const lines = text
      .split("\n")
      .map(line => line.replace(/[ \t]+/g, " ").trim())
      .filter(line => line.length > 0);

    const normalizedText = lines.join("\n");
    const normalizedContentHash = this.computeSha256(normalizedText);

    // 5. Extract structural clauses and dates
    const extractedDates = [];
    const dateMatches = normalizedText.matchAll(/\b(\d{1,2})[/-](\d{1,2})[/-](\d{4})\b/g);
    for (const match of dateMatches) {
      const day = match[1].padStart(2, "0");
      const month = match[2].padStart(2, "0");
      const year = match[3];
      extractedDates.push({
        raw: match[0],
        isoDate: `${year}-${month}-${day}`
      });
    }

    // Extract official document number if present (e.g. 3116/QĐ-ĐHSPKT)
    const docNumberMatch = normalizedText.match(/(?:quyết định|số|qd|qđ)\s*[:\.]?\s*(\d{1,5}(?:\/[A-ZĐ-]+(?:\.[A-ZĐ-]+)*)?)/i);
    const documentCode = docNumberMatch ? docNumberMatch[1] : null;

    return {
      rawText,
      normalizedText,
      rawContentHash,
      normalizedContentHash,
      lineCount: lines.length,
      charCount: normalizedText.length,
      extractedDates,
      documentCode,
      normalizedAt: new Date().toISOString()
    };
  }
}
