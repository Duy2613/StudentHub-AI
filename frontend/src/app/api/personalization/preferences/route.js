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
    allowAnonymous: false
  },
  async (request, routeParams, principal, secContext) => {
    const subjectId = principal.subjectId;
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
    allowAnonymous: false
  },
  async (request, routeParams, principal, secContext) => {
    const subjectId = principal.subjectId;
    const body = await request.json();

    const updated = PersonalizationEngine.updatePreferences(subjectId, body);

    return Response.json({
      success: true,
      data: updated,
      meta: { correlationId: secContext.correlationId }
    });
  }
);
