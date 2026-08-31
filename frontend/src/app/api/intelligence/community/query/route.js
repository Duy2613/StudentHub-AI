import { NextResponse } from "next/server";
import { CommunityQueryEngine } from "@/lib/intelligence/community/communityQueryEngine.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

async function queryCommunityKnowledge(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = CommunityQueryEngine.query(body);
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "QUERY_COMMUNITY_KNOWLEDGE",
  allowAnonymous: true,
  maxRequests: 60,
  maxBodyBytes: 64 * 1024,
}, queryCommunityKnowledge);
