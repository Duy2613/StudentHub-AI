/**
 * StudentHub AI — API Route: POST /api/personalization/reset
 * Resets user personalization settings to factory defaults
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { PersonalizationEngine } from "@/lib/personalization/PersonalizationEngine.js";

export const POST = SecurityFabric.wrapHandler(
  {
    action: "RESET_PERSONALIZATION",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const subjectId = principal.isAuthenticated ? principal.subjectId : "student:24110001";
    const res = PersonalizationEngine.resetPersonalization(subjectId);

    return Response.json({
      success: true,
      data: res,
      meta: { correlationId: secContext.correlationId }
    });
  }
);
