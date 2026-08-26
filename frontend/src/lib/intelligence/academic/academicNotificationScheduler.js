/**
 * StudentHub AI — Academic Notification Scheduler V1
 * 
 * Deterministic batch scheduler & dispatcher.
 * Identifies due scheduled notifications, transitions them through
 * QUEUED ➔ SENT (or retry backoff / FAILED), and guarantees delivery idempotency.
 */

import { AcademicNotificationStore } from "./academicNotificationStore.js";
import { AcademicNotificationStateMachine, NOTIFICATION_COMMANDS } from "./academicNotificationStateMachine.js";
import { AcademicNotificationDeliveryAdapter } from "./academicNotificationDeliveryAdapter.js";

export class AcademicNotificationScheduler {
  static #lastRunTimestamp = null;
  static #metrics = {
    totalProcessed: 0,
    totalDelivered: 0,
    totalFailed: 0,
    totalRetries: 0
  };

  /**
   * Executes a single deterministic dispatch cycle
   * @param {object} [clock]
   * @param {number} [maxBatchSize]
   * @returns {Promise<object>}
   */
  static async runDispatchCycle(clock = { now: () => Date.now() }, maxBatchSize = 100) {
    const now = clock.now();
    this.#lastRunTimestamp = new Date(now).toISOString();

    const pending = AcademicNotificationStore.getPendingScheduled(now);
    const batch = pending.slice(0, maxBatchSize);

    const summary = {
      timestamp: this.#lastRunTimestamp,
      candidateCount: pending.length,
      processedCount: batch.length,
      deliveredCount: 0,
      failedCount: 0,
      retryCount: 0,
      details: []
    };

    for (const notif of batch) {
      this.#metrics.totalProcessed++;
      try {
        // 1. Transition SCHEDULED ➔ QUEUED
        let queuedNotif = AcademicNotificationStateMachine.transition(
          notif,
          NOTIFICATION_COMMANDS.QUEUE,
          { clock, reason: "Scheduled dispatch time reached" }
        );
        queuedNotif = AcademicNotificationStore.saveNotification(queuedNotif);

        // 2. Attempt multi-channel delivery
        const deliveryResult = await AcademicNotificationDeliveryAdapter.deliver(queuedNotif);

        if (deliveryResult.overallSuccess) {
          // 3a. Success: QUEUED ➔ SENT
          const sentNotif = AcademicNotificationStateMachine.transition(
            queuedNotif,
            NOTIFICATION_COMMANDS.SEND,
            { clock, reason: "Successfully delivered via configured channels" }
          );
          AcademicNotificationStore.saveNotification(sentNotif);
          summary.deliveredCount++;
          this.#metrics.totalDelivered++;
          summary.details.push({ notificationId: notif.notificationId, status: "SENT" });
        } else {
          // 3b. Failure: Check retry policy
          const attempts = (queuedNotif.metadata?.deliveryAttempts || 0) + 1;
          const maxAttempts = 3;

          if (attempts < maxAttempts) {
            // Schedule retry with backoff
            const backoffMs = Math.pow(2, attempts) * 5 * 60 * 1000; // 10m, 20m
            const nextScheduledAt = new Date(now + backoffMs).toISOString();

            const updatedMeta = {
              ...queuedNotif.metadata,
              deliveryAttempts: attempts,
              lastError: JSON.stringify(deliveryResult.results)
            };

            const retryNotif = {
              ...queuedNotif,
              scheduledAt: nextScheduledAt,
              status: "SCHEDULED", // Re-queue for next attempt
              metadata: updatedMeta
            };

            AcademicNotificationStore.saveNotification(retryNotif);
            summary.retryCount++;
            this.#metrics.totalRetries++;
            summary.details.push({ notificationId: notif.notificationId, status: "RETRY_SCHEDULED", nextScheduledAt });
          } else {
            // Permanent failure
            const failedNotif = AcademicNotificationStateMachine.transition(
              queuedNotif,
              NOTIFICATION_COMMANDS.FAIL,
              { clock, error: JSON.stringify(deliveryResult.results) }
            );
            AcademicNotificationStore.saveNotification(failedNotif);
            summary.failedCount++;
            this.#metrics.totalFailed++;
            summary.details.push({ notificationId: notif.notificationId, status: "FAILED" });
          }
        }
      } catch (err) {
        summary.failedCount++;
        this.#metrics.totalFailed++;
        summary.details.push({ notificationId: notif.notificationId, error: err.message });
      }
    }

    return summary;
  }

  /**
   * Health and telemetry diagnostic signal
   * @returns {object}
   */
  static getHealthStatus() {
    return {
      status: "HEALTHY",
      lastRunAt: this.#lastRunTimestamp,
      metrics: { ...this.#metrics }
    };
  }

  /**
   * Resets scheduler telemetry (strictly for testing)
   */
  static resetMetrics() {
    this.#metrics = {
      totalProcessed: 0,
      totalDelivered: 0,
      totalFailed: 0,
      totalRetries: 0
    };
    this.#lastRunTimestamp = null;
  }
}
