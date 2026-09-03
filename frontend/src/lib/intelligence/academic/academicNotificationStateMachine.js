/**
 * StudentHub AI — Academic Notification State Machine V1
 * 
 * Formal state transition engine for academic notifications.
 * Enforces legal state progression, event logging, snooze rescheduling,
 * and optimistic revision increments.
 */

import { NOTIFICATION_STATUSES } from "./academicNotificationModel.js";

export const NOTIFICATION_COMMANDS = Object.freeze({
  QUEUE: "QUEUE",
  SEND: "SEND",
  MARK_READ: "MARK_READ",
  ACKNOWLEDGE: "ACKNOWLEDGE",
  SNOOZE: "SNOOZE",
  CANCEL: "CANCEL",
  EXPIRE: "EXPIRE",
  FAIL: "FAIL"
});

// Legal Transition Graph
const LEGAL_TRANSITIONS = Object.freeze({
  [NOTIFICATION_STATUSES.SCHEDULED]: [
    NOTIFICATION_STATUSES.QUEUED,
    NOTIFICATION_STATUSES.SENT,
    NOTIFICATION_STATUSES.READ,
    NOTIFICATION_STATUSES.ACKNOWLEDGED,
    NOTIFICATION_STATUSES.CANCELLED,
    NOTIFICATION_STATUSES.EXPIRED
  ],
  [NOTIFICATION_STATUSES.QUEUED]: [
    NOTIFICATION_STATUSES.SENT,
    NOTIFICATION_STATUSES.CANCELLED,
    NOTIFICATION_STATUSES.FAILED
  ],
  [NOTIFICATION_STATUSES.SENT]: [
    NOTIFICATION_STATUSES.READ,
    NOTIFICATION_STATUSES.ACKNOWLEDGED,
    NOTIFICATION_STATUSES.SCHEDULED, // Via Snooze
    NOTIFICATION_STATUSES.EXPIRED,
    NOTIFICATION_STATUSES.CANCELLED
  ],
  [NOTIFICATION_STATUSES.READ]: [
    NOTIFICATION_STATUSES.ACKNOWLEDGED,
    NOTIFICATION_STATUSES.SCHEDULED, // Via Snooze
    NOTIFICATION_STATUSES.EXPIRED
  ],
  [NOTIFICATION_STATUSES.ACKNOWLEDGED]: [
    // Terminal state - cannot transition further
  ],
  [NOTIFICATION_STATUSES.CANCELLED]: [
    // Terminal state
  ],
  [NOTIFICATION_STATUSES.EXPIRED]: [
    // Terminal state
  ],
  [NOTIFICATION_STATUSES.FAILED]: [
    NOTIFICATION_STATUSES.QUEUED,    // Via Retry
    NOTIFICATION_STATUSES.CANCELLED
  ]
});

export class AcademicNotificationStateMachine {
  /**
   * Evaluates and applies a state transition command to a notification
   * @param {object} notification 
   * @param {string} command 
   * @param {object} [payload] 
   * @returns {object} Updated immutable notification
   */
  static transition(notification, command, payload = {}) {
    if (!notification || !notification.status) {
      throw new Error("Invalid notification object provided to state machine.");
    }

    const currentStatus = notification.status;
    let targetStatus = null;
    let eventReason = payload.reason || command;
    let extraUpdates = {};

    const now = (payload.clock ? payload.clock.now() : Date.now());
    const nowIso = new Date(now).toISOString();

    switch (command) {
      case NOTIFICATION_COMMANDS.QUEUE:
        targetStatus = NOTIFICATION_STATUSES.QUEUED;
        break;

      case NOTIFICATION_COMMANDS.SEND:
        targetStatus = NOTIFICATION_STATUSES.SENT;
        extraUpdates.sentAt = nowIso;
        break;

      case NOTIFICATION_COMMANDS.MARK_READ:
        targetStatus = NOTIFICATION_STATUSES.READ;
        extraUpdates.readAt = nowIso;
        break;

      case NOTIFICATION_COMMANDS.ACKNOWLEDGE:
        targetStatus = NOTIFICATION_STATUSES.ACKNOWLEDGED;
        extraUpdates.acknowledgedAt = nowIso;
        if (!notification.readAt) {
          extraUpdates.readAt = nowIso;
        }
        break;

      case NOTIFICATION_COMMANDS.SNOOZE: {
        targetStatus = NOTIFICATION_STATUSES.SCHEDULED;
        const snoozeHours = payload.snoozeHours || 4;
        const nextScheduledTimestamp = now + (snoozeHours * 60 * 60 * 1000);
        extraUpdates.scheduledAt = new Date(nextScheduledTimestamp).toISOString();
        eventReason = `Snoozed for ${snoozeHours} hours until ${extraUpdates.scheduledAt}`;
        break;
      }

      case NOTIFICATION_COMMANDS.CANCEL:
        targetStatus = NOTIFICATION_STATUSES.CANCELLED;
        extraUpdates.cancelledAt = nowIso;
        break;

      case NOTIFICATION_COMMANDS.EXPIRE:
        targetStatus = NOTIFICATION_STATUSES.EXPIRED;
        extraUpdates.expiredAt = nowIso;
        break;

      case NOTIFICATION_COMMANDS.FAIL:
        targetStatus = NOTIFICATION_STATUSES.FAILED;
        extraUpdates.failedAt = nowIso;
        extraUpdates.failureReason = payload.error || "Delivery failed";
        break;

      default:
        throw new Error(`Unknown notification command: ${command}`);
    }

    // Check legal transition
    const allowed = LEGAL_TRANSITIONS[currentStatus] || [];
    if (!allowed.includes(targetStatus)) {
      throw new Error(`Illegal notification transition: cannot transition from ${currentStatus} to ${targetStatus} via command ${command}`);
    }

    // Produce new state with incremented revision and history entry
    const historyEntry = {
      event: `STATUS_CHANGED_${targetStatus}`,
      from: currentStatus,
      to: targetStatus,
      command,
      reason: eventReason,
      timestamp: nowIso
    };

    const nextHistory = Array.isArray(notification.history)
      ? [...notification.history, historyEntry]
      : [historyEntry];

    return Object.freeze({
      ...notification,
      ...extraUpdates,
      status: targetStatus,
      history: nextHistory,
      revision: (notification.revision || 1) + 1
    });
  }
}
