/**
 * StudentHub AI — API Route: GET /api/community/experiences
 * 
 * Retrieves real-world student experiences & posts across topics.
 */

import { CommunityStore } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMMUNITY_EXPERIENCES",
  allowAnonymous: true,
  maxRequests: 90
}, async (req) => {
  const { searchParams } = new URL(req.url);
  const topic = (searchParams.get("topic") || "").slice(0, 80);
  const posts = topic ? CommunityStore.getPostsByTopic(topic) : CommunityStore.getAllPosts();
  return Response.json({
    success: true,
    total: posts.length,
    posts,
    sourceState: "COMMUNITY_SIGNAL",
    isAuthoritative: false,
    dataNotice: "Trải nghiệm cộng đồng không thay thế thông báo chính thức."
  });
});
