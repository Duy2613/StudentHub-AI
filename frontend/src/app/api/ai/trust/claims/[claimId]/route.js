/**
 * StudentHub AI — API Route: GET /api/ai/trust/claims/[claimId]
 * 
 * Retrieves atomic claim details, cited evidence and derivation traces.
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_TRUST_CLAIM",
  requiredPermission: "TRUST.READ",
  requiredScopes: ["trust:read"],
  allowAnonymous: false,
  maxRequests: 120
}, async (_request, routeParams, principal, secContext) => {
  const { claimId } = await routeParams.params;
  if (!claimId) {
    return Response.json({ success: false, error: {
      code: "TRUST_CLAIM_ID_REQUIRED",
      userMessage: "Thiếu mã khẳng định cần kiểm chứng.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  const claim = AiTrustStore.getClaimForPrincipal(claimId, principal);
  if (!claim) {
    return Response.json({ success: false, error: {
      code: "TRUST_CLAIM_NOT_FOUND",
      userMessage: "Không tìm thấy khẳng định kiểm chứng.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }

  return Response.json({ success: true, claim, meta: { requestId: secContext.correlationId } });
});
