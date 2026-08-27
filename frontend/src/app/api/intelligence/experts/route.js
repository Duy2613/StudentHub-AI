/**
 * StudentHub AI — API Route: GET /api/intelligence/experts
 * Multi-Signal Expert Discovery & Ranking protected by Security Fabric
 * Sanitized via ExpertPublicDTO (P0 Fix)
 */

import { SecurityFabric } from "../../../../lib/security/SecurityFabric.js";
import { ExpertDiscoveryEngine } from "../../../../lib/intelligence/expert/ExpertDiscoveryEngine.js";
import { ExpertStore } from "../../../../lib/intelligence/expert/expertStore.js";
import { ExpertPublicDTO } from "../../../../lib/intelligence/expert/ExpertPublicDTO.js";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "DISCOVER_EXPERTS",
    requiredPermission: "EXPERT.READ",
    requiredScopes: ["expert:read"],
    allowAnonymous: true
  },
  async (request, routeParams, principal, secContext) => {
    const { searchParams } = new URL(request.url);
    const topic = searchParams.get("topic");
    const domain = searchParams.get("domain");
    const limit = parseInt(searchParams.get("limit") || "10", 10);

    if (topic) {
      const discoveryResults = ExpertDiscoveryEngine.discoverExperts({
        topic,
        domain,
        limit
      });

      return Response.json({
        success: true,
        data: discoveryResults,
        meta: {
          correlationId: secContext.correlationId
        }
      });
    }

    const allExperts = ExpertStore.getAllExperts({
      redactPrivate: true,
      domainFilter: domain || null
    });

    // P0 FIX: Strictly project through ExpertPublicDTO
    const publicExperts = ExpertPublicDTO.toPublicList(allExperts.slice(0, limit));

    return Response.json({
      success: true,
      total: allExperts.length,
      experts: publicExperts,
      meta: {
        correlationId: secContext.correlationId
      }
    });
  }
);
