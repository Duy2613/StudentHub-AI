import { NextResponse } from "next/server";

import { AcademicTimetableService } from "@/lib/server/academic/AcademicTimetableService.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import {
  academicErrorResponse,
  authenticatedOwnerId,
  readJson,
  requestId,
  routeParams,
} from "@/lib/server/academic/academicApi.js";

async function updateEntry(request, routeContext, principal, securityContext) {
  try {
    const { entryId } = await routeParams(routeContext);
    const result = await new AcademicTimetableService().updateEntry(
      authenticatedOwnerId(principal),
      entryId,
      await readJson(request),
      { correlationId: requestId(request, securityContext) },
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

async function deleteEntry(request, routeContext, principal, securityContext) {
  try {
    const { entryId } = await routeParams(routeContext);
    const result = await new AcademicTimetableService().deleteEntry(
      authenticatedOwnerId(principal),
      entryId,
      { correlationId: requestId(request, securityContext) },
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

export const PATCH = SecurityFabric.wrapHandler({
  action: "UPDATE_OWN_ACADEMIC_ENTRY",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 90,
  maxBodyBytes: 64 * 1024,
}, updateEntry);

export const DELETE = SecurityFabric.wrapHandler({
  action: "DELETE_OWN_ACADEMIC_ENTRY",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 90,
  maxBodyBytes: 0,
}, deleteEntry);

