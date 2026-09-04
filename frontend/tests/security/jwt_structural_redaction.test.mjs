/**
 * StudentHub AI — JWT Structural Redaction & Secret Closure Test Suite
 * 
 * Verifies:
 * 1. Bounded structural detection of JWTs (RFC 7519 / RFC 7515).
 * 2. Short synthetic signatures (e.g. 1-char, 3-char) are properly detected without arbitrary length thresholds.
 * 3. False-positive immunity for ordinary dotted strings (version.1.2.3, domain.com.vn, 192.168.1.1).
 * 4. Structural rejection of 2-segment and 4-segment strings.
 * 5. Malformed JWT handling (invalid Base64URL, undecodable JSON headers).
 * 6. Resource exhaustion protection against huge unbounded segments.
 * 7. Embedded JWT redaction in arbitrary log messages and Unicode text.
 * 8. Explicit key name redaction (authorization, token, accessToken, refreshToken, jwt, cookie, session).
 * 9. Absolute zero token leakage in sanitized outbox envelopes.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  SecurityOutboxTransformer,
  isStructuralJwt,
  redactJwts,
} from "../../src/lib/server/outbox/SecurityOutboxTransformer.js";

describe("JWT Structural Redaction & Secret Closure Suite", () => {
  // Helpers to construct test tokens
  function createToken(headerObj, payloadObj, sigStr = "realisticSignature_1234567890abcdef") {
    const h = Buffer.from(JSON.stringify(headerObj)).toString("base64url");
    const p = Buffer.from(JSON.stringify(payloadObj)).toString("base64url");
    return `${h}.${p}.${sigStr}`;
  }

  const validHeader = { alg: "HS256", typ: "JWT" };
  const validPayload = { sub: "user-123", role: "STUDENT", exp: 1893456000 };
  const realisticJwt = createToken(validHeader, validPayload, "dGVzdC1zaWduYXR1cmUtZXhhbXBsZQ");
  const shortSyntheticJwt = createToken(validHeader, validPayload, "s");
  const shortSig3Jwt = createToken(validHeader, validPayload, "sig");
  const emptySigJwt = createToken(validHeader, validPayload, "");

  it("detects realistic and short synthetic JWTs correctly", () => {
    assert.equal(isStructuralJwt(realisticJwt), true, "Realistic JWT must be detected");
    assert.equal(isStructuralJwt(shortSyntheticJwt), true, "Short 1-char synthetic JWT must be detected");
    assert.equal(isStructuralJwt(shortSig3Jwt), true, "Short 3-char signature JWT must be detected");
    assert.equal(isStructuralJwt(emptySigJwt), true, "Unsigned/empty-signature JWT must be detected");

    assert.equal(redactJwts(realisticJwt), "[REDACTED_JWT]");
    assert.equal(redactJwts(shortSyntheticJwt), "[REDACTED_JWT]");
    assert.equal(redactJwts(shortSig3Jwt), "[REDACTED_JWT]");
    assert.equal(redactJwts(emptySigJwt), "[REDACTED_JWT]");
  });

  it("guards against false positives on ordinary dotted strings", () => {
    const falsePositiveCandidates = [
      "version.1.2.3",
      "release.2026.09.final",
      "domain.com.vn",
      "user.profile.picture",
      "192.168.1.1",
      "foo.bar.baz",
      "system.out.println",
      "com.studenthub.security",
    ];

    for (const candidate of falsePositiveCandidates) {
      assert.equal(
        isStructuralJwt(candidate),
        false,
        `Ordinary dotted string "${candidate}" must NOT be detected as JWT`
      );
      assert.equal(
        redactJwts(candidate),
        candidate,
        `Ordinary dotted string "${candidate}" must NOT be redacted`
      );
    }
  });

  it("rejects two-segment and four-segment non-JWT strings", () => {
    const h = Buffer.from(JSON.stringify(validHeader)).toString("base64url");
    const p = Buffer.from(JSON.stringify(validPayload)).toString("base64url");

    const twoSegments = `${h}.${p}`;
    const fourSegments = `${h}.${p}.sig123.extra`;
    const oneSegment = `${h}`;
    const fiveSegments = `${h}.${p}.sig.part4.part5`;

    assert.equal(isStructuralJwt(twoSegments), false, "Two segments must NOT be considered standard JWS");
    assert.equal(isStructuralJwt(fourSegments), false, "Four segments must NOT be considered standard JWS");
    assert.equal(isStructuralJwt(oneSegment), false, "One segment must NOT be considered standard JWS");
    assert.equal(isStructuralJwt(fiveSegments), false, "Five segments must NOT be considered standard JWS");

    assert.equal(redactJwts(twoSegments), twoSegments);
    assert.equal(redactJwts(fourSegments), fourSegments);
  });

  it("rejects malformed JWTs (corrupted base64, invalid JSON headers)", () => {
    const p = Buffer.from(JSON.stringify(validPayload)).toString("base64url");

    // Header is not valid JSON
    const badJsonHeader = Buffer.from("this is not json").toString("base64url");
    assert.equal(isStructuralJwt(`${badJsonHeader}.${p}.sig`), false);

    // Header has no 'alg' or 'typ'
    const nonJwtHeader = Buffer.from(JSON.stringify({ greeting: "hello" })).toString("base64url");
    assert.equal(isStructuralJwt(`${nonJwtHeader}.${p}.sig`), false);

    // Payload is not valid JSON
    const badJsonPayload = Buffer.from("not-json-payload").toString("base64url");
    const h = Buffer.from(JSON.stringify(validHeader)).toString("base64url");
    assert.equal(isStructuralJwt(`${h}.${badJsonPayload}.sig`), false);

    // Invalid base64url characters
    assert.equal(isStructuralJwt(`${h}!@#.${p}.sig`), false);
  });

  it("protects against resource exhaustion on huge segments", () => {
    const hugeSegment = "A".repeat(100_000);
    const candidateHuge = `eyJhbGciOiJIUzI1NiJ9.${hugeSegment}.sig`;

    const start = Date.now();
    const result = isStructuralJwt(candidateHuge);
    const duration = Date.now() - start;

    assert.equal(result, false, "Huge segment must be rejected");
    assert.ok(duration < 50, `Huge segment validation must be bounded and fast (took ${duration}ms)`);
  });

  it("redacts JWTs embedded inside log messages and surrounded by Unicode text", () => {
    const logMsg = `[AUTH_FAIL] IP 203.0.113.5 failed bearer ${realisticJwt} on /api/v1/cases`;
    const redactedLog = redactJwts(logMsg);
    assert.ok(!redactedLog.includes(realisticJwt), "Embedded JWT must not remain in log message");
    assert.ok(redactedLog.includes("[REDACTED_JWT]"), "Log message must contain redaction placeholder");
    assert.ok(redactedLog.startsWith("[AUTH_FAIL] IP 203.0.113.5 failed bearer "), "Log prefix must be intact");

    const unicodeMsg = `Đại học Quốc gia TP.HCM: Đăng nhập với token ${shortSyntheticJwt} đã được phê duyệt`;
    const redactedUnicode = redactJwts(unicodeMsg);
    assert.ok(!redactedUnicode.includes(shortSyntheticJwt), "Embedded synthetic JWT must not remain in Unicode text");
    assert.ok(redactedUnicode.includes("[REDACTED_JWT]"), "Unicode message must contain redaction placeholder");
    assert.ok(redactedUnicode.includes("Đại học Quốc gia TP.HCM: Đăng nhập với token "), "Unicode prefix preserved");
  });

  it("preserves explicit key name redaction for credentials, tokens, sessions, and cookies", () => {
    const rawPayload = {
      authorization: "Bearer secret-token-xyz",
      token: "opaque-bearer-value",
      accessToken: "access-token-123",
      refreshToken: "refresh-token-456",
      jwt: realisticJwt,
      cookie: "session_id=abcdef123456",
      session: "durable_sess_789",
      password: "SuperSecretPassword!",
      passwd: "root-password",
      secret: "api-secret-value",
      api_key: "sk_live_1234567890",
      database_url: "postgres://user:pass@host/db",
      private_key: "-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----",
      // Non-secret key names with sensitive values
      dbConn: "postgres://user:pass@host/db",
      pemKey: "-----BEGIN RSA PRIVATE KEY-----\nMIIE...\n-----END RSA PRIVATE KEY-----",
      // Safe business fields
      student_name: "Nguyễn Văn A",
      case_id: "case-trust-999",
      university: "Đại học Quốc gia Thành phố Hồ Chí Minh",
    };

    const sanitized = SecurityOutboxTransformer.sanitize(rawPayload);

    // Explicit secret key names must be redacted
    assert.equal(sanitized.authorization, "[REDACTED]");
    assert.equal(sanitized.token, "[REDACTED]");
    assert.equal(sanitized.accessToken, "[REDACTED]");
    assert.equal(sanitized.refreshToken, "[REDACTED]");
    assert.equal(sanitized.jwt, "[REDACTED_JWT]");
    assert.equal(sanitized.cookie, "[REDACTED]");
    assert.equal(sanitized.session, "[REDACTED]");
    assert.equal(sanitized.password, "[REDACTED]");
    assert.equal(sanitized.passwd, "[REDACTED]");
    assert.equal(sanitized.secret, "[REDACTED]");
    assert.equal(sanitized.api_key, "[REDACTED]");
    assert.equal(sanitized.database_url, "[REDACTED]");
    assert.equal(sanitized.private_key, "[REDACTED]");

    // Structural value detections under non-secret key names
    assert.equal(sanitized.dbConn, "[REDACTED_DATABASE_URL]");
    assert.equal(sanitized.pemKey, "[REDACTED_PRIVATE_KEY]");

    // Safe fields must remain untouched
    assert.equal(sanitized.student_name, "Nguyễn Văn A");
    assert.equal(sanitized.case_id, "case-trust-999");
    assert.equal(sanitized.university, "Đại học Quốc gia Thành phố Hồ Chí Minh");
  });

  it("ensures no token or secret appears in outbox envelope output", () => {
    const envelope = SecurityOutboxTransformer.createEnvelope({
      payload: {
        note: `Generated session for student with ${realisticJwt}`,
        auth_details: {
          accessToken: "secret-bearer",
          refreshToken: "secret-refresh",
          raw_jwt: shortSyntheticJwt,
          safe_ref: "REF-OK-123",
        },
      },
    });

    const serializedEnvelope = JSON.stringify(envelope);
    assert.ok(!serializedEnvelope.includes(realisticJwt), "Envelope must not leak realistic JWT");
    assert.ok(!serializedEnvelope.includes(shortSyntheticJwt), "Envelope must not leak synthetic JWT");
    assert.ok(!serializedEnvelope.includes("secret-bearer"), "Envelope must not leak access token");
    assert.ok(!serializedEnvelope.includes("secret-refresh"), "Envelope must not leak refresh token");

    assert.equal(envelope.payload.auth_details.accessToken, "[REDACTED]");
    assert.equal(envelope.payload.auth_details.refreshToken, "[REDACTED]");
    assert.equal(envelope.payload.auth_details.raw_jwt, "[REDACTED_JWT]");
    assert.equal(envelope.payload.auth_details.safe_ref, "REF-OK-123");
  });
});
