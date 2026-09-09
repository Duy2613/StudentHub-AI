import { NextResponse } from "next/server";
import { CommunityRepository, CommunityRepositoryError } from "@/lib/server/database/CommunityRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { isCanonicalUuid } from "@/lib/server/database/CommunityExpertScope.js";

function userIdFromPrincipal(principal) {
  const value = String(principal?.subjectId || "").replace(/^(?:student|expert|user):/i, "");
  return isCanonicalUuid(value) ? value.toLowerCase() : null;
}

async function readTrackRecord(_request, _routeParams, principal, securityContext) {
  const userId = userIdFromPrincipal(principal);
  if (!userId) {
    return NextResponse.json({ success: false, error: { code: "AUTHENTICATION_REQUIRED", userMessage: "A durable account is required to read the contributor track record.", correlationId: securityContext.correlationId } }, { status: 401 });
  }
  try {
    return NextResponse.json({
      success: true,
      contractVersion: "community-track-record.promax.v1",
      data: await CommunityRepository.getContributorTrackRecord(userId),
      authority: "NON_AUTHORITATIVE",
      trustVerdictMutation: false,
      meta: { correlationId: securityContext.correlationId },
    });
  } catch (error) {
    if (error instanceof CommunityRepositoryError) {
      return NextResponse.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId: securityContext.correlationId } }, { status: error.statusCode });
    }
    if (["42P01", "42703", "3F000"].includes(error?.code)) {
      return NextResponse.json({ success: false, error: { code: "PROMAX_MIGRATION_REQUIRED", userMessage: "Community track record storage is not available in this environment yet.", correlationId: securityContext.correlationId } }, { status: 503 });
    }
    return NextResponse.json({ success: false, error: { code: "COMMUNITY_TRACK_RECORD_UNAVAILABLE", userMessage: "The contributor track record is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_COMMUNITY_TRACK_RECORD",
      requiredPermission: "COMMUNITY.READ",
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 0,
}, readTrackRecord);
