/**
 * StudentHub AI — Zero-Trust Security Fabric
 * PropertyFilter V1
 * 
 * Property-Level Authorization & Data Minimization Projections:
 * - Prevents over-serialization and mass exposure of internal records
 * - Tailors data projections by role (STUDENT, AI_AGENT, ADMIN)
 * - Sanitizes internal security signals, passwords, OTPs, and admin notes
 */

export class PropertyFilter {
  /**
   * Projections for Student Profiles based on requester role
   * @param {object} rawData 
   * @param {object} principal - SecurityPrincipal
   * @returns {object} Filtered projection
   */
  static filterStudentProfile(rawData, principal) {
    if (!rawData || typeof rawData !== "object") return rawData;

    // Admin / Staff receives full projection minus raw security credentials
    if (principal?.hasRole("ADMIN") || principal?.hasRole("STAFF")) {
      const sanitized = { ...rawData };
      delete sanitized.passwordHash;
      delete sanitized.otpSecret;
      return sanitized;
    }

    // AI Agent receives minimal academic projection
    if (principal?.isAgent) {
      return {
        studentId: rawData.studentId || rawData.identity?.studentId,
        cohort: rawData.cohort || rawData.identity?.cohort,
        programCode: rawData.programCode || rawData.identity?.programCode,
        academicSummary: rawData.academicSummary ? {
          cgpa: rawData.academicSummary.cgpa,
          earnedCredits: rawData.academicSummary.earnedCredits,
          academicStanding: rawData.academicSummary.academicStanding
        } : null,
        courses: Array.isArray(rawData.courses || rawData.courseRecords)
          ? (rawData.courses || rawData.courseRecords).map(c => ({
              courseId: c.courseId,
              courseName: c.courseName,
              credits: c.credits,
              status: c.status,
              gradeLetter: c.gradeLetter
            }))
          : []
      };
    }

    // Student / Public Owner projection
    const studentView = { ...rawData };
    delete studentView.passwordHash;
    delete studentView.otpSecret;
    delete studentView.internalRiskSignals;
    delete studentView.administrativeNotes;
    delete studentView.securityMetadata;
    delete studentView.authUserId; // Hide Supabase internal UUID

    return studentView;
  }

  /**
   * Convenience projection helper by role string or principal
   */
  static project(rawData, roleOrPrincipal) {
    if (typeof roleOrPrincipal === "string") {
      const mockPrincipal = {
        hasRole: (r) => r.toUpperCase() === roleOrPrincipal.toUpperCase(),
        isAgent: roleOrPrincipal.toUpperCase() === "AI_AGENT" || roleOrPrincipal.toUpperCase() === "AGENT"
      };
      return this.filterStudentProfile(rawData, mockPrincipal);
    }
    return this.filterStudentProfile(rawData, roleOrPrincipal);
  }

  /**
   * Generic object projection applying a whitelist of permitted fields
   * @param {object} source 
   * @param {string[]} allowedFields 
   * @returns {object}
   */
  static projectFields(source, allowedFields = []) {
    if (!source || typeof source !== "object") return source;
    const projected = {};
    for (const key of allowedFields) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        projected[key] = source[key];
      }
    }
    return projected;
  }
}
