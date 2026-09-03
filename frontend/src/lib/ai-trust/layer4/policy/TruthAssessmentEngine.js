/**
 * Layer 4 — TruthAssessmentEngine
 * 
 * Evaluates truth status across all claims:
 * VERIFIED_TRUE, LIKELY_TRUE, PARTIALLY_TRUE, MISLEADING, LIKELY_FALSE, CONTRADICTED, UNVERIFIED
 */

import { FINAL_CLASSIFICATION } from "../types.js";
import { ScopeReconciler } from "../fusion/ScopeReconciler.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function isExternalEvidence(item) {
  return Boolean(item &&
    item.liveEvidence === true &&
    item.sourceType !== "LOCAL_KNOWLEDGE_BASE" &&
    item.providerStatus === "SUCCESS" &&
    item.retrievalOutcome === "SUCCESS" &&
    typeof item.sourceFingerprint === "string" &&
    item.sourceFingerprint.trim() &&
    typeof item.sourceUrl === "string" &&
    /^https:\/\//i.test(item.sourceUrl));
}

function evidenceQuality(evidence) {
  if (!evidence.length) return 0;
  const values = evidence.map((item) => {
    const relevance = Number.isFinite(item.relevance) ? item.relevance : 0;
    const strength = Number.isFinite(item.strength) ? item.strength : 0;
    const authority = item.authorityTier === "TIER_5_PRIMARY_AUTHORITATIVE" ? 1 : item.authorityTier === "TIER_4_HIGH_REPUTABLE_SECONDARY" ? 0.8 : 0.6;
    const freshness = ["CURRENT", "RECENT"].includes(item.freshness) ? 1 : item.freshness === "AGING" ? 0.7 : 0;
    return Math.max(0, Math.min(1, relevance * 0.3 + strength * 0.3 + authority * 0.2 + freshness * 0.2));
  });
  return Number((values.reduce((sum, value) => sum + value, 0) / values.length).toFixed(2));
}

export class TruthAssessmentEngine {
  /**
   * Assesses factual truth status
   * @param {object} fusedGraph
   * @param {object} reconciliation
   * @returns {object} { status, confidence, claimVerdicts }
   */
  static assessTruth(fusedGraph, reconciliation = {}) {
    fusedGraph = fusedGraph && typeof fusedGraph === "object" && !Array.isArray(fusedGraph) ? fusedGraph : {};
    const claims = asArray(fusedGraph.layer2Claims).filter((claim) => claim && typeof claim === "object" && claim.claimId);
    const evidence = asArray(fusedGraph.layer3Evidence).filter((item) => item && typeof item === "object");
    const claimStatuses = fusedGraph.layer3ClaimStatuses && typeof fusedGraph.layer3ClaimStatuses === "object" && !Array.isArray(fusedGraph.layer3ClaimStatuses)
      ? fusedGraph.layer3ClaimStatuses
      : {};
    const claimVerdicts = [];
    let hasSupported = false;
    let hasContradicted = false;
    let hasPartial = false;
    let hasUnverified = false;

    if (claims.length === 0) {
      return {
        status: "NOT_APPLICABLE",
        confidence: 0,
        claimVerdicts: [],
      };
    }

    for (const claim of claims) {
      const claimStatus = typeof claimStatuses[claim.claimId] === "string" ? claimStatuses[claim.claimId] : "UNVERIFIED";
      const claimEvs = evidence.filter((e) => e.claimId === claim.claimId);
      const scopeEval = ScopeReconciler.evaluateScope(claim, claimEvs);

      let verdictStatus = claimStatus;
      if (scopeEval.isOvergeneralized) {
        verdictStatus = "MISLEADING";
        hasPartial = true;
      } else if (claimStatus === "SUPPORTED") {
        hasSupported = true;
      } else if (claimStatus === "CONTRADICTED") {
        hasContradicted = true;
      } else if (claimStatus === "PARTIALLY_SUPPORTED") {
        hasPartial = true;
      } else {
        hasUnverified = true;
      }

      claimVerdicts.push({
        claimId: claim.claimId,
        subject: claim.subject,
        predicate: claim.predicate,
        rawText: claim.rawText,
        truthStatus: verdictStatus,
        evidenceRefs: claimEvs.map((e) => e.evidenceId),
        notes: scopeEval.scopeDiscrepancyNote || "",
      });
    }

    const externallyValidatedEvidence = evidence.filter(isExternalEvidence);
    const externalClaimIds = new Set(externallyValidatedEvidence.map((item) => item.claimId));
    const externalCoverage = externalClaimIds.size / claims.length;
    const hasExternalVerification = externalCoverage >= 1 && fusedGraph.layer3Status === "VERIFIED";
    const quality = evidenceQuality(externallyValidatedEvidence);

    // Overall Truth Status Determination. Local/fallback evidence can support
    // a review explanation, but it cannot promote a factual claim to verified.
    let status = FINAL_CLASSIFICATION.INSUFFICIENT_EVIDENCE;
    let confidence = 0;

    if (reconciliation.unresolvedConflicts?.length > 0) {
      status = "CONTESTED";
      confidence = quality;
    } else if (hasPartial) {
      status = FINAL_CLASSIFICATION.MISLEADING;
      confidence = hasExternalVerification ? quality : 0;
    } else if (hasContradicted) {
      status = FINAL_CLASSIFICATION.CONTRADICTED;
      confidence = hasExternalVerification ? quality : 0;
    } else if (hasExternalVerification && hasSupported && !hasUnverified) {
      status = FINAL_CLASSIFICATION.VERIFIED_TRUE;
      confidence = quality;
    } else if (hasExternalVerification && hasSupported && hasUnverified) {
      status = FINAL_CLASSIFICATION.PARTIALLY_TRUE;
      confidence = quality;
    } else {
      status = FINAL_CLASSIFICATION.INSUFFICIENT_EVIDENCE;
      confidence = 0;
    }

    return {
      status,
      confidence: Number(confidence.toFixed(2)),
      claimVerdicts,
    };
  }
}
