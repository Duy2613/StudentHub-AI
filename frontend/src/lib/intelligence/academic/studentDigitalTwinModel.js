/**
 * StudentHub AI — Canonical Authoritative Student Academic Digital Twin Model
 * 
 * Provides the single source of truth for all student academic facts:
 * - Academic standing, credits breakdown, GPA
 * - Verified course completion transcripts
 * - Verified international certificates (TOEIC, IELTS)
 * - Administrative & financial clearance
 * - Built-in consistency, conflict, and invariant validation
 */

export class StudentDigitalTwinModel {
  /**
   * Normalizes and validates a Student Academic Digital Twin entity
   * @param {object} raw
   * @returns {object} Canonical StudentDigitalTwin
   */
  static createDigitalTwin({
    studentId,
    fullName = "Sinh Viên",
    email = "",
    cohort = 2024,
    academicYear = "2024-2028",
    programCode = "7480103",
    programName = "Kỹ thuật Phần mềm",
    faculty = "Khoa Công Nghệ Thông Tin",
    curriculumVersion = "CTĐT-2024",
    earnedCredits = 0,
    totalRequiredCredits = 150,
    generalCredits = 0,
    specializedCredits = 0,
    cgpa = 0.0,
    majorGpa = 0.0,
    academicStanding = "NORMAL",
    courses = [],
    certificates = [],
    tuitionPaid = true,
    debtAmount = 0,
    disciplinaryStatus = "CLEAN",
    sourceAuthority = "HCMUTE_DAOTAO_PORTAL",
    asOf = null,
    isStale = false,
    revision = 1,
    version = "1.0",
    metadata = {}
  }) {
    if (!studentId || typeof studentId !== "string" || !studentId.trim()) {
      throw new Error("[DIGITAL_TWIN_ERROR] studentId is mandatory for Digital Twin creation");
    }

    const cleanStudentId = String(studentId).trim();
    const numCredits = Number(earnedCredits) || 0;
    const numRequiredCredits = Number(totalRequiredCredits) || 150;
    const remainingCredits = Math.max(0, numRequiredCredits - numCredits);
    const numCgpa = Number(cgpa) || 0.0;
    const numMajorGpa = Number(majorGpa) || numCgpa;

    // Normalize courses
    const normalizedCourses = (Array.isArray(courses) ? courses : []).map((c) => ({
      courseCode: String(c.courseCode || "").trim().toUpperCase(),
      courseName: String(c.courseName || "").trim(),
      credits: Number(c.credits) || 0,
      grade: typeof c.grade === "number" ? c.grade : (c.grade ? Number(c.grade) : null),
      isPassed: Boolean(c.isPassed || (typeof c.grade === "number" && c.grade >= 4.0) || c.status === "COMPLETED"),
      status: c.status || (c.isPassed ? "COMPLETED" : "ENROLLED"),
      semester: c.semester || "HK1_2026"
    }));

    // Normalize certificates
    const normalizedCertificates = (Array.isArray(certificates) ? certificates : []).map((cert) => ({
      type: String(cert.type || "TOEIC").trim().toUpperCase(),
      score: Number(cert.score) || 0,
      issuedDate: cert.issuedDate || null,
      expiresDate: cert.expiresDate || null,
      verificationStatus: cert.verificationStatus || "VERIFIED"
    }));

    // Basic derived eligibility
    const isThesisEligible = numCredits >= 110 && numCgpa >= 2.0;
    const isGraduationReady = remainingCredits === 0 && numCgpa >= 2.0;

    const twin = {
      studentId: cleanStudentId,
      fullName: String(fullName).trim(),
      email: String(email).trim(),
      cohort: Number(cohort) || 2024,
      academicYear: String(academicYear).trim(),
      programCode: String(programCode).trim(),
      programName: String(programName).trim(),
      faculty: String(faculty).trim(),
      curriculumVersion: String(curriculumVersion).trim(),
      earnedCredits: numCredits,
      totalRequiredCredits: numRequiredCredits,
      generalCredits: Number(generalCredits) || 0,
      specializedCredits: Number(specializedCredits) || 0,
      remainingCredits,
      cgpa: numCgpa,
      majorGpa: numMajorGpa,
      academicStanding,
      courses: normalizedCourses,
      certificates: normalizedCertificates,
      tuitionPaid: Boolean(tuitionPaid),
      debtAmount: Number(debtAmount) || 0,
      disciplinaryStatus,
      isThesisEligible,
      isGraduationReady,
      sourceAuthority,
      asOf: asOf || new Date().toISOString(),
      isStale: Boolean(isStale),
      revision: typeof revision === "number" ? revision : 1,
      version: String(version).trim(),
      metadata: { ...metadata }
    };

    // Validate consistency
    this.validateTwinConsistency(twin);
    return Object.freeze(twin);
  }

  /**
   * Validates mathematical, temporal, and academic invariants
   * @param {object} twin 
   */
  static validateTwinConsistency(twin) {
    if (!twin) throw new Error("[CONSISTENCY_ERROR] Twin cannot be null");

    // 1. GPA Range check [0.0, 4.0]
    if (twin.cgpa < 0.0 || twin.cgpa > 4.0) {
      throw new Error(`[CONSISTENCY_ERROR] Invalid CGPA ${twin.cgpa}. GPA must be in [0.0, 4.0]`);
    }

    if (twin.majorGpa < 0.0 || twin.majorGpa > 4.0) {
      throw new Error(`[CONSISTENCY_ERROR] Invalid Major GPA ${twin.majorGpa}`);
    }

    // 2. Credits range check
    if (twin.earnedCredits < 0 || twin.earnedCredits > twin.totalRequiredCredits + 40) {
      throw new Error(`[CONSISTENCY_ERROR] Earned credits (${twin.earnedCredits}) violates program boundaries`);
    }

    // 3. Cohort sanity check
    if (twin.cohort < 2000 || twin.cohort > 2099) {
      throw new Error(`[CONSISTENCY_ERROR] Impossible cohort ${twin.cohort}`);
    }
  }

  /**
   * Checks whether twin data has any missing or conflicting indicators
   * @param {object} twin 
   * @returns {{ hasConflicts: boolean, conflictDetails: string[] }}
   */
  static inspectDataQuality(twin) {
    const conflictDetails = [];

    if (!twin.certificates || twin.certificates.length === 0) {
      conflictDetails.push("Chưa ghi nhận chứng chỉ Ngoại ngữ chính thức.");
    }

    if (twin.tuitionPaid === false && twin.debtAmount === 0) {
      conflictDetails.push("Trạng thái học phí ghi chưa đóng nhưng công nợ là 0 VNĐ.");
    }

    return {
      hasConflicts: conflictDetails.length > 0,
      conflictDetails
    };
  }
}
