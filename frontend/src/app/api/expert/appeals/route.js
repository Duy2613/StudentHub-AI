import { NextResponse } from "next/server";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function createAppeal(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  try {
    const appeal = await CommunityRepository.createAppeal({
      requesterId: principal.subjectId,
      caseId: body.caseId,
      caseRevision: body.caseRevision,
      claimId: body.claimId,
      assessmentId: body.assessmentId,
      reason: body.reason,
      supersedesAppealId: body.supersedesAppealId,
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
    });
    return NextResponse.json({ success: true, contractVersion: "case-appeal.promax.v1", data: appeal, historyPreserved: true, correlationId: securityContext.correlationId }, { status: appeal.idempotent ? 200 : 201 });
  } catch (error) {
    if (error instanceof CommunityRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId: securityContext.correlationId } }, { status: error.statusCode || 409 });
    return NextResponse.json({ success: false, error: { code: "APPEAL_STORAGE_UNAVAILABLE", userMessage: "Appeal storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const POST = SecurityFabric.wrapHandler({ action: "CREATE_EXPERT_APPEAL", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 20, maxBodyBytes: 32 * 1024 }, createAppeal);
