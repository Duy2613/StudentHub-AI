/**
 * StudentHub AI — Academic Notification Adapter
 * 
 * Adapts canonical AcademicInsight entities into structured notifications:
 * - Emits clear, evidence-backed notifications answering WHY, WHAT CHANGED, and ACTION REQUIRED.
 * - Suppresses notifications for students evaluated as UNAFFECTED (impactLevel = NONE).
 */

export class AcademicNotificationAdapter {
  /**
   * Adapts an AcademicInsight into a user notification
   * @param {object} insight - Canonical AcademicInsight
   * @param {object} studentProfile - Student Profile
   * @returns {object|null} Notification object or null if unaffected
   */
  static formatNotification(insight = {}, studentProfile = {}) {
    if (!insight || insight.impact === "NONE") {
      return null;
    }

    const cohort = studentProfile.cohort || 2024;
    const cohortTag = `[HỌC VỤ K${String(cohort).slice(-2)}]`;

    let priority = "NORMAL";
    if (insight.impact === "CRITICAL" || insight.urgency === "CRITICAL") {
      priority = "CRITICAL";
    } else if (insight.impact === "HIGH" || insight.urgency === "HIGH") {
      priority = "HIGH";
    }

    const title = `${cohortTag} ${insight.title}`;
    const deadlineStr = insight.deadline ? `\n⏳ Hạn chót: **${insight.deadline}**` : "";

    const body = `**Thay đổi:** ${insight.whatChanged}\n**Lý do ảnh hưởng:** ${insight.whyItMatters}${deadlineStr}`;

    return {
      notificationId: `NOTIF_${insight.insightId}_${studentProfile.studentId || "STD"}`,
      insightId: insight.insightId,
      studentId: studentProfile.studentId || "ALL",
      channel: priority === "CRITICAL" ? "RADAR_PUSH" : "IN_APP_POPUP",
      priority,
      title,
      body,
      whatChanged: insight.whatChanged,
      whyItMatters: insight.whyItMatters,
      deadline: insight.deadline,
      actions: insight.actions || [],
      sourceUrl: insight.source?.canonicalUrl || "",
      isRead: false,
      createdAt: new Date().toISOString()
    };
  }
}
