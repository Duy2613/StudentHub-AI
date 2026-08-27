/**
 * StudentHub AI — Expert Historical Claim & Reliability Tracking Engine V1
 * Records expert claim lifecycles, subsequent peer reviews, and computes historical accuracy rates.
 */

import crypto from "node:crypto";

export class ExpertReliabilityTracker {
  // expertId -> Array<ClaimRecord>
  static #expertClaimHistory = new Map();

  /**
   * Records a claim or verdict made by an expert
   */
  static recordExpertClaim({
    expertId,
    claimId,
    topicId,
    statement,
    supportingEvidenceIds = [],
    timestamp = new Date().toISOString()
  }) {
    if (!expertId) throw new Error("recordExpertClaim requires expertId.");
    if (!claimId) throw new Error("recordExpertClaim requires claimId.");

    if (!this.#expertClaimHistory.has(expertId)) {
      this.#expertClaimHistory.set(expertId, []);
    }

    const record = {
      recordId: `exp_claim_${Date.now()}_${crypto.randomBytes(3).toString("hex")}`,
      expertId,
      claimId,
      topicId,
      statement,
      supportingEvidenceIds,
      status: "ACTIVE", // ACTIVE | CONFIRMED | DISPUTED | RETRACTED | OUTDATED
      peerValidations: 0,
      peerContradictions: 0,
      isCorrected: false,
      timestamp
    };

    this.#expertClaimHistory.get(expertId).push(record);
    return record;
  }

  /**
   * Updates validation / contradiction outcome for an expert claim
   */
  static updateClaimOutcome(expertId, claimId, outcome) {
    const claims = this.#expertClaimHistory.get(expertId) || [];
    const target = claims.find(c => c.claimId === claimId);
    if (!target) return null;

    if (outcome === "VALIDATED") {
      target.peerValidations += 1;
      target.status = "CONFIRMED";
    } else if (outcome === "CONTRADICTED") {
      target.peerContradictions += 1;
      target.status = "DISPUTED";
    } else if (outcome === "RETRACTED") {
      target.isCorrected = true;
      target.status = "RETRACTED";
    }

    return target;
  }

  /**
   * Computes the historical reliability rating for an expert
   * @returns {object} { historicalAccuracy, totalClaims, confirmedClaims, disputedClaims, reliabilityLabel }
   */
  static getExpertReliability(expertId) {
    const claims = this.#expertClaimHistory.get(expertId) || [];
    if (claims.length === 0) {
      return {
        expertId,
        totalClaims: 0,
        historicalAccuracy: 0.90, // Baseline prior for unobserved expert
        confirmedClaims: 0,
        disputedClaims: 0,
        retractedClaims: 0,
        reliabilityLabel: "CHƯA ĐỦ LỊCH SỬ ĐÁNH GIÁ (MẶC ĐỊNH CAO)"
      };
    }

    const confirmed = claims.filter(c => c.status === "CONFIRMED" || (c.peerValidations > 0 && c.peerContradictions === 0)).length;
    const disputed = claims.filter(c => c.status === "DISPUTED" || c.peerContradictions > 0).length;
    const retracted = claims.filter(c => c.status === "RETRACTED" || c.isCorrected).length;

    // Accuracy formula: (confirmed + 0.5 * neutral) / total, penalized for retractions
    const activeNeutral = claims.length - confirmed - disputed - retracted;
    const score = (confirmed * 1.0 + activeNeutral * 0.7 - disputed * 0.5 - retracted * 0.8) / claims.length;
    const historicalAccuracy = Math.max(0.1, Math.min(1.0, Number(score.toFixed(3))));

    let reliabilityLabel = "ĐỘ TIN CẬY RẤT CAO";
    if (historicalAccuracy < 0.5) reliabilityLabel = "ĐỘ TIN CẬY CẦN THẬN TRỌNG";
    else if (historicalAccuracy < 0.75) reliabilityLabel = "ĐỘ TIN CẬY TRUNG BÌNH";

    return {
      expertId,
      totalClaims: claims.length,
      historicalAccuracy,
      confirmedClaims: confirmed,
      disputedClaims: disputed,
      retractedClaims: retracted,
      reliabilityLabel,
      claimHistory: [...claims]
    };
  }

  static clear() {
    this.#expertClaimHistory.clear();
  }
}
