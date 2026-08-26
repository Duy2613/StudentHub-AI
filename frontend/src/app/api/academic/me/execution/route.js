/**
 * StudentHub AI — Academic Execution Center API Route
 * GET /api/academic/me/execution
 * 
 * Server-authoritative endpoint providing:
 * - Active adopted study plan
 * - Plan vs Actual comparative reconciliation
 * - Plan Drift detection and severity
 * - Explainable replanning recommendations
 */

import { NextResponse } from "next/server";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader";
import { AcademicPlanDriftEngine } from "@/lib/intelligence/academic/academicPlanDriftEngine";
import { AcademicExecutionStore } from "@/lib/intelligence/academic/academicExecutionStore";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const targetTerm = searchParams.get("targetTerm") || "2026-HK1";

    // 1. Load Authoritative Academic Baseline (Server-Side)
    const serverData = getAuthoritativeCommandCenterData();
    if (!serverData.success) {
      return NextResponse.json(
        { success: false, error: "Không thể nạp dữ liệu học vụ cơ sở từ máy chủ." },
        { status: 500 }
      );
    }

    const { studentProfile, profile360, digitalTwin } = serverData;
    const studentId = studentProfile.studentId;

    // 2. Evaluate Live Plan vs Actual Execution & Drift
    const execution = AcademicPlanDriftEngine.evaluateExecution({
      studentId,
      targetTerm,
      profile360,
      digitalTwin
    });

    // 3. Persist Execution Snapshot in Store
    if (execution.adoptedPlanId !== "NONE") {
      AcademicExecutionStore.saveExecution(execution);
    }

    return NextResponse.json({
      success: true,
      execution,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi tính toán đối soát tiến độ và độ lệch kế hoạch học vụ.",
        message: err.message
      },
      { status: 400 }
    );
  }
}
