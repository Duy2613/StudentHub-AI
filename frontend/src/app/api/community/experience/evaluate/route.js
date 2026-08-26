/**
 * StudentHub AI — API Route: POST /api/community/experience/evaluate
 * 
 * Evaluates real-world experience consensus, median procedure duration,
 * and detects astroturfing / coordinated manipulation.
 */

import { NextResponse } from "next/server";
import { CommunityExperienceEngine } from "@/lib/intelligence/community/communityExperienceEngine";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export async function POST(req) {
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
    return NextResponse.json(
      { success: false, error: error.message || "Internal error evaluating community consensus" },
      { status: 500 }
    );
  }
}
