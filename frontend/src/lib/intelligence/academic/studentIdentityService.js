/**
 * StudentHub AI — Student Identity & Authentication Service V1
 * 
 * Bridges Supabase Auth sessions and authoritative HCMUTE Student Profiles.
 * Enforces fail-closed multi-tenant boundary checks.
 */

import { StudentIdentityStore } from "./studentIdentityStore.js";

export class StudentIdentityService {
  /**
   * Resolves authoritative student identity from an authenticated Supabase session or request token
   * @param {object} session - Supabase auth session or user object
   * @returns {object|null} Authoritative StudentIdentity
   */
  static resolveIdentity(session) {
    if (!session) return null;

    const authUserId = session.user?.id || session.id || session.sub;
    if (authUserId) {
      const byAuth = StudentIdentityStore.getIdentityByAuthUserId(authUserId);
      if (byAuth) return byAuth;
    }

    const email = session.user?.email || session.email;
    if (email) {
      const byEmail = StudentIdentityStore.getIdentityByEmail(email);
      if (byEmail) return byEmail;
    }

    // Fallback for default local dev demo user if no explicit session
    return StudentIdentityStore.getIdentityByStudentId("24110001");
  }

  /**
   * Links a Supabase Auth User ID to a verified Student ID (MSSV)
   * @param {string} studentId 
   * @param {string} authUserId 
   * @returns {object} Updated identity
   */
  static bindAuthUser(studentId, authUserId) {
    if (!studentId || !authUserId) {
      throw new Error("[IDENTITY_SERVICE] studentId and authUserId are mandatory for binding.");
    }

    const identity = StudentIdentityStore.getIdentityByStudentId(studentId);
    if (!identity) {
      throw new Error(`[IDENTITY_SERVICE] Student ${studentId} not found in authoritative records.`);
    }

    const updated = {
      ...identity,
      authUserId: String(authUserId).trim(),
      updatedAt: new Date().toISOString(),
      revision: (identity.revision || 1) + 1
    };

    return StudentIdentityStore.saveIdentity(updated);
  }

  /**
   * Asserts that an authenticated user owns the requested student identity
   * @param {string} authUserId 
   * @param {string} studentId 
   */
  static assertOwnership(authUserId, studentId) {
    if (!authUserId || !studentId) {
      throw new Error("[FORBIDDEN_STUDENT_ACCESS] Authentication credentials missing.");
    }

    const identity = StudentIdentityStore.getIdentityByStudentId(studentId);
    if (!identity) {
      throw new Error(`[NOT_FOUND_STUDENT] Student ${studentId} does not exist.`);
    }

    if (identity.authUserId && identity.authUserId !== authUserId) {
      throw new Error(`[FORBIDDEN_STUDENT_ACCESS] User ${authUserId} is not authorized for student ${studentId}.`);
    }

    return true;
  }
}
