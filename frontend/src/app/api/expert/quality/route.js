import { NextResponse } from "next/server";
import { ExpertRepository, ExpertRepositoryError } from "@/lib/server/database/ExpertRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function recordQualityEvent(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  try {
    const data = await ExpertRepository.recordQualityEvent({
      userId: body.userId,
      domainCode: body.domainCode,
      caseId: body.caseId,
      caseRevision: body.caseRevision,
      claimId: body.claimId,
      evidenceRevisionIds: body.evidenceRevisionIds,
      incidentClusterId: body.incidentClusterId,
      eventType: body.eventType,
      outcome: body.outcome,
      weight: body.weight,
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
      reason: body.reason,
      policyVersion: body.policyVersion,
      actorId: principal.subjectId,
      supersedesEventId: body.supersedesEventId,
      correlationId: securityContext.correlationId,
    });
    return NextResponse.json({ success: true, contractVersion: "expert-quality.promax.v1", data, submissionDoesNotCount: true, correlationId: securityContext.correlationId });
  } catch (error) {
    if (error instanceof ExpertRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId: securityContext.correlationId } }, { status: error.statusCode || 409 });
    return NextResponse.json({ success: false, error: { code: "QUALITY_STORAGE_UNAVAILABLE", userMessage: "Quality ledger is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const POST = SecurityFabric.wrapHandler({ action: "ADJUDICATE_EXPERT_QUALITY", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 32 * 1024 }, recordQualityEvent);
