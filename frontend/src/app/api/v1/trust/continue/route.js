import { SecurityFabric } from "../../../../../lib/security/SecurityFabric.js";
import { runTrustContinuation } from "./continuation.js";
export const runtime = "nodejs";
export const POST = SecurityFabric.wrapHandler(
  {
    action: "CONTINUE_TRUST_STAGE",
    allowAnonymous: false,
    maxRequests: 30,
    maxBodyBytes: 64 * 1024,
  },
  runTrustContinuation
);
