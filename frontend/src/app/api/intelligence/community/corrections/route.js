import { NextResponse } from "next/server";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

async function createCorrection(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  try {
    const correction = await CommunityRepository.createCorrection({
      createdBy: principal.subjectId,
      caseId: body.caseId,
      caseRevision: body.caseRevision,
      claimId: body.claimId,
      correctionType: body.correctionType,
      statement: body.statement,
      evidenceRevisionIds: body.evidenceRevisionIds,
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
    });
    return NextResponse.json({ success: true, contractVersion: "case-correction.promax.v1", data: correction, previousRevisionsImmutable: true, correlationId: securityContext.correlationId }, { status: correction.idempotent ? 200 : 201 });
  } catch (error) {
    if (error instanceof CommunityRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId: securityContext.correlationId } }, { status: error.statusCode || 409 });
    return NextResponse.json({ success: false, error: { code: "CORRECTION_STORAGE_UNAVAILABLE", userMessage: "Correction storage is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const POST = SecurityFabric.wrapHandler({ action: "CREATE_COMMUNITY_CORRECTION", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 64 * 1024 }, createCorrection);
