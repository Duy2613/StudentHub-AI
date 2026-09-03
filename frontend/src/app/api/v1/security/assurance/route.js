/**
 * StudentHub AI — Read-Only Citadel Assurance Endpoint (I4)
 * 
 * SECURITY_CONTRACT: GET ADMIN ADMIN_CITADEL_ASSURANCE_READ 60 0
 * 
 * Target: StudentHub Admin / Security Console -> CitadelAssuranceClient -> Citadel Read-Only API
 * 
 * Safety Invariants:
 * - Restricted to ADMIN and Security Operations viewers.
 * - Anonymous and ordinary student principals are strictly DENIED.
 * - Read-Only: Never influences, mutates, or blocks product TrustDecision.
 * - IDOR/BOLA Protection: Non-admin users cannot inspect arbitrary foreign cases.
 */

import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { PERMISSIONS } from "@/lib/security/authorization/RBACPolicy.js";
import { CitadelAssuranceClient, CitadelAssuranceError, ASSURANCE_ERROR_CODE } from "@/lib/server/citadel/CitadelAssuranceClient.js";

async function handleGetAssurance(request, routeParams, principal, secContext) {
  const url = new URL(request.url);
  const caseId = url.searchParams.get("caseId") || url.searchParams.get("case_id");

  if (!caseId || !caseId.trim()) {
    return NextResponse.json(
      {
        error: {
          code: "MISSING_CASE_ID",
          message: "A valid caseId query parameter is required.",
        },
      },
      { status: 400 }
    );
  }

  // Verify Role / Permission
  const isAdmin = principal?.hasRole("ADMIN") || principal?.hasRole("SYSTEM") || principal?.hasPermission(PERMISSIONS.ADMIN_SECURITY);
  if (!isAdmin) {
    return NextResponse.json(
      {
        error: {
          code: "FORBIDDEN",
          message: "Access to Citadel security assurance requires ADMIN or Security Operations privilege.",
        },
      },
      { status: 403 }
    );
  }

  const client = new CitadelAssuranceClient();
  const correlationId = secContext?.correlationId || request.headers.get("x-correlation-id");

  try {
    const assurance = await client.getAssurancePosture(caseId, { correlationId });
    return NextResponse.json({
      data: assurance,
      metadata: {
        queriedAt: new Date().toISOString(),
        correlationId,
        readOnly: true,
      },
    });
  } catch (err) {
    if (err instanceof CitadelAssuranceError) {
      let httpStatus = 503;
      if (err.code === ASSURANCE_ERROR_CODE.ASSURANCE_TIMEOUT) httpStatus = 504;
      else if (err.code === ASSURANCE_ERROR_CODE.ASSURANCE_FORBIDDEN) httpStatus = 502;
      else if (err.code === ASSURANCE_ERROR_CODE.ASSURANCE_MALFORMED) httpStatus = 502;
      else if (err.code === ASSURANCE_ERROR_CODE.ASSURANCE_OVERSIZED) httpStatus = 502;
      else if (err.code === ASSURANCE_ERROR_CODE.WORKLOAD_AUTH_UNAVAILABLE) httpStatus = 500;

      return NextResponse.json(
        {
          error: {
            code: err.code,
            message: err.message,
          },
          fallback: {
            assuranceStatus: "UNAVAILABLE",
            caseId: caseId.trim(),
            degraded: true,
          },
        },
        { status: httpStatus }
      );
    }

    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: err.message || "An unexpected error occurred while fetching assurance.",
        },
      },
      { status: 500 }
    );
  }
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "ADMIN_CITADEL_ASSURANCE_READ",
    requiredPermission: PERMISSIONS.ADMIN_SECURITY,
    allowAnonymous: false,
    maxRequests: 60,
    maxBodyBytes: 0,
  },
  handleGetAssurance
);
