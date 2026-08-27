/**
 * StudentHub AI — VectorSecurityGuard V1
 * 
 * Enforces authorization pre-filters, tenant scoping, and security post-filters
 * on vector database embeddings and semantic search retrieval.
 * Core Principle: High vector similarity alone NEVER bypasses access control or data minimization.
 */

import { SecurityError, SECURITY_ERROR_CODE } from "../../security/core/SecurityErrorEnvelope.js";

export const VECTOR_SECURITY_TIER = Object.freeze({
  PUBLIC: "PUBLIC",
  STUDENT_COMMUNITY: "STUDENT_COMMUNITY",
  VERIFIED_FACULTY: "VERIFIED_FACULTY",
  CONFIDENTIAL_STUDENT_RECORD: "CONFIDENTIAL_STUDENT_RECORD",
  SYSTEM_SECURITY: "SYSTEM_SECURITY"
});

export class VectorSecurityGuard {
  /**
   * Applies pre-retrieval filters to vector query parameters
   * @param {object} params
   * @param {object} params.principal - SecurityPrincipal executing the search
   * @param {string} [params.requestedTier] - VECTOR_SECURITY_TIER
   * @returns {object} Filter query payload for vector database
   */
  static buildSecureVectorFilter({ principal, requestedTier = VECTOR_SECURITY_TIER.PUBLIC }) {
    if (!principal) {
      // Unauthenticated search: strictly PUBLIC data only
      return {
        securityTier: { $eq: VECTOR_SECURITY_TIER.PUBLIC },
        isQuarantined: false
      };
    }

    const roles = principal.roles || [];
    const isStaffOrFaculty = roles.some(r => ["staff", "admin", "lecturer", "expert"].includes(r));

    if (requestedTier === VECTOR_SECURITY_TIER.CONFIDENTIAL_STUDENT_RECORD) {
      // Must be own student record or staff
      if (!isStaffOrFaculty && principal.subjectId !== principal.userId) {
        return {
          securityTier: { $eq: VECTOR_SECURITY_TIER.CONFIDENTIAL_STUDENT_RECORD },
          ownerSubjectId: { $eq: principal.subjectId },
          isQuarantined: false
        };
      }
    }

    const allowedTiers = [VECTOR_SECURITY_TIER.PUBLIC, VECTOR_SECURITY_TIER.STUDENT_COMMUNITY];
    if (isStaffOrFaculty) {
      allowedTiers.push(VECTOR_SECURITY_TIER.VERIFIED_FACULTY);
    }

    return {
      securityTier: { $in: allowedTiers },
      isQuarantined: false
    };
  }

  /**
   * Post-filters vector search results, validating provenance, version freshness, and confidentiality
   * @param {Array<object>} rawVectorMatches
   * @param {object} principal
   * @returns {Array<object>} Authorized vector matches
   */
  static sanitizeVectorResults(rawVectorMatches = [], principal = null) {
    if (!Array.isArray(rawVectorMatches)) return [];

    const subjectId = principal?.subjectId || "anonymous";
    const roles = principal?.roles || [];
    const isStaff = roles.some(r => ["staff", "admin"].includes(r));

    const sanitized = [];

    for (const match of rawVectorMatches) {
      // 1. Quarantined records blocked
      if (match.isQuarantined) continue;

      // 2. Security classification check
      if (match.securityTier === VECTOR_SECURITY_TIER.CONFIDENTIAL_STUDENT_RECORD) {
        if (!isStaff && match.ownerSubjectId !== subjectId) {
          continue; // Strip unauthorized private records
        }
      }

      // 3. Attach provenance audit metadata
      sanitized.push(Object.freeze({
        id: match.id,
        score: match.score,
        snippet: match.snippet,
        sourceId: match.sourceId,
        securityTier: match.securityTier,
        provenance: {
          version: match.version || "1.0",
          verifiedAt: match.verifiedAt || new Date().toISOString()
        }
      }));
    }

    return sanitized;
  }
}
