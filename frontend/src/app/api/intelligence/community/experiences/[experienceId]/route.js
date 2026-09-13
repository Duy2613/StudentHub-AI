/** GET /api/intelligence/community/experiences/[experienceId] */

import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { isCanonicalUuid } from "@/lib/server/database/CommunityExpertScope.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

function demoMode() {
  return isCommunityDemoMode();
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_COMMUNITY_EXPERIENCE", allowAnonymous: true, maxRequests: 90 }, async (_request, routeParams, _principal, secContext) => {
  const { experienceId } = await routeParams.params;
  const useDemo = demoMode();
  if (!experienceId || typeof experienceId !== "string" || experienceId.length > 120) {
    return Response.json({ success: false, error: { code: "COMMUNITY_EXPERIENCE_ID_INVALID", userMessage: "Mã trải nghiệm không hợp lệ.", requestId: secContext.correlationId, retryable: false } }, { status: 400 });
  }
  if (!useDemo && !isCanonicalUuid(experienceId)) {
    return Response.json({ success: false, error: { code: "COMMUNITY_EXPERIENCE_ID_INVALID", userMessage: "Mã trải nghiệm không hợp lệ.", requestId: secContext.correlationId, retryable: false } }, { status: 400 });
  }
  try {
    const post = useDemo ? CommunityStore.getPost(experienceId, { redactPrivate: true }) : await CommunityRepository.getContribution(experienceId);
    if (!post) return Response.json({ success: false, error: { code: "COMMUNITY_EXPERIENCE_NOT_FOUND", userMessage: "Không tìm thấy trải nghiệm.", requestId: secContext.correlationId, retryable: false } }, { status: 404 });
    return Response.json({ success: true, experience: post, sourceState: useDemo ? "DEMO_FIXTURE" : "COMMUNITY_SIGNAL", isAuthoritative: false, dataNotice: "Community contributions are signals attached to a case revision; Trust remains authoritative." });
  } catch (error) {
    return Response.json({ success: false, error: { code: error?.code === "42P01" ? "PROMAX_MIGRATION_REQUIRED" : "COMMUNITY_STORAGE_UNAVAILABLE", userMessage: "Community storage is temporarily unavailable.", requestId: secContext.correlationId, retryable: true } }, { status: 503 });
  }
});
