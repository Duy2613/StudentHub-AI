/**
 * StudentHub AI — EarlyWarningEngine V1
 * 
 * Aggregates emerging operational signals from social/community feeds
 * into actionable early warnings for students and administrators.
 * Tracks lifecycle: UNVERIFIED -> EMERGING -> CORROBORATED -> CONFIRMED -> RESOLVED.
 * Backed by durable EarlyWarningStore.
 */

import { EarlyWarningStore } from "./EarlyWarningStore.js";
import { createSecureId } from "../../security/secureId.js";

export const WARNING_LIFECYCLE = Object.freeze({
  UNVERIFIED: "UNVERIFIED",
  EMERGING: "EMERGING",
  CORROBORATED: "CORROBORATED",
  CONFIRMED: "CONFIRMED",
  RESOLVED: "RESOLVED"
});

export const WARNING_CATEGORY = Object.freeze({
  PORTAL_OUTAGE: "PORTAL_OUTAGE",
  SCHEDULE_CONFLICT: "SCHEDULE_CONFLICT",
  COURSE_REGISTRATION_BUG: "COURSE_REGISTRATION_BUG",
  TUITION_DEADLINE: "TUITION_DEADLINE",
  FACILITY_ISSUE: "FACILITY_ISSUE",
  ACADEMIC_RULE_CONFUSION: "ACADEMIC_RULE_CONFUSION"
});

export class EarlyWarningEngine {
  /**
   * Ingests a new signal and updates/creates corresponding EarlyWarning
   * @param {object} signalPayload
   * @param {string} signalPayload.category - WARNING_CATEGORY
   * @param {string} signalPayload.title
   * @param {string} signalPayload.summary
   * @param {string} [signalPayload.affectedEntity] - e.g. "SYSTEM:online_portal"
   * @param {string} [signalPayload.authorId]
   * @returns {object} Updated EarlyWarning
   */
  static recordSignal(signalPayload = {}) {
    const {
      category = WARNING_CATEGORY.PORTAL_OUTAGE,
      title = "Cảnh báo học vụ",
      summary = "",
      affectedEntity = "SYSTEM:general",
      authorId = "anon"
    } = signalPayload;

    const warningKey = `${category}__${affectedEntity}`;
    let warning = EarlyWarningStore.getWarning(warningKey);

    const now = Date.now();

    if (!warning) {
      warning = {
        warningId: createSecureId("warn"),
        category,
        title,
        summary,
        affectedEntity,
        status: WARNING_LIFECYCLE.UNVERIFIED,
        reportCount: 1,
        distinctReporters: [authorId],
        firstReportedAt: now,
        lastReportedAt: now,
        officialVerificationStatus: "PENDING_CHECK",
        confidence: 0.25,
        remediationAction: "Kiểm tra lại kết nối mạng hoặc thử lại sau 15 phút."
      };
      EarlyWarningStore.saveWarning(warningKey, warning);
    } else {
      warning.reportCount += 1;
      const reportersSet = new Set(Array.isArray(warning.distinctReporters) ? warning.distinctReporters : []);
      reportersSet.add(authorId);
      warning.distinctReporters = Array.from(reportersSet);
      warning.lastReportedAt = now;

      // State Transition based on independent reporter count
      const count = warning.distinctReporters.length;
      if (count >= 6 && warning.status !== WARNING_LIFECYCLE.CONFIRMED) {
        warning.status = WARNING_LIFECYCLE.CORROBORATED;
        warning.confidence = 0.85;
      } else if (count >= 3 && warning.status === WARNING_LIFECYCLE.UNVERIFIED) {
        warning.status = WARNING_LIFECYCLE.EMERGING;
        warning.confidence = 0.60;
      }
      EarlyWarningStore.saveWarning(warningKey, warning);
    }

    return this.#serializeWarning(warning);
  }

  /**
   * Confirms a warning when an official notice or administrative confirmation arrives
   * @param {string} warningKey 
   * @param {object} officialEvidence 
   */
  static confirmWarning(warningKey, officialEvidence = {}) {
    const warning = EarlyWarningStore.getWarning(warningKey);
    if (warning) {
      warning.status = WARNING_LIFECYCLE.CONFIRMED;
      warning.officialVerificationStatus = "CONFIRMED_BY_OFFICIAL_NOTICE";
      warning.confidence = 0.98;
      warning.officialEvidence = officialEvidence;
      EarlyWarningStore.saveWarning(warningKey, warning);
      return this.#serializeWarning(warning);
    }
    return null;
  }

  /**
   * Resolves a warning
   * @param {string} warningKey 
   */
  static resolveWarning(warningKey) {
    const warning = EarlyWarningStore.getWarning(warningKey);
    if (warning) {
      warning.status = WARNING_LIFECYCLE.RESOLVED;
      EarlyWarningStore.saveWarning(warningKey, warning);
      return this.#serializeWarning(warning);
    }
    return null;
  }

  /**
   * Lists active (non-resolved) early warnings
   * @returns {Array<object>}
   */
  static listActiveWarnings() {
    return EarlyWarningStore.getAllWarnings()
      .filter(w => w.status !== WARNING_LIFECYCLE.RESOLVED)
      .map(w => this.#serializeWarning(w));
  }

  static #serializeWarning(w) {
    const count = Array.isArray(w.distinctReporters) ? w.distinctReporters.length : (w.distinctReporterCount || 1);
    return Object.freeze({
      warningId: w.warningId,
      category: w.category,
      title: w.title,
      summary: w.summary,
      affectedEntity: w.affectedEntity,
      status: w.status,
      reportCount: w.reportCount,
      distinctReporterCount: count,
      firstReportedAt: new Date(w.firstReportedAt).toISOString(),
      lastReportedAt: new Date(w.lastReportedAt).toISOString(),
      officialVerificationStatus: w.officialVerificationStatus,
      confidence: w.confidence,
      remediationAction: w.remediationAction
    });
  }

  /**
   * Clear warnings for testing
   */
  static clear() {
    EarlyWarningStore.clear();
  }
}
