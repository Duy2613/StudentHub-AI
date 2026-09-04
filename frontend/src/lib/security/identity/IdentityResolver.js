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
import { getDurableSessionService } from "./DurableSessionService.js";
import { createSupabaseTokenVerifier } from "./OidcTokenVerifier.js";
import { StudentIdentityStore } from "../../intelligence/academic/studentIdentityStore.js";
import { SecurityError } from "../core/SecurityErrorEnvelope.js";

const tokenValidator = new TokenValidator();

export class IdentityResolver {
  /**
   * Resolves SecurityPrincipal from an incoming HTTP Request
   * @param {Request} request 
   * @param {object} [options]
   * @param {boolean} [options.allowAnonymous] - If true, returns anonymous principal instead of throwing 401
   * @param {string} [options.authMode] - e.g. "AUTH_BOOTSTRAP_SUPABASE"
   * @param {object} [options.verifier] - Optional custom OidcTokenVerifier
   * @returns {Promise<SecurityPrincipal>}
   */
  static async resolvePrincipal(request, { allowAnonymous = false, authMode = null, verifier = null } = {}) {
    if (!request) {
      if (allowAnonymous) return SecurityPrincipal.anonymous();
      throw SecurityError.unauthorized("Missing HTTP request context.");
    }

    const headers = request.headers;
    const authHeader = headers?.get("authorization") || headers?.get("Authorization");
    const cookieHeader = headers?.get("cookie") || "";

    // 0. AUTH_BOOTSTRAP_SUPABASE: Specialized bootstrap authorization boundary
    // Accepts verified upstream Supabase Bearer token before a StudentHub durable session exists.
    if (authMode === "AUTH_BOOTSTRAP_SUPABASE") {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        throw new SecurityError({
          code: "AUTH_BOOTSTRAP_TOKEN_MISSING",
          message: "Authorization Bearer token is required for auth bootstrap.",
          statusCode: 401
        });
      }
      const rawToken = authHeader.slice(7).trim();
      if (!rawToken) {
        throw new SecurityError({
          code: "AUTH_BOOTSTRAP_TOKEN_MISSING",
          message: "Authorization Bearer token is required for auth bootstrap.",
          statusCode: 401
        });
      }
      return await this.resolveFromSupabaseBootstrap(rawToken, { verifier });
    }

    // 1. The server-owned session cookie is authoritative whenever present.
    // Never let a second credential override a valid/revoked cookie, and never
    // fall back to a bearer token when the cookie is malformed or invalid.
    const hasApplicationCookie = this.#hasCookie(cookieHeader, "studenthub_session");
    const hasProviderCookie = this.#hasCookie(cookieHeader, "sb-access-token");
    const sessionCookie = hasApplicationCookie
      ? this.#extractCookie(cookieHeader, "studenthub_session")
      : hasProviderCookie
        ? this.#extractCookie(cookieHeader, "sb-access-token")
        : null;

    if (hasApplicationCookie || hasProviderCookie) {
      if (!sessionCookie) {
        throw SecurityError.unauthorized("Malformed session cookie.");
      }
      // Legacy in-memory sessions exist only as an explicit local migration escape hatch.
      // Production must never silently fall back to restart-volatile authentication.
      if (sessionCookie.startsWith("sess_") &&
          process.env.NODE_ENV !== "production" &&
          process.env.STUDENTHUB_ALLOW_LEGACY_SESSIONS === "true") {
        return this.resolveFromSessionId(sessionCookie);
      }
      try {
        return await this.resolveFromDurableSession(sessionCookie);
      } catch (error) {
        if (error instanceof SecurityError) throw error;
        throw new SecurityError({
          code: "DATABASE_UNAVAILABLE",
          message: "Authentication service is temporarily unavailable.",
          statusCode: 503
        });
      }
    }

    // 2. Bearer remains a compatibility path for stateless integrations only
    // when no session cookie was supplied at all.
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const rawToken = authHeader.slice(7).trim();
      return this.resolveFromToken(rawToken);
    }

    // 3. Unauthenticated request
    if (allowAnonymous) {
      return SecurityPrincipal.anonymous();
    }

    throw SecurityError.unauthorized("Authentication token or session cookie is required.");
  }

  /**
   * Resolves a bootstrap principal from a verified Supabase bearer token
   * @param {string} tokenString
   * @param {object} [options]
   * @param {object} [options.verifier]
   * @returns {Promise<SecurityPrincipal>}
   */
  static async resolveFromSupabaseBootstrap(tokenString, { verifier = null } = {}) {
    const activeVerifier = verifier || createSupabaseTokenVerifier();
    const identity = await activeVerifier.verify(tokenString);

    let roles = ["STUDENT"];
    try {
      const { getPostgresPool } = await import("../../server/database/PostgresPool.js");
      const pool = getPostgresPool();
      const roleRes = await pool.query(`
        select coalesce(array_agg(r.code order by r.code), array['STUDENT']::text[]) as roles
        from private.user_roles ur join private.roles r on r.id=ur.role_id
        where ur.user_id=$1 and ur.revoked_at is null
      `, [identity.userId]);
      if (roleRes.rows[0]?.roles?.length) {
        roles = roleRes.rows[0].roles;
      }
    } catch {
      // Safe fallback if database pool is unavailable in unit test harness
    }

    let principalType = PRINCIPAL_TYPE.STUDENT;
    if (roles.includes("ADMIN")) principalType = PRINCIPAL_TYPE.ADMIN;
    else if (roles.includes("MODERATOR")) principalType = PRINCIPAL_TYPE.MODERATOR;
    else if (roles.includes("EXPERT")) principalType = PRINCIPAL_TYPE.EXPERT;
    else if (roles.includes("SERVICE")) principalType = PRINCIPAL_TYPE.SYSTEM;

    return new SecurityPrincipal({
      subjectId: String(identity.userId),
      principalType,
      email: identity.email || "",
      roles,
      permissions: this.#deriveDefaultPermissions(principalType),
      scopes: ["auth:bootstrap", "academic:read", "academic:plan", "community:read", "trust:read"],
      sessionId: null,
      assuranceLevel: AUTH_ASSURANCE_LEVEL.AAL1_NORMAL,
      attributes: {
        authProvider: "supabase",
        emailVerified: identity.emailVerified === true,
        rawToken: tokenString,
        jti: identity.jti,
        amr: identity.amr,
      }
    });
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
    let attributes = {
      ...payload.attributes,
      emailVerified: payload.email_verified === true || payload.user_metadata?.email_verified === true
    };
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

  static async resolveFromDurableSession(sessionSecret) {
    const session = await getDurableSessionService().validateSession(sessionSecret);
    const roles = Array.isArray(session.roles) && session.roles.length ? session.roles : ["STUDENT"];
    let principalType = PRINCIPAL_TYPE.STUDENT;
    if (roles.includes("ADMIN")) principalType = PRINCIPAL_TYPE.ADMIN;
    else if (roles.includes("MODERATOR")) principalType = PRINCIPAL_TYPE.MODERATOR;
    else if (roles.includes("EXPERT")) principalType = PRINCIPAL_TYPE.EXPERT;
    else if (roles.includes("SERVICE")) principalType = PRINCIPAL_TYPE.SYSTEM;

    return new SecurityPrincipal({
      subjectId: String(session.user_id || session.userId),
      principalType,
      roles,
      permissions: this.#deriveDefaultPermissions(principalType),
      scopes: ["academic:read", "academic:plan", "community:read", "trust:read"],
      sessionId: "opaque-cookie",
      assuranceLevel: AUTH_ASSURANCE_LEVEL.AAL1_NORMAL,
      attributes: { authProvider: "supabase" }
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
    if (!match) return null;
    try {
      return decodeURIComponent(match[1]);
    } catch {
      // Malformed percent-encoding must fail closed as an absent credential,
      // never escape as an unhandled parser exception.
      return null;
    }
  }

  static #hasCookie(cookieHeader, name) {
    if (!cookieHeader) return false;
    return new RegExp(`(?:^|;\\s*)${name}=`).test(cookieHeader);
  }
}
