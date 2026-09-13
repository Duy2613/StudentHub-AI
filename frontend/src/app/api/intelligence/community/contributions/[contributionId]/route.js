import { NextResponse } from "next/server";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

function errorResponse(error, correlationId) {
  if (error instanceof CommunityRepositoryError || (error?.code && Number(error.statusCode) >= 400 && Number(error.statusCode) < 500)) {
    return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId } }, { status: error.statusCode || 409 });
  }
  if (["42P01", "42703", "3F000"].includes(error?.code)) {
    return NextResponse.json({ success: false, error: { code: "PROMAX_MIGRATION_REQUIRED", userMessage: "Community revision storage is not available in this environment.", correlationId } }, { status: 503 });
  }
  return NextResponse.json({ success: false, error: { code: "COMMUNITY_STORAGE_UNAVAILABLE", userMessage: "Community revision storage is temporarily unavailable.", correlationId } }, { status: 503 });
}

async function resolveRouteParams(routeParams) {
  const context = await routeParams;
  if (context?.params !== undefined) {
    return (await context.params) || {};
  }
  return context || {};
}

function contributionIdFromRequest(request, params) {
  if (params?.contributionId) return params.contributionId;
  try {
    const pathname = new URL(request.url).pathname;
    const prefix = "/api/intelligence/community/contributions/";
    if (!pathname.startsWith(prefix)) return null;
    return decodeURIComponent(pathname.slice(prefix.length).split("/")[0] || "") || null;
  } catch {
    return null;
  }
}

async function editContribution(request, routeParams, principal, securityContext) {
  const params = await resolveRouteParams(routeParams);
  const body = await request.json().catch(() => ({}));
  try {
    const data = await CommunityRepository.editContribution({
      authorId: principal.subjectId,
      contributionId: contributionIdFromRequest(request, params),
      expectedRevision: body.expectedRevision,
      caseId: body.caseId || body.caseScope?.caseId,
      caseRevision: body.caseRevision ?? body.caseScope?.caseRevision,
      claimId: body.claimId ?? null,
      statement: body.statement || body.content,
      evidenceRefs: body.evidenceRefs,
      evidenceRevisionIds: body.evidenceRevisionIds,
      metadata: body.metadata,
      ocrText: body.ocrText,
      qrContent: body.qrContent,
      source: body.source,
      contributionType: body.contributionType,
      privacyConfirmed: body.privacyConfirmed,
      previewDigest: body.previewDigest,
      correlationId: securityContext.correlationId,
    });
    return NextResponse.json({ success: true, state: data.publicationState, post: data, historyPreserved: true, correlationId: securityContext.correlationId }, { status: 200 });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

async function readContributionRevisions(request, routeParams, principal, securityContext) {
  const params = await resolveRouteParams(routeParams);
  try {
    const revisions = await CommunityRepository.listContributionRevisions({ actorId: principal.subjectId, contributionId: contributionIdFromRequest(request, params) });
    return NextResponse.json({ success: true, revisions, historyPreserved: true, correlationId: securityContext.correlationId });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_COMMUNITY_CONTRIBUTION_REVISIONS", requiredPermission: "COMMUNITY.READ", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 0 }, readContributionRevisions);
export const PATCH = SecurityFabric.wrapHandler({ action: "EDIT_COMMUNITY_CONTRIBUTION", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 512 * 1024 }, editContribution);
