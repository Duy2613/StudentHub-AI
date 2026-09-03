import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_KNOWLEDGE_HISTORY",
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
  const diff = EvidenceFusionStore.computeKnowledgeDiff(knowledgeObjectId);
  if (!diff) {
    return Response.json({ success: false, error: {
      code: "KNOWLEDGE_HISTORY_NOT_FOUND",
      userMessage: "Không tìm thấy lịch sử phiên bản.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }

  return Response.json({
    success: true,
    diff,
    sourceState: "CURATED_REFERENCE_FIXTURE",
    isAuthoritative: false,
    dataNotice: "Lịch sử phiên bản tham chiếu; không thay thế kiểm tra văn bản gốc."
  });
});
