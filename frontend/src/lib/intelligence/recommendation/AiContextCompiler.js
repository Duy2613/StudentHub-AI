/**
 * StudentHub AI — AI Context Compiler & Evidence Firewall V1
 * Compiles authorized, sanitized, and minimal intelligence packages for AI agents.
 */

import { PropertyFilter } from "../../security/authorization/PropertyFilter.js";
import { PurposeValidator } from "../../security/purpose/PurposeValidator.js";

export class AiContextCompiler {
  /**
   * Compiles an authorized, data-minimized intelligence context package for an AI Agent
   * @param {object} params
   * @param {object} params.agentPrincipal - SecurityPrincipal of delegating agent
   * @param {string} params.purpose - e.g. "ACADEMIC_PLANNING"
   * @param {object} params.rawStudentProfile - Full student profile record
   * @param {object[]} params.fusedClaims - Array of ClaimEntity objects
   * @param {object[]} params.evidenceList - Array of EvidenceEntity objects
   * @param {object[]} [params.expertSignals] - Array of expert summaries
   * @returns {object} Sanitized context object strictly safe for LLM ingestion
   */
  static compileContextForAgent({
    agentPrincipal,
    purpose = "ACADEMIC_PLANNING",
    rawStudentProfile = {},
    fusedClaims = [],
    evidenceList = [],
    expertSignals = []
  }) {
    // 1. Purpose Validation
    PurposeValidator.assertPurposeValid("COMPILE_AI_CONTEXT", purpose);

    // 2. Data Minimization on Student Profile (strips passwords, tokens, internal risk signals, admin notes)
    const sanitizedProfile = PropertyFilter.project(rawStudentProfile, "STUDENT");

    // 3. Claims Minimization (extract only validated statement, topic, confidence, and scope)
    const sanitizedClaims = (fusedClaims || []).map(claim => ({
      claimId: claim.claimId,
      statement: claim.statement,
      topicId: claim.topicId,
      status: claim.status,
      scope: claim.scope,
      confidence: claim.confidence,
      isContested: claim.isContested
    }));

    // 4. Evidence Minimization (extract public contentReference, type, and authority)
    const sanitizedEvidence = (evidenceList || []).map(e => ({
      evidenceId: e.evidenceId,
      claimId: e.claimId,
      type: e.type,
      contentReference: e.contentReference,
      authority: e.authority,
      recency: e.recency
    }));

    // 5. Expert Signals Minimization
    const sanitizedExperts = (expertSignals || []).map(exp => ({
      expertId: exp.expertId,
      fullName: exp.fullName,
      academicTitle: exp.title,
      department: exp.department,
      verificationStatus: exp.verificationStatus,
      matchedDomains: exp.matchedDomains
    }));

    return {
      contextId: `ctx_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      purpose,
      agentId: agentPrincipal.agentIdentity?.agentId || "unidentified_agent",
      targetSubjectId: agentPrincipal.subjectId,
      studentData: {
        cohort: sanitizedProfile.cohort,
        programCode: sanitizedProfile.programCode,
        academicSummary: sanitizedProfile.academicSummary,
        coursesSummary: (sanitizedProfile.courses || []).map(c => ({
          courseId: c.courseId,
          courseName: c.courseName,
          credits: c.credits,
          status: c.status
        }))
      },
      verifiedClaims: sanitizedClaims,
      supportingEvidence: sanitizedEvidence,
      expertTestimonies: sanitizedExperts,
      compiledAt: new Date().toISOString()
    };
  }
}
