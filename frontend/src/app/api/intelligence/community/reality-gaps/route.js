import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMMUNITY_REALITY_GAPS",
  allowAnonymous: true,
  maxRequests: 60
}, async (_request, _routeParams, _principal, secContext) => {
  if (!isCommunityDemoMode()) return Response.json({ success: false, error: { code: "COMMUNITY_ANALYTICS_WORKFLOW_NOT_MIGRATED", userMessage: "Reality-gap analytics are available only from the durable Promax projection.", correlationId: secContext.correlationId } }, { status: 503 });
  const realityGaps = CommunityStore.getRealityGaps();
  return Response.json({
    success: true,
    realityGaps,
    totalGaps: realityGaps.length,
    sourceState: "COMMUNITY_SIGNAL",
    isAuthoritative: false,
    dataNotice: "Khoảng cách thực tế là tổng hợp trải nghiệm, không phải kết luận học vụ."
  });
});
