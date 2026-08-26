/**
 * StudentHub AI — API Route: GET /api/intelligence/community/search
 * 
 * Searches community posts and topics prioritizing relevance, first-hand quality and recency.
 */

import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const query = (searchParams.get("q") || "").toLowerCase().trim();

    const allPosts = CommunityStore.getAllPosts({ redactPrivate: true });
    const matchedPosts = query 
      ? allPosts.filter(p => (p.body || p.content || "").toLowerCase().includes(query) || (p.topic || "").toLowerCase().includes(query))
      : allPosts;

    return NextResponse.json({
      success: true,
      query,
      totalMatches: matchedPosts.length,
      posts: matchedPosts
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error searching community posts" },
      { status: 500 }
    );
  }
}
