/**
 * StudentHub AI — API Route: GET /api/intelligence/community/topics/[topicId]
 * 
 * Retrieves topic consensus, operational friction hotspots and matching posts.
 */

import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export async function GET(req, { params }) {
  try {
    const { topicId } = await params;
    if (!topicId) {
      return NextResponse.json(
        { success: false, error: "topicId is required." },
        { status: 400 }
      );
    }

    const consensus = CommunityStore.getConsensus(topicId);
    const posts = CommunityStore.getPostsByTopic(topicId, { redactPrivate: true });

    return NextResponse.json({
      success: true,
      topic: topicId,
      consensus,
      totalPosts: posts.length,
      posts
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving topic" },
      { status: 500 }
    );
  }
}
