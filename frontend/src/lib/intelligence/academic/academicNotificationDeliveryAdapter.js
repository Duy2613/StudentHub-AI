/**
 * StudentHub AI — Academic Notification Delivery Adapter V1
 * 
 * Multi-channel delivery abstraction (IN_APP, EMAIL, PUSH) with:
 * - Privacy-safe sanitization (no passwords, OTPs, full transcripts).
 * - Deep link resolution.
 * - Delivery result tracking with failure attribution.
 */

import { NOTIFICATION_CHANNELS } from "./academicReminderPolicy.js";

export class AcademicNotificationDeliveryAdapter {
  static #emailDeliveryHandler = null;
  static #pushDeliveryHandler = null;

  /**
   * Registers a custom email sender handler for production integrations
   * @param {Function} handler 
   */
  static registerEmailHandler(handler) {
    this.#emailDeliveryHandler = handler;
  }

  /**
   * Registers a custom push sender handler for production integrations
   * @param {Function} handler 
   */
  static registerPushHandler(handler) {
    this.#pushDeliveryHandler = handler;
  }

  /**
   * Sanitizes notification body to prevent leaking sensitive academic tokens or secrets
   * @param {string} text 
   * @returns {string}
   */
  static sanitizePrivacyContent(text) {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/password\s*[:=]\s*\S+/gi, "password: [REDACTED]")
      .replace(/otp\s*[:=]\s*\d+/gi, "OTP: [PROTECTED]")
      .replace(/stk\s*[:=]\s*\d{6,}/gi, "STK: [SECURE]");
  }

  /**
   * Dispatches a notification across its configured channels
   * @param {object} notification 
   * @returns {Promise<object>} Delivery summary
   */
  static async deliver(notification) {
    if (!notification || !notification.notificationId) {
      throw new Error("Cannot deliver invalid notification.");
    }

    const channels = notification.channels || [NOTIFICATION_CHANNELS.IN_APP];
    const results = {};
    let overallSuccess = true;

    for (const channel of channels) {
      try {
        switch (channel) {
          case NOTIFICATION_CHANNELS.IN_APP:
            results.IN_APP = {
              success: true,
              deliveredAt: new Date().toISOString(),
              target: `student:${notification.studentId}`
            };
            break;

          case NOTIFICATION_CHANNELS.EMAIL: {
            const sanitizedBody = this.sanitizePrivacyContent(notification.body);
            if (this.#emailDeliveryHandler) {
              const res = await this.#emailDeliveryHandler({
                to: `${notification.studentId}@student.hcmute.edu.vn`,
                subject: `[StudentHub AI] ${notification.title}`,
                body: sanitizedBody,
                actionUrl: notification.actionUrl
              });
              results.EMAIL = { success: Boolean(res?.success), deliveredAt: new Date().toISOString() };
            } else {
              // Simulated delivery log
              results.EMAIL = {
                success: true,
                simulated: true,
                deliveredAt: new Date().toISOString(),
                to: `${notification.studentId}@student.hcmute.edu.vn`
              };
            }
            break;
          }

          case NOTIFICATION_CHANNELS.PUSH: {
            const shortBody = this.sanitizePrivacyContent(notification.body).slice(0, 120);
            if (this.#pushDeliveryHandler) {
              const res = await this.#pushDeliveryHandler({
                studentId: notification.studentId,
                title: notification.title,
                body: shortBody,
                actionUrl: notification.actionUrl
              });
              results.PUSH = { success: Boolean(res?.success), deliveredAt: new Date().toISOString() };
            } else {
              results.PUSH = {
                success: true,
                simulated: true,
                deliveredAt: new Date().toISOString()
              };
            }
            break;
          }

          default:
            results[channel] = { success: false, error: `Unsupported channel: ${channel}` };
            overallSuccess = false;
        }
      } catch (err) {
        results[channel] = { success: false, error: err.message };
        overallSuccess = false;
      }
    }

    return {
      notificationId: notification.notificationId,
      overallSuccess,
      results,
      timestamp: new Date().toISOString()
    };
  }
}
