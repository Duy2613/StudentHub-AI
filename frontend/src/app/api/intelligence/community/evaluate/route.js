/**
 * StudentHub AI — API Route: POST /api/intelligence/community/evaluate
 * 
 * Analyzes custom arrays of community posts for consensus, astroturfing and sockpuppets.
 */

import { NextResponse } from "next/server";
import { CommunityExperienceEngine } from "@/lib/intelligence/community/communityExperienceEngine";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { topic = "GENERAL", posts = [] } = body;

    const evaluation = CommunityExperienceEngine.evaluateConsensus(topic, posts);
    return NextResponse.json({
      success: true,
      evaluation
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error evaluating community posts" },
      { status: 500 }
    );
  }
}
