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
      { status: 401 }
    );
  }

  const caseId = routeParams?.caseId;
  if (!caseId) {
    return NextResponse.json(
      { success: false, error: { code: "BAD_REQUEST", message: "caseId is required." } },
      { status: 400 }
    );
  }

  try {
    const caseRecord = await TrustPersistenceService.getCaseForOwner(caseId, ownerId);
    if (!caseRecord) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_FOUND", message: "Trust case not found or access denied." } },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      case: caseRecord,
    });
  } catch (err) {
    console.error("[TrustCaseDetailAPI] Error retrieving case:", err.message);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Could not retrieve trust case." } },
      { status: 500 }
    );
  }
}

export const GET = SecurityFabric.wrapApiHandler(handleGetCase, {
  resource: "TRUST_CASE_DETAIL",
  action: "READ",
  allowAnonymous: false,
});
