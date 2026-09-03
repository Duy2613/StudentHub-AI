import { AcademicRecordsStore } from "@/lib/intelligence/academic/academicRecordsStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";


export const dynamic = "force-dynamic";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_TRANSCRIPT",
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

    const records = AcademicRecordsStore.getRecordByStudentId(studentId);
    if (!records) {
      return Response.json(
        {
          error: {
            code: "NOT_FOUND",
            message: `Academic records not found for MSSV: ${studentId}`,
            correlationId: secContext.correlationId
          }
        },
        { status: 404 }
      );
    }

    return Response.json({
      success: true,
      data: records,
      meta: { correlationId: secContext.correlationId }
    });
  }
);
