// frontend/src/lib/intelligence/academic/DeadlineExtractionService.js
//
// Provenance-backed deadline extraction service for Vietnamese university announcements.
// Enforces strict verification semantics:
// - Extracts explicit deadlines with date pattern and time pattern in context
// - Never invents or guesses artificial deadlines
// - Defaults strictly to displayText: "Chưa xác định hạn chót" when unverified

export const EXTRACTION_METHODS = Object.freeze({
  EXPLICIT_FIELD: "EXPLICIT_FIELD",
  REGEX_DATE_EXTRACTION: "REGEX_DATE_EXTRACTION",
  UNVERIFIED: "UNVERIFIED",
});

export const VERIFIED_STATUS = Object.freeze({
  VERIFIED: "VERIFIED",
  UNVERIFIED: "UNVERIFIED",
});

export class DeadlineExtractionService {
  /**
   * Extracts deadline from text or structured fields.
   *
   * @param {object} input - { text?: string, rawDeadline?: string|Date, explicitDeadline?: string }
   * @returns {object} {
   *   hasDeadline: boolean,
   *   deadlineIso: string | null,
   *   displayText: string,
   *   rawSnippet: string | null,
   *   method: string,
   *   confidence: number,
   *   verifiedStatus: string
   * }
   */
  static extractDeadline({ text = "", rawDeadline = null, explicitDeadline = null } = {}) {
    // 1. Check explicit deadline field first
    if (explicitDeadline) {
      const parsed = this._parseIsoOrDate(explicitDeadline);
      if (parsed) {
        return {
          hasDeadline: true,
          deadlineIso: parsed.toISOString(),
          displayText: this._formatVietnameseDate(parsed),
          rawSnippet: String(explicitDeadline),
          method: EXTRACTION_METHODS.EXPLICIT_FIELD,
          confidence: 1.0,
          verifiedStatus: VERIFIED_STATUS.VERIFIED,
        };
      }
    }

    if (rawDeadline instanceof Date && !isNaN(rawDeadline.getTime())) {
      return {
        hasDeadline: true,
        deadlineIso: rawDeadline.toISOString(),
        displayText: this._formatVietnameseDate(rawDeadline),
        rawSnippet: rawDeadline.toISOString(),
        method: EXTRACTION_METHODS.EXPLICIT_FIELD,
        confidence: 1.0,
        verifiedStatus: VERIFIED_STATUS.VERIFIED,
      };
    }

    if (!text || typeof text !== "string") {
      return this._unverifiedResult();
    }

    // 2. Regex matching for Vietnamese deadline phrasing
    // Patterns:
    // "hạn chót: 17h00 ngày 25/09/2026"
    // "hạn chót đến ngày 15-10-2026"
    // "trước 17:00 ngày 30/11/2026"
    // "hết hạn vào ngày 05/12/2026"
    // "thời gian nộp hồ sơ: từ ... đến hết ngày 20/10/2026"
    const deadlineKeywords = /(?:hạn\s*chót(?:\s*đến)?|hạn\s*cuối|thời\s*hạn(?:\s*(?:nộp|đăng\s*ký))?|trước|đến\s*hết|đến|hết\s*hạn(?:\s*vào)?)[\s:]*(?:(\d{1,2})[h:](\d{2})?\s*)?(?:ngày\s*)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/i;

    const match = text.match(deadlineKeywords);
    if (match) {
      const rawSnippet = match[0];
      const hourStr = match[1];
      const minuteStr = match[2];
      const day = parseInt(match[3], 10);
      const month = parseInt(match[4], 10) - 1; // 0-indexed month
      const year = parseInt(match[5], 10);

      // Validate date ranges
      if (year >= 2024 && year <= 2035 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
        const hour = hourStr !== undefined ? parseInt(hourStr, 10) : 23;
        const minute = minuteStr !== undefined ? parseInt(minuteStr, 10) : (hourStr !== undefined ? 0 : 59);

        // Academic announcements in Vietnam are in UTC+7
        const date = new Date(Date.UTC(year, month, day, hour - 7, minute, 0));

        if (!isNaN(date.getTime())) {
          return {
            hasDeadline: true,
            deadlineIso: date.toISOString(),
            displayText: `${this._formatVietnameseDate(date)}${hourStr !== undefined ? ` (${hour}h${minute.toString().padStart(2, "0")})` : ""}`,
            rawSnippet,
            method: EXTRACTION_METHODS.REGEX_DATE_EXTRACTION,
            confidence: 0.95,
            verifiedStatus: VERIFIED_STATUS.VERIFIED,
          };
        }
      }
    }

    // 3. Fallback: Secondary standalone date match ONLY if text explicitly contains "hạn" or "deadline"
    if (/\b(?:hạn|deadline)\b/i.test(text)) {
      const standaloneDateRegex = /(?:ngày\s*)?(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})/;
      const altMatch = text.match(standaloneDateRegex);
      if (altMatch) {
        const day = parseInt(altMatch[1], 10);
        const month = parseInt(altMatch[2], 10) - 1;
        const year = parseInt(altMatch[3], 10);
        if (year >= 2024 && year <= 2035 && month >= 0 && month <= 11 && day >= 1 && day <= 31) {
          const date = new Date(Date.UTC(year, month, day, 23 - 7, 59, 59));
          if (!isNaN(date.getTime())) {
            return {
              hasDeadline: true,
              deadlineIso: date.toISOString(),
              displayText: this._formatVietnameseDate(date),
              rawSnippet: altMatch[0],
              method: EXTRACTION_METHODS.REGEX_DATE_EXTRACTION,
              confidence: 0.75,
              verifiedStatus: VERIFIED_STATUS.VERIFIED,
            };
          }
        }
      }
    }

    // 4. If no verified date found, strictly return "Chưa xác định hạn chót"
    return this._unverifiedResult();
  }

  static _unverifiedResult() {
    return {
      hasDeadline: false,
      deadlineIso: null,
      displayText: "Chưa xác định hạn chót",
      rawSnippet: null,
      method: EXTRACTION_METHODS.UNVERIFIED,
      confidence: 0,
      verifiedStatus: VERIFIED_STATUS.UNVERIFIED,
    };
  }

  static _parseIsoOrDate(input) {
    if (!input) return null;
    const date = new Date(input);
    return isNaN(date.getTime()) ? null : date;
  }

  static _formatVietnameseDate(date) {
    // Format to dd/mm/yyyy in Asia/Ho_Chi_Minh timezone
    return new Intl.DateTimeFormat("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }
}
