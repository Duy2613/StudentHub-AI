import { NextResponse } from "next/server";
import { CommunityQueryEngine } from "@/lib/intelligence/community/communityQueryEngine.js";
import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { isCommunityDemoMode } from "@/lib/intelligence/community/communityStore.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

async function queryCommunityKnowledge(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = isCommunityDemoMode()
      ? CommunityQueryEngine.query(body)
      : CommunityQueryEngine.queryFromPosts(body, await CommunityRepository.listContributions({ limit: 100 }));
    return NextResponse.json({
      success: true,
      result,
      sourceState: isCommunityDemoMode() ? "DEMO_FIXTURE" : "DURABLE_POSTGRES",
      isAuthoritative: false,
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
