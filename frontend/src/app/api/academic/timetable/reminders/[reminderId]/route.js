import { NextResponse } from "next/server";

import { AcademicTimetableService } from "@/lib/server/academic/AcademicTimetableService.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import {
  academicErrorResponse,
  authenticatedOwnerId,
  requestId,
  routeParams,
} from "@/lib/server/academic/academicApi.js";

async function deleteReminder(request, routeContext, principal, securityContext) {
  try {
    const { reminderId } = await routeParams(routeContext);
    const reminder = await new AcademicTimetableService().deleteReminder(authenticatedOwnerId(principal), reminderId);
    return NextResponse.json({ success: true, reminder });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

export const DELETE = SecurityFabric.wrapHandler({
  action: "DELETE_OWN_ACADEMIC_REMINDER",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 0,
}, deleteReminder);

