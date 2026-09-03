/**
 * StudentHub AI — API Route: POST /api/community/experience/evaluate
 * 
 * Evaluates real-world experience consensus, median procedure duration,
 * and detects astroturfing / coordinated manipulation.
 */

import { NextResponse } from "next/server";
import { CommunityExperienceEngine } from "@/lib/intelligence/community/communityExperienceEngine";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

async function evaluateCommunityExperience(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic, customPosts } = body;

    const topicKey = (topic || "TOEIC_SUBMISSION").toUpperCase();
    const postsToEvaluate = Array.isArray(customPosts) && customPosts.length > 0 
      ? customPosts 
      : CommunityStore.getPostsByTopic(topicKey);

    const evaluation = CommunityExperienceEngine.evaluateConsensus(topicKey, postsToEvaluate);

    return NextResponse.json({
      success: true,
      topic: topicKey,
      postsCount: postsToEvaluate.length,
      evaluation
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "ANALYZE_COMMUNITY_EXPERIENCE",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 256 * 1024,
}, evaluateCommunityExperience);
