/**
 * StudentHub AI — Zero-Trust Security Fabric
 * PurposeValidator V1
 * 
 * Enforces explicit purpose binding on sensitive operations:
 * - Prevents silent permission expansion
 * - Rejects UNKNOWN or mismatched purpose declarations
 */

import { SecurityError, SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";

export const ALLOWED_PURPOSES = Object.freeze({
  ACADEMIC_PLANNING: "ACADEMIC_PLANNING",
  PROFILE_VIEW: "PROFILE_VIEW",
  TRUST_ANALYSIS: "TRUST_ANALYSIS",
  COMMUNITY_MODERATION: "COMMUNITY_MODERATION",
  EXPORT_REQUEST: "EXPORT_REQUEST",
  SECURITY_OPERATION: "SECURITY_OPERATION",
  AI_ASSISTANCE: "AI_ASSISTANCE",
  GENERAL_OPERATION: "GENERAL_OPERATION"
});

const ACTION_ALLOWED_PURPOSES = {
  "READ_TRANSCRIPT": [ALLOWED_PURPOSES.ACADEMIC_PLANNING, ALLOWED_PURPOSES.PROFILE_VIEW, ALLOWED_PURPOSES.EXPORT_REQUEST],
  "PLAN_SEMESTER": [ALLOWED_PURPOSES.ACADEMIC_PLANNING, ALLOWED_PURPOSES.AI_ASSISTANCE],
  "EXPORT_TRANSCRIPT": [ALLOWED_PURPOSES.EXPORT_REQUEST],
  "DISCREPANCY_REPORT": [ALLOWED_PURPOSES.ACADEMIC_PLANNING, ALLOWED_PURPOSES.PROFILE_VIEW],
  "EVALUATE_TRUST": [ALLOWED_PURPOSES.TRUST_ANALYSIS, ALLOWED_PURPOSES.AI_ASSISTANCE],
  "MODERATE_POST": [ALLOWED_PURPOSES.COMMUNITY_MODERATION],
  "MANAGE_SECURITY": [ALLOWED_PURPOSES.SECURITY_OPERATION]
};

export class PurposeValidator {
  /**
   * Asserts purpose validity for a target action
   * @param {string} action 
   * @param {string} declaredPurpose 
   */
  static assertPurposeValid(action = "", declaredPurpose = "") {
    const cleanAction = String(action || "").trim().toUpperCase();
    const cleanPurpose = String(declaredPurpose || "").trim().toUpperCase();

    if (!cleanPurpose || cleanPurpose === "UNKNOWN") {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.PURPOSE_NOT_ALLOWED,
        message: `Explicit purpose declaration is required for action '${cleanAction}'. Received: '${cleanPurpose || "NONE"}'.`,
        statusCode: 403
      });
    }

    const allowed = ACTION_ALLOWED_PURPOSES[cleanAction];
    if (allowed && !allowed.includes(cleanPurpose)) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.PURPOSE_NOT_ALLOWED,
        message: `Purpose '${cleanPurpose}' is not permitted for action '${cleanAction}'. Permitted: [${allowed.join(", ")}].`,
        statusCode: 403
      });
    }

    return true;
  }
}
