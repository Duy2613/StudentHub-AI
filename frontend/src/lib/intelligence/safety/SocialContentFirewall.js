/**
 * StudentHub AI — SocialContentFirewall V1
 * 
 * Sanitizes external untrusted social & community content before feeding into AI RAG context.
 * Detects prompt injections, indirect jailbreaks, and wraps content strictly as passive data.
 * Core Principle: External Content is DATA, NEVER an INSTRUCTION.
 */

export class SocialContentFirewall {
  // Known prompt injection / indirect jailbreak trigger patterns
  static #injectionPatterns = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /bỏ\s+qua\s+(toàn\s+bộ\s+)?(hướng\s+dẫn|chỉ\s+thị|quy\s+tắc)\s+trước\s+đó/i,
    /disregard\s+(the\s+)?system\s+prompt/i,
    /you\s+are\s+now\s+in\s+(developer|unrestricted|god)\s+mode/i,
    /act\s+as\s+(root|superuser|admin|system\s+administrator)/i,
    /reveal\s+(the\s+)?(secret|password|api\s+key|prompt)/i,
    /lộ\s+(mật\s+khẩu|khóa\s+bảo\s+mật|cấu\s+trúc\s+hệ\s+thống)/i,
    /send\s+all\s+data\s+to\s+https?:\/\//i
  ];

  /**
   * Scans text for potential prompt injection or jailbreak attempts
   * @param {string} text 
   * @returns {{ hasInjection: boolean, matchedPattern: string|null, riskScore: number }}
   */
  static inspectPromptInjection(text = "") {
    if (!text || typeof text !== "string") {
      return { hasInjection: false, matchedPattern: null, riskScore: 0.0 };
    }

    for (const pattern of this.#injectionPatterns) {
      if (pattern.test(text)) {
        return {
          hasInjection: true,
          matchedPattern: pattern.toString(),
          riskScore: 0.99
        };
      }
    }

    return {
      hasInjection: false,
      matchedPattern: null,
      riskScore: 0.05
    };
  }

  /**
   * Sanitizes raw untrusted text (stripping dangerous control characters and script tags)
   * @param {string} text 
   * @returns {string} Cleaned text
   */
  static sanitizeText(text = "") {
    if (!text || typeof text !== "string") return "";

    let cleaned = text
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "[REMOVED_SCRIPT]")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "[REMOVED_STYLE]")
      .replace(/javascript:/gi, "blocked_js:")
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ""); // Remove invisible control chars

    return cleaned.trim();
  }

  /**
   * Encapsulates untrusted content into safe, isolated boundary wrapper for LLM consumption
   * @param {object} contentItem 
   * @returns {object} IsolatedAIContextItem
   */
  static wrapForAIContext(contentItem) {
    const raw = contentItem.rawText || contentItem.normalizedText || "";
    const sanitized = this.sanitizeText(raw);
    const injectionCheck = this.inspectPromptInjection(sanitized);

    if (injectionCheck.hasInjection) {
      // Content quarantined! Redacted to safe alert description
      return Object.freeze({
        contentId: contentItem.contentId,
        sourceType: "QUARANTINED_UNTRUSTED_CONTENT",
        safeText: `[BẢO MẬT: Nội dung từ nguồn bên ngoài đã bị cách ly do chứa câu lệnh can thiệp hệ thống (Pattern: ${injectionCheck.matchedPattern})].`,
        isQuarantined: true,
        riskScore: injectionCheck.riskScore
      });
    }

    // Wrap in non-executable passive data envelope
    const safeWrapped = `<untrusted_external_content is_instruction="false" provenance_id="${contentItem.contentId}">\n${sanitized}\n</untrusted_external_content>`;

    return Object.freeze({
      contentId: contentItem.contentId,
      sourceType: contentItem.sourceClassification || "SOCIAL",
      safeText: safeWrapped,
      isQuarantined: false,
      riskScore: injectionCheck.riskScore
    });
  }
}
