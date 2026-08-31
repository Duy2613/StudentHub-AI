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

    const currentYear = new Date().getFullYear();
    const scopes = Array.isArray(expert.scopes) ? expert.scopes : [];
    const credentials = Array.isArray(expert.credentials) ? expert.credentials : [];
    const roles = Array.isArray(expert.roles) ? expert.roles : [];
    const publications = Array.isArray(expert.publications) ? expert.publications : [];
    const conflicts = Array.isArray(expert.conflicts) ? expert.conflicts : [];
    const activeRoles = roles.filter((role) => role.isCurrent !== false && (!role.validUntil || new Date(role.validUntil) >= new Date()));
    const verifiedCredentials = credentials.filter((credential) => credential.status === "VERIFIED" && credential.isVerified !== false);
    const groundedPublications = publications.filter((publication) => !publication.isRetracted && (publication.doi || publication.provenanceClusterId));
    const latestResearchYear = publications.reduce((latest, publication) => Math.max(latest, Number(publication.year) || 0), 0);
    const activeConflicts = conflicts.filter((conflict) => conflict.isActive !== false);
    const verificationStatus = expert.status || expert.verificationStatus || "UNVERIFIED_EXPERT";

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
      verifiedEmailDomain: expert.verifiedEmail?.split("@")[1] || null,
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
      reputationScore: expert.reputationScore || 0,
      verificationSummary: Object.freeze({
        status: verificationStatus,
        identity: expert.isVerified === true || verificationStatus === "VERIFIED_EXPERT" ? "VERIFIED" : "UNVERIFIED",
        affiliation: activeRoles.length > 0 || expert.affiliationStatus === "VERIFIED_ACTIVE" ? "CURRENT" : "HISTORICAL_OR_UNVERIFIED",
        verifiedCredentials: verifiedCredentials.length,
        groundedPublications: groundedPublications.length,
        latestResearchYear: latestResearchYear || null,
        researchFreshness: latestResearchYear >= currentYear - 2 ? "RECENT" : (latestResearchYear ? "AGING" : "UNKNOWN"),
        activeConflicts: activeConflicts.length,
        lastCheckedAt: expert.lastCheckedAt || null,
        evidenceGrade: this.#evidenceGrade({
          isVerified: expert.isVerified === true || verificationStatus === "VERIFIED_EXPERT",
          activeRoles: activeRoles.length,
          verifiedCredentials: verifiedCredentials.length,
          groundedPublications: groundedPublications.length,
          activeConflicts: activeConflicts.length
        })
      }),
      authorityBoundaries: Object.freeze({
        establishedDomains: scopes.filter((scope) => scope.isEstablished !== false && ["ESTABLISHED", "SUPPORTED"].includes(scope.level)).map((scope) => scope.domain),
        limitedDomains: scopes.filter((scope) => ["EMERGING", "LIMITED"].includes(scope.level)).map((scope) => scope.domain),
        outOfScopeDomains: scopes.filter((scope) => scope.level === "OUT_OF_SCOPE").map((scope) => scope.domain),
        institutionalAuthority: Boolean(expert.hasRegistrarAuthority),
        warning: expert.hasRegistrarAuthority
          ? "Có vai trò hành chính đang hiệu lực; vẫn cần đối chiếu văn bản gốc cho quyết định ràng buộc."
          : "Chuyên môn không tự tạo ra thẩm quyền ban hành quy chế."
      })
    });
  }

  static #evidenceGrade({ isVerified, activeRoles, verifiedCredentials, groundedPublications, activeConflicts }) {
    const points = (isVerified ? 2 : 0) + Math.min(activeRoles, 1) + Math.min(verifiedCredentials, 2) + Math.min(groundedPublications, 2) - Math.min(activeConflicts, 1);
    if (points >= 6) return "A";
    if (points >= 4) return "B";
    if (points >= 2) return "C";
    return "D";
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
