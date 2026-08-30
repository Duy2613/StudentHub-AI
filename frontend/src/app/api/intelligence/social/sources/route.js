import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ConnectorRegistry } from "@/lib/intelligence/social/ConnectorRegistry.js";

export const dynamic = "force-dynamic";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_SOCIAL_SOURCES",
  allowAnonymous: true,
  handler: async ({ correlationId }) => {
    const connectors = ConnectorRegistry.listConnectors();
    return Response.json({
      success: true,
      data: connectors,
      correlationId
    });
  }
});
