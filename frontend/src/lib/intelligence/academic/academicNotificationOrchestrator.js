/**
 * StudentHub AI — Academic Notification Orchestrator V1
 * 
 * Master coordinator for academic notifications:
 * - Bridges Domain Events ➔ Deadline Intelligence ➔ Reminder Policy ➔ Notification Store.
 * - Enforces invariant: Task COMPLETED ➔ Auto-Cancel all pending reminders.
 * - Enforces invariant: Deadline Changed (30/08 ➔ 05/09) ➔ Cancel old schedule, generate new.
 * - Enforces invariant: Digital Twin Updated ➔ Reconcile & Cancel obsolete.
 * - Handles user actions (Read, Acknowledge, Snooze, Dismiss).
 */

import { AcademicDeadlineEngine } from "./academicDeadlineEngine.js";
import { AcademicReminderPolicy, DEFAULT_REMINDER_POLICY } from "./academicReminderPolicy.js";
import { AcademicNotificationModel, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES, NOTIFICATION_STATUSES } from "./academicNotificationModel.js";
import { AcademicNotificationStateMachine, NOTIFICATION_COMMANDS } from "./academicNotificationStateMachine.js";
import { AcademicNotificationStore } from "./academicNotificationStore.js";
import { AcademicNotificationAuthorization } from "./academicNotificationAuthorization.js";

export class AcademicNotificationOrchestrator {
  /**
   * Schedules automated deadline reminders for an academic task
   * @param {object} params
   * @param {object} params.task
   * @param {object} [params.insight]
   * @param {object} [params.rule]
   * @param {object} [params.clock]
   * @returns {Array<object>} Scheduled notifications
   */
  static scheduleTaskReminders({
    task,
    insight = null,
    rule = null,
    clock = { now: () => Date.now() }
  }) {
    if (!task || !task.taskId || !task.studentId) {
      throw new Error("Cannot schedule reminders for invalid task.");
    }

    if (task.status === "COMPLETED" || task.status === "CANCELLED" || task.status === "EXPIRED") {
      return [];
    }

    const deadline = task.deadline || insight?.deadline || rule?.effectiveUntil;
    if (!deadline) return [];

    const schedules = AcademicReminderPolicy.computeSchedules(deadline, DEFAULT_REMINDER_POLICY, clock);
    const deadlineVersion = task.deadlineVersion || rule?.version || 1;
    const ruleVersion = rule?.version || 1;
    const createdNotifications = [];

    for (const schedule of schedules) {
      const dedupeKey = AcademicNotificationModel.deriveDedupeKey({
        studentId: task.studentId,
        taskId: task.taskId,
        type: schedule.type,
        deadlineVersion,
        reminderWindow: schedule.window
      });

      // Idempotency: skip if already created
      const existing = AcademicNotificationStore.getNotificationByDedupeKey(dedupeKey);
      if (existing) {
        createdNotifications.push(existing);
        continue;
      }

      const humanRemaining = AcademicDeadlineEngine.computeTimeRemaining(deadline, { now: () => schedule.scheduledTimestamp }).humanText;

      const title = `[Học Vụ] ${task.title}`;
      const body = `Hạn chót: **${deadline}** (${humanRemaining}). Vui lòng kiểm tra và hoàn tất quy trình học vụ.`;

      const notification = AcademicNotificationModel.createNotification({
        studentId: task.studentId,
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
        title,
        body,
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

      const saved = AcademicNotificationStore.saveNotification(notification);
      createdNotifications.push(saved);
    }

    return createdNotifications;
  }

  /**
   * Event Handler: Task COMPLETED ➔ Auto-Cancel all pending reminders
   * @param {string} taskId 
   * @param {string} studentId 
   * @param {object} [clock]
   * @returns {Array<object>} Cancelled notifications
   */
  static onTaskCompleted(taskId, studentId, clock = { now: () => Date.now() }) {
    if (!taskId) return [];

    const relatedNotifications = AcademicNotificationStore.getNotificationsByTask(taskId);
    const cancelled = [];

    for (const notif of relatedNotifications) {
      if (studentId && notif.studentId !== studentId && notif.studentId !== "ALL") {
        continue;
      }

      if (notif.status === NOTIFICATION_STATUSES.SCHEDULED || notif.status === NOTIFICATION_STATUSES.QUEUED) {
        const updated = AcademicNotificationStateMachine.transition(
          notif,
          NOTIFICATION_COMMANDS.CANCEL,
          { clock, reason: "Task successfully completed before deadline" }
        );
        const saved = AcademicNotificationStore.saveNotification(updated);
        cancelled.push(saved);
      }
    }

    return cancelled;
  }

  /**
   * Event Handler: Task BLOCKED ➔ Schedule immediate unblock guidance notification
   * @param {object} params
   * @returns {object}
   */
  static onTaskBlocked({
    taskId,
    studentId,
    blockerReason,
    missingRequirements = [],
    clock = { now: () => Date.now() }
  }) {
    if (!taskId || !studentId) return null;

    const dedupeKey = `dedupe_${studentId}_${taskId}_TASK_BLOCKED_${Date.now()}`;
    const missingDesc = missingRequirements.length > 0
      ? ` Điều kiện thiếu: ${missingRequirements.join(", ")}.`
      : "";

    const notification = AcademicNotificationModel.createNotification({
      studentId,
      type: NOTIFICATION_TYPES.TASK_BLOCKED,
      priority: NOTIFICATION_PRIORITIES.HIGH,
      sourceType: "ACADEMIC_TASK",
      sourceId: taskId,
      taskId,
      title: "[Cần Xử Lý] Quy trình học vụ bị gián đoạn",
      body: `Quy trình bị chặn vì: **${blockerReason}**.${missingDesc} Vui lòng cập nhật hồ sơ để tiếp tục.`,
      actionLabel: "Xem nguyên nhân",
      actionIntent: "VIEW_WORKFLOW",
      status: NOTIFICATION_STATUSES.SENT,
      channels: ["IN_APP"],
      metadata: { blockerReason, missingRequirements }
    });

    return AcademicNotificationStore.saveNotification(notification);
  }

  /**
   * Event Handler: Deadline Changed (e.g. 30/08 ➔ 05/09)
   * Cancels old pending notifications and schedules the new reminder timeline.
   * @param {object} params
   * @returns {object} { cancelled: [], newlyScheduled: [] }
   */
  static onDeadlineChanged({
    task,
    oldDeadline,
    newDeadline,
    newDeadlineVersion = 2,
    rule = null,
    clock = { now: () => Date.now() }
  }) {
    if (!task || !task.taskId) {
      throw new Error("Cannot reconcile deadline without task.");
    }

    // 1. Cancel all existing pending / unacknowledged notifications for this task
    const existing = AcademicNotificationStore.getNotificationsByTask(task.taskId);
    const cancelled = [];

    for (const notif of existing) {
      if (notif.status !== NOTIFICATION_STATUSES.CANCELLED && notif.status !== NOTIFICATION_STATUSES.ACKNOWLEDGED && notif.status !== NOTIFICATION_STATUSES.EXPIRED) {
        const updated = AcademicNotificationStateMachine.transition(
          notif,
          NOTIFICATION_COMMANDS.CANCEL,
          { clock, reason: `Deadline rescheduled from ${oldDeadline} to ${newDeadline}` }
        );
        cancelled.push(AcademicNotificationStore.saveNotification(updated));
      }
    }

    // 2. Schedule new reminders with updated deadline version
    const updatedTask = {
      ...task,
      deadline: newDeadline,
      deadlineVersion: newDeadlineVersion
    };

    const newlyScheduled = this.scheduleTaskReminders({
      task: updatedTask,
      rule,
      clock
    });

    return {
      cancelled,
      newlyScheduled
    };
  }

  /**
   * User Mutation: Mark notification as read
   * @param {string} notificationId 
   * @param {string} studentId 
   * @param {object} [clock]
   * @returns {object}
   */
  static markAsRead(notificationId, studentId, clock = { now: () => Date.now() }) {
    const notif = AcademicNotificationStore.getNotificationById(notificationId);
    if (!notif) throw new Error("Notification not found.");

    AcademicNotificationAuthorization.assertNotificationAccess(studentId, notif);

    if (notif.status === NOTIFICATION_STATUSES.READ || notif.status === NOTIFICATION_STATUSES.ACKNOWLEDGED) {
      return notif; // Already read or acknowledged
    }

    const updated = AcademicNotificationStateMachine.transition(
      notif,
      NOTIFICATION_COMMANDS.MARK_READ,
      { clock }
    );

    return AcademicNotificationStore.saveNotification(updated);
  }

  /**
   * User Mutation: Acknowledge notification
   * @param {string} notificationId 
   * @param {string} studentId 
   * @param {object} [clock]
   * @returns {object}
   */
  static acknowledge(notificationId, studentId, clock = { now: () => Date.now() }) {
    const notif = AcademicNotificationStore.getNotificationById(notificationId);
    if (!notif) throw new Error("Notification not found.");

    AcademicNotificationAuthorization.assertNotificationAccess(studentId, notif);

    if (notif.status === NOTIFICATION_STATUSES.ACKNOWLEDGED) {
      return notif;
    }

    const updated = AcademicNotificationStateMachine.transition(
      notif,
      NOTIFICATION_COMMANDS.ACKNOWLEDGE,
      { clock, reason: "User acknowledged notification" }
    );

    return AcademicNotificationStore.saveNotification(updated);
  }

  /**
   * User Mutation: Snooze notification for X hours
   * @param {string} notificationId 
   * @param {string} studentId 
   * @param {number} [snoozeHours] 
   * @param {object} [clock]
   * @returns {object}
   */
  static snooze(notificationId, studentId, snoozeHours = 4, clock = { now: () => Date.now() }) {
    const notif = AcademicNotificationStore.getNotificationById(notificationId);
    if (!notif) throw new Error("Notification not found.");

    AcademicNotificationAuthorization.assertNotificationAccess(studentId, notif);

    const updated = AcademicNotificationStateMachine.transition(
      notif,
      NOTIFICATION_COMMANDS.SNOOZE,
      { clock, snoozeHours }
    );

    return AcademicNotificationStore.saveNotification(updated);
  }

  /**
   * User Mutation: Dismiss / Cancel notification
   * @param {string} notificationId 
   * @param {string} studentId 
   * @param {object} [clock]
   * @returns {object}
   */
  static dismiss(notificationId, studentId, clock = { now: () => Date.now() }) {
    const notif = AcademicNotificationStore.getNotificationById(notificationId);
    if (!notif) throw new Error("Notification not found.");

    AcademicNotificationAuthorization.assertNotificationAccess(studentId, notif);

    const updated = AcademicNotificationStateMachine.transition(
      notif,
      NOTIFICATION_COMMANDS.CANCEL,
      { clock, reason: "User dismissed notification" }
    );

    return AcademicNotificationStore.saveNotification(updated);
  }
}
