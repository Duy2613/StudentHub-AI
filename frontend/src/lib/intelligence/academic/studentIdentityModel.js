/**
 * StudentHub AI — Canonical Authoritative Student Identity & Profile Model V1
 * 
 * Provides the single authoritative identity source for HCMUTE students:
 * - MSSV (Student ID) validation & normalization
 * - Institutional Email (@student.hcmute.edu.vn)
 * - Supabase Auth User ID linkage
 * - Academic program, cohort, faculty, class code, and advisor
 * - Invariant assertions and privacy-masked attributes
 */

export const ACADEMIC_STATUSES = Object.freeze({
  ACTIVE: "ACTIVE",                 // Đang học bình thường
  ACADEMIC_PROBATION: "PROBATION", // Cảnh báo học vụ
  SUSPENDED: "SUSPENDED",          // Tạm đình chỉ học tập
  ON_LEAVE: "ON_LEAVE",            // Nghỉ học tạm thời / Bảo lưu
  GRADUATED: "GRADUATED",          // Đã tốt nghiệp
  DROPOUT: "DROPOUT"               // Thôi học
});

export const EDUCATION_LEVELS = Object.freeze({
  BACHELOR: "BACHELOR", // Đại học chính quy
  ENGINEER: "ENGINEER", // Kỹ sư chính quy
  MASTER: "MASTER",     // Thạc sĩ
  DOCTOR: "DOCTOR"      // Tiến sĩ
});

export class StudentIdentityModel {
  /**
   * Validates HCMUTE Student ID (MSSV)
   * @param {string} studentId 
   * @returns {boolean}
   */
  static isValidStudentId(studentId) {
    if (!studentId || typeof studentId !== "string") return false;
    const clean = studentId.trim();
    // Standard HCMUTE MSSV is typically 8 digits, e.g. 24110001, 23110002
    return /^\d{7,10}$/.test(clean);
  }

  /**
   * Validates Institutional Email
   * @param {string} email 
   * @returns {boolean}
   */
  static isValidInstitutionalEmail(email) {
    if (!email || typeof email !== "string") return false;
    const clean = email.trim().toLowerCase();
    return clean.endsWith("@student.hcmute.edu.vn") || clean.endsWith("@hcmute.edu.vn");
  }

  /**
   * Masks National ID for privacy preservation
   * @param {string} nationalId 
   * @returns {string}
   */
  static maskNationalId(nationalId) {
    if (!nationalId || typeof nationalId !== "string") return "******";
    const clean = nationalId.trim();
    if (clean.length <= 6) return "******";
    return clean.slice(0, 6) + "*".repeat(clean.length - 6);
  }

  /**
   * Creates a canonical, validated Student Identity & Profile entity
   * @param {object} params
   * @returns {object} Immutable StudentIdentity
   */
  static createIdentity({
    studentId,
    authUserId = null,
    fullName,
    institutionalEmail,
    personalEmail = "",
    phoneNumber = "",
    nationalId = "",
    gender = "UNKNOWN",
    birthDate = null,
    cohort = 2024,
    classCode = "24110CLA",
    faculty = "Khoa Công Nghệ Thông Tin",
    programCode = "7480103",
    programName = "Kỹ thuật Phần mềm",
    curriculumVersion = "CTĐT-2024",
    educationLevel = EDUCATION_LEVELS.ENGINEER,
    academicStatus = ACADEMIC_STATUSES.ACTIVE,
    enrollmentDate = "2024-09-01",
    expectedGraduationDate = "2028-06-30",
    academicAdvisor = {
      name: "TS. Nguyễn Văn A",
      email: "advisor@hcmute.edu.vn",
      department: "Bộ môn Kỹ thuật Phần mềm"
    },
    authoritySource = "HCMUTE_SIS_REGISTRAR",
    verifiedAt = null,
    metadata = {}
  }) {
    if (!studentId || typeof studentId !== "string") {
      throw new Error("[IDENTITY_ERROR] studentId (MSSV) is required.");
    }
    const cleanStudentId = studentId.trim();
    if (!this.isValidStudentId(cleanStudentId)) {
      throw new Error(`[IDENTITY_ERROR] Invalid studentId format: "${cleanStudentId}". Expected 7-10 digit MSSV.`);
    }

    if (!fullName || typeof fullName !== "string" || !fullName.trim()) {
      throw new Error("[IDENTITY_ERROR] fullName is required.");
    }

    const cleanEmail = institutionalEmail ? institutionalEmail.trim().toLowerCase() : `${cleanStudentId}@student.hcmute.edu.vn`;
    if (!this.isValidInstitutionalEmail(cleanEmail)) {
      throw new Error(`[IDENTITY_ERROR] Invalid institutional email: "${cleanEmail}". Must be @student.hcmute.edu.vn`);
    }

    const cleanStatus = ACADEMIC_STATUSES[academicStatus] || academicStatus;
    if (!Object.values(ACADEMIC_STATUSES).includes(cleanStatus)) {
      throw new Error(`[IDENTITY_ERROR] Invalid academic status: "${academicStatus}".`);
    }

    const now = new Date().toISOString();

    return Object.freeze({
      studentId: cleanStudentId,
      authUserId: authUserId ? String(authUserId).trim() : null,
      fullName: String(fullName).trim(),
      institutionalEmail: cleanEmail,
      personalEmail: String(personalEmail).trim(),
      phoneNumber: String(phoneNumber).trim(),
      nationalIdMasked: this.maskNationalId(nationalId),
      gender: String(gender).toUpperCase(),
      birthDate: birthDate || null,
      cohort: Number(cohort) || 2024,
      classCode: String(classCode).trim().toUpperCase(),
      faculty: String(faculty).trim(),
      programCode: String(programCode).trim(),
      programName: String(programName).trim(),
      curriculumVersion: String(curriculumVersion).trim(),
      educationLevel: EDUCATION_LEVELS[educationLevel] || educationLevel,
      academicStatus: cleanStatus,
      enrollmentDate,
      expectedGraduationDate,
      academicAdvisor: Object.freeze({ ...academicAdvisor }),
      authoritySource,
      verifiedAt: verifiedAt || now,
      createdAt: now,
      updatedAt: now,
      revision: 1,
      metadata: Object.freeze({ ...metadata })
    });
  }

  /**
   * Deep clones a Student Identity object
   * @param {object} identity 
   * @returns {object}
   */
  static clone(identity) {
    if (!identity) return null;
    return JSON.parse(JSON.stringify(identity));
  }
}
