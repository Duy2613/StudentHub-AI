import { NextResponse } from "next/server";

import { AcademicTimetableService } from "@/lib/server/academic/AcademicTimetableService.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import {
  academicErrorResponse,
  authenticatedOwnerId,
  idempotencyKey,
  readJson,
  requestId,
} from "@/lib/server/academic/academicApi.js";

async function getWorkspace(request, _routeContext, principal, securityContext) {
  try {
    const owner = authenticatedOwnerId(principal);
    const { searchParams } = new URL(request.url);
    const timeZone = String(searchParams.get("timeZone") || "Asia/Ho_Chi_Minh").slice(0, 80);
    const workspace = await new AcademicTimetableService().getWorkspace(owner, { timeZone });
    return NextResponse.json(workspace, { headers: { "cache-control": "private, no-store" } });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

async function createManualTimetable(request, _routeContext, principal, securityContext) {
  try {
    const owner = authenticatedOwnerId(principal);
    const body = await readJson(request);
    const result = await new AcademicTimetableService().createManual(owner, body, {
      idempotencyKey: idempotencyKey(request, body),
      correlationId: requestId(request, securityContext),
    });
    return NextResponse.json({ success: true, ...result }, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_OWN_ACADEMIC_TIMETABLE",
  requiredPermission: "ACADEMIC.READ_OWN",
  requiredScopes: ["academic:read"],
  allowAnonymous: false,
  maxRequests: 90,
  maxBodyBytes: 0,
}, getWorkspace);

export const POST = SecurityFabric.wrapHandler({
  action: "CREATE_OWN_ACADEMIC_TIMETABLE",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 30,
  maxBodyBytes: 512 * 1024,
}, createManualTimetable);

