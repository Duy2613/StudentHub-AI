import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({ action: "READ_COMMUNITY_EXPERIENCES", allowAnonymous: true, maxRequests: 90 }, async (req, _routeParams, _principal, securityContext) => {
  const { searchParams } = new URL(req.url);
  const topic = (searchParams.get("topic") || "").slice(0, 80);
  try {
    const posts = isCommunityDemoMode()
      ? (topic ? CommunityStore.getPostsByTopic(topic, { redactPrivate: true }) : CommunityStore.getAllPosts({ redactPrivate: true }))
      : await CommunityRepository.listContributions({ caseId: searchParams.get("caseId") || null, claimId: searchParams.get("claimId") || null, sort: searchParams.get("sort") || "relevant" });
    return Response.json({ success: true, total: posts.length, posts, sourceState: isCommunityDemoMode() ? "DEMO_FIXTURE" : "COMMUNITY_SIGNAL", isAuthoritative: false, correlationId: securityContext.correlationId, dataNotice: "Community contributions are signals attached to a case revision; Trust remains authoritative." });
  } catch {
    return Response.json({ success: false, error: { code: "COMMUNITY_STORAGE_UNAVAILABLE", userMessage: "Community storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
});
