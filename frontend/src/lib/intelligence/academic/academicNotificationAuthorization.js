/**
 * StudentHub AI — Academic Notification Authorization V1
 * 
 * Strict student isolation and access control guard for notifications.
 * Prevents Student A from reading, acknowledging, or snoozing Student B's notifications.
 */

export class AcademicNotificationAuthorization {
  /**
   * Asserts that a student is authorized to view or mutate a notification
   * @param {string} studentId 
   * @param {object} notification 
   * @throws {Error} If unauthorized
   */
  static assertNotificationAccess(studentId, notification) {
    if (!studentId || typeof studentId !== "string") {
      throw new Error("UNAUTHORIZED_NOTIFICATION_ACCESS: Missing student identity.");
    }

    if (!notification || typeof notification !== "object") {
      throw new Error("NOTIFICATION_NOT_FOUND: Target notification does not exist.");
    }

    // Notifications assigned to "ALL" are publicly accessible to any authenticated student
    if (notification.studentId === "ALL") {
      return true;
    }

    if (notification.studentId !== studentId) {
      throw new Error(`FORBIDDEN_NOTIFICATION_ACCESS: Student ${studentId} is not authorized to access notification belonging to ${notification.studentId}.`);
    }

    return true;
  }

  /**
   * Safely checks authorization without throwing
   * @param {string} studentId 
   * @param {object} notification 
   * @returns {boolean}
   */
  static canAccess(studentId, notification) {
    try {
      this.assertNotificationAccess(studentId, notification);
      return true;
    } catch {
      return false;
    }
  }
}
