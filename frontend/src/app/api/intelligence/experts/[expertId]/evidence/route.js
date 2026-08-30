/**
 * StudentHub AI — API Route: GET /api/intelligence/experts/[expertId]/evidence
 * 
 * Retrieves evidence graph, publications, and provenance clusters for an expert.
 */

import { ExpertStore } from "@/lib/intelligence/expert/expertStore";
import { ExpertPublicDTO } from "@/lib/intelligence/expert/ExpertPublicDTO.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_EXPERT_EVIDENCE",
  allowAnonymous: true,
  maxRequests: 90
}, async (_request, { params }, _principal, secContext) => {
  const { expertId } = await params;
  if (!expertId || typeof expertId !== "string" || expertId.length > 120) {
    return Response.json({ success: false, error: {
      code: "EXPERT_ID_INVALID",
      userMessage: "Mã chuyên gia không hợp lệ.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }

  const expert = ExpertStore.getExpert(expertId, { redactPrivate: true });
  if (!expert) {
    return Response.json({ success: false, error: {
      code: "EXPERT_NOT_FOUND",
      userMessage: "Không tìm thấy hồ sơ chuyên gia.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }

  const publicExpert = ExpertPublicDTO.toPublicDTO(expert);
  const evidenceRefs = Array.isArray(expert.evidenceRefs)
    ? expert.evidenceRefs.filter(ref => typeof ref === "string").slice(0, 200)
    : [];
  return Response.json({
    success: true,
    expertId,
    totalPublications: publicExpert.publications.length,
    totalEvidenceRefs: evidenceRefs.length,
    publications: publicExpert.publications,
    evidenceRefs,
    credentials: publicExpert.credentials,
    sourceState: "CURATED_EXPERT_REGISTRY",
    isAuthoritative: false,
    dataNotice: "Bằng chứng chuyên gia là dữ liệu tham chiếu; không tự tạo thẩm quyền hành chính."
  });
});
