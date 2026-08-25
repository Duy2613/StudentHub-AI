/**
 * Layer 3 — Layer3DecisionEngine
 * 
 * Resolves the Layer 3 evidence status:
 * - VERIFIED
 * - VERIFIED_WITH_CONFLICT
 * - CONTESTED
 * - UNVERIFIED (Never FALSE!)
 * - INSUFFICIENT_EVIDENCE
 * 
 * Packages all findings cleanly for Layer 4.
 */

import { LAYER_3_STATUS, CLAIM_EVIDENCE_RELATION, FRESHNESS_STATUS } from "../types.js";

export class Layer3DecisionEngine {
  /**
   * Resolves final Layer 3 evidence status and claim statuses
   */
  static resolveStatus({
    claims = [],
    evidence = [],
    conflicts = [],
    completeness = 0,
  }) {
    const claimStatuses = {};

    // 1. If no claims to verify, return VERIFIED
    if (claims.length === 0) {
      return {
        status: LAYER_3_STATUS.VERIFIED,
        claimStatuses: {},
        limitations: ["Không có phát ngôn sự kiện cần đối soát nguồn tin."],
      };
    }

    // 2. If no evidence retrieved at all -> UNVERIFIED (MANDATORY: NOT FALSE!)
    if (evidence.length === 0) {
      for (const c of claims) {
        claimStatuses[c.claimId] = "UNVERIFIED";
      }
      return {
        status: LAYER_3_STATUS.UNVERIFIED,
        claimStatuses,
        limitations: ["Không tìm thấy nguồn tin bên ngoài đối soát cho các phát ngôn này."],
      };
    }

    // 3. Evaluate each claim's evidence
    let hasStrongSupport = false;
    let hasStrongContradict = false;
    let hasPartialSupport = false;
    let hasOutdatedOnly = false;

    for (const c of claims) {
      const claimEvs = evidence.filter((e) => e.claimId === c.claimId);

      if (claimEvs.length === 0) {
        claimStatuses[c.claimId] = "UNVERIFIED";
        continue;
      }

      // Check if all evidence is outdated
      const allOutdated = claimEvs.every((e) => e.freshness === FRESHNESS_STATUS.OUTDATED);
      if (allOutdated) {
        claimStatuses[c.claimId] = "OUTDATED_EVIDENCE";
        hasOutdatedOnly = true;
        continue;
      }

      // Filter to current/recent evidence
      const currentEvs = claimEvs.filter((e) => e.freshness !== FRESHNESS_STATUS.OUTDATED);

      const hasSupport = currentEvs.some(
        (e) => e.relation === CLAIM_EVIDENCE_RELATION.STRONGLY_SUPPORTS || e.relation === CLAIM_EVIDENCE_RELATION.SUPPORTS
      );
      const hasContra = currentEvs.some(
        (e) => e.relation === CLAIM_EVIDENCE_RELATION.STRONGLY_CONTRADICTS || e.relation === CLAIM_EVIDENCE_RELATION.CONTRADICTS
      );
      const hasPartial = currentEvs.some((e) => e.relation === CLAIM_EVIDENCE_RELATION.PARTIALLY_SUPPORTS);

      if (hasSupport && hasContra) {
        claimStatuses[c.claimId] = "CONTESTED";
      } else if (hasContra) {
        claimStatuses[c.claimId] = "CONTRADICTED";
        hasStrongContradict = true;
      } else if (hasPartial) {
        claimStatuses[c.claimId] = "PARTIALLY_SUPPORTED";
        hasPartialSupport = true;
      } else if (hasSupport) {
        claimStatuses[c.claimId] = "SUPPORTED";
        hasStrongSupport = true;
      } else {
        claimStatuses[c.claimId] = "UNVERIFIED";
      }
    }

    // 4. Resolve Overall Layer 3 Status
    if (conflicts.length > 0) {
      for (const conf of conflicts) {
        claimStatuses[conf.claimId] = "CONTESTED";
      }
      return {
        status: LAYER_3_STATUS.CONTESTED,
        claimStatuses,
        limitations: ["Phát hiện mâu thuẫn giữa các nguồn tin chính thống độc lập."],
      };
    }

    if (hasOutdatedOnly && !hasStrongSupport && !hasStrongContradict && !hasPartialSupport) {
      return {
        status: LAYER_3_STATUS.INSUFFICIENT_EVIDENCE,
        claimStatuses,
        limitations: ["Nguồn tin thu thập được đã cũ hoặc hết hiệu lực."],
      };
    }

    if (hasStrongSupport || hasStrongContradict || hasPartialSupport) {
      return {
        status: LAYER_3_STATUS.VERIFIED,
        claimStatuses,
        limitations: [],
      };
    }

    return {
      status: LAYER_3_STATUS.UNVERIFIED,
      claimStatuses,
      limitations: ["Chưa đủ bằng chứng để xác minh toàn bộ các phát ngôn."],
    };
  }
}
