/**
 * StudentHub AI — API Route: /api/personalization/preferences
 * Personalization Preference Configuration
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { PersonalizationEngine } from "@/lib/personalization/PersonalizationEngine.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_PREFERENCES",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const subjectId = principal.isAuthenticated ? principal.subjectId : "student:24110001";
    const prefs = PersonalizationEngine.getPreferences(subjectId);

    return Response.json({
      success: true,
      data: prefs,
      meta: { correlationId: secContext.correlationId }
    });
  }
);

export const POST = SecurityFabric.wrapHandler(
  {
    action: "UPDATE_PREFERENCES",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const subjectId = principal.isAuthenticated ? principal.subjectId : "student:24110001";
    const body = await request.json();

    const updated = PersonalizationEngine.updatePreferences(subjectId, body);

    return Response.json({
      success: true,
      data: updated,
      meta: { correlationId: secContext.correlationId }
    });
  }
);
