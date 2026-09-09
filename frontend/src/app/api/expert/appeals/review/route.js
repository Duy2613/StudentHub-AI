import { NextResponse } from "next/server";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function reviewAppeal(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  try {
    const data = await CommunityRepository.reviewAppeal({
      reviewerId: principal.subjectId,
      appealId: body.appealId,
      decision: body.decision,
      reason: body.reason,
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
      correlationId: securityContext.correlationId,
    });
    return NextResponse.json({ success: true, contractVersion: "case-appeal-review.promax.v1", data, historyPreserved: true, correlationId: securityContext.correlationId }, { status: data.idempotent ? 200 : 201 });
  } catch (error) {
    if (error instanceof CommunityRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId: securityContext.correlationId } }, { status: error.statusCode || 409 });
    return NextResponse.json({ success: false, error: { code: "APPEAL_REVIEW_STORAGE_UNAVAILABLE", userMessage: "Appeal review storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const POST = SecurityFabric.wrapHandler({ action: "REVIEW_EXPERT_APPEAL", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 32 * 1024 }, reviewAppeal);
