/**
 * StudentHub AI — Academic Notification Store V1
 * 
 * Durable, restart-safe storage for academic notifications with:
 * - Two-phase atomic write-through (.tmp ➔ renameSync).
 * - Startup boot rehydration.
 * - Deduplication index on deterministic dedupe keys.
 * - Optimistic concurrency control via revision checks.
 * - Multi-student boundary isolation.
 */

import fs from "node:fs";
import path from "node:path";
import { AcademicNotificationModel } from "./academicNotificationModel.js";
import { createSecureId } from "../../security/secureId.js";

const DATA_DIR = path.resolve(process.cwd(), ".data");
const STORAGE_FILE = path.join(DATA_DIR, "academic_notifications_store.json");

export class AcademicNotificationStore {
  static #notificationsById = new Map();
  static #notificationsByStudent = new Map();
  static #notificationsByTask = new Map();
  static #notificationsByDedupeKey = new Map();
  static #isHydrated = false;

  /**
   * Rehydrates notifications from persistent disk storage
   */
  static rehydrate() {
    this.#notificationsById.clear();
    this.#notificationsByStudent.clear();
    this.#notificationsByTask.clear();
    this.#notificationsByDedupeKey.clear();

    try {
      if (fs.existsSync(STORAGE_FILE)) {
        const raw = fs.readFileSync(STORAGE_FILE, "utf-8");
        const data = JSON.parse(raw);

        if (Array.isArray(data.notifications)) {
          for (const notif of data.notifications) {
            this.#indexNotification(notif);
          }
        }
      }
    } catch {
      console.error("[AcademicNotificationStore] Rehydration failed");
    } finally {
      this.#isHydrated = true;
    }
  }

  static #ensureHydrated() {
    if (!this.#isHydrated) {
      this.rehydrate();
    }
  }

  static #indexNotification(notif) {
    const copy = AcademicNotificationModel.clone(notif);
    this.#notificationsById.set(copy.notificationId, copy);

    if (copy.dedupeKey) {
      this.#notificationsByDedupeKey.set(copy.dedupeKey, copy.notificationId);
    }

    if (copy.studentId) {
      if (!this.#notificationsByStudent.has(copy.studentId)) {
        this.#notificationsByStudent.set(copy.studentId, new Set());
      }
      this.#notificationsByStudent.get(copy.studentId).add(copy.notificationId);
    }

    if (copy.taskId) {
      if (!this.#notificationsByTask.has(copy.taskId)) {
        this.#notificationsByTask.set(copy.taskId, new Set());
      }
      this.#notificationsByTask.get(copy.taskId).add(copy.notificationId);
    }
  }

  /**
   * Persists the current state atomically using temporary file + renameSync
   */
  static #flushToDisk() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const payload = {
        version: "1.0.0",
        savedAt: new Date().toISOString(),
        notifications: Array.from(this.#notificationsById.values())
      };

      const tempFile = path.join(DATA_DIR, `.tmp_notif_${createSecureId("tmp")}.json`);
      fs.writeFileSync(tempFile, JSON.stringify(payload, null, 2), "utf-8");
      fs.renameSync(tempFile, STORAGE_FILE);
    } catch {
      console.error("[AcademicNotificationStore] Disk flush failed");
    }
  }

  /**
   * Saves or updates a notification with optimistic concurrency validation
   * @param {object} notification 
   * @returns {object} Stored copy
   */
  static saveNotification(notification) {
    this.#ensureHydrated();
    if (!notification || !notification.notificationId) {
      throw new Error("Invalid notification: missing notificationId");
    }

    const existing = this.#notificationsById.get(notification.notificationId);
    if (existing) {
      const incomingRev = typeof notification.revision === "number" ? notification.revision : 1;
      const currentRev = typeof existing.revision === "number" ? existing.revision : 1;
      if (incomingRev < currentRev) {
        throw new Error(`STALE_NOTIFICATION_REVISION: incoming revision ${incomingRev} is older than current ${currentRev}`);
      }
    }

    this.#indexNotification(notification);
    this.#flushToDisk();
    return AcademicNotificationModel.clone(notification);
  }

  /**
   * Retrieves a notification by its ID
   * @param {string} notificationId 
   * @returns {object|null}
   */
  static getNotificationById(notificationId) {
    this.#ensureHydrated();
    const notif = this.#notificationsById.get(notificationId);
    return notif ? AcademicNotificationModel.clone(notif) : null;
  }

  /**
   * Retrieves a notification by its deduplication key
   * @param {string} dedupeKey 
   * @returns {object|null}
   */
  static getNotificationByDedupeKey(dedupeKey) {
    this.#ensureHydrated();
    const id = this.#notificationsByDedupeKey.get(dedupeKey);
    if (!id) return null;
    return this.getNotificationById(id);
  }

  /**
   * Retrieves all notifications for a given student
   * @param {string} studentId 
   * @param {object} [filter]
   * @returns {Array<object>}
   */
  static getNotificationsByStudent(studentId, filter = {}) {
    this.#ensureHydrated();
    if (!studentId) return [];

    const idSet = this.#notificationsByStudent.get(studentId) || new Set();
    let results = Array.from(idSet)
      .map(id => this.#notificationsById.get(id))
      .filter(Boolean)
      .map(n => AcademicNotificationModel.clone(n));

    if (filter.status) {
      results = results.filter(n => n.status === filter.status);
    }
    if (filter.unreadOnly) {
      results = results.filter(n => n.status === "SENT" || (n.status === "READ" && !n.readAt));
    }
    if (filter.excludeCancelled) {
      results = results.filter(n => n.status !== "CANCELLED" && n.status !== "EXPIRED");
    }

    // Sort by scheduledAt / createdAt descending
    results.sort((a, b) => new Date(b.scheduledAt || b.createdAt).getTime() - new Date(a.scheduledAt || a.createdAt).getTime());

    if (filter.limit && filter.limit > 0) {
      results = results.slice(0, filter.limit);
    }

    return results;
  }

  /**
   * Retrieves all notifications linked to a specific academic task
   * @param {string} taskId 
   * @returns {Array<object>}
   */
  static getNotificationsByTask(taskId) {
    this.#ensureHydrated();
    if (!taskId) return [];

    const idSet = this.#notificationsByTask.get(taskId) || new Set();
    return Array.from(idSet)
      .map(id => this.#notificationsById.get(id))
      .filter(Boolean)
      .map(n => AcademicNotificationModel.clone(n));
  }

  /**
   * Returns all pending SCHEDULED notifications ready to be dispatched
   * @param {Date|string|number} [currentTime] 
   * @returns {Array<object>}
   */
  static getPendingScheduled(currentTime = Date.now()) {
    this.#ensureHydrated();
    const cutoff = new Date(currentTime).getTime();

    const pending = [];
    for (const notif of this.#notificationsById.values()) {
      if (notif.status === "SCHEDULED") {
        const scheduledTime = new Date(notif.scheduledAt).getTime();
        if (scheduledTime <= cutoff) {
          pending.push(AcademicNotificationModel.clone(notif));
        }
      }
    }

    return pending.sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
  }

  /**
   * Counts unread active notifications for a student
   * @param {string} studentId 
   * @returns {number}
   */
  static countUnreadByStudent(studentId) {
    this.#ensureHydrated();
    if (!studentId) return 0;

    const idSet = this.#notificationsByStudent.get(studentId) || new Set();
    let unread = 0;
    for (const id of idSet) {
      const notif = this.#notificationsById.get(id);
      if (notif && notif.status === "SENT" && !notif.readAt && !notif.acknowledgedAt) {
        unread++;
      }
    }
    return unread;
  }

  /**
   * Resets in-memory and disk stores (strictly for testing)
   */
  static clear() {
    this.#notificationsById.clear();
    this.#notificationsByStudent.clear();
    this.#notificationsByTask.clear();
    this.#notificationsByDedupeKey.clear();
    this.#isHydrated = true;

    try {
      if (fs.existsSync(STORAGE_FILE)) {
        fs.unlinkSync(STORAGE_FILE);
      }
    } catch {}
  }
}
