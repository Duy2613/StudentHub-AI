import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * Retired caller-composed claim endpoint. A claim and evidence supplied by a
 * browser are candidate data, not authoritative verification. The canonical
 * pipeline owns retrieval and policy decisions.
 */
async function rejectClientComposedClaim(_request, _routeParams, _principal, secContext) {
  return NextResponse.json({
    success: false,
    error: {
      code: "TRUST_CLAIM_REQUIRES_CANONICAL_PIPELINE",
      userMessage: "Claim phải được kiểm chứng trong pipeline chuẩn.",
      requestId: secContext.correlationId,
      retryable: false,
    },
    canonicalEndpoint: "/api/v1/trust",
  }, {
    status: 410,
    headers: { "Cache-Control": "no-store" },
  });
}

export const POST = SecurityFabric.wrapHandler({
  action: "VERIFY_TRUST_CLAIM",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 128 * 1024,
}, rejectClientComposedClaim);
