import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { IncrementalSyncEngine } from "@/lib/intelligence/social/IncrementalSyncEngine.js";

export const dynamic = "force-dynamic";

export const POST = SecurityFabric.wrapHandler({
  action: "EXECUTE_SOURCE_SYNC",
  allowAnonymous: true,
  handler: async ({ request, principal, correlationId }) => {
    let body = {};
    try {
      body = await request.json();
    } catch (_) {}

    const connectorId = body.connectorId || "official_portal_hcmute";
    const result = await IncrementalSyncEngine.runIncrementalSync(connectorId, body);

    return Response.json({
      success: true,
      data: result,
      correlationId
    });
  }
});
