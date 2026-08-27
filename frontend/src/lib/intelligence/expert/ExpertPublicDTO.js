/**
 * StudentHub AI — ExpertPublicDTO
 * 
 * Explicit Public Data Transfer Object projection for Expert entities.
 * STRICTLY strips all private contact information (personal phone, private email, CCCD, home address),
 * internal security scores, risk signals, and private notes before JSON serialization.
 */

export class ExpertPublicDTO {
  /**
   * Projects a raw Expert storage entity into a public-safe DTO
   * @param {object} expert - Raw expert entity
   * @returns {object|null} Public-safe expert DTO
   */
  static toPublicDTO(expert) {
    if (!expert) return null;

    return Object.freeze({
      expertId: expert.expertId,
      canonicalIdentity: expert.canonicalIdentity || expert.name,
      name: expert.name,
      title: expert.title || "Giảng viên",
      institution: expert.institution || "HCMUTE",
      department: expert.department || "Khoa CNTT",
      affiliationStatus: expert.affiliationStatus || "VERIFIED_ACTIVE",
      status: expert.status || "VERIFIED_EXPERT",
      orcid: expert.orcid || null,
      verifiedEmail: expert.verifiedEmail || null,
      directoryUrl: expert.directoryUrl || null,
      scopes: (expert.scopes || []).map(s => ({
        domain: s.domain,
        subdomain: s.subdomain,
        level: s.level,
        jurisdiction: s.jurisdiction,
        citationCount: s.citationCount || 0,
        recencyYear: s.recencyYear || 2024,
        isEstablished: s.isEstablished ?? (s.level === "ESTABLISHED")
      })),
      credentials: (expert.credentials || []).map(c => ({
        credentialId: c.credentialId,
        type: c.type,
        field: c.field,
        issuer: c.issuer,
        issuedYear: c.issuedYear,
        status: c.status
      })),
      roles: (expert.roles || []).map(r => ({
        roleId: r.roleId,
        roleTitle: r.roleTitle,
        organization: r.organization,
        validFrom: r.validFrom,
        validUntil: r.validUntil
      })),
      publications: (expert.publications || []).map(p => ({
        pubId: p.pubId,
        title: p.title,
        venue: p.venue,
        year: p.year,
        domain: p.domain,
        doi: p.doi || null
      })),
      hasRegistrarAuthority: Boolean(expert.hasRegistrarAuthority),
      reputationScore: expert.reputationScore || 85
    });
  }

  /**
   * Projects an array of experts into public DTOs
   * @param {Array<object>} experts 
   * @returns {Array<object>}
   */
  static toPublicList(experts = []) {
    return (experts || []).map(e => this.toPublicDTO(e)).filter(Boolean);
  }
}
