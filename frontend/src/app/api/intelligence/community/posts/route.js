/**
 * StudentHub AI — API Route: GET & POST /api/intelligence/community/posts
 * 
 * Lists community experience posts or submits new student experiences.
 */

import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { createSecureId } from "@/lib/security/secureId.js";

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMMUNITY_INTELLIGENCE_POSTS",
  allowAnonymous: true,
  maxRequests: 90
}, async (req) => {
  const { searchParams } = new URL(req.url);
  const topic = (searchParams.get("topic") || "").slice(0, 80);
  const posts = topic
    ? CommunityStore.getPostsByTopic(topic, { redactPrivate: true })
    : CommunityStore.getAllPosts({ redactPrivate: true });
  return Response.json({
    success: true,
    total: posts.length,
    posts,
    sourceState: "COMMUNITY_SIGNAL",
    isAuthoritative: false,
    dataNotice: "Bài đăng cộng đồng là tín hiệu trải nghiệm, không phải văn bản chính thức."
  });
});

async function createCommunityIntelligencePost(req, routeParams, principal) {
  try {
    const body = await req.json().catch(() => ({}));
    if (!body.content) {
      return NextResponse.json(
        { success: false, error: "Content is required." },
        { status: 400 }
      );
    }

    const saved = CommunityStore.savePost({
      ...body,
      postId: createSecureId("POST"),
      authorId: principal.subjectId,
      authorCohort: principal.attributes?.cohort || "UNKNOWN",
      verifiedIdentity: principal.attributes?.emailVerified ? "VERIFIED_STUDENT" : "UNVERIFIED_GUEST",
      verificationState: principal.attributes?.emailVerified ? "VERIFIED_IDENTITY" : "KNOWN_ACCOUNT",
      moderationState: "CLEAN",
      upvotes: 0
    });
    return NextResponse.json({
      success: true,
      post: CommunityStore.getPost(saved.postId, { redactPrivate: true })
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler(
  {
    action: "CREATE_COMMUNITY_INTELLIGENCE_POST",
    requiredPermission: "COMMUNITY.POST",
    allowAnonymous: false
  },
  createCommunityIntelligencePost
);
