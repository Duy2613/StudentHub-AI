/**
 * StudentHub AI — Temporal Validity & Contradiction Engine V2
 * 
 * Manages temporal truth, policy evolution (Supersession vs Contradiction),
 * and flags conflicting or retracted official sources.
 */

import {
  AUTHORITY_TIER,
  TEMPORAL_STATUS,
  EPISTEMIC_STATE
} from "./aiTrustModel.js";

export class TemporalContradictionEngine {
  static analyzeTemporalAndContradictions(claims = [], sources = [], evidenceSpans = [], citations = []) {
    const sourceMap = new Map(sources.map(s => [s.sourceId, s]));
    for (const span of evidenceSpans) {
      if (span.sourceId && !sourceMap.has(span.sourceId)) {
        sourceMap.set(span.sourceId, {
          sourceId: span.sourceId,
          authorityTier: span.authorityTier || AUTHORITY_TIER.TIER_1_OFFICIAL_REGISTRAR,
          temporalStatus: span.temporalStatus || TEMPORAL_STATUS.CURRENTLY_VALID
        });
      }
    }

    const citationMap = new Map(citations.map(c => [c.citationId, c]));
    const contradictions = [];
    let hasOfficialConflict = false;
    let staleOrSupersededCount = 0;
    let retractedCount = 0;

    const claimsWithTemporalStatus = claims.map(claim => {
      const supportingSources = (claim.citationIds || [])
        .map(cid => {
          if (sourceMap.has(cid)) return sourceMap.get(cid);
          const cite = citationMap.get(cid);
          return cite ? sourceMap.get(cite.sourceId) : null;
        })
        .filter(Boolean);

      const allRetracted = sources.length > 0 && sources.every(s => s.isRetracted || s.temporalStatus === TEMPORAL_STATUS.RETRACTED);
      const isGroundedInRetracted = allRetracted || supportingSources.some(s => s.isRetracted || s.temporalStatus === TEMPORAL_STATUS.RETRACTED);

      if (isGroundedInRetracted) {
        retractedCount++;
        return {
          ...claim,
          status: EPISTEMIC_STATE.RETRACTED,
          epistemicState: EPISTEMIC_STATE.RETRACTED,
          temporalStatus: TEMPORAL_STATUS.RETRACTED
        };
      }

      const isGroundedInSuperseded = supportingSources.some(s => s.temporalStatus === TEMPORAL_STATUS.SUPERSEDED || s.supersededBy);
      if (isGroundedInSuperseded) {
        staleOrSupersededCount++;
        return {
          ...claim,
          status: EPISTEMIC_STATE.OUTDATED,
          epistemicState: EPISTEMIC_STATE.OUTDATED,
          temporalStatus: TEMPORAL_STATUS.SUPERSEDED
        };
      }

      const isGroundedInStale = supportingSources.some(s => s.temporalStatus === TEMPORAL_STATUS.STALE);
      if (isGroundedInStale) {
        staleOrSupersededCount++;
        return {
          ...claim,
          status: EPISTEMIC_STATE.OUTDATED,
          epistemicState: EPISTEMIC_STATE.OUTDATED,
          temporalStatus: TEMPORAL_STATUS.STALE
        };
      }

      return {
        ...claim,
        status: claim.status || claim.epistemicState || EPISTEMIC_STATE.VERIFIED,
        epistemicState: claim.epistemicState || claim.status || EPISTEMIC_STATE.VERIFIED,
        temporalStatus: TEMPORAL_STATUS.CURRENTLY_VALID
      };
    });

    // Detect numeric conflicts
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
