import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { TrustPersistenceService } from "@/lib/server/database/TrustPersistenceService.js";

export const runtime = "nodejs";

function principalUserId(principal) {
  const value = String(principal?.subjectId || "").replace(/^(student|expert|user):/, "");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ? value : null;
}

async function handleListCases(request, routeParams, principal) {
  const ownerId = principalUserId(principal);
  if (!ownerId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Authenticated user identity required to view cases." } },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get("limit") || "20", 10);
  const offset = parseInt(searchParams.get("offset") || "0", 10);

  try {
    const cases = await TrustPersistenceService.listCasesForOwner(ownerId, { limit, offset });
    return NextResponse.json({
      success: true,
      cases,
      pagination: { limit, offset, count: cases.length },
    });
  } catch (err) {
    console.error("[TrustCasesAPI] Error listing cases:", err.message);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Could not retrieve trust cases." } },
      { status: 500 }
    );
  }
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_TRUST_CASE_HISTORY",
    allowAnonymous: false,
  },
  handleListCases
);
