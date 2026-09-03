/**
 * StudentHub AI — Academic What-If Simulation API Route
 * POST /api/academic/me/simulate
 * 
 * Executes an isolated hypothetical scenario for the authenticated student.
 * Never mutates real student profile, digital twin, tasks, or notifications.
 */

import { NextResponse } from "next/server";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader";
import { AcademicSimulationEngine } from "@/lib/intelligence/academic/academicSimulationEngine";
import { AcademicSimulationModel } from "@/lib/intelligence/academic/academicSimulationModel";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function simulateAcademicScenario(request, routeParams, principal) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawScenario = body.scenario || body.operations || body;

    // Validate scenario format first
    const validation = AcademicSimulationModel.validateScenario(rawScenario);
    if (!validation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: "Kịch bản giả định không hợp lệ.",
          details: validation.errors
        },
        { status: 400 }
      );
    }

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

    const { studentProfile, digitalTwin, profile360, academicTasks } = serverData;

    // Run Pure In-Memory Simulation
    const simulationResult = AcademicSimulationEngine.simulateScenario({
      studentId: studentProfile.studentId,
      scenario: validation.operations,
      profile360,
      digitalTwin,
      activeTasks: academicTasks || []
    });

    return NextResponse.json({
      success: true,
      simulation: simulationResult,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: "Lỗi thực thi giả lập học vụ.",
      },
      { status: 500 }
    );
  }
}

export const POST = SecurityFabric.wrapHandler(
  {
    action: "SIMULATE_ACADEMIC_SCENARIO",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: false
  },
  simulateAcademicScenario
);
