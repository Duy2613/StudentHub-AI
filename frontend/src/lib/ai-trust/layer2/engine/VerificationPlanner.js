/**
 * Layer 2 — VerificationPlanner
 * 
 * Packages extracted claims, entities, candidate official sources,
 * and structured verification tasks ready for Layer 3 (External Evidence & Source Verification).
 */

import { VERIFICATION_TASK_TYPES, CLAIM_IMPORTANCE } from "../types.js";

export class VerificationPlanner {
  /**
   * Constructs the Layer 3 Verification Package
   * @param {object} params
   * @param {Array<object>} params.claims
   * @param {Array<object>} params.entities
   * @param {Array<object>} params.consistencyFindings
   * @param {Array<object>} params.crossModalFindings
   * @returns {object} Layer 3 Verification Package
   */
  static planVerification({
    claims = [],
    entities = [],
    consistencyFindings = [],
    crossModalFindings = [],
  }) {
    const candidateSources = [];
    const verificationTasks = [];

    // 1. Build Candidate Sources from Entities
    for (const ent of entities) {
      if (ent.officialDomains && ent.officialDomains.length > 0) {
        candidateSources.push({
          entity: ent.name,
          officialDomains: ent.officialDomains,
          authorityRank: ent.type === "university" || ent.type === "bank" ? "high" : "medium",
        });

        // Add Domain Verification Task
        verificationTasks.push({
          taskId: `task-dom-${ent.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
          type: VERIFICATION_TASK_TYPES.DOMAIN_VERIFICATION,
          priority: "HIGH",
          target: ent.name,
          expectedOfficialDomains: ent.officialDomains,
          instructions: `Đối chiếu tên miền nguồn tin với tên miền chính thống (${ent.officialDomains.join(", ")}) của ${ent.name}.`,
        });
      }
    }

    // 2. Build Claim Verification Tasks
    for (const claim of claims) {
      if (claim.verificationRequired) {
        const priority =
          claim.importance === CLAIM_IMPORTANCE.CRITICAL
            ? "CRITICAL"
            : claim.importance === CLAIM_IMPORTANCE.HIGH
            ? "HIGH"
            : "MEDIUM";

        verificationTasks.push({
          taskId: `task-claim-${claim.claimId}`,
          type: VERIFICATION_TASK_TYPES.CLAIM_VERIFICATION,
          priority,
          claimId: claim.claimId,
          targetClaim: claim.rawText,
          claimType: claim.claimType,
          instructions: `Xác minh tính xác thực của thông cáo '${claim.rawText}' qua cổng thông tin chính thức hoặc thông cáo báo chí.`,
        });
      }
    }

    // 3. Temporal Contradiction Verification Task
    if (consistencyFindings.some((f) => f.type === "temporal_contradiction")) {
      verificationTasks.push({
        taskId: `task-temporal-${Date.now()}`,
        type: VERIFICATION_TASK_TYPES.TEMPORAL_VERIFICATION,
        priority: "HIGH",
        instructions: "Xác minh mốc thời gian chính xác của sự kiện để giải quyết mâu thuẫn ngày tháng nội tại.",
      });
    }

    return {
      claims: claims.filter((c) => c.verificationRequired),
      entities,
      candidateSources,
      verificationTasks,
      totalTasksCount: verificationTasks.length,
    };
  }
}
