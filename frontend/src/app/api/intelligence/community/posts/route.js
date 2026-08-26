/**
 * StudentHub AI — API Route: GET & POST /api/intelligence/community/posts
 * 
 * Lists community experience posts or submits new student experiences.
 */

import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const topic = searchParams.get("topic");

    const posts = topic 
      ? CommunityStore.getPostsByTopic(topic, { redactPrivate: true })
      : CommunityStore.getAllPosts({ redactPrivate: true });

    return NextResponse.json({
      success: true,
      total: posts.length,
      posts
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error listing posts" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.content) {
      return NextResponse.json(
        { success: false, error: "Content is required." },
        { status: 400 }
      );
    }

    const saved = CommunityStore.savePost(body);
    return NextResponse.json({
      success: true,
      post: CommunityStore.getPost(saved.postId, { redactPrivate: true })
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error saving post" },
      { status: 500 }
    );
  }
}
