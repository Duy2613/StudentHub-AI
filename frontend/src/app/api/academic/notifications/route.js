import { NextResponse } from "next/server";

import { AcademicNotificationRepository } from "@/lib/server/database/AcademicNotificationRepository.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import {
  academicErrorResponse,
  authenticatedOwnerId,
  readJson,
  requestId,
} from "@/lib/server/academic/academicApi.js";

async function getNotifications(request, _routeContext, principal, securityContext) {
  try {
    const owner = authenticatedOwnerId(principal);
    const { searchParams } = new URL(request.url);
    const repository = new AcademicNotificationRepository();
    const notifications = await repository.getNotificationsByStudent(owner, {
      status: searchParams.get("status") || null,
      unreadOnly: searchParams.get("unreadOnly") === "true",
      excludeCancelled: true,
    });
    const unreadCount = await repository.countUnreadByStudent(owner);
    return NextResponse.json({ success: true, studentId: owner, unreadCount, notifications });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

async function updateNotification(request, _routeContext, principal, securityContext) {
  try {
    const body = await readJson(request);
    const repository = new AcademicNotificationRepository();
    const owner = authenticatedOwnerId(principal);
    const notification = await repository.updateNotificationById(body.notificationId, owner, {
      action: body.action,
      snoozeHours: body.snoozeHours,
    });
    const unreadCount = await repository.countUnreadByStudent(owner);
    return NextResponse.json({ success: true, notification, unreadCount });
  } catch (error) {
    return academicErrorResponse(error, requestId(request, securityContext));
  }
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_ACADEMIC_NOTIFICATIONS",
  requiredPermission: "ACADEMIC.READ_OWN",
  requiredScopes: ["academic:read"],
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 0,
}, getNotifications);

export const POST = SecurityFabric.wrapHandler({
  action: "UPDATE_ACADEMIC_NOTIFICATION",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:plan"],
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 32 * 1024,
}, updateNotification);

