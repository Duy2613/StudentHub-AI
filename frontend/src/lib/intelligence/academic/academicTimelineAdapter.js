/**
 * StudentHub AI — Academic Timeline Adapter
 * 
 * Adapts academic changes and insights into chronological student timeline events:
 * - Generates milestone items for student academic dashboards.
 * - Highlights student-specific impact badges and deadlines.
 */

import { createSecureId } from "../../security/secureId.js";

export class AcademicTimelineAdapter {
  /**
   * Adapts an AcademicChange and optional AcademicInsight into a Timeline Event
   * @param {object} change - SemanticChange object
   * @param {object|null} insight - Canonical AcademicInsight
   * @returns {object} TimelineEvent
   */
  static buildTimelineEvent(change = {}, insight = null) {
    const eventDate = insight?.deadline || insight?.effectiveAt || new Date().toISOString().slice(0, 10);
    const category = change.category || insight?.type || "ACADEMIC_REGULATION";
    const isAffected = insight ? (insight.impact !== "NONE") : true;

    return {
      timelineId: createSecureId("TL"),
      date: eventDate,
      milestoneTitle: insight?.title || change.field || "Cập Nhật Học Vụ",
      summary: insight?.whatChanged || change.description || "Quy định học vụ mới ban hành.",
      category,
      severity: insight?.impact || change.severity || "MEDIUM",
      isStudentAffected: isAffected,
      whyItMatters: insight?.whyItMatters || null,
      actions: insight?.actions || [],
      sourceProvenance: insight?.provenance || { sourceId: "AcademicLiveSync" },
      createdAt: new Date().toISOString()
    };
  }
}
