/**
 * StudentHub AI — API Route: GET /api/intelligence/experts
 * Multi-Signal Expert Discovery & Ranking protected by Security Fabric
 * Sanitized via ExpertPublicDTO (P0 Fix)
 */

import { SecurityFabric } from "../../../../lib/security/SecurityFabric.js";
import { ExpertRepository } from "../../../../lib/server/database/ExpertRepository.js";
import { ExpertDiscoveryEngine } from "../../../../lib/intelligence/expert/ExpertDiscoveryEngine.js";
import { ExpertStore, isExpertDemoMode } from "../../../../lib/intelligence/expert/expertStore.js";
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
    if (!isExpertDemoMode()) {
      try {
        const experts = await ExpertRepository.listPublicProfiles({ limit, domainCode: domain });
        const filtered = topic ? experts.filter((expert) => `${expert.name} ${expert.title || ""} ${(expert.scopes || []).map((scope) => scope.domain).join(" ")}`.toLocaleLowerCase("vi").includes(topic.toLocaleLowerCase("vi"))) : experts;
        return Response.json({ success: true, contractVersion: "experts.v1", total: filtered.length, experts: ExpertPublicDTO.toPublicList(filtered.slice(0, limit)), sourceState: "DURABLE_POSTGRES", historyConfidence: "INSUFFICIENT_DATA", meta: { correlationId: secContext.correlationId } });
      } catch {
        return Response.json({ success: false, error: { code: "EXPERT_STORAGE_UNAVAILABLE", userMessage: "Expert profiles are temporarily unavailable.", correlationId: secContext.correlationId } }, { status: 503 });
      }
    }

    if (topic) {
      const discoveryResults = ExpertDiscoveryEngine.discoverExperts({
        topic,
        domain,
        limit
      });

      const safeMatches = discoveryResults.topMatches.map(({ rawExpert, ...match }) => ({
        ...match,
        profile: ExpertPublicDTO.toPublicDTO(rawExpert)
      }));

      return Response.json({
        success: true,
        data: { ...discoveryResults, topMatches: safeMatches },
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
