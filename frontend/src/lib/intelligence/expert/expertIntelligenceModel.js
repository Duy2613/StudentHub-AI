/**
 * StudentHub AI — Comprehensive Expert Intelligence Domain Model V1
 * 
 * Canonical contracts, immutable factories, taxonomy, and state machines for:
 * - Expert Identity & Multi-Signal Entity Resolution
 * - Credential Lifecycle & Provenance Tracking
 * - Multi-dimensional Domain Expertise Graph
 * - Authority Scope & Disciplinary Jurisdiction (EXPERTISE ≠ AUTHORITY)
 * - Claim Classification, Correction History & Retraction Propagation
 * - Conflict of Interest & Commercial Endorsement Guard
 * - Shared Evidence Clustering & Privacy Redaction
 */

export const CREDENTIAL_STATUS = Object.freeze({
  VERIFIED: "VERIFIED",                     // Confirmed by institutional registry / MOET / ORCID
  PARTIALLY_VERIFIED: "PARTIALLY_VERIFIED", // Verified institution but pending official degree index
  UNVERIFIED: "UNVERIFIED",                 // Self-claimed, no external proof
  EXPIRED: "EXPIRED",                       // Time-bounded role or certificate passed validUntil
  DISPUTED: "DISPUTED",                     // Challenged by academic integrity board
  REVOKED: "REVOKED",                       // Withdrawn or revoked degree/license
  UNKNOWN: "UNKNOWN"                        // Unresolvable status
});

export const EXPERTISE_LEVEL = Object.freeze({
  STRONG: "STRONG",                     // Direct verified peer-reviewed expertise / major publications
  MODERATE: "MODERATE",                 // Secondary / related educational background
  NOT_ESTABLISHED: "NOT_ESTABLISHED",   // Out-of-field claims without verified domain credentials
  DISQUALIFIED: "DISQUALIFIED"          // Retracted credentials or sanctioned conflict of interest
});

export const AFFILIATION_STATUS = Object.freeze({
  VERIFIED_ACTIVE: "VERIFIED_ACTIVE",   // Currently employed faculty / official role in valid interval
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

export const CLAIM_TYPE = Object.freeze({
  OPINION: "OPINION",                                 // Personal viewpoint / perspective
  INTERPRETATION: "INTERPRETATION",                   // Analytical breakdown of existing knowledge
  TECHNICAL_CLAIM: "TECHNICAL_CLAIM",                 // Specific engineering / scientific statement
  RESEARCH_CLAIM: "RESEARCH_CLAIM",                   // Novel finding / publication hypothesis
  EXPERIENCE: "EXPERIENCE",                           // Professional / teaching experience
  PROFESSIONAL_GUIDANCE: "PROFESSIONAL_GUIDANCE",     // Career or research methodology advice
  INSTITUTIONAL_CLAIM: "INSTITUTIONAL_CLAIM",         // Statement regarding university operations
  OFFICIAL_POLICY_CLAIM: "OFFICIAL_POLICY_CLAIM"      // Binding academic regulation / deadline
});

export const CLAIM_STATUS = Object.freeze({
  SUPPORTED: "SUPPORTED",                             // Backed by active verified evidence
  CORRECTED: "CORRECTED",                             // Replaced by updated version (V1 -> V2)
  RETRACTED: "RETRACTED",                             // Withdrawn by author or journal
  DISPUTED: "DISPUTED",                               // Active disagreement among domain peers
  OUTDATED: "OUTDATED"                                // Stale / superseded by newer discoveries
});

export const EXPERT_CLAIM_STATUS = Object.freeze({
  QUALIFIED_EXPERT_OPINION: "QUALIFIED_EXPERT_OPINION",     // Within verified strong expertise
  INTERPRETATION_ONLY: "INTERPRETATION_ONLY",               // Moderate expertise / heuristic advice
  OUT_OF_SCOPE: "OUT_OF_SCOPE",                             // Beyond established domain scope
  AUTHORITY_MISMATCH: "AUTHORITY_MISMATCH",                 // Claiming official administrative power without registrar role
  CONFLICT_OF_INTEREST: "CONFLICT_OF_INTEREST",             // Commercial bias or undeclared sponsorship
  RETRACTED: "RETRACTED"                                    // Previously corrected or withdrawn
});

export const QUERY_ANSWER_MODE = Object.freeze({
  EXPERT_CONTEXT: "EXPERT_CONTEXT",                         // Relevant background knowledge provided
  EXPERT_OPINION: "EXPERT_OPINION",                         // Qualified academic viewpoint
  EXPERT_SUPPORTED: "EXPERT_SUPPORTED",                     // Strongly backed by published evidence
  EXPERT_CONFLICTED: "EXPERT_CONFLICTED",                   // Potential conflict of interest detected
  EXPERT_SCOPE_MISMATCH: "EXPERT_SCOPE_MISMATCH",           // Domain outside expert scope
  UNVERIFIED_EXPERT: "UNVERIFIED_EXPERT"                    // Identity or credentials unverified
});

export const RESOLUTION_STATUS = Object.freeze({
  EXACT_MATCH: "EXACT_MATCH",                               // Confirmed single entity via multiple strong signals
  IDENTITY_AMBIGUOUS: "IDENTITY_AMBIGUOUS",                 // Same name / multiple candidates, insufficient signals
  UNRESOLVED: "UNRESOLVED"                                  // No matching profile found
});

export class ExpertIntelligenceModel {
  /**
   * Creates a canonical, immutable Expert Profile entity
   */
  static createExpert(data = {}) {
    const expertId = data.expertId || `EXP_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const name = typeof data.name === "string" ? data.name.trim() : "Chuyên Gia";
    const title = typeof data.title === "string" ? data.title.trim() : "Giảng Viên";
    const institution = typeof data.institution === "string" ? data.institution.trim() : "HCMUTE";
    const department = typeof data.department === "string" ? data.department.trim() : "Khoa CNTT";
    const affiliationStatus = AFFILIATION_STATUS[data.affiliationStatus] || AFFILIATION_STATUS.VERIFIED_ACTIVE;
    
    // Identity resolution signals
    const orcid = typeof data.orcid === "string" ? data.orcid.trim() : null;
    const verifiedEmail = typeof data.verifiedEmail === "string" ? data.verifiedEmail.trim() : null;
    const directoryUrl = typeof data.directoryUrl === "string" ? data.directoryUrl.trim() : null;
    
    // Privacy protected fields
    const privateContact = data.privateContact ? { ...data.privateContact } : null;

    const scopes = Array.isArray(data.scopes) ? [...data.scopes] : [];
    const credentials = Array.isArray(data.credentials) ? [...data.credentials] : [];
    const publications = Array.isArray(data.publications) ? [...data.publications] : [];
    const roles = Array.isArray(data.roles) ? [...data.roles] : [];
    const conflicts = Array.isArray(data.conflicts) ? [...data.conflicts] : [];

    const isVerified = data.isVerified !== undefined
      ? Boolean(data.isVerified)
      : (affiliationStatus === AFFILIATION_STATUS.VERIFIED_ACTIVE || affiliationStatus === AFFILIATION_STATUS.VERIFIED_FORMER);

    const hasRegistrarAuthority = Boolean(
      data.hasRegistrarAuthority || 
      roles.some(r => r.roleTitle === "REGISTRAR_DIRECTOR" && (!r.validUntil || new Date(r.validUntil) >= new Date()))
    );

    return Object.freeze({
      expertId,
      name,
      title,
      institution,
      department,
      affiliationStatus,
      orcid,
      verifiedEmail,
      directoryUrl,
      privateContact: privateContact ? Object.freeze(privateContact) : null,
      scopes: Object.freeze(scopes.map(s => this.createScopeNode(s))),
      credentials: Object.freeze(credentials.map(c => this.createCredential(c))),
      publications: Object.freeze(publications.map(p => this.createPublication(p))),
      roles: Object.freeze(roles.map(r => this.createRole(r))),
      conflicts: Object.freeze(conflicts.map(cf => this.createConflict(cf))),
      hasRegistrarAuthority,
      isVerified,
      reputationScore: Number(data.reputationScore ?? 85),
      lastVerifiedAt: data.lastVerifiedAt || new Date().toISOString(),
      registeredAt: data.registeredAt || new Date().toISOString()
    });
  }

  /**
   * Creates a typed Scope Graph Node
   */
  static createScopeNode(data = {}) {
    const domain = typeof data.domain === "string" ? data.domain.trim().toUpperCase() : "GENERAL";
    const subdomain = typeof data.subdomain === "string" ? data.subdomain.trim() : null;
    const level = EXPERTISE_LEVEL[data.level] || EXPERTISE_LEVEL.NOT_ESTABLISHED;
    const jurisdiction = JURISDICTION_TYPE[data.jurisdiction] || JURISDICTION_TYPE.TECHNICAL_DOMAIN;
    const citationCount = typeof data.citationCount === "number" ? data.citationCount : 0;
    const recencyYear = typeof data.recencyYear === "number" ? data.recencyYear : new Date().getFullYear();

    return Object.freeze({
      domain,
      subdomain,
      level,
      jurisdiction,
      citationCount,
      recencyYear,
      evidenceIds: Array.isArray(data.evidenceIds) ? Object.freeze([...data.evidenceIds]) : Object.freeze([])
    });
  }

  /**
   * Creates a Credential record with lifecycle state & validity interval
   */
  static createCredential(data = {}) {
    const credentialId = data.credentialId || `CRED_${Math.random().toString(36).slice(2, 7)}`;
    const type = data.type || "DEGREE_PHD";
    const field = data.field || "Computer Science";
    const issuer = data.issuer || "Đại học Quốc gia TP.HCM";
    const issuedYear = data.issuedYear || 2020;
    const validUntil = data.validUntil || null;
    const verificationSource = data.verificationSource || "REGISTRY_MOET";
    
    // Auto-check expiry
    let status = CREDENTIAL_STATUS[data.status] || (data.isVerified !== false ? CREDENTIAL_STATUS.VERIFIED : CREDENTIAL_STATUS.UNVERIFIED);
    if (validUntil && new Date(validUntil) < new Date() && status === CREDENTIAL_STATUS.VERIFIED) {
      status = CREDENTIAL_STATUS.EXPIRED;
    }

    return Object.freeze({
      credentialId,
      type,
      field,
      issuer,
      issuedYear,
      validUntil,
      verificationSource,
      status,
      isVerified: status === CREDENTIAL_STATUS.VERIFIED
    });
  }

  /**
   * Creates a Role with effective temporal interval
   */
  static createRole(data = {}) {
    return Object.freeze({
      roleId: data.roleId || `ROLE_${Math.random().toString(36).slice(2, 7)}`,
      roleTitle: data.roleTitle || "FACULTY_MEMBER", // REGISTRAR_DIRECTOR, DEPT_HEAD, PROFESSOR
      organization: data.organization || "HCMUTE",
      validFrom: data.validFrom || "2020-01-01",
      validUntil: data.validUntil || null,
      isCurrent: !data.validUntil || new Date(data.validUntil) >= new Date()
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
      domain: (data.domain || "AI_ML").toUpperCase(),
      doi: data.doi || null,
      isRetracted: Boolean(data.isRetracted),
      citationCount: Number(data.citationCount || 0)
    });
  }

  /**
   * Creates an Expert Claim record with versioning and retraction dependency
   */
  static createExpertClaim(data = {}) {
    const claimId = data.claimId || `EXP_CLAIM_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const expertId = typeof data.expertId === "string" ? data.expertId.trim() : "";
    const text = typeof data.text === "string" ? data.text.trim() : "";
    const domain = typeof data.domain === "string" ? data.domain.trim().toUpperCase() : "GENERAL";
    const claimType = CLAIM_TYPE[data.claimType] || CLAIM_TYPE.TECHNICAL_CLAIM;
    const claimJurisdiction = JURISDICTION_TYPE[data.claimJurisdiction] || JURISDICTION_TYPE.TECHNICAL_DOMAIN;
    const version = Number(data.version || 1);
    const supersededByClaimId = data.supersededByClaimId || null;
    const citedEvidenceIds = Array.isArray(data.citedEvidenceIds) ? [...data.citedEvidenceIds] : [];
    const isCommercialEndorsement = Boolean(data.isCommercialEndorsement);
    const isRetracted = Boolean(data.isRetracted);

    let status = CLAIM_STATUS[data.status] || CLAIM_STATUS.SUPPORTED;
    if (isRetracted) {
      status = CLAIM_STATUS.RETRACTED;
    } else if (supersededByClaimId) {
      status = CLAIM_STATUS.CORRECTED;
    }

    return Object.freeze({
      claimId,
      expertId,
      text,
      domain,
      claimType,
      claimJurisdiction,
      version,
      supersededByClaimId,
      citedEvidenceIds: Object.freeze(citedEvidenceIds),
      status,
      isCommercialEndorsement,
      isRetracted,
      statedAt: data.statedAt || new Date().toISOString()
    });
  }

  /**
   * Creates a Conflict of Interest Record
   */
  static createConflict(data = {}) {
    return Object.freeze({
      conflictId: data.conflictId || `CONF_${Math.random().toString(36).slice(2, 7)}`,
      entityName: data.entityName || "Thương mại XYZ",
      relationship: data.relationship || "CONSULTANT_SPONSOR", // SPONSOR, EMPLOYER, VENDOR, COMMERCIAL_PROMOTER
      description: data.description || "Tài trợ hoặc đại diện thương mại",
      isActive: Boolean(data.isActive !== false)
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
      answerMode: QUERY_ANSWER_MODE[data.answerMode] || QUERY_ANSWER_MODE.EXPERT_OPINION,
      isWithinExpertise: Boolean(data.isWithinExpertise),
      isWithinJurisdiction: Boolean(data.isWithinJurisdiction),
      hasConflictOfInterest: Boolean(data.hasConflictOfInterest),
      explanation: typeof data.explanation === "string" ? data.explanation : "",
      reputationScore: Number(data.reputationScore ?? 80),
      evaluatedAt: data.evaluatedAt || new Date().toISOString()
    });
  }

  /**
   * Redacts private contact information from Expert Profile for public API consumption
   */
  static redactForPublic(expert) {
    if (!expert) return null;
    const { privateContact, ...publicFields } = expert;
    return Object.freeze(publicFields);
  }
}
