import { NextResponse } from "next/server";
import { AcademicNotificationRepository } from "@/lib/server/database/AcademicNotificationRepository.js";
import { DurableAcademicNotificationService } from "@/lib/intelligence/academic/durableAcademicNotificationService.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";

function studentIdFrom(principal) {
  return String(principal?.subjectId || "").replace(/^student:/, "").trim();
}

function invalidIdentityResponse() {
  return NextResponse.json(
    {
      success: false,
      error: {
        code: "DURABLE_IDENTITY_REQUIRED",
        userMessage: "Cần danh tính sinh viên hợp lệ.",
      },
    },
    { status: 422 },
  );
}

async function listNotifications(request, _routeParams, principal) {
  const studentId = studentIdFrom(principal);
  if (!studentId) return invalidIdentityResponse();

  const params = new URL(request.url).searchParams;
  const requestedStudentId = params.get("studentId");
  if (requestedStudentId && requestedStudentId !== studentId) {
    ObjectAuthorizer.assertAccess(principal, { studentId: requestedStudentId });
  }

  const repository = new AcademicNotificationRepository();
  const notifications = await repository.getNotificationsByStudent(studentId, {
    status: params.get("status") || null,
    unreadOnly: params.get("unreadOnly") === "true",
    excludeCancelled: true,
    limit: Math.min(100, Math.max(1, Number(params.get("limit") || 50))),
  });
  const unreadCount = await repository.countUnreadByStudent(studentId);

  return NextResponse.json({
    success: true,
    contractVersion: "notifications.v1",
    studentId,
    unreadCount,
    notifications,
  });
}

async function updateNotification(request, _routeParams, principal) {
  const studentId = studentIdFrom(principal);
  if (!studentId) return invalidIdentityResponse();

  const body = await request.json().catch(() => null);
  const action = body?.action;
  const notificationId = typeof body?.notificationId === "string" ? body.notificationId.trim() : "";
  const allowedActions = new Set(["MARK_READ", "ACKNOWLEDGE", "SNOOZE", "DISMISS"]);

  if (!notificationId) {
    return NextResponse.json(
      { success: false, error: { code: "NOTIFICATION_ID_REQUIRED", userMessage: "Thiếu notificationId." } },
      { status: 422 },
    );
  }
  if (!allowedActions.has(action)) {
    return NextResponse.json(
      { success: false, error: { code: "UNSUPPORTED_NOTIFICATION_ACTION", userMessage: "Thao tác thông báo không được hỗ trợ." } },
      { status: 422 },
    );
  }

  const repository = new AcademicNotificationRepository();
  const notificationService = new DurableAcademicNotificationService(repository);
  const existing = await repository.getNotificationById(notificationId, { ownerId: studentId });
  if (!existing) {
    return NextResponse.json(
      { success: false, error: { code: "NOTIFICATION_NOT_FOUND", userMessage: "Không tìm thấy thông báo." } },
      { status: 404 },
    );
  }
  if (existing.studentId !== "ALL" && existing.studentId !== studentId) {
    ObjectAuthorizer.assertAccess(principal, { studentId: existing.studentId });
  }

  const notification = await repository.updateNotificationById(notificationId, studentId, {
    action,
    snoozeHours: Math.min(168, Math.max(1, Number(body?.snoozeHours || 4))),
  });
  const unreadCount = await repository.countUnreadByStudent(studentId);

  return NextResponse.json({
    success: true,
    contractVersion: "notifications.v1",
    notification,
    unreadCount,
  });
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_CANONICAL_NOTIFICATIONS",
    requiredPermission: "ACADEMIC.READ_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: false,
    maxRequests: 60,
    maxBodyBytes: 0,
  },
  listNotifications,
);

export const POST = SecurityFabric.wrapHandler(
  {
    action: "UPDATE_CANONICAL_NOTIFICATION",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: false,
    maxRequests: 30,
    maxBodyBytes: 64 * 1024,
  },
  updateNotification,
);
