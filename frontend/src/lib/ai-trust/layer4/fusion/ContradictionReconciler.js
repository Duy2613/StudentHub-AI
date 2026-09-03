/**
 * Layer 4 — ContradictionReconciler
 * 
 * Reconciles conflicting evidence across independent sources.
 * Distinguishes true factual disputes from temporal updates (newer policy supersedes older document).
 */

export class ContradictionReconciler {
  /**
   * Reconciles detected conflicts
   * @param {Array<object>} conflicts
   * @param {Array<object>} evidenceItems
   * @param {Array<object>} sources
   * @returns {object} { resolvedConflicts, unresolvedConflicts, temporalUpdates }
   */
  static reconcile(conflicts = [], evidenceItems = [], sources = []) {
    const resolvedConflicts = [];
    const unresolvedConflicts = [];
    const temporalUpdates = [];

    for (const conf of conflicts) {
      const claimEvs = evidenceItems.filter((e) => e.claimId === conf.claimId);

      // Check if temporal ordering resolves the conflict
      const datedEvs = claimEvs
        .filter((e) => e.publishedAt)
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

      if (datedEvs.length >= 2) {
        const newest = datedEvs[0];
        const older = datedEvs[1];
        const deltaDays = (new Date(newest.publishedAt).getTime() - new Date(older.publishedAt).getTime()) / (1000 * 60 * 60 * 24);

        if (deltaDays > 1) {
          // Newer source updates/supersedes older source
          temporalUpdates.push({
            claimId: conf.claimId,
            supersedingSource: newest.sourceUrl,
            supersededSource: older.sourceUrl,
            timeDeltaDays: Math.floor(deltaDays),
            notes: `Thông tin ngày ${newest.publishedAt.slice(0, 10)} đã cập nhật thay thế cho văn bản ngày ${older.publishedAt.slice(0, 10)}.`,
          });
          resolvedConflicts.push(conf);
          continue;
        }
      }

      // If cannot be resolved temporally, record as genuine unresolved dispute
      unresolvedConflicts.push(conf);
    }

    return {
      resolvedConflicts,
      unresolvedConflicts,
      temporalUpdates,
      isFullyResolved: unresolvedConflicts.length === 0,
    };
  }
}
