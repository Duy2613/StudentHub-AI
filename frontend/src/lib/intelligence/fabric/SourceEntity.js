/**
 * StudentHub AI — Structured Source Domain Model V1
 * Captures authoritative provenance, publisher credentials, and temporal validity.
 */

import crypto from "node:crypto";

export const SOURCE_TYPE = Object.freeze({
  OFFICIAL: "OFFICIAL",                     // Statutory university central portal / rectorate
  UNIVERSITY: "UNIVERSITY",                 // General university domain
  FACULTY: "FACULTY",                       // Department / Faculty specific office
  EXPERT: "EXPERT",                         // Verified academic faculty / researcher
  PEER_REVIEWED: "PEER_REVIEWED",           // Published journal / conference proceeding
  COMMUNITY: "COMMUNITY",                   // Verified student forum / experience post
  USER_GENERATED: "USER_GENERATED",         // Unverified individual user post
  SYSTEM_GENERATED: "SYSTEM_GENERATED"      // Automated telemetry / sensor / database state
});

export const SOURCE_STATUS = Object.freeze({
  ACTIVE: "ACTIVE",                         // Currently verified and authoritative
  STALE: "STALE",                           // Needs re-verification / older revision
  SUPERSEDED: "SUPERSEDED",                 // Replaced by newer official notice
  REVOKED: "REVOKED",                       // Withdrawn or retracted
  DISPUTED: "DISPUTED"                      // Challenged by faculty or university audit
});

export class SourceEntity {
  /**
   * @param {object} params
   * @param {string} [params.sourceId]
   * @param {string} params.sourceType - SOURCE_TYPE
   * @param {string} params.publisher - e.g. "Phòng Đào tạo HCMUTE"
   * @param {string} [params.owner] - Department or individual owner
   * @param {string} [params.domain] - e.g. "academic.curriculum"
   * @param {string} [params.url] - External canonical URL
   * @param {string} [params.contentHash] - SHA-256 digest of source content
   * @param {string} [params.publishedAt]
   * @param {string} [params.retrievedAt]
   * @param {string} [params.lastVerifiedAt]
   * @param {number} [params.freshnessScore] - 0.0 to 1.0
   * @param {number} [params.authorityScore] - 0.0 to 1.0
   * @param {number} [params.reliabilityScore] - 0.0 to 1.0
   * @param {string} [params.version]
   * @param {string} [params.status] - SOURCE_STATUS
   */
  constructor({
    sourceId = null,
    sourceType = SOURCE_TYPE.OFFICIAL,
    publisher,
    owner = "HCMUTE",
    domain = "general",
    url = null,
    contentHash = null,
    publishedAt = new Date().toISOString(),
    retrievedAt = new Date().toISOString(),
    lastVerifiedAt = new Date().toISOString(),
    freshnessScore = 1.0,
    authorityScore = 0.9,
    reliabilityScore = 0.95,
    version = "1.0.0",
    status = SOURCE_STATUS.ACTIVE
  }) {
    if (!publisher) throw new Error("SourceEntity requires a publisher.");

    this.sourceId = sourceId || `src_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
    this.sourceType = sourceType;
    this.publisher = publisher.trim();
    this.owner = owner.trim();
    this.domain = domain.trim();
    this.url = url;
    this.contentHash = contentHash || crypto.createHash("sha256").update(`${this.publisher}_${this.url || ""}_${publishedAt}`).digest("hex");
    this.publishedAt = publishedAt;
    this.retrievedAt = retrievedAt;
    this.lastVerifiedAt = lastVerifiedAt;
    this.freshnessScore = Math.max(0, Math.min(1, Number(freshnessScore) || 0));
    this.authorityScore = Math.max(0, Math.min(1, Number(authorityScore) || 0));
    this.reliabilityScore = Math.max(0, Math.min(1, Number(reliabilityScore) || 0));
    this.version = version;
    this.status = status;

    Object.freeze(this);
  }

  toJSON() {
    return {
      sourceId: this.sourceId,
      sourceType: this.sourceType,
      publisher: this.publisher,
      owner: this.owner,
      domain: this.domain,
      url: this.url,
      contentHash: this.contentHash,
      publishedAt: this.publishedAt,
      retrievedAt: this.retrievedAt,
      lastVerifiedAt: this.lastVerifiedAt,
      freshnessScore: this.freshnessScore,
      authorityScore: this.authorityScore,
      reliabilityScore: this.reliabilityScore,
      version: this.version,
      status: this.status
    };
  }
}
