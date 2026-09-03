import { NextResponse } from "next/server";
import { AcademicNotificationStore } from "@/lib/intelligence/academic/academicNotificationStore.js";
import { AcademicNotificationOrchestrator } from "@/lib/intelligence/academic/academicNotificationOrchestrator.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";

function studentIdFrom(principal) { return String(principal?.subjectId || "").replace(/^student:/, "").trim(); }

async function listNotifications(request, routeParams, principal) {
  const studentId = studentIdFrom(principal);
  if (!studentId) return NextResponse.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", userMessage: "Cần danh tính sinh viên hợp lệ." } }, { status: 422 });
  const requested = new URL(request.url).searchParams.get("studentId");
  if (requested && requested !== studentId) ObjectAuthorizer.assertAccess(principal, { studentId: requested });
  const params = new URL(request.url).searchParams;
  const notifications = AcademicNotificationStore.getNotificationsByStudent(studentId, { status: params.get("status") || null, unreadOnly: params.get("unreadOnly") === "true", excludeCancelled: true, limit: Math.min(100, Math.max(1, Number(params.get("limit") || 50))) });
  return NextResponse.json({ success: true, contractVersion: "notifications.v1", studentId, unreadCount: AcademicNotificationStore.countUnreadByStudent(studentId), notifications });
}

async function updateNotification(request, routeParams, principal) {
  const studentId = studentIdFrom(principal);
  if (!studentId) return NextResponse.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", userMessage: "Cần danh tính sinh viên hợp lệ." } }, { status: 422 });
  const body = await request.json().catch(() => null);
  const action = body?.action;
  const notificationId = typeof body?.notificationId === "string" ? body.notificationId.trim() : "";
  if (!notificationId) return NextResponse.json({ success: false, error: { code: "NOTIFICATION_ID_REQUIRED", userMessage: "Thiếu notificationId." } }, { status: 422 });
  const notification = AcademicNotificationStore.getNotificationById(notificationId);
  if (!notification) return NextResponse.json({ success: false, error: { code: "NOTIFICATION_NOT_FOUND", userMessage: "Không tìm thấy thông báo." } }, { status: 404 });
  if (notification.studentId !== "ALL" && notification.studentId !== studentId) ObjectAuthorizer.assertAccess(principal, { studentId: notification.studentId });
  const handlers = { MARK_READ: () => AcademicNotificationOrchestrator.markAsRead(notificationId, studentId), ACKNOWLEDGE: () => AcademicNotificationOrchestrator.acknowledge(notificationId, studentId), SNOOZE: () => AcademicNotificationOrchestrator.snooze(notificationId, studentId, Math.min(168, Math.max(1, Number(body?.snoozeHours || 4)))), DISMISS: () => AcademicNotificationOrchestrator.dismiss(notificationId, studentId) };
  if (!handlers[action]) return NextResponse.json({ success: false, error: { code: "UNSUPPORTED_NOTIFICATION_ACTION", userMessage: "Thao tác thông báo không được hỗ trợ." } }, { status: 422 });
  const updated = handlers[action]();
  return NextResponse.json({ success: true, contractVersion: "notifications.v1", notification: updated, unreadCount: AcademicNotificationStore.countUnreadByStudent(studentId) });
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_CANONICAL_NOTIFICATIONS", requiredPermission: "ACADEMIC.READ_OWN", requiredScopes: ["academic:read"], allowAnonymous: false, maxRequests: 60, maxBodyBytes: 0 }, listNotifications);
export const POST = SecurityFabric.wrapHandler({ action: "UPDATE_CANONICAL_NOTIFICATION", requiredPermission: "ACADEMIC.PLAN_OWN", requiredScopes: ["academic:plan"], allowAnonymous: false, maxRequests: 30, maxBodyBytes: 64 * 1024 }, updateNotification);
