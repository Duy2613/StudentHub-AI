/**
 * StudentHub AI — Canonical Academic Task Mutation & Detail API Route
 * 
 * Handles authenticated workflow mutations:
 * - START
 * - COMPLETE_STEP
 * - VERIFY_COMPLETION
 */

import { NextResponse } from "next/server";
import { AcademicTaskStore } from "@/lib/intelligence/academic/academicTaskStore.js";
import { AcademicWorkflowService } from "@/lib/intelligence/academic/academicWorkflowService.js";
import { AcademicTaskAuthorization } from "@/lib/intelligence/academic/academicTaskAuthorization.js";

export async function GET(request, { params }) {
  try {
    const { taskId } = await params;
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "24110001";

    const task = AcademicTaskStore.getTask(taskId);
    if (!task) {
      return NextResponse.json({ success: false, error: "TASK_NOT_FOUND", message: "Nhiệm vụ không tồn tại." }, { status: 404 });
    }

    AcademicTaskAuthorization.assertTaskOwnership(task, studentId);
    const events = AcademicTaskStore.getEvents(taskId);

    return NextResponse.json({
      success: true,
      task,
      history: events
    });
  } catch (err) {
    return NextResponse.json({ success: false, error: "AUTHORIZATION_ERROR", message: err.message }, { status: 403 });
  }
}

export async function POST(request, { params }) {
  try {
    const { taskId } = await params;
    const body = await request.json();
    const { action, stepId, studentId = "24110001", evidence = null } = body;

    let updatedTask;

    switch (action) {
      case "START":
        updatedTask = AcademicWorkflowService.startTask(taskId, studentId);
        break;

      case "COMPLETE_STEP":
        if (!stepId) {
          return NextResponse.json({ success: false, error: "STEP_ID_REQUIRED", message: "stepId là bắt buộc." }, { status: 400 });
        }
        updatedTask = AcademicWorkflowService.completeStep(taskId, stepId, studentId, evidence);
        break;

      case "VERIFY":
        updatedTask = AcademicWorkflowService.verifyTaskCompletion(taskId, studentId, evidence);
        break;

      default:
        return NextResponse.json({ success: false, error: "INVALID_ACTION", message: `Hành động '${action}' không được hỗ trợ.` }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: "Cập nhật tiến trình học vụ thành công."
    });
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: "WORKFLOW_MUTATION_ERROR",
      message: err.message
    }, { status: 400 });
  }
}
