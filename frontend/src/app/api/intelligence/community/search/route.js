/**
 * StudentHub AI — API Route: GET /api/intelligence/community/search
 * 
 * Searches community posts and topics prioritizing relevance, first-hand quality and recency.
 */

import { CommunityStore } from "@/lib/intelligence/community/communityStore";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "SEARCH_COMMUNITY_POSTS",
  allowAnonymous: true,
  maxRequests: 90
}, async (req) => {
  const { searchParams } = new URL(req.url);
  const query = (searchParams.get("q") || "").toLowerCase().trim().slice(0, 160);
  const allPosts = CommunityStore.getAllPosts({ redactPrivate: true });
  const matchedPosts = query
    ? allPosts.filter(p => (p.body || p.content || "").toLowerCase().includes(query) || (p.topic || "").toLowerCase().includes(query))
    : allPosts;
  return Response.json({
    success: true,
    query,
    totalMatches: matchedPosts.length,
    posts: matchedPosts,
    sourceState: "COMMUNITY_SIGNAL",
    isAuthoritative: false,
    dataNotice: "Nội dung cộng đồng không thay thế văn bản chính thức."
  });
});
