/**
 * StudentHub AI — API Route: GET /api/intelligence/community/experiences/[experienceId]
 * 
 * Retrieves detailed student experience report with privacy redaction.
 */

import { CommunityStore } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMMUNITY_EXPERIENCE",
  allowAnonymous: true,
  maxRequests: 90
}, async (_request, routeParams, _principal, secContext) => {
  const { experienceId } = await routeParams.params;
  if (!experienceId || typeof experienceId !== "string" || experienceId.length > 120) {
    return Response.json({ success: false, error: {
      code: "COMMUNITY_EXPERIENCE_ID_INVALID",
      userMessage: "Mã trải nghiệm không hợp lệ.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }
  const post = CommunityStore.getPost(experienceId, { redactPrivate: true });
  if (!post) {
    return Response.json({ success: false, error: {
      code: "COMMUNITY_EXPERIENCE_NOT_FOUND",
      userMessage: "Không tìm thấy trải nghiệm.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 404 });
  }
  return Response.json({
    success: true,
    experience: post,
    sourceState: "COMMUNITY_SIGNAL",
    isAuthoritative: false,
    dataNotice: "Trải nghiệm cộng đồng không thay thế nguồn chính thức."
  });
});
