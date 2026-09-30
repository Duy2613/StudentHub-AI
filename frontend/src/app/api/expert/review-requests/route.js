import { NextResponse } from "next/server";
import { ExpertRepository, ExpertRepositoryError } from "@/lib/server/database/ExpertRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { publishRealtimeEvent } from "@/lib/server/realtime/RealtimePublisher.js";
import { ExpertBlindReviewDispatcher } from "@/lib/server/expert/ExpertBlindReviewDispatcher.js";

const MIGRATION_CODES = new Set(["42P01", "42703", "3F000"]);

function errorResponse(error, correlationId) {
  if (error instanceof ExpertRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) {
    return NextResponse.json({
      success: false,
      error: { code: error.code, userMessage: error.message, correlationId },
    }, { status: error.statusCode || 409 });
  }
  if (MIGRATION_CODES.has(error?.code)) {
    return NextResponse.json({
      success: false,
      error: {
        code: "PROMAX_MIGRATION_REQUIRED",
        userMessage: "Dữ liệu yêu cầu chuyên gia chưa được khởi tạo trong môi trường này; chưa có dữ liệu thay thế.",
        correlationId,
      },
    }, { status: 503 });
  }
  return NextResponse.json({
    success: false,
    error: {
      code: "EXPERT_REVIEW_REQUEST_STORAGE_UNAVAILABLE",
      userMessage: "Không thể lưu yêu cầu chuyên gia lúc này.",
      correlationId,
    },
  }, { status: 503 });
}

async function listRequests(request, _routeParams, principal, securityContext) {
  const { searchParams } = new URL(request.url);
  try {
    const data = await ExpertRepository.listReviewRequests({
      requesterId: principal.subjectId,
      caseId: searchParams.get("caseId") || null,
      limit: searchParams.get("limit") || 20,
    });
    return NextResponse.json({
      success: true,
      contractVersion: "expert-review-request.v1",
      data,
      correlationId: securityContext.correlationId,
    });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

async function createRequest(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  try {
    const result = await ExpertRepository.createReviewRequest({
      requesterId: principal.subjectId,
      caseId: body.caseId,
      caseRevision: body.caseRevision,
      claimId: body.claimId,
      domainCode: body.domainCode || body.category,
      question: body.question,
      contextRefs: body.contextRefs || body.evidenceRefs || [],
      communityContributionId: body.communityContributionId || null,
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
      correlationId: securityContext.correlationId,
    });
    const matching = result.communityContributionId
      ? await ExpertBlindReviewDispatcher.matchReviewRequest({
        reviewRequestId: result.id,
        requesterId: principal.subjectId,
        correlationId: securityContext.correlationId,
      })
      : { ok: true, status: result.status, assignmentsCount: 0, matching: "COORDINATOR_QUEUE" };
    if (!result.idempotent) {
      void publishRealtimeEvent({
        channel: "trust",
        eventType: "trust:expert_review",
        subjectId: principal.subjectId,
        classification: "RESTRICTED",
        producer: "StudentHub-AI",
        environment: process.env.NODE_ENV || "development",
        correlationId: securityContext.correlationId,
        causationId: result.id,
        idempotencyKey: `trust:expert-review:${result.id}:requested`,
        data: { caseId: result.caseId, caseRevision: result.caseRevision, requestId: result.id, status: matching.status || result.status, assignmentsCount: matching.assignmentsCount || 0 },
      }).catch(() => {});
    }
    return NextResponse.json({
      success: true,
      contractVersion: "expert-review-request.v1",
      data: result,
      matching,
      assignmentAuthority: "SERVER_CONTROLLED",
      expertSelection: "NOT_REQUESTER_CONTROLLED",
      correlationId: securityContext.correlationId,
    }, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_OWN_EXPERT_REVIEW_REQUESTS",
  requiredPermission: "EXPERT.REQUEST",
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 0,
}, listRequests);

export const POST = SecurityFabric.wrapHandler({
  action: "CREATE_EXPERT_REVIEW_REQUEST",
  requiredPermission: "EXPERT.REQUEST",
  allowAnonymous: false,
  maxRequests: 20,
  maxBodyBytes: 32 * 1024,
}, createRequest);
