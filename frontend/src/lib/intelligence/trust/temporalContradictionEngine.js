/**
 * StudentHub AI — Temporal Validity & Contradiction Engine V1
 * 
 * Manages temporal truth, policy evolution (Supersession vs Contradiction),
 * and flags conflicting or retracted official sources.
 * 
 * Rules:
 * - Newer policy replacing older policy is SUPERSESSION, not a contradiction.
 * - Two concurrent active official sources disagreeing is a TRUE CONTRADICTION (CONFLICTED).
 * - Retracted sources immediately invalidate dependent claims.
 */

import {
  AiTrustModel,
  AUTHORITY_TIER,
  TEMPORAL_STATUS,
  TRUST_STATUS
} from "./aiTrustModel.js";

export class TemporalContradictionEngine {
  /**
   * Analyzes temporal validity, supersession, and contradictions across claims and sources
   * @param {Array<object>} claims 
   * @param {Array<object>} sources 
   * @param {Array<object>} evidenceSpans 
   * @returns {{
   *   claimsWithTemporalStatus: Array<object>,
   *   contradictions: Array<object>,
   *   contradictionSeverity: number,
   *   temporalValidityScore: number,
   *   hasOfficialConflict: boolean
   * }}
   */
  static analyzeTemporalAndContradictions(claims = [], sources = [], evidenceSpans = [], citations = []) {
    const sourceMap = new Map(sources.map(s => [s.sourceId, s]));
    const citationMap = new Map(citations.map(c => [c.citationId, c]));
    const contradictions = [];
    let hasOfficialConflict = false;
    let staleOrSupersededCount = 0;
    let retractedCount = 0;

    // 1. Check Supersession vs True Contradiction across sources for same domain/scope
    const activeOfficialSources = sources.filter(s => 
      s.authorityTier >= AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR && 
      !s.isRetracted
    );

    // Group active official sources by domain/scope
    const sourcesByScope = new Map();
    for (const src of activeOfficialSources) {
      const scopeKey = `${src.domainScope || "DEFAULT"}_${src.version || "1"}`;
      if (!sourcesByScope.has(scopeKey)) {
        sourcesByScope.set(scopeKey, []);
      }
      sourcesByScope.get(scopeKey).push(src);
    }

    // 2. Evaluate Claims against their supporting sources
    const claimsWithTemporalStatus = claims.map(claim => {
      const supportingSources = (claim.citationIds || [])
        .map(cid => {
          if (sourceMap.has(cid)) return sourceMap.get(cid);
          const cite = citationMap.get(cid);
          return cite ? sourceMap.get(cite.sourceId) : null;
        })
        .filter(Boolean);

      // Also check if all retrieved sources have retraction (if single source)
      const allRetracted = sources.length > 0 && sources.every(s => s.isRetracted || s.temporalStatus === TEMPORAL_STATUS.RETRACTED);

      // Check if any supporting source is retracted
      const isGroundedInRetracted = allRetracted || supportingSources.some(s => s.isRetracted || s.temporalStatus === TEMPORAL_STATUS.RETRACTED);
      if (isGroundedInRetracted) {
        retractedCount++;
        return {
          ...claim,
          status: TRUST_STATUS.RETRACTED,
          temporalStatus: TEMPORAL_STATUS.RETRACTED
        };
      }

      // Check if grounded in superseded source
      const isGroundedInSuperseded = supportingSources.some(s => s.temporalStatus === TEMPORAL_STATUS.SUPERSEDED || s.supersededBy);
      if (isGroundedInSuperseded) {
        staleOrSupersededCount++;
        return {
          ...claim,
          status: TRUST_STATUS.OUTDATED,
          temporalStatus: TEMPORAL_STATUS.SUPERSEDED
        };
      }

      // Check if grounded in stale source
      const isGroundedInStale = supportingSources.some(s => s.temporalStatus === TEMPORAL_STATUS.STALE);
      if (isGroundedInStale) {
        staleOrSupersededCount++;
        return {
          ...claim,
          status: TRUST_STATUS.OUTDATED,
          temporalStatus: TEMPORAL_STATUS.STALE
        };
      }

      return {
        ...claim,
        temporalStatus: TEMPORAL_STATUS.VALID
      };
    });

    // 3. Detect True Contradictions in Claims (e.g. 2 claims about same scope stating different numbers)
    const claimsByScope = new Map();
    for (const claim of claimsWithTemporalStatus) {
      if (claim.scope && claim.scope !== "ALL" && claim.numericValue !== null) {
        const key = `${claim.predicate}_${claim.scope}`;
        if (!claimsByScope.has(key)) {
          claimsByScope.set(key, []);
        }
        claimsByScope.get(key).push(claim);
      }
    }

    for (const [key, scopedClaims] of claimsByScope.entries()) {
      if (scopedClaims.length > 1) {
        const firstVal = scopedClaims[0].numericValue;
        const conflicting = scopedClaims.filter(c => c.numericValue !== firstVal);
        if (conflicting.length > 0) {
          hasOfficialConflict = true;
          contradictions.push({
            type: "NUMERIC_CONFLICT",
            key,
            conflictingClaimIds: scopedClaims.map(c => c.claimId),
            message: `Mâu thuẫn giá trị số liệu trong cùng phạm vi ${key} giữa các khẳng định.`
          });
        }
      }
    }

    const totalClaims = claims.length;
    const contradictionSeverity = hasOfficialConflict ? 1.0 : (contradictions.length > 0 ? 0.6 : 0);
    const temporalValidityScore = totalClaims > 0
      ? Math.max(0, Number(((totalClaims - staleOrSupersededCount - (retractedCount * 2)) / totalClaims).toFixed(2)))
      : 1.0;

    return {
      claimsWithTemporalStatus,
      contradictions,
      contradictionSeverity,
      temporalValidityScore,
      hasOfficialConflict
    };
  }
}
