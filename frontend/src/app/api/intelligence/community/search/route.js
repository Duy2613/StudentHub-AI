import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({ action: "SEARCH_COMMUNITY_POSTS", allowAnonymous: true, maxRequests: 90 }, async (req, _routeParams, principal, securityContext) => {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").toLowerCase().trim().slice(0, 160);
  const limit = Math.min(Math.max(Number.parseInt(searchParams.get("limit") || "50", 10) || 50, 1), 100);
  const offset = Math.min(Math.max(Number.parseInt(searchParams.get("offset") || "0", 10) || 0, 0), 10000);
  try {
    const matchedPosts = isCommunityDemoMode()
      ? CommunityStore.getAllPosts({ redactPrivate: true }).filter((post) => !query || `${post.title || ""} ${post.body || post.content || post.statement || ""} ${post.topic || ""}`.toLowerCase().includes(query)).slice(offset, offset + limit)
      : await CommunityRepository.listContributions({ query, limit, offset, viewerId: principal?.subjectId || null });
    return Response.json({ success: true, query, totalMatches: matchedPosts.length, pagination: { limit, offset, count: matchedPosts.length }, posts: matchedPosts, sourceState: isCommunityDemoMode() ? "DEMO_FIXTURE" : "COMMUNITY_SIGNAL", isAuthoritative: false, correlationId: securityContext.correlationId, dataNotice: "Community contributions are signals attached to a case revision; Trust remains authoritative." });
  } catch {
    return Response.json({ success: false, error: { code: "COMMUNITY_STORAGE_UNAVAILABLE", userMessage: "Community storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
});

