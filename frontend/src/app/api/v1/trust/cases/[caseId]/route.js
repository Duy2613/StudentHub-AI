import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { TrustPersistenceService } from "@/lib/server/database/TrustPersistenceService.js";

export const runtime = "nodejs";

function principalUserId(principal) {
  const value = String(principal?.subjectId || "").replace(/^(student|expert|user):/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

async function handleGetCase(request, routeParams, principal) {
  const ownerId = principalUserId(principal);
  if (!ownerId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authenticated user identity required." } },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const params = await (routeParams?.params || routeParams || {});
  const caseId = params?.caseId;
  if (!caseId) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "caseId is required." } },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  const searchParams = new URL(request.url).searchParams;
  const revisionText = searchParams.get("caseRevision") || searchParams.get("revision");
  const requestedRevision = revisionText === null ? null : Number(revisionText);
  if (requestedRevision !== null && (!Number.isSafeInteger(requestedRevision) || requestedRevision < 1)) {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_CASE_REVISION", message: "caseRevision must be a positive integer." } },
      { status: 400, headers: { "Cache-Control": "private, no-store" } }
    );
  }

  try {
    const caseRecord = await TrustPersistenceService.getCaseForOwner(caseId, ownerId, requestedRevision);
    if (!caseRecord) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Trust case not found or access denied." } },
        { status: 404, headers: { "Cache-Control": "private, no-store" } }
      );
    }

    return NextResponse.json({
      success: true,
      case: caseRecord,
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (err) {
    console.error("[TrustCaseDetailAPI] Error retrieving case:", { code: /^[A-Z0-9_]{1,80}$/.test(String(err?.code || "")) ? err.code : "STORAGE_UNAVAILABLE" });
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Could not retrieve trust case." } },
      { status: 500, headers: { "Cache-Control": "private, no-store" } }
    );
  }
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_TRUST_CASE_DETAIL",
    allowAnonymous: false,
  },
  handleGetCase
);
