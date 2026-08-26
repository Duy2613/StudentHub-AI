/**
 * StudentHub AI — Canonical Academic Action Intent
 * 
 * Defines typed action intents that connect Academic Insights to concrete,
 * verified student actions with precondition validation and safe routing.
 */

export const ACTION_TYPES = Object.freeze({
  VIEW_DOCUMENT: "VIEW_DOCUMENT",
  OPEN_SOURCE: "OPEN_SOURCE",
  CHECK_ELIGIBILITY: "CHECK_ELIGIBILITY",
  REGISTER: "REGISTER",
  PAY: "PAY",
  UPLOAD_DOCUMENT: "UPLOAD_DOCUMENT",
  SUBMIT_APPLICATION: "SUBMIT_APPLICATION",
  CHECK_STATUS: "CHECK_STATUS",
  VERIFY_INFORMATION: "VERIFY_INFORMATION"
});

export const EXECUTION_MODES = Object.freeze({
  INTERNAL_ROUTE: "INTERNAL_ROUTE",
  EXTERNAL_LINK: "EXTERNAL_LINK",
  SERVER_MUTATION: "SERVER_MUTATION",
  FORM_FLOW: "FORM_FLOW",
  MANUAL_ACTION: "MANUAL_ACTION"
});

// Trusted internal routing paths mapped to action types
export const TRUSTED_INTERNAL_ROUTES = Object.freeze({
  [ACTION_TYPES.CHECK_ELIGIBILITY]: "/academic?view=twin",
  [ACTION_TYPES.REGISTER]: "/credit-scheduler",
  [ACTION_TYPES.PAY]: "/tuition-radar",
  [ACTION_TYPES.UPLOAD_DOCUMENT]: "/academic?action=upload",
  [ACTION_TYPES.SUBMIT_APPLICATION]: "/academic?action=submit",
  [ACTION_TYPES.CHECK_STATUS]: "/academic?view=status",
  [ACTION_TYPES.VERIFY_INFORMATION]: "/profile"
});

export class AcademicActionIntent {
  /**
   * Creates a verified ActionIntent object
   * @param {object} params
   * @returns {object} Canonical ActionIntent
   */
  static createIntent({
    intentId,
    type,
    label,
    description = "",
    target = null,
    executionMode = EXECUTION_MODES.INTERNAL_ROUTE,
    preconditions = [],
    source = null,
    evidence = null,
    metadata = {}
  }) {
    if (!type || !ACTION_TYPES[type]) {
      throw new Error(`[ACTION_INTENT_ERROR] Invalid action type: ${type}`);
    }

    if (!label || typeof label !== "string" || !label.trim()) {
      throw new Error("[ACTION_INTENT_ERROR] Action label is required");
    }

    // Sanitize target URL / route
    const sanitizedTarget = this.sanitizeTarget(type, target, executionMode);

    return Object.freeze({
      intentId: intentId || `INT_${type}_${Date.now()}`,
      type,
      label: label.trim(),
      description: description.trim(),
      target: sanitizedTarget,
      executionMode,
      preconditions: Array.isArray(preconditions) ? Object.freeze([...preconditions]) : Object.freeze([]),
      source: source ? Object.freeze({ ...source }) : null,
      evidence: evidence ? Object.freeze({ ...evidence }) : null,
      metadata: Object.freeze({ ...metadata }),
      createdAt: new Date().toISOString()
    });
  }

  /**
   * Sanitizes target route or URL to prevent dangerous scheme injection
   * @param {string} type 
   * @param {string} target 
   * @param {string} executionMode 
   * @returns {string}
   */
  static sanitizeTarget(type, target, executionMode) {
    if (!target) {
      return TRUSTED_INTERNAL_ROUTES[type] || "/academic";
    }

    const trimmed = String(target).trim();

    if (executionMode === EXECUTION_MODES.EXTERNAL_LINK) {
      // Must be http or https
      if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
        throw new Error(`[SECURITY_VIOLATION] Dangerous scheme in action target: ${trimmed}`);
      }
      return trimmed;
    }

    // For internal routes, must start with /
    if (trimmed.startsWith("/")) {
      return trimmed;
    }

    return TRUSTED_INTERNAL_ROUTES[type] || "/academic";
  }

  /**
   * Evaluates preconditions against a student profile
   * @param {Array} preconditions 
   * @param {object} studentProfile 
   * @returns {{ met: boolean, blockedReasons: string[] }}
   */
  static evaluatePreconditions(preconditions = [], studentProfile = {}) {
    if (!Array.isArray(preconditions) || preconditions.length === 0) {
      return { met: true, blockedReasons: [] };
    }

    const blockedReasons = [];

    for (const cond of preconditions) {
      if (!cond || typeof cond !== "object") continue;

      switch (cond.type) {
        case "MIN_CREDITS":
          if ((studentProfile.earnedCredits || 0) < cond.value) {
            blockedReasons.push(`Bạn cần tích lũy tối thiểu ${cond.value} tín chỉ (hiện tại: ${studentProfile.earnedCredits || 0}).`);
          }
          break;

        case "MIN_GPA":
          if ((studentProfile.cgpa || 0) < cond.value) {
            blockedReasons.push(`Điểm trung bình tích lũy (GPA) cần đạt tối thiểu ${cond.value} (hiện tại: ${studentProfile.cgpa || 0}).`);
          }
          break;

        case "REQUIRE_TUITION_PAID":
          if (studentProfile.tuitionPaid === false) {
            blockedReasons.push("Cần hoàn tất nghĩa vụ học phí trước khi thực hiện bước này.");
          }
          break;

        case "REQUIRED_COURSES":
          if (Array.isArray(cond.courses)) {
            const completed = new Set(studentProfile.completedCourses || []);
            const missing = cond.courses.filter(c => !completed.has(c));
            if (missing.length > 0) {
              blockedReasons.push(`Cần hoàn thành các học phần tiên quyết: ${missing.join(", ")}.`);
            }
          }
          break;

        case "ENGLISH_CERTIFICATE":
          const cert = studentProfile.englishCertificate;
          if (!cert || (cert.score || 0) < cond.minScore) {
            blockedReasons.push(`Chuẩn đầu ra Ngoại ngữ yêu cầu tối thiểu ${cond.minScore} điểm (hiện tại: ${cert ? cert.score : 0}).`);
          }
          break;

        default:
          // Custom check if validator is supplied
          if (typeof cond.evaluate === "function") {
            const result = cond.evaluate(studentProfile);
            if (!result.met) {
              blockedReasons.push(result.reason || "Điều kiện chưa được đáp ứng.");
            }
          }
          break;
      }
    }

    return {
      met: blockedReasons.length === 0,
      blockedReasons
    };
  }
}
