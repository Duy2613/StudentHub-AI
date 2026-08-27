/**
 * StudentHub AI — Zero-Trust Security Fabric
 * IdentityResolver V1
 * 
 * Resolves authoritative SecurityPrincipal from authenticated server context:
 * - NEVER trusts client-supplied studentId/role in query or body
 * - Verifies Bearer tokens and Session cookies cryptographically
 * - Maps authenticated subject to Student/Expert/Admin domain identity
 */

import { SecurityPrincipal, PRINCIPAL_TYPE, AUTH_ASSURANCE_LEVEL } from "../core/SecurityPrincipal.js";
import { TokenValidator } from "./TokenValidator.js";
import { SessionManager } from "./SessionManager.js";
import { StudentIdentityStore } from "../../intelligence/academic/studentIdentityStore.js";
import { SecurityError, SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";

const tokenValidator = new TokenValidator();

export class IdentityResolver {
  /**
   * Resolves SecurityPrincipal from an incoming HTTP Request
   * @param {Request} request 
   * @param {object} [options]
   * @param {boolean} [options.allowAnonymous] - If true, returns anonymous principal instead of throwing 401
   * @returns {SecurityPrincipal}
   */
  static resolvePrincipal(request, { allowAnonymous = false } = {}) {
    if (!request) {
      if (allowAnonymous) return SecurityPrincipal.anonymous();
      throw SecurityError.unauthorized("Missing HTTP request context.");
    }

    const headers = request.headers;
    const authHeader = headers?.get("authorization") || headers?.get("Authorization");
    const cookieHeader = headers?.get("cookie") || "";

    // 1. Try Bearer Token in Authorization Header
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const rawToken = authHeader.slice(7).trim();
      return this.resolveFromToken(rawToken);
    }

    // 2. Try Session Cookie (e.g. sb-access-token, studenthub_session)
    const sessionCookie = this.#extractCookie(cookieHeader, "studenthub_session") ||
                          this.#extractCookie(cookieHeader, "sb-access-token");
                          
    if (sessionCookie) {
      // Check if cookie is a JWT or SessionId
      if (sessionCookie.startsWith("sess_")) {
        return this.resolveFromSessionId(sessionCookie);
      }
      return this.resolveFromToken(sessionCookie);
    }

    // 3. Unauthenticated request
    if (allowAnonymous) {
      return SecurityPrincipal.anonymous();
    }

    throw SecurityError.unauthorized("Authentication token or session cookie is required.");
  }

  /**
   * Resolves principal from a verified JWT token
   * @param {string} tokenString 
   * @returns {SecurityPrincipal}
   */
  static resolveFromToken(tokenString) {
    const payload = tokenValidator.validateToken(tokenString);
    const sub = payload.sub; // e.g. "student:24110001", "usr_99", "admin:01"
    const email = payload.email || "";

    // Parse role and principal type
    let principalType = PRINCIPAL_TYPE.STUDENT;
    let roles = payload.roles || (payload.role ? [payload.role] : ["student"]);
    
    if (roles.includes("admin") || roles.includes("ADMIN")) {
      principalType = PRINCIPAL_TYPE.ADMIN;
    } else if (roles.includes("expert") || roles.includes("EXPERT")) {
      principalType = PRINCIPAL_TYPE.EXPERT;
    } else if (roles.includes("ai_agent") || roles.includes("AI_AGENT") || payload.is_agent) {
      principalType = PRINCIPAL_TYPE.AI_AGENT;
    }

    // Standardize subjectId
    let studentId = null;
    if (sub.startsWith("student:")) {
      studentId = sub.replace("student:", "").trim();
    } else if (/^\d{8}$/.test(sub)) {
      studentId = sub;
    }

    // Look up authoritative identity in store if student
    let attributes = { ...payload.attributes };
    if (studentId) {
      const identity = StudentIdentityStore.getIdentityByStudentId(studentId);
      if (identity) {
        attributes = {
          ...attributes,
          cohort: identity.cohort,
          programCode: identity.programCode,
          faculty: identity.faculty,
          fullName: identity.fullName
        };
      }
    }

    return new SecurityPrincipal({
      subjectId: sub,
      principalType,
      email,
      roles,
      permissions: payload.permissions || this.#deriveDefaultPermissions(principalType),
      scopes: payload.scopes || payload.scope?.split(" ") || ["academic:read", "community:read", "trust:read"],
      tenantId: payload.tenantId || "hcmute",
      assuranceLevel: payload.aal || (payload.amr?.includes("mfa") ? AUTH_ASSURANCE_LEVEL.AAL2_STEP_UP : AUTH_ASSURANCE_LEVEL.AAL1_NORMAL),
      sessionId: payload.sid || null,
      agentIdentity: payload.agent ? { agentId: payload.agent.id, type: payload.agent.type } : null,
      attributes
    });
  }

  /**
   * Resolves principal from an active server Session ID
   * @param {string} sessionId 
   * @returns {SecurityPrincipal}
   */
  static resolveFromSessionId(sessionId) {
    const session = SessionManager.validateSession(sessionId);
    const sub = session.subjectId;

    let principalType = PRINCIPAL_TYPE.STUDENT;
    if (sub.startsWith("admin:")) principalType = PRINCIPAL_TYPE.ADMIN;
    if (sub.startsWith("expert:")) principalType = PRINCIPAL_TYPE.EXPERT;

    return new SecurityPrincipal({
      subjectId: sub,
      principalType,
      email: "",
      roles: [principalType.toLowerCase()],
      permissions: this.#deriveDefaultPermissions(principalType),
      scopes: ["academic:read", "academic:plan", "community:read", "trust:read"],
      tenantId: "hcmute",
      assuranceLevel: session.assuranceLevel,
      sessionId: session.sessionId
    });
  }

  /**
   * Derives baseline permissions for a role
   * @param {string} principalType 
   * @returns {string[]}
   */
  static #deriveDefaultPermissions(principalType) {
    switch (principalType) {
      case PRINCIPAL_TYPE.ADMIN:
        return ["ACADEMIC.READ", "ACADEMIC.WRITE", "ADMIN.SECURITY", "TRUST.MANAGE", "AUDIT.READ", "*"];
      case PRINCIPAL_TYPE.EXPERT:
        return ["ACADEMIC.READ", "EXPERT.PUBLISH", "EXPERT.EVALUATE", "COMMUNITY.READ", "TRUST.READ"];
      case PRINCIPAL_TYPE.MODERATOR:
        return ["COMMUNITY.READ", "COMMUNITY.MODERATE", "TRUST.READ"];
      case PRINCIPAL_TYPE.AI_AGENT:
        return ["ACADEMIC.READ", "ACADEMIC.PLAN", "TRUST.EVALUATE"];
      case PRINCIPAL_TYPE.STUDENT:
      default:
        return [
          "ACADEMIC.READ_OWN",
          "ACADEMIC.PLAN_OWN",
          "COMMUNITY.READ",
          "COMMUNITY.POST",
          "TRUST.READ"
        ];
    }
  }

  static #extractCookie(cookieHeader, name) {
    if (!cookieHeader) return null;
    const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }
}
