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
import { AcademicNotificationOrchestrator } from "./academicNotificationOrchestrator.js";

export class StudentAcademicSyncBridge {
  /**
   * Synchronizes authoritative identity and records into the canonical Student Digital Twin
   * @param {string} studentId 
   * @returns {object} Updated Digital Twin clone
   */
  static syncTwin(studentId) {
    if (!studentId) {
      throw new Error("[SYNC_BRIDGE_ERROR] studentId is required for digital twin synchronization.");
    }

    const cleanStudentId = String(studentId).trim();
    const identity = StudentIdentityStore.getIdentityByStudentId(cleanStudentId);
    const records = AcademicRecordsStore.getRecordByStudentId(cleanStudentId);

    if (!identity) {
      throw new Error(`[SYNC_BRIDGE_ERROR] Cannot sync twin: Identity not found for student ${cleanStudentId}`);
    }

    // Convert authoritative courses into digital twin representation
    const twinCourses = (records?.courses || []).map(c => ({
      courseCode: c.courseCode,
      courseName: c.courseName,
      credits: c.credits,
      grade: c.grade10,
      grade4: c.grade4,
      letterGrade: c.letterGrade,
      isPassed: c.isPassed,
      status: c.status,
      semester: c.semester
    }));

    // Convert authoritative certifications into digital twin representation
    const twinCertificates = (records?.certifications || []).map(cert => ({
      type: cert.type,
      score: cert.score,
      issuedDate: cert.issuedDate,
      expiresDate: cert.expiresDate,
      verificationStatus: cert.verificationStatus
    }));

    const twin = StudentDigitalTwinModel.createDigitalTwin({
      studentId: identity.studentId,
      fullName: identity.fullName,
      email: identity.institutionalEmail,
      cohort: identity.cohort,
      programCode: identity.programCode,
      programName: identity.programName,
      faculty: identity.faculty,
      curriculumVersion: identity.curriculumVersion,
      earnedCredits: records?.earnedCredits || 0,
      totalRequiredCredits: records?.totalRequiredCredits || 150,
      generalCredits: records?.generalCredits || 0,
      specializedCredits: records?.specializedCredits || 0,
      cgpa: records?.cgpa || 0.0,
      majorGpa: records?.cgpa || 0.0,
      academicStanding: identity.academicStatus === "ACTIVE" ? "NORMAL" : identity.academicStatus,
      courses: twinCourses,
      certificates: twinCertificates,
      tuitionPaid: records?.tuition ? records.tuition.remainingDebt === 0 : true,
      debtAmount: records?.tuition?.remainingDebt || 0,
      disciplinaryStatus: records?.disciplinary?.status || "CLEAN",
      sourceAuthority: records?.authoritySource || identity.authoritySource || "HCMUTE_SIS_PORTAL",
      asOf: new Date().toISOString()
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
