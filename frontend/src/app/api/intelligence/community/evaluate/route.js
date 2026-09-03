/**
 * StudentHub AI — API Route: POST /api/intelligence/community/evaluate
 * 
 * Analyzes custom arrays of community posts for consensus, astroturfing and sockpuppets.
 */

import { NextResponse } from "next/server";
import { CommunityExperienceEngine } from "@/lib/intelligence/community/communityExperienceEngine";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

async function evaluateCommunityPosts(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic = "GENERAL", posts = [] } = body;

    const evaluation = CommunityExperienceEngine.evaluateConsensus(topic, posts);
    return NextResponse.json({
      success: true,
      evaluation
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "ANALYZE_COMMUNITY_POSTS",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 256 * 1024,
}, evaluateCommunityPosts);
