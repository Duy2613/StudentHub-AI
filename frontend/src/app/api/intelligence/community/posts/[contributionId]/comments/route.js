import { NextResponse } from "next/server";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { publishRealtimeEvent } from "@/lib/server/realtime/RealtimePublisher.js";

function errorResponse(error, correlationId) {
  const status = error?.statusCode || (error instanceof CommunityRepositoryError ? 400 : 503);
  const code = error?.code || "COMMUNITY_COMMENT_STORAGE_UNAVAILABLE";
  const userMessage = error instanceof CommunityRepositoryError
    ? error.message
    : "Bình luận tạm thời chưa khả dụng.";
  return NextResponse.json({ success: false, error: { code, userMessage, correlationId } }, { status });
}

async function listComments(_request, routeParams, _principal, securityContext) {
  const { contributionId } = await routeParams?.params || {};
  try {
    const comments = await CommunityRepository.listComments({ contributionId });
    return NextResponse.json({ success: true, contractVersion: "community-thread.v1", comments, maxDepth: 3, correlationId: securityContext.correlationId });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

async function createComment(request, routeParams, principal, securityContext) {
  const { contributionId } = await routeParams?.params || {};
  const body = await request.json().catch(() => ({}));
  const idempotencyKey = request.headers.get("idempotency-key") || body.idempotencyKey;
  try {
    const comment = await CommunityRepository.createComment({
      authorId: principal.subjectId,
      contributionId,
      parentCommentId: body.parentCommentId || null,
      content: body.content,
      idempotencyKey,
      correlationId: securityContext.correlationId,
    });
    if (!comment.idempotent) {
      void publishRealtimeEvent({
        channel: "community",
        eventType: "community:comment",
        subjectId: null,
        classification: "PUBLIC",
        producer: "StudentHub-AI",
        environment: process.env.NODE_ENV || "development",
        correlationId: securityContext.correlationId,
        causationId: comment.commentId,
        idempotencyKey: `community:comment:${comment.commentId}`,
        data: { contributionId, commentId: comment.commentId, parentCommentId: comment.parentCommentId, depth: comment.depth },
      }).catch(() => {});
    }
    return NextResponse.json({ success: true, comment, correlationId: securityContext.correlationId }, { status: comment.idempotent ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_COMMUNITY_THREAD", allowAnonymous: true, maxRequests: 90, maxBodyBytes: 0 }, listComments);
export const POST = SecurityFabric.wrapHandler({ action: "CREATE_COMMUNITY_COMMENT", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 12 * 1024 }, createComment);
