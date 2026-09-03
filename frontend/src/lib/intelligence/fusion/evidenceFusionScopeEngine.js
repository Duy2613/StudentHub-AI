/**
 * StudentHub AI — Scope Segmentation & Context Resolution Engine V1
 * 
 * Partitions academic claims across multi-dimensional contexts
 * (Cohort, Department, Program, Term) to prevent false contradictions.
 */

import { EvidenceFusionModel } from "./evidenceFusionModel.js";

export class EvidenceFusionScopeEngine {
  /**
   * Evaluates if two scopes intersect or are distinct partitions
   */
  static evaluateScopeRelation(scopeA, scopeB) {
    const sA = EvidenceFusionModel.createScopeDimension(scopeA || {});
    const sB = EvidenceFusionModel.createScopeDimension(scopeB || {});

    const cohortMatch = sA.cohort === "ALL" || sB.cohort === "ALL" || sA.cohort === sB.cohort;
    const facultyMatch = sA.faculty === "ALL" || sB.faculty === "ALL" || sA.faculty === sB.faculty;
    const programMatch = sA.program === "ALL" || sB.program === "ALL" || sA.program === sB.program;

    const isExactMatch = sA.cohort === sB.cohort && sA.faculty === sB.faculty && sA.program === sB.program;
    const isDisjoint = !cohortMatch || !facultyMatch || !programMatch;

    return {
      isExactMatch,
      isDisjoint,
      isCompatible: !isDisjoint,
      cohortMatch,
      facultyMatch,
      programMatch,
      explanation: isDisjoint
        ? `Phân đoạn phạm vi độc lập (${sA.cohort}/${sA.faculty} vs ${sB.cohort}/${sB.faculty}). Không cấu thành mâu thuẫn.`
        : `Phạm vi tương thích hoặc bao hàm.`
    };
  }

  /**
   * Groups claims by their canonical scope partition
   */
  static partitionByScope(claims = []) {
    const partitions = new Map();

    for (const claim of claims) {
      const scope = claim.scope || { cohort: "ALL", faculty: "ALL" };
      const key = `${scope.cohort || 'ALL'}::${scope.faculty || 'ALL'}::${scope.program || 'ALL'}`;

      if (!partitions.has(key)) {
        partitions.set(key, {
          scopeKey: key,
          scope,
          claims: []
        });
      }

      partitions.get(key).claims.push(claim);
    }

    return Array.from(partitions.values());
  }
}
