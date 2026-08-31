/**
 * StudentHub AI — Academic Decision Studio API Route
 * POST /api/academic/me/decision-studio
 * 
 * Generates normalized comparison matrix, pairwise trade-offs, and preference-aware rankings.
 * Never mutates real student profile, digital twin, tasks, or notifications.
 */

import { NextResponse } from "next/server";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader";
import { AcademicDecisionEngine } from "@/lib/intelligence/academic/academicDecisionEngine";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function createDecisionStudio(request, routeParams, principal) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetTerm = body.targetTerm || "2026-HK1";
    const studentPreference = body.studentPreference || "BALANCED";

    // Load Authoritative Baseline Data (Server-Side)
    const serverData = getAuthoritativeCommandCenterData({
      studentId: principal.subjectId.replace("student:", "").trim()
    });
    if (!serverData.success) {
      return NextResponse.json(
        { success: false, error: "Không thể nạp dữ liệu học vụ cơ sở từ máy chủ." },
        { status: 500 }
      );
    }

    const { studentProfile, digitalTwin, profile360 } = serverData;

    // Run Decision Studio Evaluation
    const decisionResult = AcademicDecisionEngine.evaluateDecisionStudio({
      studentId: studentProfile.studentId,
      targetTerm,
      studentPreference,
      profile360,
      digitalTwin
    });

    return NextResponse.json({
      success: true,
      decisionStudio: decisionResult,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi tạo bảng so sánh quyết định học vụ.",
      },
      { status: 500 }
    );
  }
}

export const POST = SecurityFabric.wrapHandler(
  {
    action: "EVALUATE_ACADEMIC_DECISION",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: false
  },
  createDecisionStudio
);
