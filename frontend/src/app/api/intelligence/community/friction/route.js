import { CommunityStore } from "@/lib/intelligence/community/communityStore.js";
import { CommunityFrictionEngine } from "@/lib/intelligence/community/communityFrictionEngine.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMMUNITY_FRICTION",
  allowAnonymous: true,
  maxRequests: 60
}, async (request) => {
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") === "heatmap" ? "heatmap" : "list";
  const signals = CommunityStore.getFrictionSignals();
  const payload = format === "heatmap"
    ? { heatmap: CommunityFrictionEngine.buildFrictionHeatmap(signals), totalSignals: signals.length }
    : { signals, totalSignals: signals.length };
  return Response.json({
    success: true,
    ...payload,
    sourceState: "COMMUNITY_SIGNAL",
    isAuthoritative: false,
    dataNotice: "Tín hiệu ma sát được tổng hợp từ cộng đồng; cần đối soát nguồn chính thức."
  });
});
