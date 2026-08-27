import { StudentProfile360Service } from "../../../../../lib/intelligence/academic/studentProfile360Service.js";
import { SecurityFabric } from "../../../../../lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "../../../../../lib/security/authorization/ObjectAuthorizer.js";

export const dynamic = "force-dynamic";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_TRANSCRIPT",
    requiredPermission: "ACADEMIC.READ_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: false // P0 FIX: Anonymous access to private student transcript is strictly denied
  },
  async (request, routeParams, principal, secContext) => {
    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId");

    // Derive authoritative identity exclusively from authenticated principal
    const authedStudentId = principal.subjectId.replace("student:", "").trim();

    // Zero-Trust BOLA Defense: If client explicitly requests another student's ID, assert ownership
    if (requestedStudentId && requestedStudentId !== authedStudentId) {
      ObjectAuthorizer.assertAccess(principal, {
        studentId: requestedStudentId,
        ownerId: requestedStudentId
      });
    }

    const profile = StudentProfile360Service.getProfile360(authedStudentId);

    if (!profile) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `Hồ sơ học vụ 360 không tìm thấy cho sinh viên: ${authedStudentId}`,
            correlationId: secContext.correlationId
          }
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: profile,
      meta: {
        timestamp: new Date().toISOString(),
        revision: profile.profileRevision,
        correlationId: secContext.correlationId
      }
    });
  }
);
