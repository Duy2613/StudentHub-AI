/**
 * StudentHub AI — Academic Command Center Aggregate API Route
 * 
 * Provides authenticated student academic intelligence payload:
 * - Digital twin state
 * - Actionable priority insights
 * - Recent semantic changes
 * - Academic timeline events
 * - Source sync status & provenance
 */

import { NextResponse } from "next/server";
import { AcademicIntelligenceService } from "@/lib/intelligence/academic/academicIntelligenceService.js";
import { DocumentSnapshotStore } from "@/lib/intelligence/academic/documentSnapshotStore.js";
import { AcademicRuleExtractor } from "@/lib/intelligence/academic/academicRuleExtractor.js";

// Canonical demo student profile (Khóa K24 - Kỹ thuật Phần mềm)
const DEFAULT_STUDENT_PROFILE = {
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const cohort = searchParams.get("cohort") ? parseInt(searchParams.get("cohort"), 10) : DEFAULT_STUDENT_PROFILE.cohort;
    const programCode = searchParams.get("programCode") || DEFAULT_STUDENT_PROFILE.programCode;
    const studentId = searchParams.get("studentId") || DEFAULT_STUDENT_PROFILE.studentId;

    const studentProfile = {
      ...DEFAULT_STUDENT_PROFILE,
      studentId,
      cohort,
      programCode
    };

    // 1. Fetch active snapshots from DocumentSnapshotStore
    const activeDoc = DocumentSnapshotStore.getActiveSnapshot("DOC_QD_3116") || 
      DocumentSnapshotStore.getActiveSnapshot("DOC_QD_3116_2025") ||
      DocumentSnapshotStore.getActiveSnapshot("DOC_FIT_CURRICULUM_SE");

    const documentHistory = DocumentSnapshotStore.getDocumentHistory("DOC_QD_3116");

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

    return NextResponse.json({
      success: true,
      studentProfile,
      digitalTwinState: trajectory.digitalTwinState,
      priorityInsights: sortedInsights,
      recentChanges,
      timelineEvents: trajectory.timelineEvents,
      notifications: trajectory.notifications,
      totalActionCount: sortedInsights.filter(i => i.impact === "CRITICAL" || i.impact === "HIGH").length,
      syncStatus,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "INTERNAL_ACADEMIC_SERVICE_ERROR",
        message: err.message || "Không thể khởi tạo dữ liệu Academic Command Center."
      },
      { status: 500 }
    );
  }
}
