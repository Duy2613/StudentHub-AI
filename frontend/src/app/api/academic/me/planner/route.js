/**
 * StudentHub AI — Academic Semester Planner API Route
 * POST /api/academic/me/planner
 * 
 * Generates candidate semester plans for the authenticated student.
 * Never mutates real student profile, digital twin, tasks, or notifications.
 */

import { NextResponse } from "next/server";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader";
import { AcademicSemesterPlannerEngine } from "@/lib/intelligence/academic/academicSemesterPlannerEngine";
import { AcademicPlannerModel } from "@/lib/intelligence/academic/academicPlannerModel";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetTerm = body.targetTerm || "2026-HK1";

    // Validate Input
    const validation = AcademicPlannerModel.validatePlanningInput({
      targetTerm,
      creditTarget: body.creditTarget,
      goal: body.goal
    });

    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu yêu cầu lập kế hoạch không hợp lệ.",
          details: validation.errors
        },
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

    // Generate Candidate Semester Plans
    const planningResult = AcademicSemesterPlannerEngine.generateSemesterPlans({
      studentId: studentProfile.studentId,
      targetTerm,
      profile360,
      digitalTwin
    });

    return NextResponse.json({
      success: true,
      planning: planningResult,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi tạo kế hoạch học kỳ.",
        message: err.message
      },
      { status: 500 }
    );
  }
}
