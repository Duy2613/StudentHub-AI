/**
 * StudentHub AI — Expert Intelligence Domain Model V1
 * 
 * Canonical contracts, immutable factories, and taxonomy for the
 * Expert Knowledge Graph, Scope Graphs, Credential Provenance & Jurisdiction.
 * 
 * Core Invariant: EXPERTISE ≠ INSTITUTIONAL AUTHORITY.
 */

export const EXPERTISE_LEVEL = Object.freeze({
  STRONG: "STRONG",                     // Direct verified peer-reviewed expertise / major publications
  MODERATE: "MODERATE",                 // Secondary / related educational background
  NOT_ESTABLISHED: "NOT_ESTABLISHED",   // Out-of-field claims without verified domain credentials
  DISQUALIFIED: "DISQUALIFIED"          // Retracted credentials or sanctioned conflict of interest
});

export const AFFILIATION_STATUS = Object.freeze({
  VERIFIED_ACTIVE: "VERIFIED_ACTIVE",   // Currently employed faculty / official role
  VERIFIED_FORMER: "VERIFIED_FORMER",   // Verified past role / alumni faculty
  UNVERIFIED: "UNVERIFIED",             // Self-proclaimed, missing institutional verification
  REVOKED: "REVOKED"                    // Credentials or affiliation terminated
});

export const JURISDICTION_TYPE = Object.freeze({
  TECHNICAL_DOMAIN: "TECHNICAL_DOMAIN",       // AI, Computer Science, Robotics, Electrical
  PEDAGOGICAL: "PEDAGOGICAL",                 // Teaching methodology, curriculum feedback
  INSTITUTIONAL_ADMIN: "INSTITUTIONAL_ADMIN", // Official HCMUTE administrative policy (Registrar, Rector)
  LEGAL_REGULATORY: "LEGAL_REGULATORY"        // Vietnam education law, ministerial policy
});

export const EXPERT_CLAIM_STATUS = Object.freeze({
  QUALIFIED_EXPERT_OPINION: "QUALIFIED_EXPERT_OPINION",     // Within verified strong expertise
  INTERPRETATION_ONLY: "INTERPRETATION_ONLY",               // Moderate expertise / heuristic advice
  OUT_OF_SCOPE: "OUT_OF_SCOPE",                             // Beyond established domain scope
  AUTHORITY_MISMATCH: "AUTHORITY_MISMATCH",                 // Claiming official administrative power without registrar role
  CONFLICT_OF_INTEREST: "CONFLICT_OF_INTEREST",             // Commercial bias or undeclared sponsorship
  RETRACTED: "RETRACTED"                                    // Previously corrected or withdrawn
});

export class ExpertIntelligenceModel {
  /**
   * Creates a canonical Expert Profile entity
   */
  static createExpert(data = {}) {
    const expertId = data.expertId || `EXP_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const name = typeof data.name === "string" ? data.name.trim() : "Chuyên Gia";
    const title = typeof data.title === "string" ? data.title.trim() : "Giảng Viên";
    const institution = typeof data.institution === "string" ? data.institution.trim() : "HCMUTE";
    const department = typeof data.department === "string" ? data.department.trim() : "Khoa CNTT";
    const affiliationStatus = AFFILIATION_STATUS[data.affiliationStatus] || AFFILIATION_STATUS.VERIFIED_ACTIVE;
    const scopes = Array.isArray(data.scopes) ? [...data.scopes] : []; // e.g. [{ domain: "AI_ML", level: "STRONG" }]
    const credentials = Array.isArray(data.credentials) ? [...data.credentials] : [];
    const publications = Array.isArray(data.publications) ? [...data.publications] : [];
    const administrativeRoles = Array.isArray(data.administrativeRoles) ? [...data.administrativeRoles] : [];

    return Object.freeze({
      expertId,
      name,
      title,
      institution,
      department,
      affiliationStatus,
      scopes: Object.freeze(scopes.map(s => this.createScopeNode(s))),
      credentials: Object.freeze(credentials.map(c => this.createCredential(c))),
      publications: Object.freeze(publications.map(p => this.createPublication(p))),
      administrativeRoles: Object.freeze([...administrativeRoles]),
      hasRegistrarAuthority: Boolean(data.hasRegistrarAuthority || administrativeRoles.includes("REGISTRAR_DIRECTOR")),
      isVerified: affiliationStatus === AFFILIATION_STATUS.VERIFIED_ACTIVE || affiliationStatus === AFFILIATION_STATUS.VERIFIED_FORMER,
      reputationScore: Number(data.reputationScore ?? 85),
      registeredAt: data.registeredAt || new Date().toISOString()
    });
  }

  /**
   * Creates a typed Scope Graph Node
   */
  static createScopeNode(data = {}) {
    const domain = typeof data.domain === "string" ? data.domain.trim().toUpperCase() : "GENERAL";
    const level = EXPERTISE_LEVEL[data.level] || EXPERTISE_LEVEL.NOT_ESTABLISHED;
    const jurisdiction = JURISDICTION_TYPE[data.jurisdiction] || JURISDICTION_TYPE.TECHNICAL_DOMAIN;
    const citationCount = typeof data.citationCount === "number" ? data.citationCount : 0;

    return Object.freeze({
      domain,
      level,
      jurisdiction,
      citationCount,
      evidenceIds: Array.isArray(data.evidenceIds) ? [...data.evidenceIds] : []
    });
  }

  /**
   * Creates a Credential record
   */
  static createCredential(data = {}) {
    return Object.freeze({
      credentialId: data.credentialId || `CRED_${Math.random().toString(36).slice(2, 7)}`,
      type: data.type || "DEGREE_PHD", // DEGREE_PHD, MASTERS, CERTIFICATION
      field: data.field || "Computer Science",
      issuer: data.issuer || "Đại học Quốc gia TP.HCM",
      issuedYear: data.issuedYear || 2020,
      verificationSource: data.verificationSource || "REGISTRY_MOET",
      isVerified: Boolean(data.isVerified !== false)
    });
  }

  /**
   * Creates a Publication record
   */
  static createPublication(data = {}) {
    return Object.freeze({
      pubId: data.pubId || `PUB_${Math.random().toString(36).slice(2, 7)}`,
      title: data.title || "Research Paper",
      venue: data.venue || "IEEE / ACM / Scopus",
      year: data.year || 2024,
      domain: data.domain || "AI_ML",
      doi: data.doi || null
    });
  }

  /**
   * Creates an Expert Claim record
   */
  static createExpertClaim(data = {}) {
    const claimId = data.claimId || `EXP_CLAIM_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const expertId = typeof data.expertId === "string" ? data.expertId.trim() : "";
    const text = typeof data.text === "string" ? data.text.trim() : "";
    const domain = typeof data.domain === "string" ? data.domain.trim().toUpperCase() : "GENERAL";
    const claimJurisdiction = JURISDICTION_TYPE[data.claimJurisdiction] || JURISDICTION_TYPE.TECHNICAL_DOMAIN;
    const status = EXPERT_CLAIM_STATUS[data.status] || EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION;
    const isCommercialEndorsement = Boolean(data.isCommercialEndorsement);
    const isRetracted = Boolean(data.isRetracted);

    return Object.freeze({
      claimId,
      expertId,
      text,
      domain,
      claimJurisdiction,
      status: isRetracted ? EXPERT_CLAIM_STATUS.RETRACTED : (
        isCommercialEndorsement ? EXPERT_CLAIM_STATUS.CONFLICT_OF_INTEREST : status
      ),
      isCommercialEndorsement,
      isRetracted,
      statedAt: data.statedAt || new Date().toISOString()
    });
  }

  /**
   * Creates an Auditable Expert Evaluation Object
   */
  static createExpertEvaluation(data = {}) {
    return Object.freeze({
      evaluationId: data.evaluationId || `EXP_EVAL_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      expertId: data.expertId || "",
      claim: data.claim || null,
      scopeLevel: EXPERTISE_LEVEL[data.scopeLevel] || EXPERTISE_LEVEL.NOT_ESTABLISHED,
      claimStatus: EXPERT_CLAIM_STATUS[data.claimStatus] || EXPERT_CLAIM_STATUS.OUT_OF_SCOPE,
      isWithinExpertise: Boolean(data.isWithinExpertise),
      isWithinJurisdiction: Boolean(data.isWithinJurisdiction),
      hasConflictOfInterest: Boolean(data.hasConflictOfInterest),
      explanation: typeof data.explanation === "string" ? data.explanation : "",
      reputationScore: Number(data.reputationScore ?? 80),
      evaluatedAt: data.evaluatedAt || new Date().toISOString()
    });
  }
}
