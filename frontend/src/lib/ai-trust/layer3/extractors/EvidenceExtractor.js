/**
 * Layer 3 — EvidenceExtractor
 * 
 * Extracts concise, high-relevance textual passages from candidate sources.
 * Adheres to the rule: "Do not store entire web pages as evidence; extract the smallest relevant passage."
 */

import { LAYER_3_CONFIG } from "../config/Layer3Config.js";

const NAVIGATION_WORDS = new Set([
  "accessibility", "about", "careers", "close", "contact", "home", "join", "log", "login", "menu",
  "navigation", "nist", "publications", "register", "resources", "search", "sign", "skip", "sitemap",
]);
const QUERY_STOP_WORDS = new Set(["and", "for", "from", "http", "https", "the", "this", "that", "with", "www"]);
const URL_PATH_STOP_WORDS = new Set(["article", "detail", "home", "index", "news", "page", "post", "resource", "story", "view"]);

function extractionKeywordProfile(value) {
  const urlPathKeywords = [];
  const withoutUrls = String(value || "").replace(/https?:\/\/[^\s<>'"`]+/gi, (rawUrl) => {
    try {
      const parsed = new URL(rawUrl.replace(/[),.;!?]+$/g, ""));
      urlPathKeywords.push(...decodeURIComponent(parsed.pathname)
        .toLocaleLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .split(/\s+/)
        .filter((word) => word.length > 2 && !QUERY_STOP_WORDS.has(word) && !URL_PATH_STOP_WORDS.has(word)));
      return " ";
    } catch {
      return " ";
    }
  });
  const naturalKeywords = withoutUrls
    .toLocaleLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 2 && !QUERY_STOP_WORDS.has(word));
  const uniqueUrlPathKeywords = Array.from(new Set(urlPathKeywords));
  return {
    keywords: Array.from(new Set([...naturalKeywords, ...uniqueUrlPathKeywords])),
    minimumMatches: naturalKeywords.length > 0 || uniqueUrlPathKeywords.length > 0 ? 1 : 0,
  };
}

function isNavigationBoilerplate(sentence) {
  const normalized = sentence.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, " ").replace(/\s+/g, " ").trim();
  const words = normalized.split(" ").filter(Boolean);
  if (words.length === 0) return true;
  if (/^(skip to (main )?content|open main menu|close main menu|search this site)$/.test(normalized)) return true;
  const navigationWordCount = words.filter((word) => NAVIGATION_WORDS.has(word)).length;
  return navigationWordCount >= 3 || (navigationWordCount >= 2 && navigationWordCount / words.length >= 0.35);
}

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
      .filter((s) => s.length >= LAYER_3_CONFIG.LIMITS.MIN_EXCERPT_LENGTH && !isNavigationBoilerplate(s));

    if (sentences.length === 0) return "";

    const keywordProfile = extractionKeywordProfile(`${claim.subject || ""} ${claim.predicate || ""} ${claim.rawText || ""}`);
    const { keywords } = keywordProfile;

    let bestSentence = "";
    let highestScore = -1;
    let bestLength = -1;
    let bestMatchCount = 0;
    let bestCompleteSentence = false;

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const completeSentence = /[.!?][\"'”’)}\]]*$/.test(sentence) && !sentence.includes(":");
      let score = 0;
      let matchCount = 0;

      for (const kw of keywords) {
        if (sentenceLower.includes(kw)) {
          score += 2;
          matchCount += 1;
        }
      }

      if (claim.time && sentenceLower.includes(claim.time)) {
        score += 3;
      }

      if (score > highestScore ||
          (score === highestScore && completeSentence && !bestCompleteSentence) ||
          (score === highestScore && completeSentence === bestCompleteSentence && sentence.length > bestLength)) {
        highestScore = score;
        bestLength = sentence.length;
        bestMatchCount = matchCount;
        bestCompleteSentence = completeSentence;
        bestSentence = sentence;
      }
    }

    if (keywordProfile.minimumMatches > 0 && bestMatchCount < keywordProfile.minimumMatches) return "";

    return bestSentence.slice(0, LAYER_3_CONFIG.LIMITS.MAX_EXCERPT_LENGTH);
  }
}
