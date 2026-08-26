/**
 * StudentHub AI — Academic Decision Studio Plan Adoption API Route
 * POST /api/academic/me/decision-studio/adopt
 * 
 * Revalidates current state and stores student plan adoption intent.
 * Never mutates real transcripts, course registrations, or digital twin records.
 */

import { NextResponse } from "next/server";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader";
import { AcademicDecisionEngine } from "@/lib/intelligence/academic/academicDecisionEngine";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const planId = body.planId;
    const targetTerm = body.targetTerm || "2026-HK1";

    if (!planId) {
      return NextResponse.json(
        { success: false, error: "Thiếu mã kế hoạch (planId) để chọn kế hoạch." },
        { status: 400 }
      );
    }

    // Load Authoritative Baseline Data (Server-Side)
    const serverData = getAuthoritativeCommandCenterData();
    if (!serverData.success) {
      return NextResponse.json(
        { success: false, error: "Không thể nạp dữ liệu học vụ cơ sở từ máy chủ." },
        { status: 500 }
      );
    }

    const { studentProfile, digitalTwin, profile360 } = serverData;

    // Adopt Plan with Revalidation Guard
    const adoptResult = AcademicDecisionEngine.adoptPlan({
      studentId: studentProfile.studentId,
      planId,
      targetTerm,
      profile360,
      digitalTwin
    });

    return NextResponse.json({
      success: true,
      adoptedPlan: adoptResult.adoptedPlan,
      actionBridge: adoptResult.actionBridge,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi lưu nháp kế hoạch học tập.",
        message: err.message
      },
      { status: 400 }
    );
  }
}
