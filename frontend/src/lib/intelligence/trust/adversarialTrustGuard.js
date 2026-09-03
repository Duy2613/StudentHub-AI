/**
 * StudentHub AI — Adversarial Trust & Prompt Injection Guard V2
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
    /set\s+authority/i,
    /hệ\s+thống\s+hãy\s+xác\s+nhận/i,
    /không\s+cần\s+thi\s+tốt\s+nghiệp/i,
    /<system[\s\S]*?>[\s\S]*?<\/system>/i,
    /<script[\s\S]*?>[\s\S]*?<\/script>/i,
    /javascript:/i,
    /(?:do\s+not|don't)\s+follow\s+(?:the\s+)?(?:safety|validation|security)\s+(?:rules|checks)/i,
    /(?:set|return|classify|label)\s+(?:this|the\s+(?:url|source|claim|document|content))\s+as\s+(?:safe|verified|official|trusted)/i,
    /(?:ignore|override|bypass)\s+(?:the\s+)?(?:security|trust|verification|evidence)\s+(?:engine|policy|check|rule)/i,
    /(?:reveal|print|dump|exfiltrate)\s+(?:the\s+)?(?:prompt|system|secret|credential|api\s*key)/i,
  ];

  static inspectText(text) {
    if (text === null || text === undefined || text === "") {
      return {
        isSafe: true,
        isAdversarial: false,
        manipulationRisk: 0,
        detectedPatterns: [],
        sanitizedText: "",
        inputValid: true,
      };
    }

    if (typeof text !== "string") {
      return {
        isSafe: false,
        isAdversarial: false,
        manipulationRisk: 1,
        detectedPatterns: ["INVALID_INPUT_TYPE"],
        sanitizedText: "",
        inputValid: false,
      };
    }

    const normalized = text
      .normalize("NFKC")
      .replace(/[\u200B-\u200D\u2060\uFEFF]/g, "")
      .replace(/[\u0000-\u001F\u007F]/g, " ");

    const detected = [];
    for (const pattern of this.#INJECTION_PATTERNS) {
      pattern.lastIndex = 0;
      if (pattern.test(normalized)) {
        detected.push(pattern.source);
      }
    }

    const manipulationRisk = detected.length > 0
      ? Math.min(1.0, 0.5 + (detected.length * 0.3))
      : 0;

    const sanitizedText = normalized
      .replace(/<\/?(script|system).*?>/gi, "")
      .replace(/javascript:/gi, "");

    return {
      isSafe: detected.length === 0,
      isAdversarial: detected.length > 0,
      manipulationRisk,
      detectedPatterns: detected,
      sanitizedText,
      inputValid: true,
    };
  }

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

  static isValidCitationFormat(urlOrId) {
    if (!urlOrId || typeof urlOrId !== "string") return false;
    const clean = urlOrId.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://")) {
      try {
        const parsed = new URL(clean);
        const hostname = parsed.hostname.toLowerCase().replace(/\.+$/, "");
        // This helper validates format only. It is deliberately conservative:
        // private/local hosts and broad suffix claims are not citations of
        // authority. Authority must come from the Layer 3 registry.
        return parsed.protocol === "https:" &&
          hostname !== "localhost" &&
          !hostname.endsWith(".localhost") &&
          !hostname.endsWith(".internal") &&
          !hostname.endsWith(".local") &&
          !/^(?:127\.|10\.|192\.168\.|169\.254\.)/.test(hostname) &&
          hostname.includes(".");
      } catch {
        return false;
      }
    }
    return /^DOC_[A-Z0-9_-]+$/i.test(clean) || /^EVID_[A-Z0-9_-]+$/i.test(clean) || /^SRC_[A-Z0-9_-]+$/i.test(clean);
  }
}
