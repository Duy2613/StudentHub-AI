/**
 * StudentHub AI — Canonical Authoritative Student Profile 360 Model V1
 * 
 * Aggregates verified student identity, transcripts, certified credentials,
 * curriculum graduation requirements, financial clearance, and section-level provenance.
 */

import { StudentIdentityModel } from "./studentIdentityModel.js";
import { AcademicRecordsModel, CERTIFICATE_STATUSES, TUITION_STATUSES } from "./academicRecordsModel.js";
import { 
  CANONICAL_SOURCES, 
  DATA_AUTHORITY_LEVELS, 
  SECTION_FRESHNESS, 
  StudentDataProvenanceMatrix 
} from "./studentDataProvenanceMatrix.js";
import { AcademicClock } from "./academicClock.js";

export const ACADEMIC_STANDINGS = Object.freeze({
  EXCELLENT: "EXCELLENT",       // Xuất sắc (GPA >= 3.60)
  GOOD: "GOOD",                 // Giỏi (GPA >= 3.20)
  FAIR: "FAIR",                 // Khá (GPA >= 2.50)
  AVERAGE: "AVERAGE",           // Trung bình (GPA >= 2.00)
  PROBATION: "PROBATION",       // Cảnh báo học vụ (GPA < 2.00)
  CRITICAL: "CRITICAL",         // Nguy cơ thôi học
  UNKNOWN: "UNKNOWN"            // Chưa có dữ liệu
});

export const CONFLICT_STATUSES = Object.freeze({
  RESOLVED: "RESOLVED",
  REQUIRES_REVIEW: "REQUIRES_REVIEW",
  UNRESOLVED: "UNRESOLVED"
});

export class StudentProfile360Model {
  /**
   * Computes academic standing from CGPA
   * @param {number|null} cgpa 
   * @returns {string} ACADEMIC_STANDINGS
   */
  static computeAcademicStanding(cgpa) {
    if (cgpa === null || cgpa === undefined || Number.isNaN(Number(cgpa))) {
      return ACADEMIC_STANDINGS.UNKNOWN;
    }
    const val = Number(cgpa);
    if (val >= 3.6) return ACADEMIC_STANDINGS.EXCELLENT;
    if (val >= 3.2) return ACADEMIC_STANDINGS.GOOD;
    if (val >= 2.5) return ACADEMIC_STANDINGS.FAIR;
    if (val >= 2.0) return ACADEMIC_STANDINGS.AVERAGE;
    if (val >= 1.0) return ACADEMIC_STANDINGS.PROBATION;
    return ACADEMIC_STANDINGS.CRITICAL;
  }

  /**
   * Creates a canonical StudentProfile360 aggregate
   * @param {object} input 
   * @param {object} [clock]
   * @returns {object}
   */
  static createProfile(input = {}, clock = AcademicClock) {
    const raw = input && typeof input === "object" ? input : {};
    
    // 1. Identity Layer
    const identityInput = raw.identity || raw;
    const validatedIdentity = StudentIdentityModel.createIdentity(identityInput);
    const studentId = validatedIdentity.studentId;

    // 2. Academic Records Layer
    const recordsInput = raw.records || raw.academicSummary || raw;
    const earnedCredits = raw.earnedCredits !== undefined 
      ? raw.earnedCredits 
      : (raw.academicSummary?.earnedCredits !== undefined ? raw.academicSummary.earnedCredits : recordsInput.earnedCredits);
    const inputCgpa = raw.cgpa !== undefined 
      ? raw.cgpa 
      : (raw.academicSummary?.cgpa !== undefined ? raw.academicSummary.cgpa : recordsInput.cgpa);

    const validatedRecords = AcademicRecordsModel.createRecord({
      studentId,
      earnedCredits,
      cgpa: inputCgpa,
      totalRequiredCredits: raw.totalRequiredCredits || recordsInput.totalRequiredCredits || 150,
      courses: raw.courses || raw.courseRecords || recordsInput.courses || [],
      certifications: raw.certifications || recordsInput.certifications || [],
      tuition: raw.tuition || raw.financialClearance || recordsInput.tuition || {},
      extracurricularScore: raw.extracurricularScore || recordsInput.extracurricularScore || 0
    });

    const nowIso = clock.nowIso ? clock.nowIso() : new Date().toISOString();
    const revision = typeof raw.profileRevision === "number" ? Math.max(1, Math.floor(raw.profileRevision)) : (raw.revision || 1);

    // 3. Academic Summary
    const finalCgpa = validatedRecords.cgpa;
    const academicStanding = this.computeAcademicStanding(finalCgpa);
    const expectedGraduationYear = (validatedIdentity.cohort || 2024) + 4;

    const academicSummary = Object.freeze({
      totalRequiredCredits: validatedRecords.totalRequiredCredits,
      earnedCredits: validatedRecords.earnedCredits,
      remainingCredits: validatedRecords.remainingCredits,
      generalCredits: validatedRecords.generalCredits,
      coreCredits: validatedRecords.coreCredits,
      specializedCredits: validatedRecords.specializedCredits,
      electiveCredits: Math.max(0, validatedRecords.earnedCredits - (validatedRecords.generalCredits + validatedRecords.coreCredits + validatedRecords.specializedCredits)),
      cgpa: finalCgpa,
      academicStanding,
      expectedGraduationYear,
      extracurricularScore: validatedRecords.extracurricularScore
    });

    // 4. Graduation Requirements Projection
    const graduationRequirements = this.#projectGraduationRequirements(academicSummary, validatedRecords, validatedIdentity);

    // 5. Financial Clearance Projection
    const isCleared = (validatedRecords.tuition.remainingDebt === 0) 
      || validatedRecords.tuition.status === TUITION_STATUSES.PAID_IN_FULL 
      || validatedRecords.tuition.status === TUITION_STATUSES.WAIVED;

    const financialClearance = Object.freeze({
      status: validatedRecords.tuition.status,
      totalDue: validatedRecords.tuition.totalDue,
      paidAmount: validatedRecords.tuition.paidAmount,
      remainingDebt: validatedRecords.tuition.remainingDebt,
      isCleared,
      asOf: validatedRecords.tuition.lastPaymentDate || nowIso
    });

    // 6. Section-Level Freshness & Provenance
    const provenance = Object.freeze({
      identity: {
        source: CANONICAL_SOURCES.SUPABASE_AUTH,
        authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
        verifiedAt: raw.identityVerifiedAt || nowIso,
        revision: 1
      },
      transcripts: {
        source: CANONICAL_SOURCES.HCMUTE_SIS_PORTAL,
        authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
        verifiedAt: raw.transcriptsVerifiedAt || nowIso,
        revision: validatedRecords.revision
      },
      certifications: {
        source: CANONICAL_SOURCES.IIG_VIETNAM,
        authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
        verifiedAt: raw.certificationsVerifiedAt || nowIso,
        revision: 1
      },
      finance: {
        source: CANONICAL_SOURCES.HCMUTE_FINANCE_PORTAL,
        authority: DATA_AUTHORITY_LEVELS.AUTHORITATIVE,
        verifiedAt: raw.financeVerifiedAt || nowIso,
        revision: 1
      }
    });

    const freshness = Object.freeze({
      global: SECTION_FRESHNESS.FRESH,
      sections: {
        identity: StudentDataProvenanceMatrix.computeFreshness(provenance.identity.verifiedAt, 720, clock),
        transcripts: StudentDataProvenanceMatrix.computeFreshness(provenance.transcripts.verifiedAt, 24, clock),
        certifications: StudentDataProvenanceMatrix.computeFreshness(provenance.certifications.verifiedAt, 168, clock),
        finance: StudentDataProvenanceMatrix.computeFreshness(provenance.finance.verifiedAt, 12, clock)
      }
    });

    // 7. Conflicts List
    const conflicts = Array.isArray(raw.conflicts) ? raw.conflicts.map(c => Object.freeze({ ...c })) : [];

    return Object.freeze({
      studentId,
      profileRevision: revision,
      asOf: nowIso,
      updatedAt: nowIso,
      identity: validatedIdentity,
      academicSummary,
      courseRecords: validatedRecords.courses,
      certifications: validatedRecords.certifications,
      graduationRequirements,
      financialClearance,
      provenance,
      freshness,
      conflicts: Object.freeze(conflicts)
    });
  }

  /**
   * Projects graduation criteria evaluations for student
   */
  static #projectGraduationRequirements(academicSummary, validatedRecords, validatedIdentity) {
    const toeicCert = validatedRecords.certifications.find(c => c.type === "TOEIC" && c.verificationStatus === CERTIFICATE_STATUSES.VERIFIED);
    const toeicScore = toeicCert ? toeicCert.score : 0;
    const requiredToeic = 500;

    const requirements = [
      {
        requirementId: "REQ_TOTAL_CREDITS",
        title: "Tích lũy tối thiểu 150 tín chỉ CTĐT",
        requirementType: "CREDITS_MIN",
        requiredValue: 150,
        currentValue: academicSummary.earnedCredits,
        isSatisfied: academicSummary.earnedCredits >= 150,
        status: academicSummary.earnedCredits >= 150 ? "SATISFIED" : "PENDING",
        studentFacingExplanation: `Đã tích lũy ${academicSummary.earnedCredits}/150 tín chỉ.`
      },
      {
        requirementId: "REQ_MIN_GPA",
        title: "Điểm trung bình tích lũy CGPA >= 2.00",
        requirementType: "GPA_MIN",
        requiredValue: 2.00,
        currentValue: academicSummary.cgpa,
        isSatisfied: academicSummary.cgpa !== null && academicSummary.cgpa >= 2.00,
        status: (academicSummary.cgpa !== null && academicSummary.cgpa >= 2.00) ? "SATISFIED" : "PENDING",
        studentFacingExplanation: `CGPA hiện tại: ${academicSummary.cgpa !== null ? academicSummary.cgpa : "Chưa có"}/4.00.`
      },
      {
        requirementId: "REQ_ENGLISH_TOEIC",
        title: `Chuẩn đầu ra ngoại ngữ TOEIC quốc tế >= ${requiredToeic}`,
        requirementType: "CERTIFICATE_PRESENT",
        requiredValue: requiredToeic,
        currentValue: toeicScore,
        isSatisfied: toeicScore >= requiredToeic,
        status: toeicScore >= requiredToeic ? "SATISFIED" : "PENDING",
        studentFacingExplanation: toeicScore > 0 
          ? `Điểm TOEIC xác minh: ${toeicScore}/${requiredToeic}.` 
          : "Chưa nộp hoặc chưa có chứng chỉ TOEIC được xác minh."
      },
      {
        requirementId: "REQ_TUITION_CLEARANCE",
        title: "Hoàn tất nghĩa vụ học phí và công nợ sinh viên",
        requirementType: "TUITION_CLEAR",
        requiredValue: 0,
        currentValue: validatedRecords.tuition.remainingDebt,
        isSatisfied: validatedRecords.tuition.remainingDebt === 0 || validatedRecords.tuition.status === TUITION_STATUSES.PAID_IN_FULL || validatedRecords.tuition.status === TUITION_STATUSES.WAIVED,
        status: (validatedRecords.tuition.remainingDebt === 0 || validatedRecords.tuition.status === TUITION_STATUSES.PAID_IN_FULL || validatedRecords.tuition.status === TUITION_STATUSES.WAIVED) ? "SATISFIED" : "PENDING",
        studentFacingExplanation: (validatedRecords.tuition.remainingDebt === 0 || validatedRecords.tuition.status === TUITION_STATUSES.PAID_IN_FULL || validatedRecords.tuition.status === TUITION_STATUSES.WAIVED) 
          ? "Đã hoàn tất nghĩa vụ tài chính học kỳ." 
          : `Còn nợ học phí: ${validatedRecords.tuition.remainingDebt.toLocaleString("vi-VN")} đ.`
      }
    ];

    return Object.freeze(requirements.map(r => Object.freeze(r)));
  }

  /**
   * Detects data discrepancy between two official sources and creates an auditable conflict record
   * @param {string} field 
   * @param {any} valueA 
   * @param {string} sourceA 
   * @param {any} valueB 
   * @param {string} sourceB 
   * @returns {object|null}
   */
  static detectConflict(field, valueA, sourceA, valueB, sourceB) {
    if (valueA === valueB) return null;
    if (valueA === undefined || valueA === null || valueB === undefined || valueB === null) return null;

    const precedence = StudentDataProvenanceMatrix.resolvePrecedence(sourceA, sourceB);
    const resolution = precedence > 0 ? `Resolved in favor of higher precedence source (${sourceA})` 
                     : precedence < 0 ? `Resolved in favor of higher precedence source (${sourceB})` 
                     : "Sources have equal authority; manual registrar review required";

    return Object.freeze({
      conflictId: `CONF_${field}_${Date.now()}`,
      field,
      valueA,
      sourceA,
      valueB,
      sourceB,
      precedenceWinner: precedence > 0 ? sourceA : precedence < 0 ? sourceB : null,
      status: precedence !== 0 ? CONFLICT_STATUSES.RESOLVED : CONFLICT_STATUSES.REQUIRES_REVIEW,
      resolution,
      detectedAt: new Date().toISOString()
    });
  }
}
