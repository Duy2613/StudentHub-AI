/**
 * StudentHub AI — API Route: GET /api/ai/trust/audit/[answerId]
 * 
 * Retrieves immutable audit records, answer dependency graphs and blast radius analysis.
 */

import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_TRUST_AUDIT",
  requiredPermission: "TRUST.READ",
  requiredScopes: ["trust:read"],
  allowAnonymous: false,
  maxRequests: 120
}, async (_request, routeParams, principal, secContext) => {
  const { answerId } = await routeParams.params;
  if (!answerId) {
    return Response.json({ success: false, error: {
      code: "TRUST_EVALUATION_ID_REQUIRED",
      userMessage: "Thiếu mã bản ghi kiểm chứng.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  const evaluation = AiTrustStore.getEvaluationForPrincipal(answerId, principal);
  if (!evaluation) {
    return Response.json({ success: false, error: {
      code: "TRUST_EVALUATION_NOT_FOUND",
      userMessage: "Không tìm thấy bản ghi kiểm chứng.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }

  const blastRadius = AiTrustStore.computeBlastRadiusForPrincipal(
    evaluation.evidenceSpans?.[0]?.sourceId || answerId,
    principal
  );

  return Response.json({
    success: true,
    auditRecord: evaluation.auditRecord,
    evaluation,
    blastRadius,
    meta: { requestId: secContext.correlationId }
  });
});
