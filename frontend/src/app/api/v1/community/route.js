import { NextResponse } from "next/server";
import { CommunityQueryEngine } from "@/lib/intelligence/community/communityQueryEngine.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

function normalizeQuery(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return {
    topic: typeof value.topic === "string" ? value.topic.trim().slice(0, 160) : undefined,
    queryType: typeof value.queryType === "string" ? value.queryType.trim().slice(0, 80) : undefined,
    cohort: typeof value.cohort === "string" ? value.cohort.trim().slice(0, 40) : undefined,
  };
}

async function readCommunity(request) {
  const url = new URL(request.url);
  const result = CommunityQueryEngine.query(normalizeQuery({
    topic: url.searchParams.get("topic"),
    queryType: url.searchParams.get("queryType"),
    cohort: url.searchParams.get("cohort"),
  }));
  return NextResponse.json({
    success: true,
    contractVersion: "community.v1",
    provenance: "COMMUNITY",
    data: result,
  });
}

async function queryCommunity(request) {
  let body;
  try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: { code: "INVALID_JSON", userMessage: "Payload phải là JSON hợp lệ." } }, { status: 400 }); }
  const result = CommunityQueryEngine.query(normalizeQuery(body));
  return NextResponse.json({ success: true, contractVersion: "community.v1", provenance: "COMMUNITY", data: result });
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_CANONICAL_COMMUNITY", allowAnonymous: true, maxRequests: 60, maxBodyBytes: 0 }, readCommunity);
export const POST = SecurityFabric.wrapHandler({ action: "QUERY_CANONICAL_COMMUNITY", allowAnonymous: true, maxRequests: 60, maxBodyBytes: 64 * 1024 }, queryCommunity);
