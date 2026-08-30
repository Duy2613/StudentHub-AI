/**
 * StudentHub AI — Security Fabric Token & Session Test Suite
 */

import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

import { TokenValidator } from "../../src/lib/security/identity/TokenValidator.js";
import { SessionManager } from "../../src/lib/security/identity/SessionManager.js";
import { AUTH_ASSURANCE_LEVEL } from "../../src/lib/security/core/SecurityPrincipal.js";
import { SECURITY_ERROR_CODE } from "../../src/lib/security/core/SecurityErrorEnvelope.js";

describe("Security Fabric — Token & Session Validation", () => {
  const secretKey = "test-token-secret-key-32bytes-secure-seed-value";
  const validator = new TokenValidator({
    expectedIssuer: "https://studenthub.ai",
    expectedAudience: "studenthub-api",
    secretOrKey: secretKey
  });

  beforeEach(() => {
    SessionManager.clear();
  });

  describe("TokenValidator", () => {
    it("should issue and validate a well-formed JWT token", () => {
      const token = validator.signToken({
        sub: "student:24110001",
        email: "24110001@student.hcmute.edu.vn",
        roles: ["student"],
        scopes: ["academic:read", "academic:plan"]
      }, { expiresInSeconds: 1800 });

      const decoded = validator.validateToken(token);
      assert.strictEqual(decoded.sub, "student:24110001");
      assert.strictEqual(decoded.email, "24110001@student.hcmute.edu.vn");
      assert.strictEqual(decoded.iss, "https://studenthub.ai");
      assert.strictEqual(decoded.aud, "studenthub-api");
    });

    it("should reject token with algorithm 'none'", () => {
      const header = Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString("base64url");
      const payload = Buffer.from(JSON.stringify({ sub: "student:24110001" })).toString("base64url");
      const unsignedToken = `${header}.${payload}.`;

      assert.throws(
        () => validator.validateToken(unsignedToken),
        (err) => {
          assert.strictEqual(err.code, SECURITY_ERROR_CODE.INVALID_TOKEN_SIGNATURE);
          return true;
        }
      );
    });

    it("should reject token with wrong issuer", () => {
      const foreignToken = validator.signToken({
        sub: "student:24110001",
        iss: "https://untrusted-auth-server.com"
      });

      assert.throws(
        () => validator.validateToken(foreignToken, { issuer: "https://studenthub.ai" }),
        (err) => {
          assert.strictEqual(err.code, SECURITY_ERROR_CODE.INVALID_ISSUER);
          return true;
        }
      );
    });

    it("should reject signed tokens missing mandatory issuer or expiration claims", () => {
      const missingIssuer = validator.signToken({
        sub: "student:24110001",
        iss: undefined
      });
      assert.throws(
        () => validator.validateToken(missingIssuer),
        (err) => err.code === SECURITY_ERROR_CODE.INVALID_ISSUER
      );

      const missingExpiration = validator.signToken({
        sub: "student:24110001",
        exp: undefined
      });
      assert.throws(
        () => validator.validateToken(missingExpiration),
        (err) => err.code === SECURITY_ERROR_CODE.UNAUTHORIZED
      );
    });

    it("should reject expired token", () => {
      const expiredToken = validator.signToken({
        sub: "student:24110001"
      }, { expiresInSeconds: -60 });

      assert.throws(
        () => validator.validateToken(expiredToken),
        (err) => {
          assert.strictEqual(err.code, SECURITY_ERROR_CODE.TOKEN_EXPIRED);
          return true;
        }
      );
    });
  });

  describe("SessionManager", () => {
    it("should create, validate, and track session activity", () => {
      const session = SessionManager.createSession({
        subjectId: "student:24110001",
        authMethod: "GOOGLE",
        assuranceLevel: AUTH_ASSURANCE_LEVEL.AAL1_NORMAL
      });

      assert.ok(session.sessionId.startsWith("sess_"));
      assert.strictEqual(session.subjectId, "student:24110001");
      assert.strictEqual(session.revokedAt, null);

      const validated = SessionManager.validateSession(session.sessionId);
      assert.strictEqual(validated.sessionId, session.sessionId);
    });

    it("should revoke session and reject subsequent requests", () => {
      const session = SessionManager.createSession({
        subjectId: "student:24110001"
      });

      SessionManager.revokeSession(session.sessionId, "COMPROMISE_DETECTED");

      assert.throws(
        () => SessionManager.validateSession(session.sessionId),
        (err) => {
          assert.strictEqual(err.code, SECURITY_ERROR_CODE.SESSION_REVOKED);
          return true;
        }
      );
    });

    it("should support global logout across all user sessions", () => {
      const sess1 = SessionManager.createSession({ subjectId: "student:24110001" });
      const sess2 = SessionManager.createSession({ subjectId: "student:24110001" });
      const sessOther = SessionManager.createSession({ subjectId: "student:24110002" });

      SessionManager.revokeAllSessionsForSubject("student:24110001", "PASSWORD_RESET");

      assert.throws(() => SessionManager.validateSession(sess1.sessionId));
      assert.throws(() => SessionManager.validateSession(sess2.sessionId));
      // Other student session remains valid
      const otherValid = SessionManager.validateSession(sessOther.sessionId);
      assert.strictEqual(otherValid.subjectId, "student:24110002");
    });

    it("should elevate assurance level on step-up challenge completion", () => {
      const session = SessionManager.createSession({
        subjectId: "student:24110001",
        assuranceLevel: AUTH_ASSURANCE_LEVEL.AAL1_NORMAL
      });

      const elevated = SessionManager.elevateAssurance(session.sessionId, AUTH_ASSURANCE_LEVEL.AAL2_STEP_UP);
      assert.strictEqual(elevated.assuranceLevel, AUTH_ASSURANCE_LEVEL.AAL2_STEP_UP);
      assert.strictEqual(elevated.securityVersion, 2);
    });
  });
});
