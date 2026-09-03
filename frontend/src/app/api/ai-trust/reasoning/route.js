import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

export const runtime = "nodejs";

/**
 * The old client-composed endpoint cannot establish provenance for the layer
 * results supplied by a browser. It is intentionally retired so forged
 * VERIFIED/evidence payloads cannot reach the final policy boundary.
 */
async function rejectClientComposedReasoning() {
  return NextResponse.json({
    success: false,
    error: {
      code: "TRUST_REASONING_REQUIRES_CANONICAL_PIPELINE",
      userMessage: "Hãy sử dụng luồng Trust Engine chuẩn để hệ thống tự kiểm tra và giữ provenance của từng tầng.",
    },
    canonicalEndpoint: "/api/v1/trust",
  }, {
    status: 410,
    headers: { "Cache-Control": "no-store" },
  });
}

export const POST = SecurityFabric.wrapHandler({
  action: "REJECT_CLIENT_COMPOSED_TRUST_REASONING",
  allowAnonymous: true,
  maxRequests: 20,
  maxBodyBytes: 256 * 1024,
}, rejectClientComposedReasoning);
