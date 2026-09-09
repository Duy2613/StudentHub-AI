import { NextResponse } from "next/server";
import { ExpertRepository, ExpertRepositoryError } from "@/lib/server/database/ExpertRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

function errorResponse(error, correlationId) {
  if (error instanceof ExpertRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId } }, { status: error.statusCode || 409 });
  if (["42P01", "42703", "3F000"].includes(error?.code)) return NextResponse.json({ success: false, error: { code: "PROMAX_MIGRATION_REQUIRED", userMessage: "Expert Promax storage is not available in this environment.", correlationId } }, { status: 503 });
  return NextResponse.json({ success: false, error: { code: "EXPERT_STORAGE_UNAVAILABLE", userMessage: "Expert assessment storage is temporarily unavailable.", correlationId } }, { status: 503 });
}

async function readAssessments(request, _routeParams, _principal, securityContext) {
  const { searchParams } = new URL(request.url);
  const caseId = searchParams.get("caseId");
  if (!caseId) return NextResponse.json({ success: false, error: { code: "CASE_ID_REQUIRED", userMessage: "caseId is required.", correlationId: securityContext.correlationId } }, { status: 400 });
  try {
    return NextResponse.json({ success: true, contractVersion: "expert-assessment.promax.v1", data: await ExpertRepository.getAssessmentsForCase(caseId), policyVersion: "expert-quality-v1" });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

async function submitAssessment(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => ({}));
  try {
    const idempotencyKey = request.headers.get("idempotency-key") || body.idempotencyKey;
    const assessment = await ExpertRepository.submitAssessment({
      expertId: principal.subjectId,
      caseId: body.caseId,
      domainCode: body.domainCode,
      assessment: body.assessment || { analysis: body.reasoning },
      confidence: body.confidence,
      assignmentId: body.assignmentId,
      caseRevision: body.caseRevision,
      claimId: body.claimId,
      evidenceRevisionIds: body.evidenceRevisionIds,
      conclusionWithinScope: body.conclusionWithinScope,
      reasoning: body.reasoning,
      uncertainty: body.uncertainty,
      missingEvidence: body.missingEvidence,
      coiDeclared: body.coiDeclared,
      idempotencyKey,
      policyVersion: body.policyVersion,
      requireAssignment: true,
    });
    return NextResponse.json({ success: true, contractVersion: "expert-assessment.promax.v1", data: assessment, qualityMutation: "NONE_ON_SUBMISSION", correlationId: securityContext.correlationId }, { status: 201 });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_EXPERT_ASSESSMENTS", requiredPermission: "EXPERT.READ", allowAnonymous: false, maxRequests: 90, maxBodyBytes: 0 }, readAssessments);
export const POST = SecurityFabric.wrapHandler({ action: "SUBMIT_EXPERT_ASSESSMENT", requiredPermission: "EXPERT.EVALUATE", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 128 * 1024 }, submitAssessment);
