import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { CommunityStore } from "@/lib/intelligence/community/communityStore.js";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore.js";
import { ExpertPublicDTO } from "@/lib/intelligence/expert/ExpertPublicDTO.js";

function normalizeQuery(value) {
  return String(value || "").trim().slice(0, 120);
}

async function searchProduct(request) {
  const query = normalizeQuery(new URL(request.url).searchParams.get("q"));
  if (query.length < 2) return Response.json({ success: false, error: { code: "QUERY_TOO_SHORT", userMessage: "Nhập ít nhất 2 ký tự để tìm kiếm." } }, { status: 422 });
  const needle = query.toLocaleLowerCase("vi");
  const posts = CommunityStore.getAllPosts({ redactPrivate: true }).filter((post) => `${post.title || ""} ${post.body || post.content || ""}`.toLocaleLowerCase("vi").includes(needle)).slice(0, 8).map((post) => ({ id: post.postId, kind: "COMMUNITY", title: post.title || "Quan sát cộng đồng", summary: post.body || post.content || "" }));
  const experts = ExpertStore.getAllExperts({ redactPrivate: true }).filter((expert) => `${expert.fullName || expert.name || ""} ${expert.title || ""} ${expert.department || ""}`.toLocaleLowerCase("vi").includes(needle)).slice(0, 8).map((expert) => ({ id: expert.expertId, kind: "EXPERT", title: ExpertPublicDTO.toPublicDTO(expert).fullName || expert.fullName, summary: expert.title || "Chuyên gia có phạm vi công bố" }));
  return Response.json({ success: true, contractVersion: "search.v1", query, data: { results: [...posts, ...experts], total: posts.length + experts.length } });
}

export const GET = SecurityFabric.wrapHandler({ action: "SEARCH_CANONICAL_PRODUCT", allowAnonymous: true, maxRequests: 90, maxBodyBytes: 0 }, searchProduct);
