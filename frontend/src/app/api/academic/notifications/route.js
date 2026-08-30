import { NextResponse } from "next/server";
import { AcademicNotificationStore } from "@/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationOrchestrator } from "@/lib/intelligence/academic/academicNotificationOrchestrator.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";

async function getNotifications(request, routeParams, principal) {
  try {
    const { searchParams } = new URL(request.url);
    const requestedStudentId = searchParams.get("studentId");
    const studentId = principal.subjectId.replace("student:", "").trim();
    if (requestedStudentId && requestedStudentId !== studentId) {
      ObjectAuthorizer.assertAccess(principal, { studentId: requestedStudentId });
    }
    const status = searchParams.get("status") || null;
    const unreadOnly = searchParams.get("unreadOnly") === "true";

    const notifications = AcademicNotificationStore.getNotificationsByStudent(studentId, {
      status,
      unreadOnly,
      excludeCancelled: true
    });

    const unreadCount = AcademicNotificationStore.countUnreadByStudent(studentId);

    return NextResponse.json({
      success: true,
      studentId,
      unreadCount,
      notifications
    });
  } catch (err) {
    if (err?.name === "SecurityError") throw err;
    return NextResponse.json(
      { success: false, message: "Không thể tải thông báo học vụ." },
      { status: 400 }
    );
  }
}

async function updateNotification(request, routeParams, principal) {
  try {
    const body = await request.json();
    const { action, notificationId, studentId: requestedStudentId, snoozeHours = 4 } = body || {};
    const studentId = principal.subjectId.replace("student:", "").trim();

    if (requestedStudentId && requestedStudentId !== studentId) {
      ObjectAuthorizer.assertAccess(principal, { studentId: requestedStudentId });
    }

    if (!notificationId) {
      return NextResponse.json(
        { success: false, message: "Missing required notificationId." },
        { status: 400 }
      );
    }

    let updatedNotification = null;

    switch (action) {
      case "MARK_READ":
        updatedNotification = AcademicNotificationOrchestrator.markAsRead(notificationId, studentId);
        break;

      case "ACKNOWLEDGE":
        updatedNotification = AcademicNotificationOrchestrator.acknowledge(notificationId, studentId);
        break;

      case "SNOOZE":
        updatedNotification = AcademicNotificationOrchestrator.snooze(notificationId, studentId, snoozeHours);
        break;

      case "DISMISS":
        updatedNotification = AcademicNotificationOrchestrator.dismiss(notificationId, studentId);
        break;

      default:
        return NextResponse.json(
          { success: false, message: `Unsupported action: ${action}` },
          { status: 400 }
        );
    }

    const unreadCount = AcademicNotificationStore.countUnreadByStudent(studentId);

    return NextResponse.json({
      success: true,
      notification: updatedNotification,
      unreadCount
    });
  } catch (err) {
    if (err?.name === "SecurityError") throw err;
    const status = err?.code === "FORBIDDEN" || err?.code === "OBJECT_NOT_OWNED" ? 403 : 400;
    return NextResponse.json(
      { success: false, message: "Không thể cập nhật thông báo học vụ." },
      { status }
    );
  }
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "READ_ACADEMIC_NOTIFICATIONS",
    requiredPermission: "ACADEMIC.READ_OWN",
    requiredScopes: ["academic:read"],
    allowAnonymous: false
  },
  getNotifications
);

export const POST = SecurityFabric.wrapHandler(
  {
    action: "UPDATE_ACADEMIC_NOTIFICATION",
    requiredPermission: "ACADEMIC.PLAN_OWN",
    requiredScopes: ["academic:plan"],
    allowAnonymous: false
  },
  updateNotification
);
