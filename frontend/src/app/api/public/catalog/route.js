import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { getPublicApiCatalog } from "@/lib/server/public-api/PublicApiRegistry.js";

export const runtime = "nodejs";

async function readPublicCatalog(_request, _routeParams, _principal, securityContext) {
  return Response.json({
    success: true,
    contractVersion: "public-source.v1",
    sourceState: "PUBLIC_API_CATALOG",
    liveProviderCalls: false,
    isAuthoritative: false,
    ...getPublicApiCatalog(),
    correlationId: securityContext.correlationId,
  }, {
    headers: {
      "cache-control": "public, max-age=300, stale-while-revalidate=600",
    },
  });
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_PUBLIC_API_CATALOG",
  allowAnonymous: true,
  maxRequests: 120,
  maxBodyBytes: 0,
}, readPublicCatalog);

