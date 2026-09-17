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

async function confirmTimetable(request, _routeContext, principal, securityContext) {
  try {
    const body = await readJson(request);
    const result = await new AcademicTimetableService().confirmDraft(authenticatedOwnerId(principal), body, {
      idempotencyKey: idempotencyKey(request, body),
      correlationId: requestId(request, securityContext),
    });
    return NextResponse.json({ success: true, ...result }, { status: result.idempotent ? 200 : 201 });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "CONFIRM_OWN_ACADEMIC_TIMETABLE",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 30,
  maxBodyBytes: 512 * 1024,
}, confirmTimetable);

