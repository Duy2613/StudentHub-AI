/**
 * StudentHub AI — Closed-Loop Outcome Feedback & Learning Engine V1
 * Records real-world outcomes of recommendations and automatically feeds back into reputation and confidence calibration.
 */

import crypto from "node:crypto";
import { ReputationGraph, REPUTATION_ACTION } from "../fabric/ReputationGraph.js";
import { ConfidenceCalibrationEngine } from "../fusion/ConfidenceCalibrationEngine.js";
import { ProvenanceGraph, TRANSFORMATION_TYPE } from "../fabric/ProvenanceGraph.js";

export const OUTCOME_STATUS = Object.freeze({
  SUCCESSFUL: "SUCCESSFUL",       // Recommendation achieved expected outcome
  FAILED: "FAILED",               // Action did not succeed (e.g. course failed, deadline missed)
  INCONCLUSIVE: "INCONCLUSIVE",   // Partial data or dropped action
  ABANDONED: "ABANDONED"          // Student chose alternative path
});

export class OutcomeFeedbackEngine {
  static #outcomes = new Map();

  /**
   * Records an observable outcome for a past recommendation
   * @param {object} params
   * @param {string} params.recommendationId
   * @param {string} params.subjectId
   * @param {string} params.outcomeStatus - OUTCOME_STATUS
   * @param {string} [params.details]
   * @param {string[]} [params.associatedClaimIds]
   * @param {string[]} [params.associatedExpertIds]
   * @returns {object} Outcome record and feedback delta summary
   */
  static recordOutcome({
    recommendationId,
    subjectId,
    outcomeStatus = OUTCOME_STATUS.SUCCESSFUL,
    details = "",
    associatedClaimIds = [],
    associatedExpertIds = []
  }) {
    if (!recommendationId) throw new Error("recordOutcome requires recommendationId.");
    if (!subjectId) throw new Error("recordOutcome requires subjectId.");

    const outcomeId = `out_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const timestamp = new Date().toISOString();

    const outcomeRecord = {
      outcomeId,
      recommendationId,
      subjectId,
      outcomeStatus,
      details,
      associatedClaimIds,
      associatedExpertIds,
      recordedAt: timestamp
    };

    this.#outcomes.set(outcomeId, outcomeRecord);

    // Feedback Loop 1: Record Brier calibration data
    const isSuccess = outcomeStatus === OUTCOME_STATUS.SUCCESSFUL ? 1 : 0;
    for (const claimId of associatedClaimIds) {
      ConfidenceCalibrationEngine.recordCalibrationData({
        claimId,
        predictedConfidence: 0.85, // From recommendation baseline
        observedOutcome: isSuccess,
        domain: "academic",
        timestamp
      });
    }

    // Feedback Loop 2: Update reputation for contributing experts
    const reputationDeltas = [];
    if (outcomeStatus === OUTCOME_STATUS.SUCCESSFUL) {
      for (const expertId of associatedExpertIds) {
        const repRes = ReputationGraph.applyReputationDelta({
          subjectId: expertId,
          topicId: "academic.curriculum",
          action: REPUTATION_ACTION.EXPERT_VALIDATED_CLAIM,
          evidenceQuality: 1.0,
          timestamp
        });
        reputationDeltas.push(repRes);
      }
    }

    // Record Provenance
    ProvenanceGraph.recordProvenance({
      targetEntityId: recommendationId,
      targetEntityType: "RECOMMENDATION",
      authorId: subjectId,
      transformations: [TRANSFORMATION_TYPE.CALIBRATED],
      confidence: isSuccess ? 0.95 : 0.40
    });

    return {
      success: true,
      outcomeRecord,
      calibrationRecorded: associatedClaimIds.length,
      reputationUpdatedExperts: associatedExpertIds.length,
      reputationDeltas
    };
  }

  static getOutcomesForSubject(subjectId) {
    const list = [];
    for (const out of this.#outcomes.values()) {
      if (out.subjectId === subjectId) list.push(out);
    }
    return list;
  }

  static clear() {
    this.#outcomes.clear();
  }
}
