/**
 * Layer 3 — EvidenceExtractor
 * 
 * Extracts concise, high-relevance textual passages from candidate sources.
 * Adheres to the rule: "Do not store entire web pages as evidence; extract the smallest relevant passage."
 */

import { LAYER_3_CONFIG } from "../config/Layer3Config.js";

export class EvidenceExtractor {
  /**
   * Extracts the most relevant passage for a claim from text content
   * @param {string} textContent
   * @param {object} claim
   * @returns {string} Extracted concise passage
   */
  static extractRelevantPassage(textContent, claim) {
    if (!textContent || typeof textContent !== "string") return "";

    const sentences = textContent
      .split(/(?<=[.!?\n])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= LAYER_3_CONFIG.LIMITS.MIN_EXCERPT_LENGTH);

    if (sentences.length === 0) return textContent.slice(0, LAYER_3_CONFIG.LIMITS.MAX_EXCERPT_LENGTH);

    const subject = (claim.subject || "").toLowerCase();
    const predicate = (claim.predicate || "").toLowerCase();
    const keywords = `${subject} ${predicate}`.split(/\s+/).filter((w) => w.length > 2);

    let bestSentence = sentences[0];
    let highestScore = -1;

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      let score = 0;

      for (const kw of keywords) {
        if (sentenceLower.includes(kw)) score += 2;
      }

      if (claim.time && sentenceLower.includes(claim.time)) {
        score += 3;
      }

      if (score > highestScore) {
        highestScore = score;
        bestSentence = sentence;
      }
    }

    return bestSentence.slice(0, LAYER_3_CONFIG.LIMITS.MAX_EXCERPT_LENGTH);
  }
}
