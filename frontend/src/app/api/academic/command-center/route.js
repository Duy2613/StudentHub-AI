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

import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";

export const dynamic = "force-dynamic";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_ACADEMIC_COMMAND_CENTER",
    requiredPermission: "ACADEMIC.READ_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: false
  },
  async (request, routeParams, principal, secContext) => {
    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId");
    const studentId = principal.subjectId.replace("student:", "").trim();

    if (requestedStudentId && requestedStudentId !== studentId) {
      ObjectAuthorizer.assertAccess(principal, {
        studentId: requestedStudentId,
        ownerId: requestedStudentId
      });
    }

    let payload;
    try {
      payload = getAuthoritativeCommandCenterData({
        studentId,
        cohort: principal.attributes?.cohort,
        programCode: principal.attributes?.programCode
      });
    } catch (error) {
      payload = {
        studentProfile: {
          studentId,
          fullName: principal.attributes?.fullName || "Sinh viên StudentHub",
          cohort: principal.attributes?.cohort || 2024,
          programCode: principal.attributes?.programCode || "7480103",
        },
        digitalTwin: null,
        status: "UNAVAILABLE",
        notice: "Dữ liệu trung tâm điều hành học vụ tạm thời chưa khả dụng.",
        error: {
          code: error?.code || "DURABLE_ACADEMIC_UNAVAILABLE",
          message: error?.message || "Cơ sở dữ liệu học vụ tạm thời không phản hồi.",
        },
      };
    }

    return Response.json({
      ...payload,
      meta: {
        ...(payload.meta || {}),
        correlationId: secContext.correlationId
      }
    });
  }
);
