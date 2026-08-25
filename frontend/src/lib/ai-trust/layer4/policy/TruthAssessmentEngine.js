/**
 * Layer 4 — TruthAssessmentEngine
 * 
 * Evaluates truth status across all claims:
 * VERIFIED_TRUE, LIKELY_TRUE, PARTIALLY_TRUE, MISLEADING, LIKELY_FALSE, CONTRADICTED, UNVERIFIED
 */

import { FINAL_CLASSIFICATION } from "../types.js";
import { ScopeReconciler } from "../fusion/ScopeReconciler.js";

export class TruthAssessmentEngine {
  /**
   * Assesses factual truth status
   * @param {object} fusedGraph
   * @param {object} reconciliation
   * @returns {object} { status, confidence, claimVerdicts }
   */
  static assessTruth(fusedGraph, reconciliation = {}) {
    const claimVerdicts = [];
    let hasSupported = false;
    let hasContradicted = false;
    let hasPartial = false;
    let hasUnverified = false;

    for (const claim of fusedGraph.layer2Claims) {
      const claimStatus = fusedGraph.layer3ClaimStatuses[claim.claimId] || "UNVERIFIED";
      const claimEvs = fusedGraph.layer3Evidence.filter((e) => e.claimId === claim.claimId);
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

    // Overall Truth Status Determination
    let status = FINAL_CLASSIFICATION.UNVERIFIED;
    let confidence = 0.85;

    if (reconciliation.unresolvedConflicts?.length > 0) {
      status = "CONTESTED";
      confidence = 0.88;
    } else if (hasPartial) {
      status = FINAL_CLASSIFICATION.MISLEADING;
      confidence = 0.90;
    } else if (hasContradicted) {
      status = FINAL_CLASSIFICATION.CONTRADICTED;
      confidence = 0.95;
    } else if (hasSupported && !hasUnverified) {
      status = FINAL_CLASSIFICATION.VERIFIED_TRUE;
      confidence = 0.96;
    } else if (hasSupported && hasUnverified) {
      status = FINAL_CLASSIFICATION.PARTIALLY_TRUE;
      confidence = 0.85;
    } else {
      status = FINAL_CLASSIFICATION.UNVERIFIED;
      confidence = 0.88;
    }

    return {
      status,
      confidence: Number(confidence.toFixed(2)),
      claimVerdicts,
    };
  }
}
