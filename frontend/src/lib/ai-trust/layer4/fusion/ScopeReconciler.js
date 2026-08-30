/**
 * Layer 4 — ScopeReconciler
 * 
 * Analyzes quantifiers and scope discrepancies:
 * Detects when a claim claims universal applicability ("all students receive 10M")
 * while the evidence establishes bounded scope ("up to 10% of students receive up to 10M").
 */

export class ScopeReconciler {
  /**
   * Evaluates quantifier overgeneralization
   * @param {object} claim
   * @param {Array<object>} evidenceItems
   * @returns {object} { isOvergeneralized, scopeDiscrepancyNote }
   */
  static evaluateScope(claim = {}, evidenceItems = []) {
    const safeClaim = claim && typeof claim === "object" && !Array.isArray(claim) ? claim : {};
    const rawClaim = typeof safeClaim.rawText === "string" ? safeClaim.rawText.toLowerCase() : "";
    const hasUniversalQuantifier =
      rawClaim.includes("mọi sinh viên") ||
      rawClaim.includes("tất cả sinh viên") ||
      rawClaim.includes("toàn thể") ||
      rawClaim.includes("100%");

    if (!hasUniversalQuantifier) {
      return { isOvergeneralized: false, scopeDiscrepancyNote: null };
    }

    const hasBoundedEvidence = (Array.isArray(evidenceItems) ? evidenceItems : []).some(
      (e) => Boolean(e && typeof e === "object") && (
        typeof e.excerpt === "string" && (
          e.excerpt.toLowerCase().includes("tối đa") ||
          e.excerpt.toLowerCase().includes("xét cấp cho") ||
          e.excerpt.toLowerCase().includes("chỉ dành cho")
        ) ||
        e.relation === "PARTIALLY_SUPPORTS"
      )
    );

    if (hasBoundedEvidence) {
      return {
        isOvergeneralized: true,
        scopeDiscrepancyNote: "Phát ngôn phóng đại phạm vi ('toàn thể sinh viên') so với giới hạn thực tế trong chính sách ('tối đa theo hạn mức/đối tượng tuyển chọn').",
      };
    }

    return { isOvergeneralized: false, scopeDiscrepancyNote: null };
  }
}
