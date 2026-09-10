import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { TrustPersistenceService } from "@/lib/server/database/TrustPersistenceService.js";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { isCanonicalUuid } from "@/lib/server/database/CommunityExpertScope.js";

export const runtime = "nodejs";

function principalUserId(principal) {
  const value = String(principal?.subjectId || "").replace(/^(student|expert|user):/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

async function readCommunitySignals(request, routeParams, principal, securityContext) {
  const ownerId = principalUserId(principal);
  const params = await routeParams?.params || {};
  const caseId = params?.caseId;
  const { searchParams } = new URL(request.url);
  const caseRevision = Number(searchParams.get("caseRevision"));
  const claimId = searchParams.get("claimId") || null;
  if (!ownerId || !isCanonicalUuid(caseId) || !Number.isInteger(caseRevision) || caseRevision < 1 || (claimId && !isCanonicalUuid(claimId))) {
    return NextResponse.json({ success: false, error: { code: "TRUST_SIGNAL_SCOPE_REQUIRED", userMessage: "caseId and caseRevision are required.", correlationId: securityContext.correlationId } }, { status: 400 });
  }
  try {
    const caseRecord = await TrustPersistenceService.getCaseForOwner(caseId, ownerId);
    if (!caseRecord) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", userMessage: "Trust case not found or access denied.", correlationId: securityContext.correlationId } }, { status: 404 });
    const signals = await CommunityRepository.listEvidenceSignalsForTrust({ caseId, caseRevision, claimId, limit: Number(searchParams.get("limit") || 100) });
    return NextResponse.json({
      success: true,
      contractVersion: "trust-community-signals.promax.v1",
      caseScope: { caseId, caseRevision, claimId },
      signals,
      authority: "NON_AUTHORITATIVE",
      trustVerdictMutation: false,
      correlationId: securityContext.correlationId,
    });
  } catch (error) {
    if (error instanceof CommunityRepositoryError) return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId: securityContext.correlationId } }, { status: error.statusCode });
    if (["42P01", "42703", "3F000"].includes(error?.code)) return NextResponse.json({ success: false, error: { code: "PROMAX_MIGRATION_REQUIRED", userMessage: "Community signal storage is not available in this environment.", correlationId: securityContext.correlationId } }, { status: 503 });
    return NextResponse.json({ success: false, error: { code: "TRUST_SIGNAL_STORAGE_UNAVAILABLE", userMessage: "Community signals are temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_TRUST_COMMUNITY_SIGNALS", requiredPermission: "TRUST.READ", allowAnonymous: false, maxRequests: 90, maxBodyBytes: 0 }, readCommunitySignals);
