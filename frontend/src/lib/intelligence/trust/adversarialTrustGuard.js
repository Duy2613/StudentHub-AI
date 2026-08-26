/**
 * StudentHub AI — Adversarial Trust & Prompt Injection Guard V1
 * 
 * Enforces strict boundary isolation between DATA and INSTRUCTION.
 * Prevents direct & indirect prompt injection, citation forgery,
 * and malicious document overrides from polluting the AI Trust Engine.
 */

export class AdversarialTrustGuard {
  static #INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior)\s+instructions/i,
    /system\s+(prompt|override|command|message)/i,
    /reveal\s+(internal|secret|system)\s+key/i,
    /mark\s+this\s+(source|claim|document)\s+(as\s+)?official/i,
    /bỏ\s+qua\s+(mọi\s+)?(hướng\s+dẫn|quy\s+tắc|chỉ\s+thị)/i,
    /coi\s+nguồn\s+này\s+là\s+(chính\s+thức|chuẩn\s+xác)/i,
    /ghi\s+đè\s+quy\s+chế/i,
    /always\s+respond\s+with/i,
    /luôn\s+trả\s+lời\s+rằng/i,
    /you\s+must\s+verify\s+this/i,
    /trust_override\s*=\s*true/i,
    /bypass_verification/i,
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    /javascript:/i
  ];

  /**
   * Scans a text passage or query for adversarial prompt injection attempts
   * @param {string} text 
   * @returns {{ isSafe: boolean, manipulationRisk: number, detectedPatterns: string[], sanitizedText: string }}
   */
  static inspectText(text) {
    if (!text || typeof text !== "string") {
      return {
        isSafe: true,
        manipulationRisk: 0,
        detectedPatterns: [],
        sanitizedText: ""
      };
    }

    const detected = [];
    for (const pattern of this.#INJECTION_PATTERNS) {
      if (pattern.test(text)) {
        detected.push(pattern.source);
      }
    }

    const manipulationRisk = detected.length > 0
      ? Math.min(1.0, 0.4 + (detected.length * 0.3))
      : 0;

    // Neutralize any instruction verbs and treat solely as literal data
    const sanitizedText = text
      .replace(/<\/?script.*?>/gi, "")
      .replace(/javascript:/gi, "");

    return {
      isSafe: detected.length === 0,
      manipulationRisk,
      detectedPatterns: detected,
      sanitizedText
    };
  }

  /**
   * Classifies segments of a retrieved document into DATA CONTENT vs UNTRUSTED INSTRUCTION
   * @param {string} rawDocumentText 
   * @returns {{ contentSpans: string[], rejectedInstructionSpans: string[] }}
   */
  static isolateDocumentData(rawDocumentText) {
    if (!rawDocumentText || typeof rawDocumentText !== "string") {
      return { contentSpans: [], rejectedInstructionSpans: [] };
    }

    const lines = rawDocumentText.split(/\r?\n/);
    const contentSpans = [];
    const rejectedInstructionSpans = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const inspection = this.inspectText(trimmed);
      if (inspection.isSafe) {
        contentSpans.push(trimmed);
      } else {
        rejectedInstructionSpans.push(trimmed);
      }
    }

    return {
      contentSpans,
      rejectedInstructionSpans
    };
  }

  /**
   * Validates whether a citation URL or identifier looks authentic or forged
   * @param {string} urlOrId 
   * @returns {boolean}
   */
  static isValidCitationFormat(urlOrId) {
    if (!urlOrId || typeof urlOrId !== "string") return false;
    const clean = urlOrId.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      try {
        const parsed = new URL(clean);
        return parsed.hostname.endsWith(".edu.vn") || 
               parsed.hostname.endsWith("hcmute.edu.vn") ||
               parsed.hostname === "localhost";
      } catch {
        return false;
      }
    }
    // Document IDs e.g. DOC_HCMUTE_K24_TOEIC, EVID_123
    return /^DOC_[A-Z0-9_-]+$/i.test(clean) || /^EVID_[A-Z0-9_-]+$/i.test(clean) || /^SRC_[A-Z0-9_-]+$/i.test(clean);
  }
}
