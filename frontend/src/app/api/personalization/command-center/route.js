/**
 * StudentHub AI — API Route: GET /api/personalization/command-center
 * Personal Academic Command Center Context protected by Security Fabric
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { PersonalizationEngine } from "@/lib/personalization/PersonalizationEngine.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_COMMAND_CENTER",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId");

    const subjectId = principal.isAuthenticated
      ? principal.subjectId
      : `student:${requestedStudentId || "24110001"}`;

    const context = PersonalizationEngine.compileCommandCenterContext(subjectId, principal);

    return Response.json({
      success: true,
      data: context,
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
