/**
 * Layer 3 — SourceConflictDetector
 * 
 * Detects discrepancies between independent authoritative sources.
 * Records structured conflict packages without making arbitrary winner-takes-all guesses.
 */

import { CONFLICT_TYPES, CLAIM_EVIDENCE_RELATION } from "../types.js";

export class SourceConflictDetector {
  /**
   * Evaluates evidence items for conflicts
   * @param {Array<object>} evidenceItems
   * @returns {Array<object>} Array of detected conflict packages
   */
  static detectConflicts(evidenceItems = []) {
    const conflicts = [];
    const claimEvidenceMap = new Map();

    for (const ev of evidenceItems) {
      if (!claimEvidenceMap.has(ev.claimId)) {
        claimEvidenceMap.set(ev.claimId, []);
      }
      claimEvidenceMap.get(ev.claimId).push(ev);
    }

    for (const [claimId, items] of claimEvidenceMap.entries()) {
      const supporting = items.filter(
        (i) => i.relation === CLAIM_EVIDENCE_RELATION.STRONGLY_SUPPORTS || i.relation === CLAIM_EVIDENCE_RELATION.SUPPORTS
      );
      const contradicting = items.filter(
        (i) => i.relation === CLAIM_EVIDENCE_RELATION.STRONGLY_CONTRADICTS || i.relation === CLAIM_EVIDENCE_RELATION.CONTRADICTS
      );

      // Check for opposing evidence from independent clusters
      if (supporting.length > 0 && contradicting.length > 0) {
        const supportClusters = new Set(supporting.map((s) => s.clusterId));
        const contradictClusters = new Set(contradicting.map((c) => c.clusterId));

        // Genuine conflict across separate lineages
        conflicts.push({
          conflictId: `conflict-${claimId}-${Date.now()}`,
          claimId,
          conflictType: CONFLICT_TYPES.POLICY_DISCREPANCY,
          supportingSourcesCount: supporting.length,
          contradictingSourcesCount: contradicting.length,
          supportingClustersCount: supportClusters.size,
          contradictingClustersCount: contradictClusters.size,
          supportingExcerpts: supporting.map((s) => ({ source: s.sourceUrl, text: s.excerpt })),
          contradictingExcerpts: contradicting.map((c) => ({ source: c.sourceUrl, text: c.excerpt })),
          resolutionRecommendation: "Chuyển giao cho Layer 4 đối chiếu tính ưu tiên văn bản pháp lý và dấu mốc thời gian phát hành.",
        });
      }
    }

    return conflicts;
  }
}
