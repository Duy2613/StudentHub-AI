/**
 * StudentHub AI — Zero-Trust Security Fabric
 * ABACPolicy V1
 * 
 * Attribute-Based Access Control evaluator:
 * - Dynamic attribute inspection (subject, resource, action, environment, assurance)
 * - Evaluates multi-attribute constraints (e.g. AAL assurance, tenant isolation, sensitivity)
 */

import { AUTH_ASSURANCE_LEVEL } from "../core/SecurityPrincipal.js";

export class ABACPolicy {
  /**
   * Evaluates dynamic attribute rules
   * @param {object} params
   * @param {object} params.principal
   * @param {string} params.action - e.g. "READ", "EXPORT", "MODIFY"
   * @param {object} params.resource - Resource metadata
   * @param {object} [params.environment]
   * @returns {{ allowed: boolean, reason?: string }}
   */
  static evaluate({ principal, action, resource, environment = {} }) {
    if (!principal) {
      return { allowed: false, reason: "Missing security principal." };
    }

    // 1. Tenant Boundary Check
    if (resource?.tenantId && principal.tenantId && resource.tenantId !== principal.tenantId) {
      // Admins might cross tenant if explicitly authorized, others strictly rejected
      if (!principal.hasRole("ADMIN")) {
        return { allowed: false, reason: "Cross-tenant access prohibited." };
      }
    }

    // 2. High-Assurance / Step-Up Requirement on Sensitive Actions
    const elevatedActions = ["EXPORT_TRANSCRIPT", "EXPORT_ALL_RECORDS", "CHANGE_SECURITY_SETTINGS", "REVOKE_SESSION"];
    if (elevatedActions.includes(action)) {
      if (principal.assuranceLevel !== AUTH_ASSURANCE_LEVEL.AAL2_STEP_UP &&
          principal.assuranceLevel !== AUTH_ASSURANCE_LEVEL.AAL3_HIGH_ASSURANCE) {
        return {
          allowed: false,
          reason: "STEP_UP_REQUIRED: Elevated authentication assurance (AAL2) required.",
          requiresStepUp: true
        };
      }
    }

    // 3. Resource Status Checks (e.g. locked or archived records)
    if (resource?.isLocked && !principal.hasRole("ADMIN")) {
      return { allowed: false, reason: "Resource is locked against mutations." };
    }

    return { allowed: true };
  }
}
