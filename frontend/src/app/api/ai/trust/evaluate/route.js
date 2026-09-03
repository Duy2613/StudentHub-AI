import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * Retired client-composed trust endpoint.
 *
 * A caller-provided source/evidence bundle cannot establish live provenance,
 * freshness, retrieval integrity, or independence. It therefore cannot be
 * allowed to reach a VERIFIED result. Authentication and authorization are
 * still enforced by SecurityFabric before this retirement response.
 */
async function rejectClientComposedEvaluation(_request, _routeParams, _principal, secContext) {
  return NextResponse.json({
    success: false,
    error: {
      code: "TRUST_EVALUATION_REQUIRES_CANONICAL_PIPELINE",
      userMessage: "Đánh giá tin cậy phải đi qua pipeline xác minh chuẩn.",
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
  action: "CREATE_TRUST_EVALUATION",
  requiredPermission: "TRUST.ANALYZE",
  maxRequests: 30,
  maxBodyBytes: 256 * 1024,
}, rejectClientComposedEvaluation);
