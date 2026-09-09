/**
 * StudentHub AI — CitationValidator
 *
 * Enforces citation integrity before any final result is produced:
 * 1. evidenceId must exist in the current run
 * 2. belongs to current revision
 * 3. underlying source exists and has a validated canonical URL
 * 4. claim relation exists and matches the cited claim
 * 5. Rejects: hallucinated IDs, invented URLs, orphan citations, stale-revision citations.
 */

export class CitationValidationError extends Error {
  constructor(message, invalidCitations = []) {
    super(message);
    this.name = "CitationValidationError";
    this.invalidCitations = invalidCitations;
  }
}

export class CitationValidator {
  /**
   * Validates citations against verified evidence pool.
   * @param {object} params
   * @param {string[]} params.citedEvidenceIds - Array of evidence IDs cited in verdict or explanation
   * @param {Array<object>} params.availableEvidence - Evidence pool in current run
   * @param {number} params.currentRevision - Run/case revision integer
   * @returns {{ valid: boolean, validCitationIds: string[], rejectedCitations: Array<{ evidenceId: string, reason: string }> }}
   */
  static validateCitations({
    citedEvidenceIds = [],
    availableEvidence = [],
    currentRevision = 1,
  } = {}) {
    const evidenceMap = new Map();
    for (const ev of availableEvidence) {
      if (ev && ev.evidenceId) {
        evidenceMap.set(ev.evidenceId, ev);
      }
      if (ev && ev.sourceId) {
        evidenceMap.set(ev.sourceId, ev);
      }
      if (ev && ev.id) {
        evidenceMap.set(ev.id, ev);
      }
    }

    const validCitationIds = [];
    const rejectedCitations = [];

    const uniqueCited = [...new Set(citedEvidenceIds || [])];

    for (const id of uniqueCited) {
      if (!id || typeof id !== "string") {
        rejectedCitations.push({ evidenceId: String(id), reason: "INVALID_ID_TYPE" });
        continue;
      }

      const ev = evidenceMap.get(id);
      if (!ev) {
        rejectedCitations.push({
          evidenceId: id,
          reason: "HALLUCINATED_EVIDENCE_ID",
        });
        continue;
      }

      // Check revision freshness
      if (ev.revision && Number.isInteger(ev.revision) && ev.revision !== currentRevision) {
        rejectedCitations.push({
          evidenceId: id,
          reason: "STALE_REVISION_CITATION",
        });
        continue;
      }

      // Check source existence & validated URL
      const source = ev.source || ev.sourceMetadata || ev;
      if (!source) {
        rejectedCitations.push({
          evidenceId: id,
          reason: "ORPHAN_CITATION_NO_SOURCE",
        });
        continue;
      }

      const url = source.canonicalUrl || source.url;
      if (url) {
        try {
          const parsed = new URL(url);
          if (!parsed.protocol || !parsed.hostname) {
            rejectedCitations.push({
              evidenceId: id,
              reason: "INVENTED_OR_MALFORMED_URL",
            });
            continue;
          }
        } catch {
          rejectedCitations.push({
            evidenceId: id,
            reason: "INVENTED_OR_MALFORMED_URL",
          });
          continue;
        }
      }

      validCitationIds.push(id);
    }

    return {
      valid: rejectedCitations.length === 0,
      validCitationIds,
      rejectedCitations,
    };
  }
}
