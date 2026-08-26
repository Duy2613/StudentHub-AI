import { NextResponse } from "next/server";
import { AcademicNotificationStore } from "@/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationOrchestrator } from "@/lib/intelligence/academic/academicNotificationOrchestrator.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get("studentId") || "24110001";
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
    return NextResponse.json(
      { success: false, message: err.message || "Failed to fetch notifications." },
      { status: 400 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, notificationId, studentId = "24110001", snoozeHours = 4 } = body || {};

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
    const status = err.message.includes("FORBIDDEN") ? 403 : 400;
    return NextResponse.json(
      { success: false, message: err.message || "Failed to process notification action." },
      { status }
    );
  }
}
