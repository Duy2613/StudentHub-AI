import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_KNOWLEDGE_UNKNOWNS",
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
  const kno = EvidenceFusionStore.getById(knowledgeObjectId, { redactPrivate: true });
  if (!kno) {
    return Response.json({ success: false, error: {
      code: "KNOWLEDGE_OBJECT_NOT_FOUND",
      userMessage: "Không tìm thấy đối tượng tri thức.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }

  return Response.json({
    success: true,
    knowledgeObjectId,
    unknowns: kno.unknowns || [],
    limitations: kno.limitations || [],
    sourceState: "CURATED_REFERENCE_FIXTURE",
    isAuthoritative: false,
    dataNotice: "Khoảng trống và giới hạn được công khai để hỗ trợ kiểm chứng, không phải cam kết tính đầy đủ."
  });
});
