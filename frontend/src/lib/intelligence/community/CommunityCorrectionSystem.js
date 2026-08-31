/**
 * StudentHub AI — Immutable Community Correction & Audit Workflow Architecture V1
 * Tracks verified corrections and retractions without silently erasing historical assertions.
 */

import crypto from "node:crypto";
import { ProvenanceGraph, TRANSFORMATION_TYPE } from "../fabric/ProvenanceGraph.js";

export const CORRECTION_TYPE = Object.freeze({
  COMMUNITY_CORRECTION: "COMMUNITY_CORRECTION",
  EXPERT_CORRECTION: "EXPERT_CORRECTION",
  OFFICIAL_CORRECTION: "OFFICIAL_CORRECTION",
  AUTHOR_CORRECTION: "AUTHOR_CORRECTION",
  SYSTEM_CORRECTION: "SYSTEM_CORRECTION"
});

export const CORRECTION_STATUS = Object.freeze({
  PROPOSED: "PROPOSED",
  UNDER_REVIEW: "UNDER_REVIEW",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED"
});

export class CommunityCorrectionSystem {
  static #corrections = new Map();

  /**
   * Submits a formal correction against an existing claim
   */
  static proposeCorrection({
    claimId,
    originalStatement,
    correctedStatement,
    correctionType = CORRECTION_TYPE.COMMUNITY_CORRECTION,
    reason,
    evidenceIds = [],
    authorId = "student:anonymous"
  }) {
    if (!claimId) throw new Error("proposeCorrection requires claimId.");
    if (!correctedStatement) throw new Error("proposeCorrection requires correctedStatement.");
    if (!reason) throw new Error("proposeCorrection requires reason.");

    const correctionId = `corr_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    const record = {
      correctionId,
      claimId,
      originalStatement,
      correctedStatement: correctedStatement.trim(),
      correctionType,
      reason: reason.trim(),
      evidenceIds: [...new Set(evidenceIds)],
      authorId,
      status: CORRECTION_STATUS.PROPOSED,
      validatorId: null,
      submittedAt: new Date().toISOString(),
      resolvedAt: null
    };

    this.#corrections.set(correctionId, record);
    return record;
  }

  /**
   * Validates and applies a proposed correction
   */
  static resolveCorrection(correctionId, { status, validatorId, reviewNotes = "" }) {
    const target = this.#corrections.get(correctionId);
    if (!target) throw new Error(`Correction not found for ID: ${correctionId}`);

    target.status = status;
    target.validatorId = validatorId;
    target.reviewNotes = reviewNotes;
    target.resolvedAt = new Date().toISOString();

    if (status === CORRECTION_STATUS.ACCEPTED) {
      ProvenanceGraph.recordProvenance({
        targetEntityId: target.claimId,
        targetEntityType: "CLAIM",
        authorId: target.authorId,
        validatorId,
        transformations: [TRANSFORMATION_TYPE.ARBITRATED],
        confidence: 0.95
      });
    }

    return target;
  }

  /**
   * Retrieves all correction history for a claim
   */
  static getCorrectionsForClaim(claimId) {
    const list = [];
    for (const c of this.#corrections.values()) {
      if (c.claimId === claimId) list.push(c);
    }
    return list.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
  }

  static clear() {
    this.#corrections.clear();
  }
}
