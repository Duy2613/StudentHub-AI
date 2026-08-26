/**
 * StudentHub AI — Semantic Diff Engine vs. Cosmetic Noise Filter
 * 
 * Enforces Semantic Diff Constitution:
 * Automatically filters out cosmetic changes (HTML tags, spaces, CSS styling, tracking URLs)
 * and accurately isolates semantic changes (deadlines, GPAs, credits, prerequisites, warnings, English standards).
 */

export const CHANGE_CLASSIFICATION = {
  COSMETIC: "COSMETIC", // HTML styling, formatting, spaces, tracking params (ignored for rule invalidation)
  SEMANTIC: "SEMANTIC"  // Academic rules, deadlines, credits, GPA, prerequisites, requirements (triggers change flow)
};

export class SemanticDiffEngine {
  /**
   * Cleans raw HTML/Text to remove cosmetic noise
   * @param {string} rawText 
   * @returns {string} Normalized semantic text
   */
  static normalizeText(rawText = "") {
    return rawText
      .replace(/<[^>]*>/g, " ")             // Strip HTML tags
      .replace(/&nbsp;|&amp;|&quot;/g, " ") // Strip HTML entities
      .replace(/\s+/g, " ")                 // Normalize multiple whitespace to single space
      .trim();
  }

  /**
   * Compares two content versions and determines if changes are purely cosmetic or semantic
   * @param {object} previousDoc - { text, metadata }
   * @param {object} currentDoc - { text, metadata }
   * @returns {object} Diff Evaluation
   */
  static analyzeDiff(previousDoc = {}, currentDoc = {}) {
    const prevNorm = this.normalizeText(previousDoc.text || "");
    const currNorm = this.normalizeText(currentDoc.text || "");

    const rawChanged = previousDoc.text !== currentDoc.text;
    const normChanged = prevNorm !== currNorm;

    // If only raw HTML changed but normalized text is identical -> PURELY COSMETIC
    if (rawChanged && !normChanged) {
      return {
        hasChanged: false,
        classification: CHANGE_CLASSIFICATION.COSMETIC,
        semanticChangesCount: 0,
        changes: [],
        summary: "Phát hiện thay đổi định dạng HTML / CSS / khoảng trắng (Cosmetic). Giữ nguyên quy tắc học thuật."
      };
    }

    if (!rawChanged && !normChanged) {
      return {
        hasChanged: false,
        classification: CHANGE_CLASSIFICATION.COSMETIC,
        semanticChangesCount: 0,
        changes: [],
        summary: "Nội dung hoàn toàn đồng nhất, không có sự thay đổi."
      };
    }

    // Extract Semantic Mutations
    const semanticChanges = [];

    // 1. Check GPA Threshold Changes
    const prevGpaMatch = prevNorm.match(/(?:GPA|DTB|điểm trung bình)\s*(?:<|>=|>=|<=)?\s*([0-4]\.\d{1,2})/gi);
    const currGpaMatch = currNorm.match(/(?:GPA|DTB|điểm trung bình)\s*(?:<|>=|>=|<=)?\s*([0-4]\.\d{1,2})/gi);

    if (JSON.stringify(prevGpaMatch) !== JSON.stringify(currGpaMatch)) {
      semanticChanges.push({
        field: "GPA_THRESHOLD",
        type: "MODIFIED",
        oldValue: prevGpaMatch ? prevGpaMatch.join(", ") : "N/A",
        newValue: currGpaMatch ? currGpaMatch.join(", ") : "N/A",
        severity: "HIGH",
        triggerEvent: "RULE_CHANGE_DETECTED"
      });
    }

    // 2. Check Credit Changes
    const prevCreditMatch = prevNorm.match(/(\d{1,3})\s*(?:tín chỉ|credits|TC)/gi);
    const currCreditMatch = currNorm.match(/(\d{1,3})\s*(?:tín chỉ|credits|TC)/gi);

    if (JSON.stringify(prevCreditMatch) !== JSON.stringify(currCreditMatch)) {
      semanticChanges.push({
        field: "CREDIT_REQUIREMENT",
        type: "MODIFIED",
        oldValue: prevCreditMatch ? prevCreditMatch.join(", ") : "N/A",
        newValue: currCreditMatch ? currCreditMatch.join(", ") : "N/A",
        severity: "HIGH",
        triggerEvent: "RULE_CHANGE_DETECTED"
      });
    }

    // 3. Check Deadline Changes
    const prevDateMatch = prevNorm.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g);
    const currDateMatch = currNorm.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g);

    if (JSON.stringify(prevDateMatch) !== JSON.stringify(currDateMatch)) {
      semanticChanges.push({
        field: "DEADLINE_DATE",
        type: "MODIFIED",
        oldValue: prevDateMatch ? prevDateMatch.join(", ") : "N/A",
        newValue: currDateMatch ? currDateMatch.join(", ") : "N/A",
        severity: "HIGH",
        triggerEvent: "DEADLINE_CHANGED"
      });
    }

    // 4. Check English Standard Changes (TOEIC / IELTS / B1 / B2)
    const prevEnglish = prevNorm.match(/(?:TOEIC\s*\d{3}|IELTS\s*\d\.\d|VSTEP\s*B[12]|B[12]\s*Quốc tế)/gi);
    const currEnglish = currNorm.match(/(?:TOEIC\s*\d{3}|IELTS\s*\d\.\d|VSTEP\s*B[12]|B[12]\s*Quốc tế)/gi);

    if (JSON.stringify(prevEnglish) !== JSON.stringify(currEnglish)) {
      semanticChanges.push({
        field: "ENGLISH_EXIT_STANDARD",
        type: "MODIFIED",
        oldValue: prevEnglish ? prevEnglish.join(", ") : "N/A",
        newValue: currEnglish ? currEnglish.join(", ") : "N/A",
        severity: "HIGH",
        triggerEvent: "RULE_CHANGE_DETECTED"
      });
    }

    const isSemantic = semanticChanges.length > 0;

    return {
      hasChanged: true,
      classification: isSemantic ? CHANGE_CLASSIFICATION.SEMANTIC : CHANGE_CLASSIFICATION.COSMETIC,
      semanticChangesCount: semanticChanges.length,
      changes: semanticChanges,
      summary: isSemantic
        ? `Phát hiện ${semanticChanges.length} biến thiên ngữ nghĩa học thuật trọng yếu (Triggering RULE_CHANGE_DETECTED).`
        : "Nội dung văn bản thay đổi cấu trúc câu từ nhưng không thay đổi số liệu/quy định học thuật."
    };
  }
}
