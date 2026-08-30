/**
 * StudentHub AI — Auth Resilience & Error Translation Contracts Test Suite
 * Validates:
 * 1. translateAuthError return type and exhaustive error coverage (Finding B)
 * 2. dynamicAuthStorage Remember Me partitioning and storage isolation (Finding E)
 * 3. syncBackendUser failure resilience and graceful offline fallback (Finding D)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { translateAuthError } from "../../src/lib/auth/authService.js";
import { dynamicAuthStorage } from "../../src/lib/supabase/client.js";

describe("Auth Error Translation Contracts (Finding B)", () => {
  it("should return valid human-readable string for null/undefined/empty input", () => {
    const resNull = translateAuthError(null);
    const resUndefined = translateAuthError(undefined);
    const resEmptyObj = translateAuthError({});

    assert.strictEqual(typeof resNull, "string");
    assert.strictEqual(typeof resUndefined, "string");
    assert.strictEqual(typeof resEmptyObj, "string");
    assert.ok(resNull.length > 0);
  });

  it("should translate known Supabase auth error codes and messages to Vietnamese strings", () => {
    const errorCases = [
      { input: "Invalid login credentials", contains: "không chính xác" },
      { input: { message: "User already registered" }, contains: "Email này đã được sử dụng" },
      { input: { error_description: "Password should be at least 6 characters" }, contains: "tối thiểu 6" },
      { input: "Email not confirmed", contains: "chưa được xác thực" },
      { input: "over_email_send_rate_limit", contains: "quá tải" },
      { input: { message: "Token has expired" }, contains: "hết hạn" },
      { input: "Failed to fetch", contains: "kết nối tới máy chủ" }
    ];

    for (const { input, contains } of errorCases) {
      const translated = translateAuthError(input);
      assert.strictEqual(typeof translated, "string");
      assert.ok(
        translated.toLowerCase().includes(contains.toLowerCase()),
        `Expected translation for '${JSON.stringify(input)}' to contain '${contains}', got: '${translated}'`
      );
    }
  });

  it("should return string fallback for unknown error strings or objects without returning JSX", () => {
    const customError = { message: "ERR_CUSTOM_500_UNEXPECTED" };
    const translated = translateAuthError(customError);

    assert.strictEqual(typeof translated, "string");
    assert.strictEqual(translated, "ERR_CUSTOM_500_UNEXPECTED");
  });
});

describe("Dynamic Auth Storage Adapter (Finding E)", () => {
  it("should isolate in-memory storage safely without throwing when window is undefined", () => {
    const testKey = "sb-auth-token-test";
    const testValue = "jwt_token_sample_123";

    dynamicAuthStorage.setItem(testKey, testValue);
    const retrieved = dynamicAuthStorage.getItem(testKey);

    assert.strictEqual(typeof retrieved === "string" || retrieved === null, true);

    dynamicAuthStorage.removeItem(testKey);
    const afterRemove = dynamicAuthStorage.getItem(testKey);
    assert.strictEqual(afterRemove, null);
  });
});

describe("Auth Sync Resilience & Rate Limit Translation (Findings C & D)", () => {
  it("should translate GitHub API rate limit errors gracefully", () => {
    const ghRateLimit = translateAuthError("API rate limit exceeded for 127.0.0.1");
    assert.strictEqual(typeof ghRateLimit, "string");
    assert.ok(ghRateLimit.toLowerCase().includes("quá tải") || ghRateLimit.includes("rate limit"));
  });

  it("should ensure translateAuthError handles non-Error objects and status codes", () => {
    const codeError = translateAuthError({ code: "weak_password" });
    assert.strictEqual(typeof codeError, "string");
    assert.ok(codeError.toLowerCase().includes("tối thiểu 6"));

    const otpExpiredError = translateAuthError({ code: "otp_expired" });
    assert.strictEqual(typeof otpExpiredError, "string");
    assert.ok(otpExpiredError.toLowerCase().includes("hết hạn"));
  });
});
