/**
 * StudentHub AI — Student Academic Sync Bridge V1
 * 
 * Bridges Authoritative Identity + Academic Records -> Student Digital Twin.
 * Projects canonical facts into the Digital Twin projection store and triggers
 * downstream Workflow & Notification reconciliations.
 */

import { StudentIdentityStore } from "./studentIdentityStore.js";
import { AcademicRecordsStore } from "./academicRecordsStore.js";
import { StudentDigitalTwinModel } from "./studentDigitalTwinModel.js";
import { StudentDigitalTwinStore } from "./studentDigitalTwinStore.js";
import { AcademicWorkflowReconciliationEngine } from "./academicWorkflowReconciliationEngine.js";


export class StudentAcademicSyncBridge {
  /**
   * Synchronizes authoritative identity, records, and profile 360 into the canonical Student Digital Twin
   * @param {string} studentId 
   * @param {object} [providedProfile] Optional pre-built StudentProfile360
   * @returns {object} Updated Digital Twin clone
   */
  static syncTwin(studentId, providedProfile = null) {
    if (!studentId) {
      throw new Error("[SYNC_BRIDGE_ERROR] studentId is required for digital twin synchronization.");
    }

    const cleanStudentId = String(studentId).trim();
    const identity = providedProfile?.identity || StudentIdentityStore.getIdentityByStudentId(cleanStudentId);
    const records = providedProfile ? null : AcademicRecordsStore.getRecordByStudentId(cleanStudentId);

    if (!identity) {
      throw new Error(`[SYNC_BRIDGE_ERROR] Cannot sync twin: Identity not found for student ${cleanStudentId}`);
    }

    const profileRevision = providedProfile?.profileRevision || 1;

    // Convert authoritative courses into digital twin representation
    const rawCourses = providedProfile?.courseRecords || records?.courses || [];
    const twinCourses = rawCourses.map(c => ({
      courseCode: c.courseCode,
      courseName: c.courseName,
      credits: c.credits,
      grade: c.grade10 !== undefined ? c.grade10 : c.grade,
      grade4: c.grade4 !== undefined ? c.grade4 : c.gpa4,
      letterGrade: c.letterGrade,
      isPassed: c.isPassed,
      status: c.status || c.courseStatus,
      semester: c.semester
    }));

    // Convert authoritative certifications into digital twin representation
    const rawCerts = providedProfile?.certifications || records?.certifications || [];
    const twinCertificates = rawCerts.map(cert => ({
      type: cert.type,
      score: cert.score,
      issuedDate: cert.issuedDate || cert.issuedAt,
      expiresDate: cert.expiresDate || cert.expiresAt,
      verificationStatus: cert.verificationStatus
    }));

    const earnedCredits = providedProfile?.academicSummary?.earnedCredits !== undefined 
      ? providedProfile.academicSummary.earnedCredits 
      : (records?.earnedCredits || 0);

    const totalRequiredCredits = providedProfile?.academicSummary?.totalRequiredCredits !== undefined 
      ? providedProfile.academicSummary.totalRequiredCredits 
      : (records?.totalRequiredCredits || 150);

    const generalCredits = providedProfile?.academicSummary?.generalCredits !== undefined 
      ? providedProfile.academicSummary.generalCredits 
      : (records?.generalCredits || 0);

    const specializedCredits = providedProfile?.academicSummary?.specializedCredits !== undefined 
      ? providedProfile.academicSummary.specializedCredits 
      : (records?.specializedCredits || 0);

    const cgpa = providedProfile?.academicSummary?.cgpa !== undefined 
      ? providedProfile.academicSummary.cgpa 
      : (records?.cgpa || 0.0);

    const remainingDebt = providedProfile?.financialClearance?.remainingDebt !== undefined 
      ? providedProfile.financialClearance.remainingDebt 
      : (records?.tuition?.remainingDebt || 0);

    const isTuitionPaid = providedProfile?.financialClearance?.isCleared !== undefined 
      ? providedProfile.financialClearance.isCleared 
      : (records?.tuition ? records.tuition.remainingDebt === 0 : true);

    const twin = StudentDigitalTwinModel.createDigitalTwin({
      studentId: identity.studentId,
      fullName: identity.fullName,
      email: identity.institutionalEmail,
      cohort: identity.cohort,
      programCode: identity.programCode,
      programName: identity.programName,
      faculty: identity.faculty,
      curriculumVersion: identity.curriculumVersion,
      earnedCredits,
      totalRequiredCredits,
      generalCredits,
      specializedCredits,
      cgpa,
      majorGpa: cgpa,
      academicStanding: identity.academicStatus === "ACTIVE" ? "NORMAL" : identity.academicStatus,
      courses: twinCourses,
      certificates: twinCertificates,
      tuitionPaid: isTuitionPaid,
      debtAmount: remainingDebt,
      disciplinaryStatus: records?.disciplinary?.status || "CLEAN",
      sourceAuthority: records?.authoritySource || identity.authoritySource || "HCMUTE_SIS_PORTAL",
      asOf: new Date().toISOString(),
      evaluatedAgainstProfileRevision: profileRevision
    });

    // Save projected twin into durable store
    const savedTwin = StudentDigitalTwinStore.saveTwin(twin);

    // Trigger downstream workflow reconciliation
    try {
      AcademicWorkflowReconciliationEngine.reconcileTasksWithTwin(cleanStudentId, savedTwin);
    } catch {
      // Ignore if workflow store empty
    }

    return savedTwin;
  }

  /**
   * Synchronizes all registered students in the identity store
   * @returns {Array<object>}
   */
  static syncAll() {
    const identities = StudentIdentityStore.getAllIdentities();
    const synced = [];
    for (const id of identities) {
      try {
        synced.push(this.syncTwin(id.studentId));
      } catch {
        // continue
      }
    }
    return synced;
  }
}
