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

async function updateTimetable(request, routeContext, principal, securityContext) {
  try {
    const { timetableId } = await routeParams(routeContext);
    const body = await readJson(request);
    const owner = authenticatedOwnerId(principal);
    const service = new AcademicTimetableService();
    const metadata = Object.prototype.hasOwnProperty.call(body, "name") || Object.prototype.hasOwnProperty.call(body, "academicTerm")
      ? { name: body.name, academicTerm: body.academicTerm }
      : null;
    const result = Array.isArray(body.entries)
      ? await service.replaceEntries(owner, timetableId, body.entries, {
        correlationId: requestId(request, securityContext),
        metadata,
      })
      : await service.updateTimetable(owner, timetableId, body, { correlationId: requestId(request, securityContext) });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

async function deleteTimetable(request, routeContext, principal, securityContext) {
  try {
    const { timetableId } = await routeParams(routeContext);
    const result = await new AcademicTimetableService().deleteTimetable(
      authenticatedOwnerId(principal),
      timetableId,
      { correlationId: requestId(request, securityContext) },
    );
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

export const PATCH = SecurityFabric.wrapHandler({
  action: "UPDATE_OWN_ACADEMIC_TIMETABLE",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 512 * 1024,
}, updateTimetable);

export const DELETE = SecurityFabric.wrapHandler({
  action: "DELETE_OWN_ACADEMIC_TIMETABLE",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 30,
  maxBodyBytes: 0,
}, deleteTimetable);
