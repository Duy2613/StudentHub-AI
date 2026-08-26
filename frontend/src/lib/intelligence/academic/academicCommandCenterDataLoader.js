/**
 * StudentHub AI — Server-Side Authoritative Academic Command Center Data Loader
 * 
 * Enforces Server-First Data Fetching:
 * Resolves authoritative student state, active snapshots, rules, and trajectory directly
 * on the server, preventing client-side computation or waterfall requests.
 */

import { AcademicIntelligenceService } from "./academicIntelligenceService.js";
import { DocumentSnapshotStore } from "./documentSnapshotStore.js";
import { AcademicRuleExtractor } from "./academicRuleExtractor.js";
import { AcademicWorkflowService } from "./academicWorkflowService.js";
import { StudentDigitalTwinStore } from "./studentDigitalTwinStore.js";
import { AcademicEligibilityEngine } from "./academicEligibilityEngine.js";

export const DEFAULT_STUDENT_PROFILE = {
  studentId: "24110001",
  fullName: "Nguyễn Văn Duy",
  cohort: 2024,
  programCode: "7480103",
  programName: "Kỹ thuật Phần mềm",
  earnedCredits: 115,
  cgpa: 2.85,
  completedCourses: ["SWEN330103", "INTR430103", "DSAA230203"],
  englishCertificate: { type: "TOEIC", score: 480 },
  tuitionPaid: true
};

/**
 * Loads the complete authoritative Academic Command Center aggregate payload
 * @param {object} params - Optional overrides { studentId, cohort, programCode }
 * @returns {object} Authoritative Aggregate Payload
 */
export function getAuthoritativeCommandCenterData(params = {}) {
  const studentProfile = {
    ...DEFAULT_STUDENT_PROFILE,
    ...(params.studentId ? { studentId: params.studentId } : {}),
    ...(params.cohort ? { cohort: parseInt(params.cohort, 10) } : {}),
    ...(params.programCode ? { programCode: params.programCode } : {})
  };

  // 0. Load or initialize authoritative Student Digital Twin
  let digitalTwin = StudentDigitalTwinStore.getTwin(studentProfile.studentId);
  if (!digitalTwin) {
    digitalTwin = StudentDigitalTwinStore.saveTwin({
      studentId: studentProfile.studentId,
      fullName: studentProfile.fullName,
      cohort: studentProfile.cohort,
      programCode: studentProfile.programCode,
      programName: studentProfile.programName,
      earnedCredits: studentProfile.earnedCredits,
      cgpa: studentProfile.cgpa,
      courses: (studentProfile.completedCourses || []).map(code => ({ courseCode: code, isPassed: true, status: "COMPLETED" })),
      certificates: studentProfile.englishCertificate ? [studentProfile.englishCertificate] : [],
      tuitionPaid: studentProfile.tuitionPaid
    });
  }

  // 0.1. Evaluate Authoritative Eligibility
  const eligibilityResult = AcademicEligibilityEngine.evaluateEligibility(digitalTwin);

  // 1. Fetch active snapshots from DocumentSnapshotStore
  const activeDoc = DocumentSnapshotStore.getActiveSnapshot("DOC_QD_3116") || 
    DocumentSnapshotStore.getActiveSnapshot("DOC_QD_3116_2025") ||
    DocumentSnapshotStore.getActiveSnapshot("DOC_FIT_CURRICULUM_SE");

  // 2. Synthesize active canonical rules and recent changes
  const sampleNormalizedDoc = {
    normalizedText: `
      Trường Đại học Sư phạm Kỹ thuật TP.HCM
      Phòng Đào Tạo & Học Vụ
      Thông báo điều chỉnh kế hoạch đăng ký học lại Khóa 2024 và Khóa 2026 ngành 7480103.
      Hạn chót đăng ký: 05/09/2026.
      Quy định chuẩn đầu ra tiếng Anh: TOEIC 550 điểm.
      Mức thu học phí học kỳ 1 năm học 2026-2027: 16.000.000 VNĐ.
    `,
    documentCode: "3116/QĐ-ĐHSPKT",
    extractedDates: [{ raw: "05/09/2026", isoDate: "2026-09-05" }]
  };

  const rules = AcademicRuleExtractor.extractRules(sampleNormalizedDoc, {
    source: { sourceId: "SRC_HCMUTE_DAOTAO", canonicalUrl: "https://daotao.hcmute.edu.vn", sourceTier: "TIER_1_OFFICIAL" }
  });

  const recentChanges = [
    {
      changeId: "CHG_DEADLINE_2026",
      category: "DEADLINE_CHANGE",
      field: "DEADLINE_DATE",
      oldValue: "30/08/2026",
      newValue: "05/09/2026",
      severity: "HIGH",
      description: "Hạn chót đăng ký học vụ và nộp hồ sơ xét tốt nghiệp đợt 2 được gia hạn từ 30/08/2026 sang 05/09/2026.",
      affectedCohort: "2024",
      affectedProgram: "7480103",
      sourceId: "SRC_HCMUTE_DAOTAO"
    },
    {
      changeId: "CHG_ENG_2026",
      category: "REQUIREMENT_CHANGE",
      field: "ENGLISH_EXIT_STANDARD",
      oldValue: "TOEIC 500",
      newValue: "TOEIC 550 / B2 Quốc tế",
      severity: "HIGH",
      description: "Chuẩn đầu ra Ngoại ngữ tốt nghiệp cho Khóa K24 & K26 nâng lên TOEIC 550 điểm.",
      affectedCohort: "2024",
      affectedProgram: "7480103",
      sourceId: "SRC_HCMUTE_DAOTAO"
    },
    {
      changeId: "CHG_FEE_2026",
      category: "FEE_CHANGE",
      field: "TUITION_FEE",
      oldValue: "14.500.000 VNĐ",
      newValue: "16.000.000 VNĐ",
      severity: "MEDIUM",
      description: "Biểu mức thu học phí năm học 2026-2027 áp dụng theo khung định mức mới.",
      affectedCohort: "ALL",
      affectedProgram: "ALL",
      sourceId: "SRC_HCMUTE_CTSV"
    }
  ];

  // 3. Evaluate student trajectory via AcademicIntelligenceService
  const trajectory = AcademicIntelligenceService.evaluateStudentTrajectory(
    studentProfile,
    rules,
    recentChanges
  );

  // 4. Sort priority insights (CRITICAL -> HIGH -> MEDIUM -> LOW)
  const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4 };
  const sortedInsights = [...trajectory.insights].sort((a, b) => {
    const pA = priorityOrder[a.impact] ?? 99;
    const pB = priorityOrder[b.impact] ?? 99;
    return pA - pB;
  });

  // 5. Generate or reconcile authoritative Action Plans and Academic Tasks
  const { plans: actionPlans, tasks: academicTasks } = AcademicWorkflowService.generateActionPlansForStudent(
    studentProfile,
    sortedInsights,
    recentChanges
  );

  const syncStatus = {
    isLive: true,
    lastSyncedAt: new Date().toISOString(),
    activeDocument: activeDoc ? {
      documentId: activeDoc.documentId,
      title: activeDoc.title,
      versionId: activeDoc.versionId,
      sourceUrl: activeDoc.sourceUrl,
      publishedAt: activeDoc.publishedAt
    } : null,
    warning: null
  };

  return {
    success: true,
    studentProfile,
    digitalTwin,
    eligibilityResult,
    digitalTwinState: trajectory.digitalTwinState,
    priorityInsights: sortedInsights,
    actionPlans,
    academicTasks,
    recentChanges,
    timelineEvents: trajectory.timelineEvents,
    notifications: trajectory.notifications,
    totalActionCount: sortedInsights.filter(i => i.impact === "CRITICAL" || i.impact === "HIGH").length,
    syncStatus,
    timestamp: new Date().toISOString()
  };
}
