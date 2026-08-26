/**
 * StudentHub AI — Academic Notification Domain Model V1
 * 
 * Authoritative schema, deterministic deduplication key generation,
 * and immutable entity factory for academic notifications.
 */

import crypto from "node:crypto";

export const NOTIFICATION_TYPES = Object.freeze({
  DEADLINE_UPCOMING: "DEADLINE_UPCOMING",
  DEADLINE_SOON: "DEADLINE_SOON",
  DEADLINE_TOMORROW: "DEADLINE_TOMORROW",
  DEADLINE_TODAY: "DEADLINE_TODAY",
  TASK_OVERDUE: "TASK_OVERDUE",
  TASK_BLOCKED: "TASK_BLOCKED",
  VERIFICATION_PENDING: "VERIFICATION_PENDING",
  TASK_COMPLETED: "TASK_COMPLETED",
  ACADEMIC_CHANGE: "ACADEMIC_CHANGE",
  RULE_UPDATED: "RULE_UPDATED",
  SOURCE_STALE: "SOURCE_STALE"
});

export const NOTIFICATION_PRIORITIES = Object.freeze({
  CRITICAL: "CRITICAL",
  HIGH: "HIGH",
  MEDIUM: "MEDIUM",
  LOW: "LOW"
});

export const NOTIFICATION_STATUSES = Object.freeze({
  SCHEDULED: "SCHEDULED",
  QUEUED: "QUEUED",
  SENT: "SENT",
  READ: "READ",
  ACKNOWLEDGED: "ACKNOWLEDGED",
  CANCELLED: "CANCELLED",
  EXPIRED: "EXPIRED",
  FAILED: "FAILED"
});

export class AcademicNotificationModel {
  /**
   * Computes a deterministic deduplication key to guarantee idempotency
   * @param {object} params
   * @returns {string}
   */
  static deriveDedupeKey({
    studentId,
    taskId = "GLOBAL",
    type,
    deadlineVersion = 1,
    reminderWindow = "DEFAULT"
  }) {
    if (!studentId || !type) {
      throw new Error("Cannot derive dedupe key without studentId and notification type.");
    }
    return `dedupe_${studentId}_${taskId}_${type}_v${deadlineVersion}_${reminderWindow}`;
  }

  /**
   * Derives a deterministic notification ID
   * @param {object} params
   * @returns {string}
   */
  static deriveNotificationId({
    studentId,
    taskId = "GLOBAL",
    type,
    deadlineVersion = 1,
    reminderWindow = "DEFAULT"
  }) {
    const raw = `${studentId}:${taskId}:${type}:v${deadlineVersion}:${reminderWindow}`;
    const hash = crypto.createHash("sha256").update(raw).digest("hex").slice(0, 16);
    return `notif_${type.toLowerCase()}_${hash}`;
  }

  /**
   * Creates a canonical, validated AcademicNotification object
   * @param {object} params
   * @returns {object}
   */
  static createNotification({
    notificationId = null,
    studentId,
    type,
    priority = NOTIFICATION_PRIORITIES.MEDIUM,
    sourceType = "ACADEMIC_TASK",
    sourceId = null,
    taskId = null,
    insightId = null,
    ruleId = null,
    ruleVersion = 1,
    deadlineVersion = 1,
    reminderWindow = "DEFAULT",
    title,
    body,
    actionLabel = "Xem chi tiết",
    actionIntent = "VIEW_WORKFLOW",
    actionUrl = null,
    dueAt = null,
    scheduledAt = null,
    expiresAt = null,
    status = NOTIFICATION_STATUSES.SCHEDULED,
    channels = ["IN_APP"],
    metadata = {}
  }) {
    if (!studentId) throw new Error("AcademicNotification requires studentId.");
    if (!type || !NOTIFICATION_TYPES[type]) {
      throw new Error(`Invalid or missing notification type: ${type}`);
    }
    if (!title || typeof title !== "string") {
      throw new Error("AcademicNotification requires a title.");
    }
    if (!body || typeof body !== "string") {
      throw new Error("AcademicNotification requires a body.");
    }

    const dedupeKey = this.deriveDedupeKey({
      studentId,
      taskId: taskId || "GLOBAL",
      type,
      deadlineVersion,
      reminderWindow
    });

    const finalId = notificationId || this.deriveNotificationId({
      studentId,
      taskId: taskId || "GLOBAL",
      type,
      deadlineVersion,
      reminderWindow
    });

    const now = new Date().toISOString();

    return Object.freeze({
      notificationId: finalId,
      studentId,
      type,
      priority: NOTIFICATION_PRIORITIES[priority] ? priority : NOTIFICATION_PRIORITIES.MEDIUM,
      sourceType,
      sourceId,
      taskId,
      insightId,
      ruleId,
      ruleVersion,
      deadlineVersion,
      reminderWindow,
      dedupeKey,
      title: title.trim(),
      body: body.trim(),
      actionLabel: actionLabel.trim(),
      actionIntent,
      actionUrl: actionUrl || (taskId ? `/academic?taskId=${taskId}` : "/academic"),
      dueAt,
      scheduledAt: scheduledAt || now,
      expiresAt: expiresAt || null,
      createdAt: now,
      sentAt: status === NOTIFICATION_STATUSES.SENT ? now : null,
      readAt: null,
      acknowledgedAt: null,
      status: NOTIFICATION_STATUSES[status] ? status : NOTIFICATION_STATUSES.SCHEDULED,
      channels: Array.isArray(channels) ? [...channels] : ["IN_APP"],
      metadata: { ...metadata },
      history: [
        {
          event: "NOTIFICATION_CREATED",
          status: status || NOTIFICATION_STATUSES.SCHEDULED,
          timestamp: now
        }
      ],
      revision: 1
    });
  }

  /**
   * Defensive clone of an AcademicNotification
   * @param {object} notification 
   * @returns {object}
   */
  static clone(notification) {
    if (!notification || typeof notification !== "object") return null;
    return JSON.parse(JSON.stringify(notification));
  }
}
