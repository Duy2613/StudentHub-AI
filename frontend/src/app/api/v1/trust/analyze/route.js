// V5's explicit endpoint name. The implementation remains shared with the
// legacy-compatible canonical route so authorization, rate limiting, input
// bounds and security headers cannot drift between entry points.
import { runCanonicalTrust } from "../route.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const runtime = "nodejs";

export const POST = SecurityFabric.wrapHandler({
  action: "RUN_CANONICAL_TRUST_PIPELINE",
  allowAnonymous: true,
  maxRequests: 20,
  maxBodyBytes: 512 * 1024,
}, runCanonicalTrust);
