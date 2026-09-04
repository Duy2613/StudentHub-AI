import { SecurityFabric } from "../../../../lib/security/SecurityFabric.js";

export const runtime = "nodejs";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "HEALTH_LIVE",
    allowAnonymous: true,
    rateLimit: false,
    maxBodyBytes: 0
  },
  async (_request, _routeParams, _principal, securityContext) => Response.json(
    {
      status: "LIVE",
      service: "studenthub-ai",
      checkedAt: new Date().toISOString(),
      meta: { correlationId: securityContext.correlationId }
    },
    { headers: { "cache-control": "no-store" } }
  )
);
