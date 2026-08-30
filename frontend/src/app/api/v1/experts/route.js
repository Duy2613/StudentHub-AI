import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertDiscoveryEngine } from "@/lib/intelligence/expert/ExpertDiscoveryEngine.js";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore.js";
import { ExpertPublicDTO } from "@/lib/intelligence/expert/ExpertPublicDTO.js";

function limitValue(value) {
  const parsed = Number.parseInt(value || "10", 10);
  return Number.isFinite(parsed) ? Math.min(50, Math.max(1, parsed)) : 10;
}

async function discoverExperts(request, routeParams, principal, securityContext) {
  const { searchParams } = new URL(request.url);
  const topic = searchParams.get("topic")?.trim().slice(0, 160) || null;
  const domain = searchParams.get("domain")?.trim().slice(0, 120) || null;
  const limit = limitValue(searchParams.get("limit"));
  if (topic) {
    const discovery = ExpertDiscoveryEngine.discoverExperts({ topic, domain, limit });
    const topMatches = discovery.topMatches.map(({ rawExpert, ...match }) => ({ ...match, profile: ExpertPublicDTO.toPublicDTO(rawExpert) }));
    return Response.json({ success: true, contractVersion: "experts.v1", data: { ...discovery, topMatches }, meta: { correlationId: securityContext.correlationId } });
  }
  const experts = ExpertStore.getAllExperts({ redactPrivate: true, domainFilter: domain });
  return Response.json({ success: true, contractVersion: "experts.v1", data: { total: experts.length, experts: ExpertPublicDTO.toPublicList(experts.slice(0, limit)) }, meta: { correlationId: securityContext.correlationId } });
}

export const GET = SecurityFabric.wrapHandler({
  action: "DISCOVER_CANONICAL_EXPERTS",
  requiredPermission: "EXPERT.READ",
  requiredScopes: ["expert:read"],
  allowAnonymous: true,
  maxRequests: 60,
  maxBodyBytes: 0,
}, discoverExperts);
