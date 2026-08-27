/**
 * StudentHub AI — API Route: GET /api/personalization/search
 * Universal Cross-Domain Search protected by Security Fabric
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { UniversalSearchEngine } from "@/lib/personalization/UniversalSearchEngine.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "UNIVERSAL_SEARCH",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = parseInt(searchParams.get("limit") || "5", 10);

    const subjectId = principal.isAuthenticated ? principal.subjectId : "student:24110001";
    const results = UniversalSearchEngine.search({ query, subjectId, limit });

    return Response.json({
      success: true,
      data: results,
      meta: { correlationId: secContext.correlationId }
    });
  }
);
