import { NextResponse } from "next/server";

import { AcademicTimetableService } from "@/lib/server/academic/AcademicTimetableService.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import {
  academicErrorResponse,
  authenticatedOwnerId,
  readJson,
  requestId,
} from "@/lib/server/academic/academicApi.js";

async function listReminders(request, _routeContext, principal, securityContext) {
  try {
    const { searchParams } = new URL(request.url);
    const timetableId = searchParams.get("timetableId") || null;
    const reminders = await new AcademicTimetableService().listReminders(authenticatedOwnerId(principal), timetableId);
    return NextResponse.json({ success: true, reminders });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

async function createReminder(request, _routeContext, principal, securityContext) {
  try {
    const reminder = await new AcademicTimetableService().createReminder(authenticatedOwnerId(principal), await readJson(request));
    return NextResponse.json({ success: true, reminder }, { status: 201 });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_OWN_ACADEMIC_REMINDERS",
  requiredPermission: "ACADEMIC.READ_OWN",
  requiredScopes: ["academic:read"],
  allowAnonymous: false,
  maxRequests: 90,
  maxBodyBytes: 0,
}, listReminders);

export const POST = SecurityFabric.wrapHandler({
  action: "CREATE_OWN_ACADEMIC_REMINDER",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 32 * 1024,
}, createReminder);

