/**
 * StudentHub AI — API Route: GET /api/ai/trust/evidence/[evidenceId]
 * 
 * Retrieves evidence span passage, source lineage, content hash, and validity window.
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_TRUST_EVIDENCE",
  requiredPermission: "TRUST.READ",
  requiredScopes: ["trust:read"],
  allowAnonymous: false,
  maxRequests: 120
}, async (_request, routeParams, principal, secContext) => {
  const { evidenceId } = await routeParams.params;
  if (!evidenceId) {
    return Response.json({ success: false, error: {
      code: "TRUST_EVIDENCE_ID_REQUIRED",
      userMessage: "Thiếu mã bằng chứng.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  const evidence = AiTrustStore.getEvidenceForPrincipal(evidenceId, principal);
  if (!evidence) {
    return Response.json({ success: false, error: {
      code: "TRUST_EVIDENCE_NOT_FOUND",
      userMessage: "Không tìm thấy bằng chứng kiểm chứng.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }

  return Response.json({ success: true, evidence, meta: { requestId: secContext.correlationId } });
});
