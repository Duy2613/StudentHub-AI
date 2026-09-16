import { NextResponse } from "next/server";
import { ExpertRepository, ExpertRepositoryError } from "@/lib/server/database/ExpertRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

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
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
      correlationId: securityContext.correlationId,
    });
    return NextResponse.json({
      success: true,
      contractVersion: "expert-review-request.v1",
      data: result,
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
