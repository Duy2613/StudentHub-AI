import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { EarlyWarningEngine } from "@/lib/intelligence/social/EarlyWarningEngine.js";

export const dynamic = "force-dynamic";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_EARLY_WARNINGS",
  allowAnonymous: true,
  handler: async ({ correlationId }) => {
    const warnings = EarlyWarningEngine.listActiveWarnings();
    return Response.json({
      success: true,
      data: warnings,
      count: warnings.length,
      correlationId
    });
  }
});
