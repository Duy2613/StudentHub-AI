import { NextResponse } from "next/server";
import { ExpertRepository, ExpertRepositoryError } from "@/lib/server/database/ExpertRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function assignCase(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  try {
    const assignment = await ExpertRepository.createAssignment({
      assignedBy: principal.subjectId,
      expertId: body.expertId,
      caseId: body.caseId,
      caseRevision: body.caseRevision,
      claimId: body.claimId,
      domainCode: body.domainCode,
      expiresAt: body.expiresAt,
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
    });
    return NextResponse.json({ success: true, contractVersion: "expert-assignment.promax.v1", data: assignment, correlationId: securityContext.correlationId }, { status: assignment.idempotent ? 200 : 201 });
  } catch (error) {
    if (error instanceof ExpertRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId: securityContext.correlationId } }, { status: error.statusCode || 409 });
    return NextResponse.json({ success: false, error: { code: "ASSIGNMENT_STORAGE_UNAVAILABLE", userMessage: "Assignment storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const POST = SecurityFabric.wrapHandler({ action: "ASSIGN_EXPERT_CASE", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 32 * 1024 }, assignCase);
