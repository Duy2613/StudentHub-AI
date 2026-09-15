import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

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
      meta: {
        correlationId: securityContext.correlationId,
        releaseId: process.env.STUDENTHUB_RELEASE_ID || process.env.VERCEL_GIT_COMMIT_SHA || null,
        gitCommitSha: process.env.VERCEL_GIT_COMMIT_SHA || null,
        deploymentId: process.env.VERCEL_DEPLOYMENT_ID || null
      }
    },
    { headers: { "cache-control": "no-store" } }
  )
);
