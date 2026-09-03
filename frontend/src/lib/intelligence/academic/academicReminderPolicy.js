/**
 * StudentHub AI — Academic Reminder Policy V1
 * 
 * Centralized, configurable reminder scheduling policies.
 * Defines standard reminder windows, priority mappings, and channel allocations.
 */

import { AcademicDeadlineEngine } from "./academicDeadlineEngine.js";
import { AcademicClock } from "./academicClock.js";

export const REMINDER_WINDOWS = Object.freeze({
  WINDOW_7_DAYS: "WINDOW_7_DAYS",
  WINDOW_3_DAYS: "WINDOW_3_DAYS",
  WINDOW_1_DAY: "WINDOW_1_DAY",
  WINDOW_DAY_OF: "WINDOW_DAY_OF",
  WINDOW_OVERDUE: "WINDOW_OVERDUE"
});

export const NOTIFICATION_CHANNELS = Object.freeze({
  IN_APP: "IN_APP",
  EMAIL: "EMAIL",
  PUSH: "PUSH"
});

export const DEFAULT_REMINDER_POLICY = Object.freeze({
  enabled: true,
  cooldownMs: 4 * 60 * 60 * 1000, // 4 hours minimum between repeated reminders
  maxAttempts: 3,
  windows: [
    {
      window: REMINDER_WINDOWS.WINDOW_7_DAYS,
      offsetMs: -7 * 24 * 60 * 60 * 1000,
      priority: "MEDIUM",
      type: "DEADLINE_UPCOMING",
      channels: [NOTIFICATION_CHANNELS.IN_APP]
    },
    {
      window: REMINDER_WINDOWS.WINDOW_3_DAYS,
      offsetMs: -3 * 24 * 60 * 60 * 1000,
      priority: "HIGH",
      type: "DEADLINE_SOON",
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
    },
    {
      window: REMINDER_WINDOWS.WINDOW_1_DAY,
      offsetMs: -1 * 24 * 60 * 60 * 1000,
      priority: "HIGH",
      type: "DEADLINE_TOMORROW",
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL, NOTIFICATION_CHANNELS.PUSH]
    },
    {
      window: REMINDER_WINDOWS.WINDOW_DAY_OF,
      offsetMs: -12 * 60 * 60 * 1000, // 12 hours before end of deadline
      priority: "CRITICAL",
      type: "DEADLINE_TODAY",
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.PUSH]
    },
    {
      window: REMINDER_WINDOWS.WINDOW_OVERDUE,
      offsetMs: 1 * 60 * 60 * 1000, // 1 hour past deadline if uncompleted
      priority: "CRITICAL",
      type: "TASK_OVERDUE",
      channels: [NOTIFICATION_CHANNELS.IN_APP, NOTIFICATION_CHANNELS.EMAIL]
    }
  ]
});

export class AcademicReminderPolicy {
  /**
   * Calculates scheduled reminder timestamps relative to a due date
   * @param {Date|string} dueDate 
   * @param {object} [customPolicy]
   * @param {object} [clock]
   * @returns {Array<object>}
   */
  static computeSchedules(dueDate, customPolicy = DEFAULT_REMINDER_POLICY, clock = { now: () => AcademicClock.now() }) {
    if (!dueDate) return [];
    const parsedDate = AcademicDeadlineEngine.parseDeadline(dueDate);
    if (!parsedDate) return [];
    const dueTime = parsedDate.getTime();

    const now = clock.now();
    const policy = { ...DEFAULT_REMINDER_POLICY, ...customPolicy };
    if (!policy.enabled) return [];

    const schedules = [];

    for (const rule of policy.windows) {
      const scheduledTimestamp = dueTime + rule.offsetMs;
      
      // Determine if schedule is in the future or ready to be queued
      schedules.push({
        window: rule.window,
        type: rule.type,
        priority: rule.priority,
        channels: rule.channels,
        scheduledAt: new Date(scheduledTimestamp).toISOString(),
        scheduledTimestamp,
        isPast: scheduledTimestamp <= now,
        dueAt: new Date(dueTime).toISOString()
      });
    }

    // Sort chronologically by scheduled timestamp
    return schedules.sort((a, b) => a.scheduledTimestamp - b.scheduledTimestamp);
  }
}
