/**
 * StudentHub AI — Multi-Type Contradiction Detection & Classification Engine V2
 * Detects, classifies, and tracks discrepancies without silently merging or discarding conflicting evidence.
 */

import crypto from "node:crypto";

export const CONTRADICTION_TYPE = Object.freeze({
  DIRECT_CONTRADICTION: "DIRECT_CONTRADICTION",       // Mutually exclusive within same scope & time
  PARTIAL_CONTRADICTION: "PARTIAL_CONTRADICTION",     // Conflicting prerequisite/course load condition
  TEMPORAL_CONFLICT: "TEMPORAL_CONFLICT",             // 2025 vs 2026 regulation change
  SCOPE_CONFLICT: "SCOPE_CONFLICT",                   // Mass vs High-Quality program divergence
  SOURCE_VERSION_CONFLICT: "SOURCE_VERSION_CONFLICT", // Draft announcement vs Promulgated decision
  APPARENT_CONFLICT: "APPARENT_CONFLICT"              // Semantically reconcilable wording variation
});

export class ContradictionEngine {
  /**
   * Analyzes two claims or evidence items for semantic, temporal, or scope conflicts
   * @param {object} claimA - First Claim or Evidence object
   * @param {object} claimB - Second Claim or Evidence object
   * @returns {object|null} Contradiction descriptor or null if compatible
   */
  static detectContradiction(claimA, claimB) {
    if (!claimA || !claimB) return null;

    const statementA = (claimA.statement || claimA.contentReference || "").toLowerCase();
    const statementB = (claimB.statement || claimB.contentReference || "").toLowerCase();

    // 1. Temporal Conflict Check (Different effective dates)
    const timeA = claimA.temporalContext?.semester || claimA.publishedAt || "";
    const timeB = claimB.temporalContext?.semester || claimB.publishedAt || "";
    if (timeA && timeB && timeA !== timeB) {
      if (this.#hasSemanticInversion(statementA, statementB)) {
        return this.#createContradictionPayload(
          CONTRADICTION_TYPE.TEMPORAL_CONFLICT,
          claimA,
          claimB,
          `Xung đột do sự thay đổi quy chế theo thời gian (Thời điểm A: ${timeA} vs Thời điểm B: ${timeB}).`
        );
      }
    }

    // 2. Scope Conflict Check (Different student cohorts / faculties)
    const scopeA = claimA.scope || "ALL_STUDENTS";
    const scopeB = claimB.scope || "ALL_STUDENTS";
    if (scopeA !== scopeB && (scopeA !== "ALL_STUDENTS" || scopeB !== "ALL_STUDENTS")) {
      if (this.#hasSemanticInversion(statementA, statementB)) {
        return this.#createContradictionPayload(
          CONTRADICTION_TYPE.SCOPE_CONFLICT,
          claimA,
          claimB,
          `Xung đột về phạm vi áp dụng (Đối tượng A: ${scopeA} vs Đối tượng B: ${scopeB}).`
        );
      }
    }

    // 3. Direct Semantic Inversion
    if (this.#hasSemanticInversion(statementA, statementB)) {
      return this.#createContradictionPayload(
        CONTRADICTION_TYPE.DIRECT_CONTRADICTION,
        claimA,
        claimB,
        "Phát hiện mâu thuẫn trực tiếp giữa hai mệnh đề khẳng định và phủ định trong cùng phạm vi."
      );
    }

    // 4. Partial Prerequisite / Value Conflict
    if (this.#hasNumericOrConditionMismatch(statementA, statementB)) {
      return this.#createContradictionPayload(
        CONTRADICTION_TYPE.PARTIAL_CONTRADICTION,
        claimA,
        claimB,
        "Phát hiện sai lệch về mốc thời gian, số tín chỉ, hoặc điều kiện tiên quyết giữa hai nguồn."
      );
    }

    return null;
  }

  static #hasSemanticInversion(textA, textB) {
    const negations = ["không được", "bắt buộc", "không yêu cầu", "yêu cầu", "miễn", "phải đóng", "không phải đóng", "hết hạn", "gia hạn"];
    for (let i = 0; i < negations.length; i += 2) {
      const term1 = negations[i];
      const term2 = negations[i + 1] || "";
      if ((textA.includes(term1) && textB.includes(term2)) || (textA.includes(term2) && textB.includes(term1))) {
        return true;
      }
    }
    return false;
  }

  static #hasNumericOrConditionMismatch(textA, textB) {
    const extractNumbers = (str) => (str.match(/\d+(?:[.,]\d+)?/g) || []).join(",");
    const numsA = extractNumbers(textA);
    const numsB = extractNumbers(textB);
    return numsA.length > 0 && numsB.length > 0 && numsA !== numsB && (textA.includes("ngày") || textA.includes("tín chỉ") || textA.includes("gpa"));
  }

  static #createContradictionPayload(type, a, b, explanation) {
    return {
      contradictionId: `contra_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      contradictionType: type,
      sourceA: { id: a.claimId || a.evidenceId, statement: a.statement || a.contentReference },
      sourceB: { id: b.claimId || b.evidenceId, statement: b.statement || b.contentReference },
      explanation,
      detectedAt: new Date().toISOString()
    };
  }
}
