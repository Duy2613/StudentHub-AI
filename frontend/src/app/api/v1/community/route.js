import { NextResponse } from "next/server";
import { CommunityQueryEngine } from "@/lib/intelligence/community/communityQueryEngine.js";
import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

function normalizeQuery(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    topic: typeof value.topic === "string" ? value.topic.trim().slice(0, 160) : undefined,
    queryType: typeof value.queryType === "string" ? value.queryType.trim().slice(0, 80) : undefined,
    cohort: typeof value.cohort === "string" ? value.cohort.trim().slice(0, 40) : undefined,
  };
}

function communityUnavailableResponse() {
  return NextResponse.json({
    success: false,
    contractVersion: "community.v1",
    provenance: "UNAVAILABLE",
    sourceState: "UNAVAILABLE",
    isAuthoritative: false,
    data: null,
    error: {
      code: "COMMUNITY_STORAGE_UNAVAILABLE",
      userMessage: "Dữ liệu Community hiện chưa khả dụng. Không có dữ liệu mẫu thay thế.",
    },
  }, { status: 503, headers: { "Cache-Control": "no-store" } });
}

async function queryCanonicalCommunity(query) {
  if (isCommunityDemoMode()) return CommunityQueryEngine.query(query);
  try {
    const contributions = await CommunityRepository.listContributions({ limit: 100 });
    return CommunityQueryEngine.queryFromPosts(query, contributions);
  } catch (error) {
    const code = typeof error?.code === "string" ? error.code : "";
    const storageFailure = /^[0-9A-Z]{5}$/.test(code)
      || /^(ECONN|ETIMEDOUT|ENOTFOUND)/.test(code)
      || error?.statusCode === 503;
    if (!storageFailure) throw error;
    console.warn("[CommunityAPI] Durable community storage unavailable.", {
      code: /^[0-9A-Z_]{1,24}$/.test(code) ? code : "UNKNOWN",
    });
    return null;
  }
}

async function readCommunity(request) {
  const url = new URL(request.url);
  const query = normalizeQuery({
    topic: url.searchParams.get("topic"),
    queryType: url.searchParams.get("queryType"),
    cohort: url.searchParams.get("cohort"),
  });
  const result = await queryCanonicalCommunity(query);
  if (result === null) return communityUnavailableResponse();
  return NextResponse.json({
    success: true,
    contractVersion: "community.v1",
    provenance: isCommunityDemoMode() ? "DEMO_FIXTURE" : "DURABLE_POSTGRES",
    sourceState: isCommunityDemoMode() ? "DEMO_FIXTURE" : "DURABLE_POSTGRES",
    isAuthoritative: false,
    data: result,
  });
}

async function queryCommunity(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_JSON", userMessage: "Payload phải là JSON hợp lệ." } }, { status: 400 }); }
  const query = normalizeQuery(body);
  const result = await queryCanonicalCommunity(query);
  if (result === null) return communityUnavailableResponse();
  return NextResponse.json({ success: true, contractVersion: "community.v1", provenance: isCommunityDemoMode() ? "DEMO_FIXTURE" : "DURABLE_POSTGRES", sourceState: isCommunityDemoMode() ? "DEMO_FIXTURE" : "DURABLE_POSTGRES", isAuthoritative: false, data: result });
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_CANONICAL_COMMUNITY", allowAnonymous: true, maxRequests: 60, maxBodyBytes: 0 }, readCommunity);
export const POST = SecurityFabric.wrapHandler({ action: "QUERY_CANONICAL_COMMUNITY", allowAnonymous: true, maxRequests: 60, maxBodyBytes: 64 * 1024 }, queryCommunity);
