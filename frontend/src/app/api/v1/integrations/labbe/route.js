import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { getLabbeReadiness } from "@/lib/server/integrations/LabbeBridge.js";
import { LabbeOutboxService } from "@/lib/server/integrations/LabbeOutboxService.js";

async function readLabbeStatus(request, routeParams, principal, securityContext) {
  return Response.json({
    success: true,
    contractVersion: "studenthub-labbe.v1",
    data: getLabbeReadiness(),
    meta: { correlationId: securityContext.correlationId },
  }, { headers: { "cache-control": "no-store" } });
}

async function drainLabbeOutbox(request, routeParams, principal, securityContext) {
  let body = {};
  try { body = await request.json(); } catch { /* an empty body is valid */ }
  const requestedLimit = Number.isInteger(body?.limit) ? body.limit : 5;
  const results = await LabbeOutboxService.dispatchAvailable({ limit: Math.min(20, Math.max(1, requestedLimit)) });
  return Response.json({
    success: true,
    contractVersion: "studenthub-labbe.v1",
    data: { readiness: getLabbeReadiness(), results },
    meta: { correlationId: securityContext.correlationId },
  }, { headers: { "cache-control": "no-store" } });
}

const adminIntegrationPolicy = {
  requiredPermission: "ADMIN.SECURITY",
  allowAnonymous: false,
  maxRequests: 30,
  maxBodyBytes: 8 * 1024,
};

export const GET = SecurityFabric.wrapHandler({ ...adminIntegrationPolicy, action: "READ_LABBE_INTEGRATION" , maxBodyBytes: 0 }, readLabbeStatus);
export const POST = SecurityFabric.wrapHandler({ ...adminIntegrationPolicy, action: "DRAIN_LABBE_OUTBOX" }, drainLabbeOutbox);

