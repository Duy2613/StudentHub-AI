/**
 * StudentHub AI — Zero-Trust Security Fabric
 * ReBACPolicy V1
 * 
 * Relationship-Based Access Control evaluator:
 * - Checks relational bindings (OWNS, MEMBER_OF, MANAGES, ACTS_FOR)
 * - Guarantees AI Agent can only act within delegated student relationship
 */

export const RELATIONSHIPS = Object.freeze({
  OWNS: "OWNS",
  MEMBER_OF: "MEMBER_OF",
  MANAGES: "MANAGES",
  ACTS_FOR: "ACTS_FOR"
});

export class ReBACPolicy {
  /**
   * Evaluates if principal has valid relationship with resource
   * @param {object} params
   * @param {object} params.principal
   * @param {object} params.resource - { type, ownerId, members, facultyId }
   * @param {string} params.requiredRelationship - RELATIONSHIPS enum
   * @returns {{ allowed: boolean, reason?: string }}
   */
  static evaluate({ principal, resource, requiredRelationship = RELATIONSHIPS.OWNS }) {
    if (!principal || !resource) {
      return { allowed: false, reason: "Missing principal or resource context." };
    }

    // Admins bypass standard relationship constraints for system administration
    if (principal.hasRole("ADMIN") || principal.hasRole("SYSTEM")) {
      return { allowed: true };
    }

    const principalSubject = principal.subjectId; // e.g. "student:24110001" or "24110001"
    const cleanPrincipalStudentId = principalSubject.replace("student:", "").trim();

    // 1. Direct Ownership (OWNS)
    if (requiredRelationship === RELATIONSHIPS.OWNS) {
      const resourceOwner = String(resource.ownerId || resource.studentId || "").trim();
      const cleanResourceOwner = resourceOwner.replace("student:", "").trim();

      // Check direct match
      if (cleanPrincipalStudentId && cleanResourceOwner && cleanPrincipalStudentId === cleanResourceOwner) {
        return { allowed: true };
      }

      // Check Agent Delegation: AI Agent ACTS_FOR student
      if (principal.isAgent && principal.agentIdentity) {
        const delegatorId = String(principal.agentIdentity.delegatorId || principal.attributes?.delegatorId || "").trim();
        const cleanDelegator = delegatorId.replace("student:", "").trim();
        if (cleanDelegator && cleanDelegator === cleanResourceOwner) {
          return { allowed: true };
        }
      }

      return {
        allowed: false,
        reason: `OBJECT_NOT_OWNED: Principal '${principalSubject}' does not own resource belonging to '${resourceOwner}'.`
      };
    }

    // 2. Member of Cohort / Class / Faculty (MEMBER_OF)
    if (requiredRelationship === RELATIONSHIPS.MEMBER_OF) {
      const members = Array.isArray(resource.members) ? resource.members : [];
      if (members.includes(cleanPrincipalStudentId) || members.includes(principalSubject)) {
        return { allowed: true };
      }
      return { allowed: false, reason: "Principal is not a member of the target group." };
    }

    // 3. Management / Moderation (MANAGES)
    if (requiredRelationship === RELATIONSHIPS.MANAGES) {
      if (principal.hasRole("MODERATOR") || principal.hasRole("ADMIN")) {
        return { allowed: true };
      }
      return { allowed: false, reason: "Principal does not hold managerial/moderation relationship." };
    }

    return { allowed: false, reason: `Unsupported relationship: '${requiredRelationship}'.` };
  }
}
