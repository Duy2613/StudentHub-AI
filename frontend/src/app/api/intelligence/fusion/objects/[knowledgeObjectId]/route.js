import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_KNOWLEDGE_OBJECT",
  allowAnonymous: true,
  maxRequests: 90
}, async (_request, { params }, _principal, secContext) => {
  const { knowledgeObjectId } = await params;
  if (!knowledgeObjectId || typeof knowledgeObjectId !== "string" || knowledgeObjectId.length > 120) {
    return Response.json({ success: false, error: {
      code: "KNOWLEDGE_OBJECT_ID_INVALID",
      userMessage: "Mã đối tượng tri thức không hợp lệ.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  const knowledgeObject = EvidenceFusionStore.getById(knowledgeObjectId, { redactPrivate: true });
  if (!knowledgeObject) {
    return Response.json({ success: false, error: {
      code: "KNOWLEDGE_OBJECT_NOT_FOUND",
      userMessage: "Không tìm thấy đối tượng tri thức.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }

  return Response.json({
    success: true,
    knowledgeObject,
    sourceState: "CURATED_REFERENCE_FIXTURE",
    isAuthoritative: false,
    dataNotice: "Dữ liệu tham chiếu đã biên tập; luôn đối chiếu văn bản gốc trước quyết định ràng buộc."
  });
});
