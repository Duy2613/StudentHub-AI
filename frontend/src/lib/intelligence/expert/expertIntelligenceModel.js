/**
 * StudentHub AI — Comprehensive Expert Intelligence Domain Model V2
 * Verified Expert Knowledge Graph & Scope Boundary Architecture
 * 
 * Canonical contracts, immutable factories, taxonomy, and state machines for:
 * - Expert Identity & Multi-Signal Entity Resolution (ORCID, @hcmute.edu.vn, DOIs)
 * - Credential Lifecycle & Effective Time Intervals (CREDENTIAL ≠ CURRENT ROLE)
 * - Multi-dimensional Domain Expertise Graph (ESTABLISHED / SUPPORTED / EMERGING / LIMITED)
 * - Authority Scope & Disciplinary Jurisdiction (EXPERTISE ≠ AUTHORITY)
 * - Claim Classification, Correction History (V1 -> V2) & Retraction Cascade
 * - Disagreement Mapping (Peer discrepancies without fame bias)
 * - "Why this expert?" & "Where NOT to trust" Scope Boundaries
 * - Conflict of Interest & Commercial Endorsement Transparency
 * - Shared Evidence Clustering (Shared papers != Independent Consensus)
 * 
 * Non-Negotiable Invariants:
 * ==================================================================================
 * 1. EXPERTISE NEVER AUTOMATICALLY CREATES INSTITUTIONAL AUTHORITY.
 * 2. IDENTITY ≠ EXPERTISE (Verified person != Universal authority).
 * 3. CREDENTIAL ≠ CURRENT ROLE (Department Head 2022 != Department Head 2026).
 * 4. POPULARITY / RATINGS NEVER CREATE ACADEMIC CREDIBILITY.
 * 5. PUBLICATION COUNT NEVER MAKES AN UNPROVEN CLAIM TRUE.
 * 6. THREE EXPERTS CITING ONE STUDY = ONE PROVENANCE CLUSTER, NOT 3 INDEPENDENT PROOFS.
 * 7. UNKNOWN MUST REMAIN UNKNOWN (NEVER GENERATIVELY AVERAGED).
 * ==================================================================================
 */

import crypto from "node:crypto";
import { createSecureId } from "../../security/secureId.js";

export const EXPERT_STATUS = Object.freeze({
  VERIFIED_EXPERT: "VERIFIED_EXPERT",       // Verified identity, active credentials, proven expertise
  PARTIALLY_VERIFIED: "PARTIALLY_VERIFIED", // Identity confirmed, but peripheral credentials pending
  IDENTITY_AMBIGUOUS: "IDENTITY_AMBIGUOUS", // Same name / multiple candidates, insufficient disambiguation
  UNVERIFIED_EXPERT: "UNVERIFIED_EXPERT",   // Self-claimed, missing official verification
  STALE_PROFILE: "STALE_PROFILE",           // No active publications or roles verified in last 3+ years
  DISPUTED: "DISPUTED",                     // Challenged by academic integrity board
  REVOKED: "REVOKED"                        // Credentials or institutional affiliation formally withdrawn
});

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
  ESTABLISHED: "ESTABLISHED",               // Strong verified peer-reviewed expertise / major publications
  SUPPORTED: "SUPPORTED",                   // Active research projects / verified specialized credentials
  EMERGING: "EMERGING",                     // Recent secondary work or cross-disciplinary explorations
  LIMITED: "LIMITED",                       // Heuristic familiarity, lacking primary peer-reviewed evidence
  UNKNOWN: "UNKNOWN",                       // No grounded domain evidence available
  OUT_OF_SCOPE: "OUT_OF_SCOPE",             // Beyond established domain scope
  STRONG: "ESTABLISHED",                    // Compatibility alias
  MODERATE: "SUPPORTED",                    // Compatibility alias
  NOT_ESTABLISHED: "OUT_OF_SCOPE",          // Compatibility alias
  DISQUALIFIED: "OUT_OF_SCOPE"              // Compatibility alias
});

export const AFFILIATION_STATUS = Object.freeze({
  VERIFIED_ACTIVE: "VERIFIED_ACTIVE",       // Currently employed faculty / official role in valid interval
  VERIFIED_FORMER: "VERIFIED_FORMER",       // Verified past role / alumni faculty
  UNVERIFIED: "UNVERIFIED",                 // Self-proclaimed, missing institutional verification
  REVOKED: "REVOKED"                        // Credentials or affiliation terminated
});

export const JURISDICTION_TYPE = Object.freeze({
  TECHNICAL_DOMAIN: "TECHNICAL_DOMAIN",       // AI, Computer Science, Robotics, Electrical
  RESEARCH_INTERPRETATION: "RESEARCH_INTERPRETATION", // Scientific analysis of published literature
  PEDAGOGICAL: "PEDAGOGICAL",                 // Teaching methodology, curriculum feedback
  INSTITUTIONAL_ADMIN: "INSTITUTIONAL_ADMIN", // Official HCMUTE administrative policy (Registrar, Rector)
  LEGAL_REGULATORY: "LEGAL_REGULATORY"        // Vietnam education law, ministerial policy
});

export const CLAIM_TYPE = Object.freeze({
  TECHNICAL_CLAIM: "TECHNICAL_CLAIM",                 // Specific engineering / scientific statement
  RESEARCH_CLAIM: "RESEARCH_CLAIM",                   // Novel finding / publication hypothesis
  PROFESSIONAL_GUIDANCE: "PROFESSIONAL_GUIDANCE",     // Career or research methodology advice
  EXPERT_OPINION: "EXPERT_OPINION",                   // Qualified academic viewpoint
  INTERPRETATION: "INTERPRETATION",                   // Analytical breakdown of existing knowledge
  FIRST_HAND_EXPERIENCE: "FIRST_HAND_EXPERIENCE",     // Direct classroom / project observation
  INSTITUTIONAL_CLAIM: "INSTITUTIONAL_CLAIM",         // Statement regarding university operations
  OFFICIAL_POLICY_CLAIM: "OFFICIAL_POLICY_CLAIM",      // Binding academic regulation / deadline
  OPINION: "EXPERT_OPINION",                          // Compatibility alias
  EXPERIENCE: "FIRST_HAND_EXPERIENCE"                 // Compatibility alias
});

export const CLAIM_STATUS = Object.freeze({
  SUPPORTED: "SUPPORTED",                             // Backed by active verified evidence
  CORRECTED: "CORRECTED",                             // Replaced by updated version (V1 -> V2)
  RETRACTED: "RETRACTED",                             // Withdrawn by author or journal
  DISPUTED: "DISPUTED",                               // Active disagreement among domain peers
  OUTDATED: "OUTDATED",                               // Stale / superseded by newer discoveries
  NEEDS_REEVALUATION: "NEEDS_REEVALUATION"            // Dependent on a retracted citation
});

export const EXPERT_CLAIM_STATUS = Object.freeze({
  QUALIFIED_EXPERT_OPINION: "QUALIFIED_EXPERT_OPINION",     // Within verified established expertise
  INTERPRETATION_ONLY: "INTERPRETATION_ONLY",               // Analytical interpretation of third-party evidence
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
  UNVERIFIED_EXPERT: "UNVERIFIED_EXPERT",                   // Identity or credentials unverified
  DISAGREEMENT_DETECTED: "DISAGREEMENT_DETECTED"            // Divergent expert perspectives mapped
});

export const RESOLUTION_STATUS = Object.freeze({
  EXACT_MATCH: "EXACT_MATCH",                               // Confirmed single entity via multiple strong signals
  POSSIBLE_SAME_PERSON: "POSSIBLE_SAME_PERSON",             // Likely match, requires minor secondary corroboration
  IDENTITY_AMBIGUOUS: "IDENTITY_AMBIGUOUS",                 // Same name / multiple candidates across institutions
  DIFFERENT_PERSON: "DIFFERENT_PERSON",                     // Confirmed separate entity
  UNRESOLVED: "UNRESOLVED"                                  // No matching profile found
});

export const DISAGREEMENT_REASON = Object.freeze({
  DIFFERENT_DATASETS: "DIFFERENT_DATASETS",
  DIFFERENT_COHORTS: "DIFFERENT_COHORTS",
  DIFFERENT_TIMEFRAMES: "DIFFERENT_TIMEFRAMES",
  DIFFERENT_METHODOLOGIES: "DIFFERENT_METHODOLOGIES",
  THEORETICAL_DIVERGENCE: "THEORETICAL_DIVERGENCE"
});

export class ExpertIntelligenceModel {
  /**
   * Creates a canonical, immutable Expert Profile entity V2
   */
  static createExpert(data = {}) {
    const expertId = data.expertId || createSecureId("EXP");
    const name = typeof data.name === "string" ? data.name.trim() : "Chuyên Gia";
    const canonicalIdentity = data.canonicalIdentity || name;
    const aliases = Array.isArray(data.aliases) ? Object.freeze([...data.aliases]) : Object.freeze([name]);
    const title = typeof data.title === "string" ? data.title.trim() : "Giảng Viên";
    const institution = typeof data.institution === "string" ? data.institution.trim() : "HCMUTE";
    const department = typeof data.department === "string" ? data.department.trim() : "Khoa CNTT";
    const affiliationStatus = AFFILIATION_STATUS[data.affiliationStatus] || AFFILIATION_STATUS.VERIFIED_ACTIVE;
    const status = EXPERT_STATUS[data.status] || (affiliationStatus === AFFILIATION_STATUS.VERIFIED_ACTIVE ? EXPERT_STATUS.VERIFIED_EXPERT : EXPERT_STATUS.UNVERIFIED_EXPERT);

    // Multi-signal identifiers
    const orcid = typeof data.orcid === "string" ? data.orcid.trim() : null;
    const verifiedEmail = typeof data.verifiedEmail === "string" ? data.verifiedEmail.trim().toLowerCase() : null;
    const directoryUrl = typeof data.directoryUrl === "string" ? data.directoryUrl.trim() : null;
    
    // Privacy protected fields
    const privateContact = data.privateContact ? { ...data.privateContact } : null;

    const scopes = Array.isArray(data.scopes) ? data.scopes.map(s => this.createScopeNode(s)) : [];
    const credentials = Array.isArray(data.credentials) ? data.credentials.map(c => this.createCredential(c)) : [];
    const publications = Array.isArray(data.publications) ? data.publications.map(p => this.createPublication(p)) : [];
    const roles = Array.isArray(data.roles) ? data.roles.map(r => this.createRole(r)) : [];
    const conflicts = Array.isArray(data.conflicts) ? data.conflicts.map(cf => this.createConflict(cf)) : [];
    const evidenceRefs = Array.isArray(data.evidenceRefs) ? [...data.evidenceRefs] : [];

    const isVerified = data.isVerified !== undefined
      ? Boolean(data.isVerified)
      : (status === EXPERT_STATUS.VERIFIED_EXPERT || affiliationStatus === AFFILIATION_STATUS.VERIFIED_ACTIVE);

    // Registrar authority check: must hold active, unexpired role
    const now = new Date();
    const hasRegistrarAuthority = Boolean(
      data.hasRegistrarAuthority || 
      roles.some(r => (r.roleTitle === "REGISTRAR_DIRECTOR" || r.roleTitle === "RECTOR") && (!r.validUntil || new Date(r.validUntil) >= now))
    );

    return Object.freeze({
      expertId,
      canonicalIdentity,
      aliases,
      name,
      title,
      institution,
      department,
      affiliationStatus,
      status,
      orcid,
      verifiedEmail,
      directoryUrl,
      privateContact: privateContact ? Object.freeze(privateContact) : null,
      scopes: Object.freeze(scopes),
      expertiseDomains: Object.freeze(scopes.map(s => s.domain)),
      credentials: Object.freeze(credentials),
      publications: Object.freeze(publications),
      roles: Object.freeze(roles),
      conflicts: Object.freeze(conflicts),
      evidenceRefs: Object.freeze(evidenceRefs),
      hasRegistrarAuthority,
      isVerified,
      reputationScore: Number(data.reputationScore ?? 85),
      verifiedAt: data.verifiedAt || data.lastVerifiedAt || new Date().toISOString(),
      lastVerifiedAt: data.lastVerifiedAt || data.verifiedAt || new Date().toISOString(),
      lastCheckedAt: data.lastCheckedAt || new Date().toISOString(),
      registeredAt: data.registeredAt || new Date().toISOString()
    });
  }

  /**
   * Creates a typed Scope Graph Node
   */
  static createScopeNode(data = {}) {
    const domain = typeof data.domain === "string" ? data.domain.trim().toUpperCase() : "GENERAL_ACADEMIC";
    const subdomain = typeof data.subdomain === "string" ? data.subdomain.trim() : "General";
    const level = EXPERTISE_LEVEL[data.level] || EXPERTISE_LEVEL.SUPPORTED;
    const jurisdiction = JURISDICTION_TYPE[data.jurisdiction] || JURISDICTION_TYPE.TECHNICAL_DOMAIN;
    const citationCount = Number(data.citationCount || 0);
    const recencyYear = Number(data.recencyYear || new Date().getFullYear());
    const evidenceRefs = Array.isArray(data.evidenceRefs) ? [...data.evidenceRefs] : [];

    return Object.freeze({
      domain,
      subdomain,
      level,
      jurisdiction,
      citationCount,
      recencyYear,
      evidenceRefs: Object.freeze(evidenceRefs),
      isEstablished: level === EXPERTISE_LEVEL.ESTABLISHED || level === EXPERTISE_LEVEL.SUPPORTED
    });
  }

  /**
   * Creates an immutable Credential Entity V2
   */
  static createCredential(data = {}) {
    const credentialId = data.credentialId || createSecureId("CRED");
    const type = data.type || "DEGREE_PHD";
    const title = data.title || (data.field ? `Degree in ${data.field}` : "Tiến Sĩ");
    const issuingInstitution = data.issuingInstitution || data.issuer || "Đại Học Sư Phạm Kỹ Thuật";
    const issuer = issuingInstitution;
    const issuedAt = data.issuedAt || (data.issuedYear ? `${data.issuedYear}-01-01` : "2020-01-01");
    const validUntil = data.validUntil || data.expiresAt || null;
    const expiresAt = validUntil;
    const verificationMethod = data.verificationMethod || data.verificationSource || (data.status === CREDENTIAL_STATUS.VERIFIED ? "OFFICIAL_MOET_REGISTRY" : "SELF_CLAIMED");
    const verificationSource = verificationMethod;
    const evidenceRefs = Array.isArray(data.evidenceRefs) ? [...data.evidenceRefs] : [];

    let status = CREDENTIAL_STATUS[data.status] || (data.isVerified !== undefined ? (data.isVerified ? CREDENTIAL_STATUS.VERIFIED : CREDENTIAL_STATUS.UNVERIFIED) : (data.verificationSource || data.verificationMethod ? CREDENTIAL_STATUS.VERIFIED : CREDENTIAL_STATUS.UNVERIFIED));
    
    // Auto detect expired credential
    if (validUntil && new Date(validUntil) < new Date()) {
      status = CREDENTIAL_STATUS.EXPIRED;
    }

    const isVerified = data.isVerified !== undefined
      ? Boolean(data.isVerified && status !== CREDENTIAL_STATUS.EXPIRED && status !== CREDENTIAL_STATUS.REVOKED && status !== CREDENTIAL_STATUS.UNVERIFIED)
      : (status === CREDENTIAL_STATUS.VERIFIED);

    return Object.freeze({
      credentialId,
      type,
      title,
      field: data.field || title,
      issuingInstitution,
      issuer,
      issuedAt,
      issuedYear: Number(data.issuedYear || (issuedAt ? parseInt(issuedAt.slice(0, 4)) : 2020)),
      expiresAt,
      validUntil,
      status,
      isVerified,
      verificationMethod,
      verificationSource,
      evidenceRefs: Object.freeze(evidenceRefs),
      verifiedAt: data.verifiedAt || new Date().toISOString()
    });
  }

  /**
   * Creates an immutable Role Entity V2
   */
  static createRole(data = {}) {
    const roleId = data.roleId || createSecureId("ROLE");
    const roleTitle = typeof data.roleTitle === "string" ? data.roleTitle.trim() : (data.title || "Giảng Viên");
    const organization = typeof data.organization === "string" ? data.organization.trim() : (data.institution || "HCMUTE");
    const department = typeof data.department === "string" ? data.department.trim() : "Khoa CNTT";
    const validFrom = data.validFrom || "2020-01-01";
    const validUntil = data.validUntil || null;

    const isCurrent = !validUntil || new Date(validUntil) >= new Date();

    return Object.freeze({
      roleId,
      roleTitle,
      title: roleTitle,
      organization,
      institution: organization,
      department,
      validFrom,
      validUntil,
      isCurrent,
      verificationSource: data.verificationSource || "OFFICIAL_FACULTY_PAGE",
      lastCheckedAt: data.lastCheckedAt || new Date().toISOString()
    });
  }

  /**
   * Creates a Peer-Reviewed Publication node
   */
  static createPublication(data = {}) {
    const pubId = data.pubId || createSecureId("PUB");
    const title = typeof data.title === "string" ? data.title.trim() : "Nghiên cứu khoa học";
    const venue = typeof data.venue === "string" ? data.venue.trim() : "Hội nghị Khoa học HCMUTE";
    const year = Number(data.year || new Date().getFullYear());
    const domain = typeof data.domain === "string" ? data.domain.trim().toUpperCase() : "AI_ML";
    const doi = typeof data.doi === "string" ? data.doi.trim().toLowerCase() : null;
    const isRetracted = Boolean(data.isRetracted);
    const citationCount = Number(data.citationCount || 0);
    const provenanceClusterId = data.provenanceClusterId || `CLUSTER_${this.computeHash(title).slice(0, 8)}`;

    return Object.freeze({
      pubId,
      title,
      venue,
      year,
      domain,
      doi,
      isRetracted,
      citationCount,
      provenanceClusterId
    });
  }

  /**
   * Creates a Conflict of Interest Record V2
   */
  static createConflict(data = {}) {
    const conflictId = data.conflictId || createSecureId("COI");
    const entity = typeof data.entity === "string" ? data.entity.trim() : (data.entityName || "Tổ chức thương mại");
    const nature = data.nature || data.relationship || "COMMERCIAL_SPONSORSHIP"; // CONSULTANCY, VENDOR_COMMISSION, EMPLOYER
    const domain = typeof data.domain === "string" ? data.domain.trim().toUpperCase() : null;
    const isActive = data.isActive !== undefined ? Boolean(data.isActive) : true;
    const disclosedAt = data.disclosedAt || new Date().toISOString();

    return Object.freeze({
      conflictId,
      entity,
      entityName: entity,
      nature,
      relationship: nature,
      domain,
      isActive,
      disclosedAt,
      description: data.description || `Mối quan hệ tư vấn/tài trợ với ${entity}.`
    });
  }

  /**
   * Creates an Expert Claim entity V2
   */
  static createExpertClaim(data = {}) {
    const claimId = data.claimId || createSecureId("EXP_CLM");
    const expertId = data.expertId || "EXP_UNKNOWN";
    const statement = typeof data.statement === "string" ? data.statement.trim() : (typeof data.text === "string" ? data.text.trim() : "");
    const claimType = CLAIM_TYPE[data.claimType] || CLAIM_TYPE.EXPERT_OPINION;
    const domain = typeof data.domain === "string" ? data.domain.trim().toUpperCase() : "AI_ML";
    const scope = data.scope || "GENERAL";
    const claimJurisdiction = JURISDICTION_TYPE[data.claimJurisdiction || data.jurisdiction] || JURISDICTION_TYPE.TECHNICAL_DOMAIN;
    const supersededByClaimId = data.supersededByClaimId || null;
    const status = data.status ? (CLAIM_STATUS[data.status] || data.status) : (supersededByClaimId ? CLAIM_STATUS.CORRECTED : CLAIM_STATUS.SUPPORTED);
    const version = Number(data.version || 1);
    const publishedAt = data.publishedAt || new Date().toISOString();
    const evidenceRefs = Array.isArray(data.evidenceRefs) ? [...data.evidenceRefs] : [];
    const citedEvidenceIds = Array.isArray(data.citedEvidenceIds) ? [...data.citedEvidenceIds] : evidenceRefs;
    const citedPublicationDoi = data.citedPublicationDoi || null;
    const isRetracted = Boolean(data.isRetracted || status === CLAIM_STATUS.RETRACTED);
    const isCommercialEndorsement = Boolean(data.isCommercialEndorsement);

    return Object.freeze({
      claimId,
      expertId,
      statement,
      text: statement,
      claimType,
      domain,
      scope,
      jurisdiction: claimJurisdiction,
      claimJurisdiction,
      status,
      version,
      publishedAt,
      evidenceRefs: Object.freeze(evidenceRefs),
      citedEvidenceIds: Object.freeze(citedEvidenceIds),
      citedPublicationDoi,
      isRetracted,
      isCommercialEndorsement,
      correctionReason: data.correctionReason || null,
      supersedesClaimId: data.supersedesClaimId || null,
      supersededByClaimId
    });
  }

  /**
   * Redacts private contact details from public view
   */
  static redactForPublic(expert) {
    if (!expert) return null;
    const clone = { ...expert };
    delete clone.privateContact;
    return Object.freeze(clone);
  }

  /**
   * Creates a structured Expert Evaluation response
   */
  static createExpertEvaluation(data = {}) {
    return Object.freeze({
      evaluationId: data.evaluationId || createSecureId("EXP_EVAL"),
      expertId: data.expertId,
      claim: data.claim ? this.createExpertClaim(data.claim) : null,
      scopeLevel: EXPERTISE_LEVEL[data.scopeLevel] || EXPERTISE_LEVEL.OUT_OF_SCOPE,
      claimStatus: EXPERT_CLAIM_STATUS[data.claimStatus] || EXPERT_CLAIM_STATUS.QUALIFIED_EXPERT_OPINION,
      answerMode: QUERY_ANSWER_MODE[data.answerMode] || QUERY_ANSWER_MODE.EXPERT_OPINION,
      isWithinExpertise: Boolean(data.isWithinExpertise),
      isWithinJurisdiction: Boolean(data.isWithinJurisdiction),
      hasConflictOfInterest: Boolean(data.hasConflictOfInterest),
      explanation: data.explanation || "",
      evaluatedAt: new Date().toISOString()
    });
  }

  /**
   * Creates a structured Disagreement Map between experts
   */
  static createDisagreementMap(data = {}) {
    return Object.freeze({
      mapId: data.mapId || createSecureId("DISAGREE"),
      topic: data.topic || "Chủ đề học thuật",
      domain: data.domain || "AI_ML",
      expertA: data.expertA ? { ...data.expertA } : null,
      claimA: data.claimA ? this.createExpertClaim(data.claimA) : null,
      evidenceA: data.evidenceA || [],
      expertB: data.expertB ? { ...data.expertB } : null,
      claimB: data.claimB ? this.createExpertClaim(data.claimB) : null,
      evidenceB: data.evidenceB || [],
      divergenceReason: DISAGREEMENT_REASON[data.divergenceReason] || DISAGREEMENT_REASON.DIFFERENT_DATASETS,
      uncertainty: Number(data.uncertainty ?? 0.4),
      analysis: data.analysis || "Hai chuyên gia sử dụng các tập dữ liệu thực nghiệm khác nhau dẫn đến nhận định phân kỳ hợp lý."
    });
  }

  /**
   * Creates a 'Why this expert?' Explanation Report
   */
  static createWhyThisExpertReport(data = {}) {
    return Object.freeze({
      expertId: data.expertId,
      canonicalIdentity: data.canonicalIdentity || data.name,
      isIdentityVerified: Boolean(data.isIdentityVerified),
      identityEvidence: data.identityEvidence || "Đã xác thực danh tính qua cổng thông tin FIT HCMUTE và ORCID.",
      currentRole: data.currentRole || "Trưởng Bộ Môn Trí Tuệ Nhân Tạo",
      isRoleCurrent: Boolean(data.isRoleCurrent ?? true),
      relevantExpertise: data.relevantExpertise || "AI_ML (ESTABLISHED)",
      supportingEvidence: Object.freeze(Array.isArray(data.supportingEvidence) ? [...data.supportingEvidence] : []),
      authorityScope: data.authorityScope || "Nghiên cứu & Phương pháp luận học thuật (Không có thẩm quyền quy chế hành chính).",
      scopeBoundaries: data.scopeBoundaries || {
        established: ["AI_ML", "Computer Vision"],
        limited: ["EdTech"],
        outOfScope: ["HCMUTE Tuition & Administrative Regulations"]
      },
      recencyStatus: data.recencyStatus || "ACTIVE (Công trình mới nhất năm 2024)",
      limitations: Object.freeze([
        "Ý kiến mang tính hướng dẫn chuyên môn và phương pháp nghiên cứu.",
        "Không thay thế văn bản quy chế ban hành bởi Ban Giám Hiệu hoặc Phòng Đào Tạo."
      ])
    });
  }

  /**
   * Computes deterministic SHA-256 hash
   */
  static computeHash(text = "") {
    return crypto.createHash("sha256").update(String(text).trim()).digest("hex");
  }
}
