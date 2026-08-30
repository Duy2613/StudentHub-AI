import { AIObservatoryEngine } from "@/lib/ai-trust/observatory/AIObservatoryEngine.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

// Observatory data contains internal model/security telemetry.  It is an
// admin-only diagnostic surface and intentionally cannot be used as a public
// source of production truth.
export const GET = SecurityFabric.wrapHandler({
  action: "READ_AI_OBSERVATORY",
  requiredPermission: "ADMIN.SECURITY",
  requiredScopes: ["trust:read"],
  allowAnonymous: false,
  maxRequests: 60
}, async () => Response.json(AIObservatoryEngine.getObservatorySnapshot()));
