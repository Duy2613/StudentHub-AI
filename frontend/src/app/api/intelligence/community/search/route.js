import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({ action: "SEARCH_COMMUNITY_POSTS", allowAnonymous: true, maxRequests: 90 }, async (req, _routeParams, _principal, securityContext) => {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").toLowerCase().trim().slice(0, 160);
  try {
    const allPosts = isCommunityDemoMode() ? CommunityStore.getAllPosts({ redactPrivate: true }) : await CommunityRepository.listContributions({ limit: 100 });
    const matchedPosts = query ? allPosts.filter((post) => `${post.title || ""} ${post.body || post.content || post.statement || ""} ${post.topic || ""}`.toLowerCase().includes(query)) : allPosts;
    return Response.json({ success: true, query, totalMatches: matchedPosts.length, posts: matchedPosts, sourceState: isCommunityDemoMode() ? "DEMO_FIXTURE" : "COMMUNITY_SIGNAL", isAuthoritative: false, correlationId: securityContext.correlationId, dataNotice: "Community contributions are signals attached to a case revision; Trust remains authoritative." });
  } catch {
    return Response.json({ success: false, error: { code: "COMMUNITY_STORAGE_UNAVAILABLE", userMessage: "Community storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
});

