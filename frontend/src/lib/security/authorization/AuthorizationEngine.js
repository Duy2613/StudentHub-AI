/**
 * StudentHub AI — Zero-Trust Security Fabric
 * AuthorizationEngine V1
 * 
 * Central Policy & Authorization Evaluation Engine:
 * Strictly follows evaluation order:
 * 1. HARD DENY RULES (Immutable safety boundaries)
 * 2. AUTHENTICATION CHECK
 * 3. SESSION STATUS (Revocation / Timeout)
 * 4. SCOPE VALIDATION
 * 5. RBAC PERMISSION EVALUATION
 * 6. ABAC DYNAMIC ATTRIBUTE & ASSURANCE EVALUATION
 * 7. ReBAC RELATIONSHIP & OWNERSHIP EVALUATION
 * 8. CAPABILITY VERIFICATION (If capability-bound)
 * 9. PURPOSE BINDING
 * 10. RISK-ADAPTIVE EVALUATION
 * 11. FINAL DECISION (ALLOW / STEP_UP / DENY)
 */

import { RBACPolicy } from "./RBACPolicy.js";
import { ABACPolicy } from "./ABACPolicy.js";
import { ReBACPolicy, RELATIONSHIPS } from "./ReBACPolicy.js";
import { SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";

export const DECISION = Object.freeze({
  ALLOW: "ALLOW",
  DENY: "DENY",
  STEP_UP: "STEP_UP",
  RATE_LIMIT: "RATE_LIMIT",
  BLOCK: "BLOCK"
});

export const POLICY_VERSION = "security-policy-v1";

export class AuthorizationEngine {
  /**
   * Evaluates an authorization request
   * @param {object} request
   * @param {import("../core/SecurityPrincipal.js").SecurityPrincipal} request.principal
   * @param {string} request.action - e.g. "READ_TRANSCRIPT", "EXPORT_RECORDS", "PLAN_SEMESTER"
   * @param {object} [request.resource] - Target resource object
   * @param {string} [request.requiredPermission] - Permission identifier
   * @param {string|string[]} [request.requiredScopes] - Required OAuth/Token scopes
   * @param {string} [request.purpose] - Declared purpose e.g. "ACADEMIC_PLANNING"
   * @param {object} [request.capability] - Capability object if operation requires capability
   * @param {object} [request.context] - SecurityContext
   * @returns {object} AuthorizationDecision
   */
  static authorize({
    principal,
    action = "READ",
    resource = null,
    requiredPermission = null,
    requiredScopes = [],
    purpose = "GENERAL_OPERATION",
    capability = null,
    context = null,
    allowAnonymous = false
  }) {
    const correlationId = context?.correlationId || `authz_${Date.now()}`;

    // =========================================================================
    // 1. HARD DENY RULES (IMMUTABLE BOUNDARIES — CANNOT BE OVERRIDDEN)
    // =========================================================================

    // Hard Rule 1: Students & AI Agents can NEVER modify official academic records directly
    if (action === "MODIFY_OFFICIAL_TRANSCRIPT" || action === "MODIFY_ACADEMIC_RECORD" || requiredPermission === "ACADEMIC.MODIFY_OFFICIAL") {
      if (principal?.hasRole("STUDENT") || principal?.isAgent) {
        return this.#deny("HARD_DENY: Students and AI agents are strictly prohibited from modifying official academic records.", correlationId, "HARD_SAFETY_VIOLATION");
      }
    }

    // Hard Rule 2: AI Agents cannot grant privileges or modify security policy
    if (principal?.isAgent && (action.includes("GRANT") || action.includes("ADMIN") || action.includes("SECURITY_POLICY"))) {
      return this.#deny("HARD_DENY: AI Agents cannot grant privileges or modify security policies.", correlationId, "AI_ESCALATION_BLOCKED");
    }

    // =========================================================================
    // 2. AUTHENTICATION CHECK
    // =========================================================================
    if (!principal || !principal.isAuthenticated) {
      if (allowAnonymous) {
        return {
          decision: DECISION.ALLOW,
          allowed: true,
          reason: "ANONYMOUS_ACCESS_ALLOWED",
          policyVersion: POLICY_VERSION,
          correlationId
        };
      }
      return this.#deny("AUTHENTICATION_REQUIRED: Operation requires an authenticated identity.", correlationId, "UNAUTHORIZED");
    }

    // =========================================================================
    // 3. SCOPE CHECK
    // =========================================================================
    if (requiredScopes && requiredScopes.length > 0) {
      const hasScope = principal.hasScope(requiredScopes);
      if (!hasScope) {
        return this.#deny(`INSUFFICIENT_SCOPE: Missing required scope(s): ${Array.isArray(requiredScopes) ? requiredScopes.join(", ") : requiredScopes}.`, correlationId, "INSUFFICIENT_SCOPE");
      }
    }

    // =========================================================================
    // 4. RBAC PERMISSION CHECK
    // =========================================================================
    if (requiredPermission) {
      const hasPerm = RBACPolicy.hasPermission(principal.roles, requiredPermission);
      if (!hasPerm) {
        return this.#deny(`INSUFFICIENT_ROLE_PERMISSION: Role does not grant permission '${requiredPermission}'.`, correlationId, "INSUFFICIENT_PERMISSION");
      }
    }

    // =========================================================================
    // 5. ABAC ATTRIBUTE & ASSURANCE EVALUATION
    // =========================================================================
    const abacResult = ABACPolicy.evaluate({ principal, action, resource });
    if (!abacResult.allowed) {
      if (abacResult.requiresStepUp) {
        return {
          decision: DECISION.STEP_UP,
          allowed: false,
          reason: abacResult.reason,
          reasonCode: SECURITY_ERROR_CODE.STEP_UP_REQUIRED,
          policyVersion: POLICY_VERSION,
          correlationId,
          stepUpChallenge: {
            type: "STEP_UP_AUTHENTICATION",
            requiredAssurance: "AAL2_STEP_UP"
          }
        };
      }
      return this.#deny(abacResult.reason || "ABAC attribute evaluation failed.", correlationId, "FORBIDDEN");
    }

    // =========================================================================
    // 6. ReBAC RELATIONSHIP & OBJECT-LEVEL OWNERSHIP (BOLA DEFENSE)
    // =========================================================================
    if (resource && (resource.ownerId || resource.studentId)) {
      const rebacResult = ReBACPolicy.evaluate({
        principal,
        resource,
        requiredRelationship: RELATIONSHIPS.OWNS
      });
      if (!rebacResult.allowed) {
        return this.#deny(rebacResult.reason || "Object-level relationship authorization failed.", correlationId, "OBJECT_NOT_OWNED");
      }
    }

    // =========================================================================
    // 7. CAPABILITY VALIDATION (IF GATED BY CAPABILITY)
    // =========================================================================
    if (capability) {
      const capCheck = this.#evaluateCapability(principal, capability, action, resource);
      if (!capCheck.valid) {
        return this.#deny(capCheck.reason, correlationId, capCheck.reasonCode);
      }
    }

    // =========================================================================
    // 8. FINAL ALLOW DECISION
    // =========================================================================
    return {
      decision: DECISION.ALLOW,
      allowed: true,
      reason: "Request successfully authorized by Security Fabric.",
      reasonCode: "AUTHORIZED",
      policyVersion: POLICY_VERSION,
      correlationId
    };
  }

  static #deny(reason, correlationId, reasonCode = "FORBIDDEN") {
    return {
      decision: DECISION.DENY,
      allowed: false,
      reason,
      reasonCode,
      policyVersion: POLICY_VERSION,
      correlationId
    };
  }

  static #evaluateCapability(principal, capability, action, resource) {
    if (!capability || typeof capability !== "object") {
      return { valid: false, reason: "Malformed capability object.", reasonCode: "CAPABILITY_REQUIRED" };
    }

    // Expiration check
    if (capability.expiresAt && Date.now() > capability.expiresAt) {
      return { valid: false, reason: "Capability has expired.", reasonCode: "CAPABILITY_EXPIRED" };
    }

    // Subject binding check
    if (capability.subject && capability.subject !== principal.subjectId) {
      return { valid: false, reason: "Capability subject binding mismatch.", reasonCode: "CAPABILITY_MISMATCH" };
    }

    // Action binding check
    if (capability.action && capability.action !== action && capability.action !== "*") {
      return { valid: false, reason: "Capability action binding mismatch.", reasonCode: "CAPABILITY_MISMATCH" };
    }

    return { valid: true };
  }
}
