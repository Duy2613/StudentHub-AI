/**
 * StudentHub AI — ContentItemNormalizer V1
 * 
 * Normalizes multi-platform raw content into unified typed ContentItem aggregates.
 * Supports Vietnamese-first linguistic normalization, slang expansion,
 * and entity linking while strictly preserving raw text provenance.
 */

import { EntityResolutionEngine } from "./EntityResolutionEngine.js";
import { SOURCE_CLASSIFICATION } from "./ISourceConnector.js";
import { createSecureId } from "../../security/secureId.js";

export class ContentItemNormalizer {
  // Common Vietnamese academic slang dictionary
  static #slangDictionary = {
    "đkhp": "đăng ký học phần",
    "dkhp": "đăng ký học phần",
    "sv": "sinh viên",
    "pđt": "phòng đào tạo",
    "pdt": "phòng đào tạo",
    "tài liệu": "tài liệu",
    "tkb": "thời khóa biểu",
    "gpa": "điểm trung bình tích lũy",
    "kltn": "khóa luận tốt nghiệp",
    "đatn": "đồ án tốt nghiệp",
    "ktpm": "kỹ thuật phần mềm",
    "cntt": "công nghệ thông tin"
  };

  /**
   * Normalizes raw text by expanding common academic abbreviations
   * @param {string} text 
   * @returns {string} Normalized text string
   */
  static normalizeText(text = "") {
    if (!text || typeof text !== "string") return "";

    let normalized = text.trim();
    for (const [slang, full] of Object.entries(this.#slangDictionary)) {
      const regex = new RegExp(`(^|[^a-zA-Z0-9_À-ỹ])${slang}([^a-zA-Z0-9_À-ỹ]|$)`, "gi");
      normalized = normalized.replace(regex, `$1${full}$2`);
    }

    return normalized;
  }

  /**
   * Detects language of the content
   * @param {string} text 
   * @returns {"vi"|"en"|"bilingual"}
   */
  static detectLanguage(text = "") {
    const vietnameseAccentsRegex = /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđ]/i;
    const hasVietnamese = vietnameseAccentsRegex.test(text);

    // Simple heuristic for English keywords
    const englishWords = ["course", "exam", "grade", "professor", "deadline", "schedule", "registration"];
    const lower = text.toLowerCase();
    const hasEnglish = englishWords.some(w => lower.includes(w));

    if (hasVietnamese && hasEnglish) return "bilingual";
    if (hasVietnamese) return "vi";
    return "en";
  }

  /**
   * Normalizes a raw payload into a canonical ContentItem
   * @param {object} rawPayload
   * @param {object} [context]
   * @returns {object} Canonical ContentItem
   */
  static normalize(rawPayload = {}, context = {}) {
    const rawText = (rawPayload.content || rawPayload.text || rawPayload.body || rawPayload.title || "").trim();
    const rawId = rawPayload.rawId || rawPayload.id || createSecureId("raw");
    const sourceId = context.sourceId || rawPayload.sourceId || "src_unknown";
    const connectorId = context.connectorId || rawPayload.connectorId || "connector_general";
    const sourceClassification = context.sourceClassification || rawPayload.sourceClassification || SOURCE_CLASSIFICATION.SOCIAL;

    const publishedAt = rawPayload.publishedAt 
      ? new Date(rawPayload.publishedAt).toISOString() 
      : new Date().toISOString();

    const normalizedText = this.normalizeText(rawText);
    const language = this.detectLanguage(rawText);
    const linkedEntities = EntityResolutionEngine.resolveEntities(rawText);

    return Object.freeze({
      contentId: createSecureId("ci"),
      rawId: String(rawId),
      sourceId: String(sourceId),
      connectorId: String(connectorId),
      sourceClassification,
      author: {
        authorId: rawPayload.authorId || rawPayload.author || "anonymous_contributor",
        authorName: rawPayload.authorName || rawPayload.author || "Thành viên cộng đồng",
        authorRole: rawPayload.authorRole || "STUDENT"
      },
      publishedAt,
      retrievedAt: new Date().toISOString(),
      language,
      rawText,
      normalizedText,
      linkedEntities: Object.freeze(linkedEntities),
      mediaUrls: Object.freeze(rawPayload.mediaUrls || []),
      url: rawPayload.url || null
    });
  }
}
