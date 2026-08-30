/**
 * StudentHub AI — API Route: GET /api/ai/trust/evaluations/[evaluationId]
 * 
 * Retrieves detailed audit trail and claim graph for a specific trust evaluation.
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_TRUST_EVALUATION",
  requiredPermission: "TRUST.READ",
  requiredScopes: ["trust:read"],
  allowAnonymous: false,
  maxRequests: 120
}, async (_request, routeParams, principal, secContext) => {
  const { evaluationId } = await routeParams.params;
  if (!evaluationId) {
    return Response.json({ success: false, error: {
      code: "TRUST_EVALUATION_ID_REQUIRED",
      userMessage: "Thiếu mã đánh giá tin cậy.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  const evaluation = AiTrustStore.getEvaluationForPrincipal(evaluationId, principal);
  if (!evaluation) {
    return Response.json({ success: false, error: {
      code: "TRUST_EVALUATION_NOT_FOUND",
      userMessage: "Không tìm thấy đánh giá tin cậy.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }

  return Response.json({ success: true, evaluation, meta: { requestId: secContext.correlationId } });
});
