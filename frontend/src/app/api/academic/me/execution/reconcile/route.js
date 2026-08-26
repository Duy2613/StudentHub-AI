/**
 * StudentHub AI — Academic Execution Reconcile API Route
 * POST /api/academic/me/execution/reconcile
 * 
 * Re-runs full authoritative plan-actual reconciliation and updates execution snapshots.
 */

import { NextResponse } from "next/server";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader";
import { AcademicPlanDriftEngine } from "@/lib/intelligence/academic/academicPlanDriftEngine";
import { AcademicExecutionStore } from "@/lib/intelligence/academic/academicExecutionStore";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const targetTerm = body.targetTerm || "2026-HK1";

    const serverData = getAuthoritativeCommandCenterData();
    if (!serverData.success) {
      return NextResponse.json(
        { success: false, error: "Không thể nạp dữ liệu học vụ cơ sở từ máy chủ." },
        { status: 500 }
      );
    }

    const { studentProfile, profile360, digitalTwin } = serverData;
    const studentId = studentProfile.studentId;

    const execution = AcademicPlanDriftEngine.evaluateExecution({
      studentId,
      targetTerm,
      profile360,
      digitalTwin
    });

    if (execution.adoptedPlanId !== "NONE") {
      AcademicExecutionStore.saveExecution(execution);
    }

    return NextResponse.json({
      success: true,
      execution,
      reconciledAt: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi đồng bộ đối soát kế hoạch học vụ.",
        message: err.message
      },
      { status: 400 }
    );
  }
}
