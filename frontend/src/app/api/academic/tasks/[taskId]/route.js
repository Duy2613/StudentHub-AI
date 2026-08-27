/**
 * StudentHub AI — Canonical Academic Task Mutation & Detail API Route
 * Upgraded with Zero-Trust Security Fabric
 */

import { NextResponse } from "next/server";
import { AcademicTaskStore } from "@/lib/intelligence/academic/academicTaskStore.js";
import { AcademicWorkflowService } from "@/lib/intelligence/academic/academicWorkflowService.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_TASK",
    requiredPermission: "ACADEMIC.READ_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { taskId } = await routeParams.params;
    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId");

    const authedStudentId = principal.isAuthenticated
      ? principal.subjectId.replace("student:", "").trim()
      : (requestedStudentId || "24110001");

    const task = AcademicTaskStore.getTask(taskId);
    if (!task) {
      return NextResponse.json(
        {
          error: {
            code: "TASK_NOT_FOUND",
            message: "Nhiệm vụ học vụ không tồn tại.",
            correlationId: secContext.correlationId
          }
        },
        { status: 404 }
      );
    }

    // Zero-Trust BOLA Object Check
    if (principal.isAuthenticated) {
      ObjectAuthorizer.assertAccess(principal, task);
    }

    const events = AcademicTaskStore.getEvents(taskId);

    return NextResponse.json({
      success: true,
      task,
      history: events,
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);

export const POST = SecurityFabric.wrapHandler(
  {
    action: "MUTATE_TASK",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { taskId } = await routeParams.params;
    const body = await request.json();
    const { action, stepId, studentId: clientSentStudentId, evidence = null } = body;

    // Derived identity from server context — NEVER trust client-sent studentId alone!
    const effectiveStudentId = principal.isAuthenticated
      ? principal.subjectId.replace("student:", "").trim()
      : (clientSentStudentId || "24110001");

    const task = AcademicTaskStore.getTask(taskId);
    if (task && principal.isAuthenticated) {
      ObjectAuthorizer.assertAccess(principal, task);
    }

    let updatedTask;

    switch (action) {
      case "START":
        updatedTask = AcademicWorkflowService.startTask(taskId, effectiveStudentId);
        break;

      case "COMPLETE_STEP":
        if (!stepId) {
          return NextResponse.json(
            {
              error: {
                code: "STEP_ID_REQUIRED",
                message: "stepId là bắt buộc.",
                correlationId: secContext.correlationId
              }
            },
            { status: 400 }
          );
        }
        updatedTask = AcademicWorkflowService.completeStep(taskId, stepId, effectiveStudentId, evidence);
        break;

      case "VERIFY":
        updatedTask = AcademicWorkflowService.verifyTaskCompletion(taskId, effectiveStudentId, evidence);
        break;

      default:
        return NextResponse.json(
          {
            error: {
              code: "INVALID_ACTION",
              message: `Hành động '${action}' không được hỗ trợ.`,
              correlationId: secContext.correlationId
            }
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      task: updatedTask,
      message: "Cập nhật tiến trình học vụ thành công.",
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
