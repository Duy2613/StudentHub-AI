import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { ExpertRepository } from "@/lib/server/database/ExpertRepository.js";
import { CommunityStore, isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { ExpertStore, isExpertDemoMode } from "@/lib/intelligence/expert/expertStore.js";
import { ExpertPublicDTO } from "@/lib/intelligence/expert/ExpertPublicDTO.js";

function normalizeQuery(value) {
  return String(value || "").trim().slice(0, 120);
}

async function searchProduct(request, _routeParams, _principal, securityContext) {
  const query = normalizeQuery(new URL(request.url).searchParams.get("q"));
  if (query.length < 2) return Response.json({ success: false, error: { code: "QUERY_TOO_SHORT", userMessage: "Nhập ít nhất 2 ký tự để tìm kiếm." } }, { status: 422 });
  const needle = query.toLocaleLowerCase("vi");
  try {
    const communityRows = isCommunityDemoMode() ? CommunityStore.getAllPosts({ redactPrivate: true }) : await CommunityRepository.listContributions({ limit: 100 });
    const posts = communityRows.filter((post) => `${post.title || ""} ${post.body || post.content || post.statement || ""}`.toLocaleLowerCase("vi").includes(needle)).slice(0, 8).map((post) => ({ id: post.postId || post.contributionId, kind: "COMMUNITY", title: post.title || "Quan sát cộng đồng", summary: post.body || post.content || post.statement || "" }));
    const expertRows = isExpertDemoMode() ? ExpertStore.getAllExperts({ redactPrivate: true }) : await ExpertRepository.listPublicProfiles({ limit: 100 });
    const experts = expertRows.filter((expert) => `${expert.fullName || expert.name || ""} ${expert.title || ""} ${expert.department || ""}`.toLocaleLowerCase("vi").includes(needle)).slice(0, 8).map((expert) => ({ id: expert.expertId, kind: "EXPERT", title: ExpertPublicDTO.toPublicDTO(expert).fullName || expert.fullName || expert.name, summary: expert.title || "Chuyên gia có phạm vi công bố" }));
    return Response.json({ success: true, contractVersion: "search.v1", query, data: { results: [...posts, ...experts], total: posts.length + experts.length }, communitySource: isCommunityDemoMode() ? "DEMO_FIXTURE" : "DURABLE_POSTGRES", correlationId: securityContext.correlationId });
  } catch {
    return Response.json({ success: false, error: { code: "SEARCH_STORAGE_UNAVAILABLE", userMessage: "Search storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "SEARCH_CANONICAL_PRODUCT", allowAnonymous: true, maxRequests: 90, maxBodyBytes: 0 }, searchProduct);
