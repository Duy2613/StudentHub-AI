/**
 * StudentHub AI — First-Class Evidence Domain Model V1
 * Represents verified empirical facts, official clauses, and expert affirmations.
 */

import crypto from "node:crypto";

export const EVIDENCE_TYPE = Object.freeze({
  OFFICIAL_REGULATION: "OFFICIAL_REGULATION",   // University statute, syllabus, or rector decision
  EXPERT_TESTIMONY: "EXPERT_TESTIMONY",         // Peer-reviewed expert analysis
  COMMUNITY_OBSERVATION: "COMMUNITY_OBSERVATION", // Multiple independent student experiences
  SYSTEM_LOG: "SYSTEM_LOG",                     // Verified database / audit record
  THIRD_PARTY_AUDIT: "THIRD_PARTY_AUDIT"        // External government / accredited body report
});

export const EVIDENCE_DIRECTNESS = Object.freeze({
  DIRECT: "DIRECT",                             // Directly answers the proposition
  INDIRECT: "INDIRECT",                         // Requires deductive entailment
  CIRCUMSTANTIAL: "CIRCUMSTANTIAL"              // Corroborative context only
});

export class EvidenceEntity {
  /**
   * @param {object} params
   * @param {string} [params.evidenceId]
   * @param {string} params.claimId - ID of associated Claim
   * @param {string} params.sourceId - ID of origin SourceEntity
   * @param {string} [params.type] - EVIDENCE_TYPE
   * @param {string} params.contentReference - Excerpt, clause text, or citation
   * @param {string} [params.publishedAt]
   * @param {string} [params.retrievedAt]
   * @param {number} [params.authority] - 0.0 to 1.0
   * @param {number} [params.relevance] - 0.0 to 1.0
   * @param {number} [params.independence] - 0.0 to 1.0 (penalized for syndication/copy)
   * @param {number} [params.recency] - 0.0 to 1.0
   * @param {number} [params.specificity] - 0.0 to 1.0
   * @param {string} [params.directness] - EVIDENCE_DIRECTNESS
   * @param {number} [params.consistency] - 0.0 to 1.0
   * @param {boolean} [params.isVerifiable]
   * @param {string} [params.clusterId] - Provenance cluster ID for deduplication
   */
  constructor({
    evidenceId = null,
    claimId,
    sourceId,
    type = EVIDENCE_TYPE.OFFICIAL_REGULATION,
    contentReference,
    publishedAt = new Date().toISOString(),
    retrievedAt = new Date().toISOString(),
    authority = 0.8,
    relevance = 1.0,
    independence = 1.0,
    recency = 1.0,
    specificity = 0.9,
    directness = EVIDENCE_DIRECTNESS.DIRECT,
    consistency = 1.0,
    isVerifiable = true,
    clusterId = null
  }) {
    if (!claimId) throw new Error("EvidenceEntity requires a valid claimId.");
    if (!sourceId) throw new Error("EvidenceEntity requires a valid sourceId.");
    if (!contentReference) throw new Error("EvidenceEntity requires contentReference.");

    this.evidenceId = evidenceId || `evi_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    this.claimId = claimId;
    this.sourceId = sourceId;
    this.type = type;
    this.contentReference = contentReference.trim();
    this.publishedAt = publishedAt;
    this.retrievedAt = retrievedAt;

    // 8 Multi-dimensional Quality Metrics
    this.authority = Math.max(0, Math.min(1, Number(authority) || 0));
    this.relevance = Math.max(0, Math.min(1, Number(relevance) || 0));
    this.independence = Math.max(0, Math.min(1, Number(independence) || 0));
    this.recency = Math.max(0, Math.min(1, Number(recency) || 0));
    this.specificity = Math.max(0, Math.min(1, Number(specificity) || 0));
    this.directness = directness;
    this.consistency = Math.max(0, Math.min(1, Number(consistency) || 0));
    this.isVerifiable = Boolean(isVerifiable);
    this.clusterId = clusterId || `cluster_${crypto.createHash("sha256").update(this.contentReference).digest("hex").slice(0, 12)}`;

    Object.freeze(this);
  }

  /**
   * Deterministic combined evidence weight (never collapsed to opaque single score on UI, but available for ranking)
   */
  get qualityWeight() {
    const directnessMultiplier = this.directness === EVIDENCE_DIRECTNESS.DIRECT ? 1.0 : (this.directness === EVIDENCE_DIRECTNESS.INDIRECT ? 0.75 : 0.5);
    return (
      (this.authority * 0.35 +
       this.relevance * 0.20 +
       this.independence * 0.15 +
       this.recency * 0.15 +
       this.specificity * 0.15) * directnessMultiplier
    );
  }

  toJSON() {
    return {
      evidenceId: this.evidenceId,
      claimId: this.claimId,
      sourceId: this.sourceId,
      type: this.type,
      contentReference: this.contentReference,
      publishedAt: this.publishedAt,
      retrievedAt: this.retrievedAt,
      authority: this.authority,
      relevance: this.relevance,
      independence: this.independence,
      recency: this.recency,
      specificity: this.specificity,
      directness: this.directness,
      consistency: this.consistency,
      isVerifiable: this.isVerifiable,
      clusterId: this.clusterId,
      qualityWeight: Number(this.qualityWeight.toFixed(4))
    };
  }
}
