/**
 * StudentHub AI — API Route: GET /api/intelligence/community/topics/[topicId]
 * 
 * Retrieves topic consensus, operational friction hotspots and matching posts.
 */

import { CommunityStore } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMMUNITY_TOPIC",
  allowAnonymous: true,
  maxRequests: 90
}, async (_request, routeParams, _principal, secContext) => {
  const { topicId } = await routeParams.params;
  if (!topicId || typeof topicId !== "string" || topicId.length > 100) {
    return Response.json({ success: false, error: {
      code: "COMMUNITY_TOPIC_INVALID",
      userMessage: "Chủ đề không hợp lệ.",
      requestId: secContext.correlationId,
      retryable: false
    } }, { status: 400 });
  }
  const consensus = CommunityStore.getConsensus(topicId);
  const posts = CommunityStore.getPostsByTopic(topicId, { redactPrivate: true });
  return Response.json({
    success: true,
    topic: topicId,
    consensus,
    totalPosts: posts.length,
    posts,
    sourceState: "COMMUNITY_SIGNAL",
    isAuthoritative: false,
    dataNotice: "Tín hiệu cộng đồng không thay thế thông báo chính thức."
  });
});
