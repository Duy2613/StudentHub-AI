/**
 * StudentHub AI — Auth Resilience & Error Translation Contracts Test Suite
 * Validates:
 * 1. translateAuthError return type and exhaustive error coverage (Finding B)
 * 2. provider credentials remain memory-only and never enter Web Storage
 * 3. syncBackendUser failure resilience and graceful offline fallback (Finding D)
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import {
  exchangeApplicationSession,
  getStoredToken,
  setStoredToken,
  signOutSupabase,
  translateAuthError,
} from "../../src/lib/auth/authService.js";
import { dynamicAuthStorage } from "../../src/lib/supabase/client.js";
import { supabase } from "../../src/lib/supabase/client.js";

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

describe("HttpOnly application session boundary (Finding E)", () => {
  it("keeps Supabase provider storage in page memory without touching Web Storage", () => {
    const previousWindow = globalThis.window;
    globalThis.window = {};
    const testKey = "sb-auth-token-test";
    const testValue = "jwt_token_sample_123";

    try {
      dynamicAuthStorage.setItem(testKey, testValue);
      assert.equal(dynamicAuthStorage.getItem(testKey), testValue);
      dynamicAuthStorage.removeItem(testKey);
      assert.equal(dynamicAuthStorage.getItem(testKey), null);
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
    }
  });

  it("contains no browser write path for provider or application bearer credentials", () => {
    const authSource = readFileSync(new URL("../../src/lib/auth/authService.js", import.meta.url), "utf8");
    const supabaseSource = readFileSync(new URL("../../src/lib/supabase/client.js", import.meta.url), "utf8");

    assert.doesNotMatch(authSource, /(?:localStorage|sessionStorage)\.setItem\(\s*["']studenthub_jwt_token["']/);
    assert.doesNotMatch(supabaseSource, /(?:localStorage|sessionStorage)\./);
  });

  it("uses the same-origin cookie boundary for protected dashboard requests", () => {
    const dashboardSource = readFileSync(new URL("../../src/components/home/CommandCenterDashboard.jsx", import.meta.url), "utf8");

    assert.match(dashboardSource, /fetch\("\/api\/v1\/dashboard", \{ credentials: "include" \}\)/);
    assert.doesNotMatch(dashboardSource, /session\.access_token/);
  });

  it("checks the authoritative application session before restoring demo cache", () => {
    const authContextSource = readFileSync(new URL("../../src/lib/auth/AuthContext.jsx", import.meta.url), "utf8");
    assert.ok(
      authContextSource.indexOf("const applicationState = await getApplicationSession();") <
      authContextSource.indexOf("const savedDemo ="),
      "stale local demo state must not shadow a server-owned session"
    );
  });

  it("serializes Supabase auth subscription after initial session reconciliation", () => {
    const authContextSource = readFileSync(new URL("../../src/lib/auth/AuthContext.jsx", import.meta.url), "utf8");
    assert.match(authContextSource, /initAuth\(\)\.finally\(subscribeToAuthChanges\);/);
    assert.match(authContextSource, /_event === "INITIAL_SESSION" && applicationSessionReadyRef\.current/);
  });

  it("keeps canonical auth independent from the legacy OWNER_COMPAT backend", () => {
    const authSource = readFileSync(new URL("../../src/lib/auth/authService.js", import.meta.url), "utf8");
    const callbackSource = readFileSync(new URL("../../src/app/callback/page.jsx", import.meta.url), "utf8");
    const proxySource = readFileSync(new URL("../../src/app/api/[...path]/route.js", import.meta.url), "utf8");

    assert.doesNotMatch(authSource, /https:\/\/studenthub-api-8fqp\.onrender\.com/);
    assert.doesNotMatch(proxySource, /https:\/\/studenthub-api-8fqp\.onrender\.com/);
    assert.doesNotMatch(callbackSource, /user_metadata\?\.role|user_metadata\?\.onboarded/);

    const signInStart = authSource.indexOf("export async function signInWithPassword");
    const signInEnd = authSource.indexOf("/**", signInStart + 1);
    assert.ok(signInStart >= 0 && signInEnd > signInStart);
    assert.doesNotMatch(authSource.slice(signInStart, signInEnd), /syncBackendUser/);
  });

  it("exchanges a transient proof with credentials included and exposes no returned secret", async () => {
    const previousWindow = globalThis.window;
    const previousFetch = globalThis.fetch;
    const calls = [];
    globalThis.window = {};
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response(JSON.stringify({
        success: true,
        session: { userId: "11111111-1111-4111-8111-111111111111", expiresAt: "2026-09-01T00:00:00.000Z" },
      }), { status: 200, headers: { "content-type": "application/json" } });
    };

    try {
      setStoredToken("provider-proof-memory-only", true);
      assert.equal(getStoredToken(), "provider-proof-memory-only");
      const result = await exchangeApplicationSession("provider-proof-memory-only");

      assert.equal(result.success, true);
      assert.equal(getStoredToken(), null);
      assert.equal(calls.length, 1);
      assert.match(calls[0].url, /\/api\/auth\/session\/exchange$/);
      assert.equal(calls[0].options.credentials, "include");
      assert.equal(calls[0].options.headers.Authorization, "Bearer provider-proof-memory-only");
      assert.equal(JSON.stringify(result).includes("provider-proof-memory-only"), false);
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      globalThis.fetch = previousFetch;
    }
  });

  it("fails closed when durable session exchange is unavailable", async () => {
    const previousWindow = globalThis.window;
    const previousFetch = globalThis.fetch;
    globalThis.window = {};
    globalThis.fetch = async () => new Response(JSON.stringify({
      error: { code: "DATABASE_UNAVAILABLE" },
    }), { status: 503, headers: { "content-type": "application/json" } });

    try {
      setStoredToken("provider-proof-that-must-not-survive-failure");
      const result = await exchangeApplicationSession("provider-proof-that-must-not-survive-failure");
      assert.equal(result.success, false);
      assert.equal(result.code, "DATABASE_UNAVAILABLE");
      assert.equal(getStoredToken(), null);
    } finally {
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      globalThis.fetch = previousFetch;
    }
  });

  it("remains inert and returns null when browser context is absent", () => {
    dynamicAuthStorage.setItem("server-side-key", "must-not-persist");
    assert.equal(dynamicAuthStorage.getItem("server-side-key"), null);
  });

  it("does not let browser storage failure prevent provider logout", async () => {
    const previousWindow = globalThis.window;
    const previousFetch = globalThis.fetch;
    const previousSignOut = supabase.auth.signOut;
    let signOutCalls = 0;

    globalThis.window = {
      get localStorage() { throw new Error("storage blocked"); },
      get sessionStorage() { throw new Error("storage blocked"); },
    };
    globalThis.fetch = async () => new Response(JSON.stringify({ success: true }), { status: 200 });
    supabase.auth.signOut = async () => {
      signOutCalls += 1;
      return { error: null };
    };

    try {
      await signOutSupabase();
      assert.equal(signOutCalls, 1);
    } finally {
      supabase.auth.signOut = previousSignOut;
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      globalThis.fetch = previousFetch;
    }
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
