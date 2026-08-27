import { StudentIdentityStore } from "../../../../lib/intelligence/academic/studentIdentityStore.js";
import { SecurityFabric } from "../../../../lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "../../../../lib/security/authorization/ObjectAuthorizer.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_IDENTITY",
    requiredPermission: "ACADEMIC.READ_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: false // P0 FIX: Anonymous access to private student identity is strictly denied
  },
  async (request, routeParams, principal, secContext) => {
    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId");

    // Derive authoritative identity exclusively from authenticated principal
    const authedStudentId = principal.subjectId.replace("student:", "").trim();

    // Zero-Trust BOLA Defense: Prohibit accessing other students' identities
    if (requestedStudentId && requestedStudentId !== authedStudentId) {
      ObjectAuthorizer.assertAccess(principal, {
        studentId: requestedStudentId,
        ownerId: requestedStudentId
      });
    }

    const targetStudentId = authedStudentId;
    const identity = StudentIdentityStore.getIdentityByStudentId(targetStudentId);

    if (!identity) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `Student identity not found for MSSV: ${targetStudentId}`,
            correlationId: secContext.correlationId
          }
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: identity,
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
