import { EvidenceFusionAdjudicator } from "@/lib/intelligence/fusion/evidenceFusionAdjudicator.js";
import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

async function evaluateKnowledgeObject(request, _routeParams, _principal, secContext) {
  const body = await request.json().catch(() => ({}));
  if (!body || typeof body !== "object" || Array.isArray(body) || !Array.isArray(body.claims) || body.claims.length > 100) {
    return Response.json({ success: false, error: {
      code: "KNOWLEDGE_OBJECT_INPUT_INVALID",
      userMessage: "Dữ liệu đánh giá tri thức không hợp lệ.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  const oversizedClaim = body.claims.some(claim => typeof claim?.statement === "string" && claim.statement.length > 10_000);
  if (oversizedClaim || (Array.isArray(body.sources) && body.sources.length > 100)) {
    return Response.json({ success: false, error: {
      code: "KNOWLEDGE_OBJECT_INPUT_TOO_LARGE",
      userMessage: "Dữ liệu tri thức vượt giới hạn cho phép.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 413 });
  }

  const knowledgeObject = EvidenceFusionAdjudicator.adjudicate(body);
  EvidenceFusionStore.saveKnowledgeObject(knowledgeObject);

  return Response.json({
    success: true,
    knowledgeObject
  });
}

export const POST = SecurityFabric.wrapHandler({
  action: "EVALUATE_KNOWLEDGE_OBJECT",
  requiredPermission: "TRUST.EVALUATE",
  maxRequests: 20,
  maxBodyBytes: 256 * 1024,
}, evaluateKnowledgeObject);
