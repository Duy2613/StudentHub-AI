/**
 * StudentHub AI — Multi-Tier Academic Notification Delivery Adapter V1
 * 
 * Multi-channel delivery abstraction (IN_APP, EMAIL, PUSH) enforcing:
 * 1. Data minimization principle (channel-aware payload projection).
 * 2. Channel-specific privacy boundaries (Push <= 100 chars, zero private data; Email with high-level summary & auth link; In-App with full context).
 * 3. Defense-in-depth secondary regex content sanitizer.
 * 4. Centralized AcademicClock timestamping.
 */

import { NOTIFICATION_CHANNELS } from "./academicReminderPolicy.js";
import { AcademicClock } from "./academicClock.js";

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
   * Defense-in-depth sanitizer to redact sensitive tokens or credentials
   * @param {string} text 
   * @returns {string}
   */
  static sanitizePrivacyContent(text) {
    if (!text || typeof text !== "string") return "";
    return text
      .replace(/password\s*[:=]\s*\S+/gi, "password: [REDACTED]")
      .replace(/otp\s*[:=]\s*\d+/gi, "OTP: [PROTECTED]")
      .replace(/stk\s*[:=]\s*\d{6,}/gi, "STK: [SECURE]")
      .replace(/\b(cccd|cmnd)\s*[:=]\s*\d{9,12}\b/gi, "$1: [MASKED]");
  }

  /**
   * Channel-aware projection for IN_APP notifications (rich action intent & metadata)
   * @param {object} notif 
   * @returns {object}
   */
  static projectForInApp(notif) {
    return {
      notificationId: notif.notificationId,
      studentId: notif.studentId,
      type: notif.type,
      priority: notif.priority,
      title: this.sanitizePrivacyContent(notif.title),
      body: this.sanitizePrivacyContent(notif.body),
      actionLabel: notif.actionLabel,
      actionIntent: notif.actionIntent,
      actionUrl: notif.actionUrl,
      dueAt: notif.dueAt,
      scheduledAt: notif.scheduledAt,
      status: notif.status,
      metadata: notif.metadata || {}
    };
  }

  /**
   * Channel-aware projection for EMAIL notifications (minimized summary + direct secure portal link)
   * @param {object} notif 
   * @returns {object}
   */
  static projectForEmail(notif) {
    const sanitizedBody = this.sanitizePrivacyContent(notif.body);
    const summaryLines = sanitizedBody.split("\n").filter(Boolean);
    const primarySummary = summaryLines[0] || "Thông báo học vụ quan trọng từ Trường ĐH Sư Phạm Kỹ Thuật TP.HCM (HCMUTE).";

    return {
      to: `${notif.studentId}@student.hcmute.edu.vn`,
      subject: `[HCMUTE StudentHub] ${notif.title}`,
      summary: primarySummary,
      actionUrl: notif.actionUrl || "https://studenthub.hcmute.edu.vn/academic",
      actionLabel: notif.actionLabel || "Đăng nhập và xử lý",
      channel: "EMAIL",
      sentAt: AcademicClock.nowIso()
    };
  }

  /**
   * Channel-aware projection for PUSH notifications (minimalist 1-line urgency alert <= 100 chars)
   * @param {object} notif 
   * @returns {object}
   */
  static projectForPush(notif) {
    const rawBody = this.sanitizePrivacyContent(notif.body);
    const shortBody = rawBody.replace(/[*_#`]/g, "").slice(0, 100);

    return {
      studentId: notif.studentId,
      title: notif.title,
      body: shortBody,
      badgeCount: 1,
      actionUrl: notif.actionUrl || "/academic",
      channel: "PUSH",
      sentAt: AcademicClock.nowIso()
    };
  }

  /**
   * Dispatches a notification across its configured channels with channel-aware projections
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
    const nowIso = AcademicClock.nowIso();

    for (const channel of channels) {
      try {
        switch (channel) {
          case NOTIFICATION_CHANNELS.IN_APP: {
            const inAppPayload = this.projectForInApp(notification);
            results.IN_APP = {
              success: true,
              deliveredAt: nowIso,
              payload: inAppPayload,
              target: `student:${notification.studentId}`
            };
            break;
          }

          case NOTIFICATION_CHANNELS.EMAIL: {
            const emailPayload = this.projectForEmail(notification);
            if (this.#emailDeliveryHandler) {
              const res = await this.#emailDeliveryHandler(emailPayload);
              results.EMAIL = { success: Boolean(res?.success), deliveredAt: nowIso, payload: emailPayload };
            } else {
              results.EMAIL = {
                success: true,
                simulated: true,
                deliveredAt: nowIso,
                to: emailPayload.to
              };
            }
            break;
          }

          case NOTIFICATION_CHANNELS.PUSH: {
            const pushPayload = this.projectForPush(notification);
            if (this.#pushDeliveryHandler) {
              const res = await this.#pushDeliveryHandler(pushPayload);
              results.PUSH = { success: Boolean(res?.success), deliveredAt: nowIso, payload: pushPayload };
            } else {
              results.PUSH = {
                success: true,
                simulated: true,
                deliveredAt: nowIso,
                preview: pushPayload.body
              };
            }
            break;
          }

          default:
            results[channel] = { success: false, error: `Unsupported channel: ${channel}` };
            overallSuccess = false;
        }
      } catch {
        results[channel] = { success: false, error: "DELIVERY_FAILED" };
        overallSuccess = false;
      }
    }

    return {
      notificationId: notification.notificationId,
      overallSuccess,
      results,
      timestamp: nowIso
    };
  }
}
