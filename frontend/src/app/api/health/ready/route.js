import { SecurityFabric } from "../../../../lib/security/SecurityFabric.js";
import { checkReadiness } from "../../../../lib/server/health/readiness.js";

export const runtime = "nodejs";

export const GET = SecurityFabric.wrapHandler(
  {
    action: "HEALTH_READY",
    allowAnonymous: true,
    rateLimit: false,
    maxBodyBytes: 0
  },
  async () => {
    const readiness = await checkReadiness();
    return Response.json(readiness, {
      status: readiness.ready ? 200 : 503,
      headers: { "cache-control": "no-store" }
    });
  }
);
