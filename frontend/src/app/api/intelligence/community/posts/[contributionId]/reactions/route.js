import { NextResponse } from "next/server";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { publishRealtimeEvent } from "@/lib/server/realtime/RealtimePublisher.js";

function errorResponse(error, correlationId) {
  const status = error?.statusCode || (error instanceof CommunityRepositoryError ? 400 : 503);
  return NextResponse.json({
    success: false,
    error: {
      code: error?.code || "COMMUNITY_REACTION_STORAGE_UNAVAILABLE",
      userMessage: error instanceof CommunityRepositoryError ? error.message : "Phản hồi tạm thời chưa khả dụng.",
      correlationId,
    },
  }, { status });
}

async function setReaction(request, routeParams, principal, securityContext) {
  const { contributionId } = await routeParams?.params || {};
  const body = await request.json().catch(() => ({}));
  const idempotencyKey = request.headers.get("idempotency-key") || body.idempotencyKey;
  try {
    const reaction = await CommunityRepository.setReaction({
      userId: principal.subjectId,
      contributionId,
      claimId: body.claimId || null,
      caseRevision: Number(body.caseRevision),
      kind: body.kind,
      value: Number(body.value ?? 1),
      idempotencyKey,
      expectedRevision: body.expectedRevision == null ? null : Number(body.expectedRevision),
    });
    if (!reaction.idempotent) {
      void publishRealtimeEvent({
        channel: "community",
        eventType: "community:reaction",
        subjectId: null,
        classification: "PUBLIC",
        producer: "StudentHub-AI",
        environment: process.env.NODE_ENV || "development",
        correlationId: securityContext.correlationId,
        causationId: contributionId,
        idempotencyKey: `community:reaction:${reaction.eventId}`,
        data: { contributionId, kind: reaction.kind, value: Number(reaction.value), trustMutation: false },
      }).catch(() => {});
    }
    return NextResponse.json({ success: true, reaction, correlationId: securityContext.correlationId }, { status: reaction.idempotent ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

export const POST = SecurityFabric.wrapHandler({ action: "REACT_TO_COMMUNITY_CONTRIBUTION", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 12 * 1024 }, setReaction);
