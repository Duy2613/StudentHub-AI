import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";
import { EvidenceFusionGraph } from "@/lib/intelligence/fusion/evidenceFusionGraph.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_KNOWLEDGE_EVIDENCE",
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

  const graph = new EvidenceFusionGraph();
  const rootNode = graph.addNode({ id: kno.knowledgeObjectId, label: kno.subject, type: "KNOWLEDGE_OBJECT" });
  if (kno.officialTruth) {
    const offNode = graph.addNode({ id: kno.officialTruth.sourceId, label: kno.officialTruth.statement, layer: "OFFICIAL_TRUTH" });
    graph.addEdge(offNode.id, rootNode.id, "SUPPORTS");
  }
  for (const exp of kno.expertInterpretation || []) {
    const expNode = graph.addNode({ id: exp.expertId || `expert-${kno.knowledgeObjectId}`, label: exp.interpretation, layer: "EXPERT_INTERPRETATION" });
    graph.addEdge(expNode.id, rootNode.id, "INTERPRETS");
  }

  return Response.json({
    success: true,
    knowledgeObjectId,
    evidenceGraph: graph.toJSON(),
    supportingEvidence: kno.supportingEvidence || [],
    sourceState: "CURATED_REFERENCE_FIXTURE",
    isAuthoritative: false,
    dataNotice: "Chuỗi bằng chứng tham chiếu; độ tin cậy cuối cùng phụ thuộc vào nguồn gốc được kiểm tra."
  });
});
