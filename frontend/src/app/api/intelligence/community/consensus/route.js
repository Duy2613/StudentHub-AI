/**
 * StudentHub AI — API Route: GET /api/intelligence/community/consensus
 * 
 * Computes multi-account consensus, median durations, and edge-cases for a topic.
 */

import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMMUNITY_CONSENSUS",
  allowAnonymous: true,
  maxRequests: 60
}, async (req) => {
  const { searchParams } = new URL(req.url);
  const topic = (searchParams.get("topic") || "TOEIC_SUBMISSION_TIME").slice(0, 100);
  if (!isCommunityDemoMode()) return Response.json({ success: false, error: { code: "COMMUNITY_ANALYTICS_WORKFLOW_NOT_MIGRATED", userMessage: "Consensus analytics are available only from the durable Promax projection." } }, { status: 503 });
  const consensus = CommunityStore.getConsensus(topic);
  return Response.json({
    success: true,
    consensus,
    sourceState: "COMMUNITY_SIGNAL",
    isAuthoritative: false,
    dataNotice: "Đồng thuận cộng đồng chỉ là tín hiệu tham khảo, không thay thế quyết định chính thức."
  });
});
