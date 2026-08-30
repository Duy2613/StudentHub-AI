/**
 * StudentHub AI — API Route: GET /api/personalization/digital-twin
 * Returns Server-Authoritative Personal Digital Twin protected by Security Fabric
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { PersonalDigitalTwin } from "@/lib/personalization/PersonalDigitalTwin.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_DIGITAL_TWIN",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: false
  },
  async (request, routeParams, principal, secContext) => {
    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId");

    const subjectId = principal.subjectId;
    const authenticatedStudentId = subjectId.replace("student:", "").trim();

    if (requestedStudentId && requestedStudentId !== authenticatedStudentId) {
      ObjectAuthorizer.assertAccess(principal, { studentId: requestedStudentId });
    }

    const twin = PersonalDigitalTwin.buildDigitalTwin(subjectId);

    return Response.json({
      success: true,
      data: twin,
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
