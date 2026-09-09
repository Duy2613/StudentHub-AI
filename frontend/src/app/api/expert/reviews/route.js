import { NextResponse } from "next/server";
import { ExpertRepository, ExpertRepositoryError } from "@/lib/server/database/ExpertRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

function errorResponse(error, correlationId) {
  if (error instanceof ExpertRepositoryError || ["CASE_NOT_AVAILABLE", "CLAIM_CASE_MISMATCH", "EVIDENCE_CASE_MISMATCH", "STALE_CASE_REVISION", "IDEMPOTENCY_CONFLICT"].includes(error?.code)) {
    return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId } }, { status: error.statusCode || 409 });
  }
  if (["42P01", "42703", "3F000"].includes(error?.code)) return NextResponse.json({ success: false, error: { code: "PROMAX_MIGRATION_REQUIRED", userMessage: "Expert review storage is not available in this environment.", correlationId } }, { status: 503 });
  return NextResponse.json({ success: false, error: { code: "EXPERT_REVIEW_STORAGE_UNAVAILABLE", userMessage: "Independent review storage is temporarily unavailable.", correlationId } }, { status: 503 });
}

async function createReview(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  try {
    const data = await ExpertRepository.recordReviewDecision({
      reviewerId: principal.subjectId,
      assessmentId: body.assessmentId,
      assignmentId: body.assignmentId,
      decision: body.decision,
      reasoning: body.reasoning,
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
      correlationId: securityContext.correlationId,
    });
    return NextResponse.json({ success: true, contractVersion: "expert-review.promax.v1", data, majorityApplied: false, correlationId: securityContext.correlationId }, { status: data.idempotent ? 200 : 201 });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

async function readConsensus(request, _routeParams, principal, securityContext) {
  const { searchParams } = new URL(request.url);
  try {
    const data = await ExpertRepository.getAssessmentConsensus({
      actorId: principal.subjectId,
      caseId: searchParams.get("caseId"),
      caseRevision: Number(searchParams.get("caseRevision")),
      claimId: searchParams.get("claimId") || null,
    });
    return NextResponse.json({ success: true, contractVersion: "expert-review.promax.v1", data, correlationId: securityContext.correlationId });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_EXPERT_REVIEW_CONSENSUS", requiredPermission: "EXPERT.READ", allowAnonymous: false, maxRequests: 90, maxBodyBytes: 0 }, readConsensus);
export const POST = SecurityFabric.wrapHandler({ action: "RECORD_EXPERT_REVIEW_DECISION", requiredPermission: "EXPERT.EVALUATE", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 32 * 1024 }, createReview);

