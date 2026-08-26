/**
 * StudentHub AI — API Route: GET /api/intelligence/community/consensus
 * 
 * Computes multi-account consensus, median durations, and edge-cases for a topic.
 */

import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic") || "TOEIC_SUBMISSION_TIME";

    const consensus = CommunityStore.getConsensus(topic);
    return NextResponse.json({
      success: true,
      consensus
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error computing consensus" },
      { status: 500 }
    );
  }
}
