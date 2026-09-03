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
    externalEvidence = false,
  } = {}) {
    const safeClaims = Array.isArray(claims) ? claims.filter((claim) => claim && typeof claim === "object" && claim.claimId) : [];
    const safeEvidence = Array.isArray(evidence) ? evidence.filter((item) => item && typeof item === "object") : [];
    const safeConflicts = Array.isArray(conflicts) ? conflicts.filter((conflict) => conflict && typeof conflict === "object") : [];
    const safeCompleteness = Number.isFinite(Number(completeness)) ? Number(completeness) : 0;
    const claimStatuses = {};

    // 1. No claim is not a verified claim. This status is deliberately
    // non-final so downstream policy cannot render it as safe.
    if (safeClaims.length === 0) {
      return {
        status: LAYER_3_STATUS.NOT_APPLICABLE,
        claimStatuses: {},
        limitations: ["Không có phát ngôn sự kiện cần đối soát nguồn tin; trạng thái này không chứng minh an toàn."],
      };
    }

    // 2. If no evidence retrieved at all -> INSUFFICIENT_EVIDENCE (NOT FALSE)
    if (safeEvidence.length === 0) {
      for (const c of safeClaims) {
        claimStatuses[c.claimId] = "UNVERIFIED";
      }
      return {
        status: LAYER_3_STATUS.INSUFFICIENT_EVIDENCE,
        claimStatuses,
        limitations: ["Không tìm thấy nguồn tin bên ngoài đối soát cho các phát ngôn này."],
      };
    }

    // 3. Evaluate each claim's evidence
    let hasStrongSupport = false;
    let hasStrongContradict = false;
    let hasPartialSupport = false;
    let hasOutdatedOnly = false;
    let hasUnverified = false;

    for (const c of safeClaims) {
      const claimEvs = safeEvidence.filter((e) => e.claimId === c.claimId);

      if (claimEvs.length === 0) {
        claimStatuses[c.claimId] = "UNVERIFIED";
        hasUnverified = true;
        continue;
      }

      // Check if all evidence is outdated
      const usableFreshness = new Set([
        FRESHNESS_STATUS.CURRENT,
        FRESHNESS_STATUS.RECENT,
        FRESHNESS_STATUS.AGING,
      ]);
      const allOutdatedOrUnknown = claimEvs.every((e) => !usableFreshness.has(e.freshness));
      if (allOutdatedOrUnknown) {
        claimStatuses[c.claimId] = "OUTDATED_EVIDENCE";
        hasOutdatedOnly = true;
        continue;
      }

      // Filter to current/recent evidence
      const currentEvs = claimEvs.filter((e) => usableFreshness.has(e.freshness));

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
        hasUnverified = true;
      }
    }

    // 4. Resolve Overall Layer 3 Status
    if (safeConflicts.length > 0) {
      for (const conf of safeConflicts) {
        if (conf.claimId) claimStatuses[conf.claimId] = "CONTESTED";
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

    if (hasUnverified || safeCompleteness < 0.75) {
      return {
        status: LAYER_3_STATUS.INSUFFICIENT_EVIDENCE,
        claimStatuses,
        limitations: ["Chưa đủ bằng chứng có thể dùng để xác minh toàn bộ các phát ngôn."],
      };
    }

    const usableExternalEvidence = safeEvidence.filter((item) =>
      item.liveEvidence === true &&
      item.sourceType !== "LOCAL_KNOWLEDGE_BASE" &&
      typeof item.sourceFingerprint === "string" &&
      item.sourceFingerprint.length > 0 &&
      item.providerStatus === "SUCCESS" &&
      item.retrievalOutcome === "SUCCESS"
    );
    const externalCoverage = safeClaims.length > 0
      ? new Set(usableExternalEvidence.map((item) => item.claimId)).size / safeClaims.length
      : 0;

    if (!externalEvidence || externalCoverage < 1) {
      return {
        status: LAYER_3_STATUS.PARTIAL,
        claimStatuses,
        limitations: ["Chỉ có dữ liệu cục bộ hoặc nguồn chưa được xác nhận trực tiếp; không coi là xác minh bên ngoài."],
      };
    }

    if (hasPartialSupport) {
      return {
        status: LAYER_3_STATUS.VERIFIED_WITH_CONFLICT,
        claimStatuses,
        limitations: ["Bằng chứng chỉ hỗ trợ một phần phạm vi của ít nhất một phát ngôn."],
      };
    }

    if (hasStrongSupport || hasStrongContradict) {
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
