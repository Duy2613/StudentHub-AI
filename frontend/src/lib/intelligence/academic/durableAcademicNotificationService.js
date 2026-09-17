/**
 * Server-owned academic notification orchestration.
 *
 * This adapter keeps the domain policy/state machine shared with the local
 * fixture implementation while making every production read/write go through
 * PostgreSQL. It deliberately has no dependency on AcademicNotificationStore.
 */

import { AcademicNotificationRepository } from "../../server/database/AcademicNotificationRepository.js";
import { AcademicDeadlineEngine } from "./academicDeadlineEngine.js";
import { AcademicReminderPolicy, DEFAULT_REMINDER_POLICY } from "./academicReminderPolicy.js";
import {
  AcademicNotificationModel,
  NOTIFICATION_TYPES,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_STATUSES
} from "./academicNotificationModel.js";
import { AcademicNotificationStateMachine, NOTIFICATION_COMMANDS } from "./academicNotificationStateMachine.js";
import { AcademicNotificationAuthorization } from "./academicNotificationAuthorization.js";

function requireStudentId(studentId) {
  const value = String(studentId || "").trim();
  if (!value) {
    const error = new Error("A durable student identity is required.");
    error.code = "DURABLE_IDENTITY_REQUIRED";
    error.statusCode = 422;
    throw error;
  }
  return value;
}

function getDeadline(task, insight = null, rule = null) {
  return task?.deadline || task?.dueAt || insight?.deadline || rule?.effectiveUntil || null;
}

export class DurableAcademicNotificationService {
  constructor(repository = new AcademicNotificationRepository()) {
    this.repository = repository;
  }

  async scheduleTaskReminders({
    task,
    insight = null,
    rule = null,
    clock = { now: () => Date.now() }
  } = {}) {
    const studentId = requireStudentId(task?.studentId);
    if (!task?.taskId) throw new Error("Cannot schedule reminders for invalid task.");
    if (["COMPLETED", "CANCELLED", "EXPIRED"].includes(task.status)) return [];

    const deadline = getDeadline(task, insight, rule);
    if (!deadline) return [];

    const schedules = AcademicReminderPolicy.computeSchedules(
      deadline,
      DEFAULT_REMINDER_POLICY,
      clock
    );
    const deadlineVersion = task.deadlineVersion || rule?.version || 1;
    const ruleVersion = rule?.version || 1;
    const createdNotifications = [];

    for (const schedule of schedules) {
      const dedupeKey = AcademicNotificationModel.deriveDedupeKey({
        studentId,
        taskId: task.taskId,
        type: schedule.type,
        deadlineVersion,
        reminderWindow: schedule.window
      });

      const existing = await this.repository.getNotificationByDedupeKey(dedupeKey, studentId);
      if (existing) {
        createdNotifications.push(existing);
        continue;
      }

      const humanRemaining = AcademicDeadlineEngine.computeTimeRemaining(
        deadline,
        { now: () => schedule.scheduledTimestamp }
      ).humanText;

      const notification = AcademicNotificationModel.createNotification({
        studentId,
        type: schedule.type,
        priority: schedule.priority,
        sourceType: "ACADEMIC_TASK",
        sourceId: task.planId || task.taskId,
        taskId: task.taskId,
        insightId: insight?.insightId || task.insightId,
        ruleId: rule?.ruleId || task.ruleId,
        ruleVersion,
        deadlineVersion,
        reminderWindow: schedule.window,
        title: `[Học Vụ] ${task.title}`,
        body: `Hạn chót: **${deadline}** (${humanRemaining}). Vui lòng kiểm tra và hoàn tất quy trình học vụ.`,
        actionLabel: "Tiếp tục quy trình",
        actionIntent: "VIEW_WORKFLOW",
        actionUrl: `/academic?taskId=${task.taskId}`,
        dueAt: schedule.dueAt,
        scheduledAt: schedule.scheduledAt,
        status: schedule.isPast ? NOTIFICATION_STATUSES.SENT : NOTIFICATION_STATUSES.SCHEDULED,
        channels: schedule.channels,
        metadata: {
          taskTitle: task.title,
          deadline,
          scheduledWindow: schedule.window
        }
      });

      createdNotifications.push(await this.repository.saveNotification(notification));
    }

    return createdNotifications;
  }

  async onTaskCompleted(taskId, studentId, clock = { now: () => Date.now() }) {
    const ownerId = requireStudentId(studentId);
    if (!taskId) return [];
    const relatedNotifications = await this.repository.getNotificationsByTask(taskId, ownerId);
    const cancelled = [];

    for (const notification of relatedNotifications) {
      if (![NOTIFICATION_STATUSES.SCHEDULED, NOTIFICATION_STATUSES.QUEUED].includes(notification.status)) {
        continue;
      }
      const updated = AcademicNotificationStateMachine.transition(
        notification,
        NOTIFICATION_COMMANDS.CANCEL,
        { clock, reason: "Task successfully completed before deadline" }
      );
      cancelled.push(await this.repository.saveNotification(updated));
    }

    return cancelled;
  }

  async onTaskBlocked({
    taskId,
    studentId,
    blockerReason,
    missingRequirements = []
  } = {}) {
    const ownerId = requireStudentId(studentId);
    if (!taskId) return null;
    const missingDescription = missingRequirements.length > 0
      ? ` Điều kiện thiếu: ${missingRequirements.join(", ")}.`
      : "";
    const notification = AcademicNotificationModel.createNotification({
      notificationId: `notif_task_blocked_${taskId}_${Date.now()}`,
      studentId: ownerId,
      type: NOTIFICATION_TYPES.TASK_BLOCKED,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      sourceType: "ACADEMIC_TASK",
      sourceId: taskId,
      taskId,
      title: "[Cần Xử Lý] Quy trình học vụ bị gián đoạn",
      body: `Quy trình bị chặn vì: **${blockerReason || "chưa đủ điều kiện"}**.${missingDescription} Vui lòng cập nhật hồ sơ để tiếp tục.`,
      actionLabel: "Xem nguyên nhân",
      actionIntent: "VIEW_WORKFLOW",
      status: NOTIFICATION_STATUSES.SENT,
      channels: ["IN_APP"],
      metadata: { blockerReason, missingRequirements }
    });
    return this.repository.saveNotification(notification);
  }

  async onDeadlineChanged({
    task,
    oldDeadline,
    newDeadline,
    newDeadlineVersion = 2,
    rule = null,
    clock = { now: () => Date.now() }
  } = {}) {
    const ownerId = requireStudentId(task?.studentId);
    if (!task?.taskId) throw new Error("Cannot reconcile deadline without task.");

    const existing = await this.repository.getNotificationsByTask(task.taskId, ownerId);
    const cancelled = [];
    for (const notification of existing) {
      if ([NOTIFICATION_STATUSES.CANCELLED, NOTIFICATION_STATUSES.ACKNOWLEDGED, NOTIFICATION_STATUSES.EXPIRED].includes(notification.status)) {
        continue;
      }
      const updated = AcademicNotificationStateMachine.transition(
        notification,
        NOTIFICATION_COMMANDS.CANCEL,
        { clock, reason: `Deadline rescheduled from ${oldDeadline} to ${newDeadline}` }
      );
      cancelled.push(await this.repository.saveNotification(updated));
    }

    const newlyScheduled = await this.scheduleTaskReminders({
      task: { ...task, dueAt: newDeadline, deadline: newDeadline, deadlineVersion: newDeadlineVersion },
      rule,
      clock
    });
    return { cancelled, newlyScheduled };
  }

  async #getOwnedNotification(notificationId, studentId) {
    const ownerId = requireStudentId(studentId);
    const notification = await this.repository.getNotificationById(notificationId, { ownerId });
    if (!notification) {
      const error = new Error("Notification not found.");
      error.code = "NOTIFICATION_NOT_FOUND";
      error.statusCode = 404;
      throw error;
    }
    AcademicNotificationAuthorization.assertNotificationAccess(ownerId, notification);
    return { ownerId, notification };
  }

  async markAsRead(notificationId, studentId, clock = { now: () => Date.now() }) {
    const { notification } = await this.#getOwnedNotification(notificationId, studentId);
    if ([NOTIFICATION_STATUSES.READ, NOTIFICATION_STATUSES.ACKNOWLEDGED].includes(notification.status)) {
      return notification;
    }
    return this.repository.saveNotification(
      AcademicNotificationStateMachine.transition(notification, NOTIFICATION_COMMANDS.MARK_READ, { clock })
    );
  }

  async acknowledge(notificationId, studentId, clock = { now: () => Date.now() }) {
    const { notification } = await this.#getOwnedNotification(notificationId, studentId);
    if (notification.status === NOTIFICATION_STATUSES.ACKNOWLEDGED) return notification;
    return this.repository.saveNotification(
      AcademicNotificationStateMachine.transition(notification, NOTIFICATION_COMMANDS.ACKNOWLEDGE, {
        clock,
        reason: "User acknowledged notification"
      })
    );
  }

  async snooze(notificationId, studentId, snoozeHours = 4, clock = { now: () => Date.now() }) {
    const { notification } = await this.#getOwnedNotification(notificationId, studentId);
    return this.repository.saveNotification(
      AcademicNotificationStateMachine.transition(notification, NOTIFICATION_COMMANDS.SNOOZE, {
        clock,
        snoozeHours
      })
    );
  }

  async dismiss(notificationId, studentId, clock = { now: () => Date.now() }) {
    const { notification } = await this.#getOwnedNotification(notificationId, studentId);
    return this.repository.saveNotification(
      AcademicNotificationStateMachine.transition(notification, NOTIFICATION_COMMANDS.CANCEL, {
        clock,
        reason: "User dismissed notification"
      })
    );
  }
}

