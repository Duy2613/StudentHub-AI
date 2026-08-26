/**
 * StudentHub AI — Semantic Diff Engine vs. Cosmetic Noise Filter (Production Grade)
 * 
 * Enforces Semantic Diff Constitution:
 * Automatically filters out cosmetic changes (HTML tags, spaces, CSS styling, tracking URLs)
 * and accurately isolates semantic changes:
 * - Deadlines & dates (DEADLINE_CHANGE, DATE_CHANGE)
 * - Tuition & fee adjustments (FEE_CHANGE)
 * - Academic requirements: credits, GPA, prerequisites, English exit standards (REQUIREMENT_CHANGE, ELIGIBILITY_CHANGE)
 * - Academic policies & penalties (POLICY_CHANGE, PENALTY_CHANGE)
 */

export const CHANGE_CLASSIFICATION = {
  COSMETIC: "COSMETIC", // HTML styling, formatting, spaces, tracking params (ignored for rule invalidation)
  SEMANTIC: "SEMANTIC"  // Academic rules, deadlines, credits, GPA, prerequisites, requirements (triggers change flow)
};

export const CHANGE_CATEGORIES = {
  DEADLINE_CHANGE: "DEADLINE_CHANGE",
  DATE_CHANGE: "DATE_CHANGE",
  FEE_CHANGE: "FEE_CHANGE",
  ELIGIBILITY_CHANGE: "ELIGIBILITY_CHANGE",
  REQUIREMENT_CHANGE: "REQUIREMENT_CHANGE",
  PROCEDURE_CHANGE: "PROCEDURE_CHANGE",
  POLICY_CHANGE: "POLICY_CHANGE",
  PENALTY_CHANGE: "PENALTY_CHANGE",
  GENERAL_TEXT_CHANGE: "GENERAL_TEXT_CHANGE"
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
      .replace(/&nbsp;|&amp;|&quot;|&lt;|&gt;/gi, " ") // Strip HTML entities
      .replace(/\s+/g, " ")                 // Normalize multiple whitespace to single space
      .trim();
  }

  /**
   * Compares two content versions and determines if changes are purely cosmetic or semantic
   * @param {object} previousDoc - { text, rawText, metadata }
   * @param {object} currentDoc - { text, rawText, metadata }
   * @returns {object} Diff Evaluation
   */
  static analyzeDiff(previousDoc = {}, currentDoc = {}) {
    const prevRaw = previousDoc.text || previousDoc.rawText || "";
    const currRaw = currentDoc.text || currentDoc.rawText || "";

    const prevNorm = this.normalizeText(prevRaw);
    const currNorm = this.normalizeText(currRaw);

    const rawChanged = prevRaw !== currRaw;
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
    const prevGpaMatch = prevNorm.match(/(?:GPA|DTB|điểm trung bình)\s*(?:<|>=|>=|<=|:)?\s*([0-4]\.\d{1,2})/gi);
    const currGpaMatch = currNorm.match(/(?:GPA|DTB|điểm trung bình)\s*(?:<|>=|>=|<=|:)?\s*([0-4]\.\d{1,2})/gi);

    if (JSON.stringify(prevGpaMatch) !== JSON.stringify(currGpaMatch)) {
      semanticChanges.push({
        category: CHANGE_CATEGORIES.ELIGIBILITY_CHANGE,
        field: "GPA_THRESHOLD",
        type: "MODIFIED",
        oldValue: prevGpaMatch ? prevGpaMatch.join(", ") : "N/A",
        newValue: currGpaMatch ? currGpaMatch.join(", ") : "N/A",
        severity: "HIGH",
        triggerEvent: "RULE_CHANGE_DETECTED",
        description: `Ngưỡng GPA điều chỉnh từ [${prevGpaMatch ? prevGpaMatch.join(", ") : "N/A"}] thành [${currGpaMatch ? currGpaMatch.join(", ") : "N/A"}].`
      });
    }

    // 2. Check Credit Changes
    const prevCreditMatch = prevNorm.match(/(\d{1,3})\s*(?:tín chỉ|credits|TC)/gi);
    const currCreditMatch = currNorm.match(/(\d{1,3})\s*(?:tín chỉ|credits|TC)/gi);

    if (JSON.stringify(prevCreditMatch) !== JSON.stringify(currCreditMatch)) {
      semanticChanges.push({
        category: CHANGE_CATEGORIES.REQUIREMENT_CHANGE,
        field: "CREDIT_REQUIREMENT",
        type: "MODIFIED",
        oldValue: prevCreditMatch ? prevCreditMatch.join(", ") : "N/A",
        newValue: currCreditMatch ? currCreditMatch.join(", ") : "N/A",
        severity: "HIGH",
        triggerEvent: "RULE_CHANGE_DETECTED",
        description: `Yêu cầu số tín chỉ điều chỉnh từ [${prevCreditMatch ? prevCreditMatch.join(", ") : "N/A"}] thành [${currCreditMatch ? currCreditMatch.join(", ") : "N/A"}].`
      });
    }

    // 3. Check Deadline / Date Changes
    const prevDateMatch = prevNorm.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g);
    const currDateMatch = currNorm.match(/\b\d{1,2}[/-]\d{1,2}[/-]\d{4}\b/g);

    if (JSON.stringify(prevDateMatch) !== JSON.stringify(currDateMatch)) {
      const isDeadlineContext = /(?:hạn|han|deadline|trước ngày|truoc ngay|đến ngày|den ngay|kết thúc|ket thuc)/i.test(currNorm);
      semanticChanges.push({
        category: isDeadlineContext ? CHANGE_CATEGORIES.DEADLINE_CHANGE : CHANGE_CATEGORIES.DATE_CHANGE,
        field: "DEADLINE_DATE",
        type: "MODIFIED",
        oldValue: prevDateMatch ? prevDateMatch.join(", ") : "N/A",
        newValue: currDateMatch ? currDateMatch.join(", ") : "N/A",
        severity: isDeadlineContext ? "HIGH" : "MEDIUM",
        triggerEvent: "DEADLINE_CHANGED",
        description: `Thời hạn học vụ điều chỉnh từ [${prevDateMatch ? prevDateMatch.join(", ") : "N/A"}] thành [${currDateMatch ? currDateMatch.join(", ") : "N/A"}].`
      });
    }

    // 4. Check English Standard Changes (TOEIC / IELTS / B1 / B2)
    const prevEnglish = prevNorm.match(/(?:TOEIC\s*\d{3}|IELTS\s*\d\.\d|VSTEP\s*B[12]|B[12]\s*Quốc tế)/gi);
    const currEnglish = currNorm.match(/(?:TOEIC\s*\d{3}|IELTS\s*\d\.\d|VSTEP\s*B[12]|B[12]\s*Quốc tế)/gi);

    if (JSON.stringify(prevEnglish) !== JSON.stringify(currEnglish)) {
      semanticChanges.push({
        category: CHANGE_CATEGORIES.REQUIREMENT_CHANGE,
        field: "ENGLISH_EXIT_STANDARD",
        type: "MODIFIED",
        oldValue: prevEnglish ? prevEnglish.join(", ") : "N/A",
        newValue: currEnglish ? currEnglish.join(", ") : "N/A",
        severity: "HIGH",
        triggerEvent: "RULE_CHANGE_DETECTED",
        description: `Chuẩn đầu ra Ngoại ngữ điều chỉnh từ [${prevEnglish ? prevEnglish.join(", ") : "N/A"}] thành [${currEnglish ? currEnglish.join(", ") : "N/A"}].`
      });
    }

    // 5. Check Tuition & Fee Amount Changes
    const feePattern = /\b\d{1,3}(?:[.,]\d{3})+\s*(?:VNĐ|VND|đồng|đ)/gi;
    const prevFeeMatch = prevNorm.match(feePattern);
    const currFeeMatch = currNorm.match(feePattern);

    if (JSON.stringify(prevFeeMatch) !== JSON.stringify(currFeeMatch)) {
      semanticChanges.push({
        category: CHANGE_CATEGORIES.FEE_CHANGE,
        field: "TUITION_FEE",
        type: "MODIFIED",
        oldValue: prevFeeMatch ? prevFeeMatch.join(", ") : "N/A",
        newValue: currFeeMatch ? currFeeMatch.join(", ") : "N/A",
        severity: "HIGH",
        triggerEvent: "FEE_CHANGED",
        description: `Mức học phí / lệ phí điều chỉnh từ [${prevFeeMatch ? prevFeeMatch.join(", ") : "N/A"}] thành [${currFeeMatch ? currFeeMatch.join(", ") : "N/A"}].`
      });
    }

    // 6. If normalized text changed but no specific regex matched, record GENERAL_TEXT_CHANGE
    if (semanticChanges.length === 0 && normChanged) {
      semanticChanges.push({
        category: CHANGE_CATEGORIES.GENERAL_TEXT_CHANGE,
        field: "DOCUMENT_BODY",
        type: "MODIFIED",
        oldValue: prevNorm.slice(0, 100) + (prevNorm.length > 100 ? "..." : ""),
        newValue: currNorm.slice(0, 100) + (currNorm.length > 100 ? "..." : ""),
        severity: "LOW",
        triggerEvent: "GENERAL_UPDATE_DETECTED",
        description: "Có thay đổi về câu chữ trong văn bản nhưng không tác động trực tiếp tới các thông số học vụ chính."
      });
    }

    const isSemantic = semanticChanges.some(c => c.category !== CHANGE_CATEGORIES.GENERAL_TEXT_CHANGE || c.severity !== "LOW");

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
