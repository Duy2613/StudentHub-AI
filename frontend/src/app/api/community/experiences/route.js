/**
 * StudentHub AI — API Route: GET /api/community/experiences
 * 
 * Retrieves real-world student experiences & posts across topics.
 */

import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");

    const posts = topic 
      ? CommunityStore.getPostsByTopic(topic)
      : CommunityStore.getAllPosts();

    return NextResponse.json({
      success: true,
      total: posts.length,
      posts
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving community experiences" },
      { status: 500 }
    );
  }
}
