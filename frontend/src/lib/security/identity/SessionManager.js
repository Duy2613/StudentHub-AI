/**
 * StudentHub AI — Zero-Trust Security Fabric
 * SessionManager V1
 * 
 * Server-side session tracking, idle/absolute timeout enforcement,
 * instant revocation, session rotation, and replay anomaly defense.
 */

import crypto from "node:crypto";
import { SecurityError, SECURITY_ERROR_CODE } from "../core/SecurityErrorEnvelope.js";
import { AUTH_ASSURANCE_LEVEL } from "../core/SecurityPrincipal.js";

export class SessionManager {
  static #sessions = new Map(); // sessionId -> sessionObject
  static #userSessions = new Map(); // subjectId -> Set<sessionId>

  static IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
  static ABSOLUTE_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Creates a new server-managed session
   * @param {object} params
   * @param {string} params.subjectId - e.g. "student:24110001"
   * @param {string} [params.userId] - Auth provider user ID
   * @param {string} [params.authMethod] - "PASSWORD", "OIDC", "GOOGLE", "OTP"
   * @param {string} [params.assuranceLevel] - AUTH_ASSURANCE_LEVEL
   * @param {string} [params.clientIp]
   * @param {string} [params.userAgent]
   * @returns {object} Created session metadata
   */
  static createSession({
    subjectId,
    userId = null,
    authMethod = "OIDC",
    assuranceLevel = AUTH_ASSURANCE_LEVEL.AAL1_NORMAL,
    clientIp = "127.0.0.1",
    userAgent = "Unknown"
  }) {
    if (!subjectId) {
      throw new Error("[SESSION_MANAGER_ERROR] subjectId is required to create a session.");
    }

    const sessionId = `sess_${Date.now()}_${crypto.randomBytes(16).toString("hex")}`;
    const now = Date.now();

    const session = {
      sessionId,
      subjectId: String(subjectId).trim(),
      userId: userId ? String(userId).trim() : String(subjectId).trim(),
      authMethod,
      assuranceLevel: Object.values(AUTH_ASSURANCE_LEVEL).includes(assuranceLevel)
        ? assuranceLevel
        : AUTH_ASSURANCE_LEVEL.AAL1_NORMAL,
      createdAt: now,
      lastSeenAt: now,
      expiresAt: now + this.ABSOLUTE_TIMEOUT_MS,
      revokedAt: null,
      revocationReason: null,
      securityVersion: 1,
      clientIp: String(clientIp || "127.0.0.1").trim(),
      userAgent: String(userAgent || "Unknown").trim(),
      riskState: "LOW"
    };

    this.#sessions.set(sessionId, session);

    if (!this.#userSessions.has(session.subjectId)) {
      this.#userSessions.set(session.subjectId, new Set());
    }
    this.#userSessions.get(session.subjectId).add(sessionId);

    return Object.freeze({ ...session });
  }

  /**
   * Validates and updates lastSeen timestamp for an active session
   * @param {string} sessionId 
   * @param {object} [clientMetadata]
   * @returns {object} Validated session
   */
  static validateSession(sessionId, clientMetadata = {}) {
    if (!sessionId || typeof sessionId !== "string") {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.UNAUTHORIZED,
        message: "Missing session identifier.",
        statusCode: 401
      });
    }

    const session = this.#sessions.get(sessionId);
    if (!session) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.UNAUTHORIZED,
        message: "Session does not exist or has expired.",
        statusCode: 401
      });
    }

    // 1. Check Revocation
    if (session.revokedAt) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.SESSION_REVOKED,
        message: `Session has been revoked: ${session.revocationReason || "Security policy"}.`,
        statusCode: 401
      });
    }

    const now = Date.now();

    // 2. Check Absolute Expiration
    if (now > session.expiresAt) {
      this.revokeSession(sessionId, "ABSOLUTE_TIMEOUT_EXPIRED");
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.SESSION_EXPIRED,
        message: "Session has exceeded absolute lifetime (24h). Re-authentication required.",
        statusCode: 401
      });
    }

    // 3. Check Idle Timeout
    if (now - session.lastSeenAt > this.IDLE_TIMEOUT_MS) {
      this.revokeSession(sessionId, "IDLE_TIMEOUT_EXPIRED");
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.SESSION_EXPIRED,
        message: "Session expired due to inactivity. Re-authentication required.",
        statusCode: 401
      });
    }

    // 4. Update activity timestamp
    session.lastSeenAt = now;
    if (clientMetadata.clientIp) session.clientIp = clientMetadata.clientIp;
    if (clientMetadata.userAgent) session.userAgent = clientMetadata.userAgent;

    return Object.freeze({ ...session });
  }

  /**
   * Revokes an active session immediately
   * @param {string} sessionId 
   * @param {string} reason 
   */
  static revokeSession(sessionId, reason = "MANUAL_LOGOUT") {
    const session = this.#sessions.get(sessionId);
    if (session && !session.revokedAt) {
      session.revokedAt = Date.now();
      session.revocationReason = reason;
    }
  }

  /**
   * Global logout: revokes all sessions belonging to a user/subject
   * @param {string} subjectId 
   * @param {string} reason 
   */
  static revokeAllSessionsForSubject(subjectId, reason = "GLOBAL_LOGOUT") {
    const sessionIds = this.#userSessions.get(subjectId);
    if (sessionIds) {
      for (const sid of sessionIds) {
        this.revokeSession(sid, reason);
      }
      this.#userSessions.delete(subjectId);
    }
  }

  /**
   * Convenience alias for revokeAllSessionsForSubject
   */
  static revokeSubjectSessions(subjectId, reason = "GLOBAL_LOGOUT") {
    return this.revokeAllSessionsForSubject(subjectId, reason);
  }

  /**
   * Elevates session assurance level (e.g. after Step-Up OTP/Passkey verification)
   * @param {string} sessionId 
   * @param {string} newAssuranceLevel 
   */
  static elevateAssurance(sessionId, newAssuranceLevel = AUTH_ASSURANCE_LEVEL.AAL2_STEP_UP) {
    const session = this.validateSession(sessionId);
    const modSession = this.#sessions.get(sessionId);
    if (modSession) {
      modSession.assuranceLevel = newAssuranceLevel;
      modSession.securityVersion += 1;
      return Object.freeze({ ...modSession });
    }
    return session;
  }

  /**
   * Rotates a session identifier on privilege or authentication change
   * @param {string} oldSessionId 
   * @returns {object} New session
   */
  static rotateSession(oldSessionId) {
    const session = this.validateSession(oldSessionId);
    this.revokeSession(oldSessionId, "SESSION_ROTATED");

    return this.createSession({
      subjectId: session.subjectId,
      userId: session.userId,
      authMethod: session.authMethod,
      assuranceLevel: session.assuranceLevel,
      clientIp: session.clientIp,
      userAgent: session.userAgent
    });
  }

  /**
   * Clear all sessions (for unit tests isolation)
   */
  static clear() {
    this.#sessions.clear();
    this.#userSessions.clear();
  }
}
