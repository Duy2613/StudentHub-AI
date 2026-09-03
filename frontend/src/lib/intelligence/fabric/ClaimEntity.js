/**
 * StudentHub AI — First-Class Claim Domain Model V1
 * Canonical Claim object representing verifiable factual propositions.
 */

import crypto from "node:crypto";

export const CLAIM_STATUS = Object.freeze({
  OBSERVED: "OBSERVED",                     // Raw proposition detected in text/feed
  EXTRACTED: "EXTRACTED",                   // Parsed into structured subject-predicate-object
  NORMALIZED: "NORMALIZED",                 // Canonicalized terms & entity mappings
  SUPPORTED: "SUPPORTED",                   // Has >= 1 verified supporting evidence
  UNSUPPORTED: "UNSUPPORTED",               // Missing external evidence
  VALIDATED: "VALIDATED",                   // Explicitly confirmed by qualified expert / official source
  DISPUTED: "DISPUTED",                     // Contradictory evidence detected
  CONFIDENCE_UPDATED: "CONFIDENCE_UPDATED", // Epistemic score updated
  STALE: "STALE",                           // Temporal validity interval elapsed
  SUPERSEDED: "SUPERSEDED",                 // Officially replaced by newer regulation/policy
  RESOLVED: "RESOLVED"                      // Conflict resolved by arbitration
});

export const CLAIM_SCOPE = Object.freeze({
  ALL_STUDENTS: "ALL_STUDENTS",             // Applies university-wide
  COHORT_SPECIFIC: "COHORT_SPECIFIC",       // e.g. K22, K23, K24 only
  PROGRAM_SPECIFIC: "PROGRAM_SPECIFIC",     // e.g. High-Quality, Standard, Mass
  FACULTY_SPECIFIC: "FACULTY_SPECIFIC",     // e.g. FIT, FEEE, FME
  COURSE_SPECIFIC: "COURSE_SPECIFIC",       // e.g. MATH141701 only
  INDIVIDUAL_ONLY: "INDIVIDUAL_ONLY"        // Applies only to a specific student case
});

export class ClaimEntity {
  /**
   * @param {object} params
   * @param {string} [params.claimId]
   * @param {string} params.statement - Original human-readable claim statement
   * @param {string} [params.normalizedStatement] - Canonicalized statement
   * @param {string} params.topicId - Topic identifier (e.g. "academic.prerequisites.math")
   * @param {string} [params.authorId] - Subject ID of author/submitter
   * @param {string} [params.status] - CLAIM_STATUS
   * @param {string} [params.scope] - CLAIM_SCOPE
   * @param {object} [params.temporalContext] - { effectiveFrom, effectiveUntil, semester }
   * @param {number} [params.confidence] - 0.0 to 1.0
   * @param {string[]} [params.supportingEvidenceIds]
   * @param {string[]} [params.contradictingEvidenceIds]
   * @param {string[]} [params.validatingExpertIds]
   * @param {string} [params.originalText] - Preserved verbatim source text for provenance
   * @param {string} [params.version]
   */
  constructor({
    claimId = null,
    statement,
    normalizedStatement = null,
    topicId,
    authorId = "system",
    status = CLAIM_STATUS.OBSERVED,
    scope = CLAIM_SCOPE.ALL_STUDENTS,
    temporalContext = {},
    confidence = 0.5,
    supportingEvidenceIds = [],
    contradictingEvidenceIds = [],
    validatingExpertIds = [],
    originalText = null,
    version = "1.0.0",
    createdAt = new Date().toISOString(),
    updatedAt = new Date().toISOString()
  }) {
    if (!statement || typeof statement !== "string") {
      throw new Error("ClaimEntity requires a valid non-empty statement.");
    }
    if (!topicId || typeof topicId !== "string") {
      throw new Error("ClaimEntity requires a valid topicId.");
    }

    this.claimId = claimId || `claim_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    this.statement = statement.trim();
    this.normalizedStatement = (normalizedStatement || statement).trim().toLowerCase();
    this.topicId = topicId;
    this.authorId = authorId;
    this.status = status;
    this.scope = scope;
    this.temporalContext = Object.freeze({
      effectiveFrom: temporalContext.effectiveFrom || null,
      effectiveUntil: temporalContext.effectiveUntil || null,
      semester: temporalContext.semester || null
    });
    this.confidence = Math.max(0.0, Math.min(1.0, Number(confidence) || 0.0));
    this.supportingEvidenceIds = Object.freeze([...new Set(supportingEvidenceIds)]);
    this.contradictingEvidenceIds = Object.freeze([...new Set(contradictingEvidenceIds)]);
    this.validatingExpertIds = Object.freeze([...new Set(validatingExpertIds)]);
    this.originalText = originalText || statement;
    this.version = version;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;

    Object.freeze(this);
  }

  get evidenceCount() {
    return this.supportingEvidenceIds.length;
  }

  get contradictionCount() {
    return this.contradictingEvidenceIds.length;
  }

  get validationCount() {
    return this.validatingExpertIds.length;
  }

  get isContested() {
    return this.contradictingEvidenceIds.length > 0;
  }

  /**
   * Immutable state transition
   */
  withUpdates(updates = {}) {
    return new ClaimEntity({
      claimId: this.claimId,
      statement: updates.statement || this.statement,
      normalizedStatement: updates.normalizedStatement || this.normalizedStatement,
      topicId: updates.topicId || this.topicId,
      authorId: updates.authorId || this.authorId,
      status: updates.status || this.status,
      scope: updates.scope || this.scope,
      temporalContext: updates.temporalContext || this.temporalContext,
      confidence: updates.confidence !== undefined ? updates.confidence : this.confidence,
      supportingEvidenceIds: updates.supportingEvidenceIds || this.supportingEvidenceIds,
      contradictingEvidenceIds: updates.contradictingEvidenceIds || this.contradictingEvidenceIds,
      validatingExpertIds: updates.validatingExpertIds || this.validatingExpertIds,
      originalText: updates.originalText || this.originalText,
      version: updates.version || this.version,
      createdAt: this.createdAt,
      updatedAt: new Date().toISOString()
    });
  }

  toJSON() {
    return {
      claimId: this.claimId,
      statement: this.statement,
      normalizedStatement: this.normalizedStatement,
      topicId: this.topicId,
      authorId: this.authorId,
      status: this.status,
      scope: this.scope,
      temporalContext: this.temporalContext,
      confidence: this.confidence,
      evidenceCount: this.evidenceCount,
      contradictionCount: this.contradictionCount,
      validationCount: this.validationCount,
      supportingEvidenceIds: this.supportingEvidenceIds,
      contradictingEvidenceIds: this.contradictingEvidenceIds,
      validatingExpertIds: this.validatingExpertIds,
      originalText: this.originalText,
      version: this.version,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }
}
