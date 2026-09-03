import { CommunityStore } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMMUNITY_REALITY_GAPS",
  allowAnonymous: true,
  maxRequests: 60
}, async () => {
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
