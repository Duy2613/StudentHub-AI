/**
 * StudentHub AI — ExpertPublicDTO
 * 
 * Explicit Public Data Transfer Object projection for Expert entities.
 * STRICTLY strips all private contact information (personal phone, private email, CCCD, home address),
 * internal security/reputation scores, risk signals, conflict data, and private notes before JSON serialization.
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
    const verificationStatus = expert.status || expert.verificationStatus || "UNVERIFIED_EXPERT";
    const isVerified = expert.isVerified === true || verificationStatus === "VERIFIED_EXPERT";
    const verifiedCredentials = credentials.filter((credential) => credential.status === "VERIFIED" && credential.isVerified !== false);
    const groundedPublications = publications.filter((publication) => !publication.isRetracted && (publication.doi || publication.provenanceClusterId));
    const latestResearchYear = publications.reduce((latest, publication) => Math.max(latest, Number(publication.year) || 0), 0);
    const activeConflicts = conflicts.filter((conflict) => conflict.isActive !== false);
    const verifiedEmailDomain = typeof expert.verifiedEmail === "string" && expert.verifiedEmail.includes("@")
      ? expert.verifiedEmail.slice(expert.verifiedEmail.lastIndexOf("@") + 1).trim().toLowerCase() || null
      : null;
    const safeCredentials = credentials.filter((credential) => credential.isPublic !== false).map((credential) => ({
      type: credential.type || null,
      field: credential.field || null,
      issuer: credential.issuer || null,
      issuedYear: credential.issuedYear || null,
      status: credential.status || null,
    }));
    const safeRoles = roles.filter((role) => role.isPublic !== false).map((role) => ({
      roleTitle: role.roleTitle || null,
      organization: role.organization || null,
      validFrom: role.validFrom || null,
      validUntil: role.validUntil || null,
    }));
    const safePublications = publications.filter((publication) => publication.isPublic !== false).map((publication) => ({
      title: publication.title || null,
      venue: publication.venue || null,
      year: publication.year || null,
      domain: publication.domain || null,
      doi: publication.doi || null,
    }));

    return Object.freeze({
      expertId: expert.expertId,
      canonicalIdentity: expert.canonicalIdentity || expert.name || null,
      name: expert.name || null,
      title: expert.title || null,
      bio: expert.bio || null,
      institution: expert.institution || null,
      department: expert.department || null,
      affiliationStatus: expert.affiliationStatus || null,
      status: verificationStatus,
      directoryUrl: expert.directoryUrl || null,
      verifiedEmailDomain,
      scopes: (expert.scopes || []).map(s => ({
        domain: s.domain,
        subdomain: s.subdomain,
        level: s.level,
        jurisdiction: s.jurisdiction,
        citationCount: Number.isFinite(Number(s.citationCount)) ? Number(s.citationCount) : null,
        recencyYear: Number.isFinite(Number(s.recencyYear)) ? Number(s.recencyYear) : null,
        isEstablished: s.isEstablished === true || s.level === "ESTABLISHED"
      })),
      credentials: safeCredentials,
      roles: safeRoles,
      publications: safePublications,
      reputationState: expert.reputationState || null,
      earnedStars: Array.isArray(expert.earnedStars) ? expert.earnedStars.slice(0, 12).map((star) => ({
        label: typeof star?.label === "string" ? star.label.slice(0, 120) : null,
        earnedAt: star?.earnedAt || null,
      })) : [],
      verificationSummary: Object.freeze({
        status: verificationStatus,
        identity: isVerified ? "VERIFIED" : "UNVERIFIED",
        affiliation: activeRoles.length > 0 || expert.affiliationStatus === "VERIFIED_ACTIVE" ? "CURRENT" : "HISTORICAL_OR_UNVERIFIED",
        verifiedCredentials: verifiedCredentials.length,
        groundedPublications: groundedPublications.length,
        latestResearchYear: latestResearchYear || null,
        researchFreshness: latestResearchYear >= currentYear - 2 ? "RECENT" : (latestResearchYear ? "AGING" : "UNKNOWN"),
        activeConflicts: activeConflicts.length,
        lastCheckedAt: expert.lastCheckedAt || null,
        evidenceGrade: this.#evidenceGrade({
          isVerified,
          activeRoles: activeRoles.length,
          verifiedCredentials: verifiedCredentials.length,
          groundedPublications: groundedPublications.length,
          activeConflicts: activeConflicts.length,
        }),
      }),
      authorityBoundaries: Object.freeze({
        establishedDomains: scopes.filter((scope) => scope.isEstablished !== false && ["ESTABLISHED", "SUPPORTED", "DOMAIN_VERIFIED"].includes(scope.level)).map((scope) => scope.domain),
        limitedDomains: scopes.filter((scope) => ["EMERGING", "LIMITED"].includes(scope.level)).map((scope) => scope.domain),
        outOfScopeDomains: scopes.filter((scope) => scope.level === "OUT_OF_SCOPE").map((scope) => scope.domain),
        institutionalAuthority: Boolean(expert.hasRegistrarAuthority),
        warning: "Ý kiến chuyên gia chỉ có giá trị trong phạm vi domain đã xác minh; không tự tạo ra thẩm quyền và không thay thế văn bản chính thức."
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
