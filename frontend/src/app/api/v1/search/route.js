import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { ExpertRepository } from "@/lib/server/database/ExpertRepository.js";
import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { ExpertStore, isExpertDemoMode } from "@/lib/intelligence/expert/expertStore.js";
import { ExpertPublicDTO } from "@/lib/intelligence/expert/ExpertPublicDTO.js";

function normalizeQuery(value) {
  return String(value || "").trim().slice(0, 120);
}

async function searchProduct(request, _routeParams, principal, securityContext) {
  const query = normalizeQuery(new URL(request.url).searchParams.get("q"));
  if (query.length < 2) return Response.json({ success: false, error: { code: "QUERY_TOO_SHORT", userMessage: "Nhập ít nhất 2 ký tự để tìm kiếm." } }, { status: 422 });
  const needle = query.toLocaleLowerCase("vi");
  const settled = await Promise.allSettled([
    Promise.resolve().then(() => isCommunityDemoMode()
      ? CommunityStore.getAllPosts({ redactPrivate: true }).filter((post) => `${post.title || ""} ${post.body || post.content || post.statement || ""}`.toLocaleLowerCase("vi").includes(needle)).slice(0, 8)
      : CommunityRepository.listContributions({ query, limit: 8, viewerId: principal?.subjectId || null })),
    Promise.resolve().then(() => isExpertDemoMode()
      ? ExpertStore.getAllExperts({ redactPrivate: true }).filter((expert) => `${expert.fullName || expert.name || ""} ${expert.title || ""} ${expert.department || ""}`.toLocaleLowerCase("vi").includes(needle)).slice(0, 8)
      : ExpertRepository.listPublicProfiles({ query, limit: 8 })),
  ]);
  const sources = Object.fromEntries(["community", "experts"].map((name, index) => [name, {
    status: settled[index].status === "fulfilled" ? "AVAILABLE" : "UNAVAILABLE",
    sourceState: (index === 0 ? isCommunityDemoMode() : isExpertDemoMode()) ? "DEMO_FIXTURE" : "DURABLE_POSTGRES",
    ...(settled[index].status === "rejected" ? { errorCode: index === 0 ? "COMMUNITY_STORAGE_UNAVAILABLE" : "EXPERT_STORAGE_UNAVAILABLE" } : {}),
  }]));
  if (settled.every((result) => result.status === "rejected")) {
    return Response.json({ success: false, sources, error: { code: "SEARCH_STORAGE_UNAVAILABLE", userMessage: "Search storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
  const communityRows = settled[0].status === "fulfilled" ? settled[0].value : [];
  const expertRows = settled[1].status === "fulfilled" ? settled[1].value : [];
  const posts = communityRows.map((post) => ({ id: post.postId || post.contributionId, kind: "COMMUNITY", title: post.title || "Quan sát cộng đồng", summary: post.body || post.content || post.statement || "" }));
  const experts = expertRows.map((expert) => ({ id: expert.expertId, kind: "EXPERT", title: ExpertPublicDTO.toPublicDTO(expert).fullName || expert.fullName || expert.name, summary: expert.title || "Chuyên gia có phạm vi công bố" }));
  const status = settled.every((result) => result.status === "fulfilled") ? "COMPLETE" : "PARTIAL";
  return Response.json({ success: true, contractVersion: "search.v1", status, query, data: { results: [...posts, ...experts], total: posts.length + experts.length }, sources, communitySource: sources.community.sourceState, correlationId: securityContext.correlationId });
}

export const GET = SecurityFabric.wrapHandler({ action: "SEARCH_CANONICAL_PRODUCT", allowAnonymous: true, maxRequests: 90, maxBodyBytes: 0 }, searchProduct);
