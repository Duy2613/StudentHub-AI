import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

import {
  AUTH_CAPABILITY_STATE,
  clearAuthProviderDegraded,
  getAuthCapabilities,
  markAuthProviderDegraded,
  resetAuthCapabilityRuntimeForTests,
} from "../../src/lib/auth/authCapabilities.js";
import {
  AUTH_LOGOUT_SIGNAL_KEY,
  sanitizeProfileUpdates,
  signOutSupabase,
  translateAuthError,
} from "../../src/lib/auth/authService.js";
import { supabase } from "../../src/lib/supabase/client.js";
import { AUTH_STATE, canTransitionAuthState } from "../../src/lib/auth/authStateMachine.js";
import { normalizeSubjectId, normalizeUuidSubjectId } from "../../src/lib/security/identity/normalizeSubjectId.js";

const configuredEnv = {
  NEXT_PUBLIC_SUPABASE_URL: "https://auth.example.supabase.co",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "public-test-key",
};

describe("Auth identity closure — capability and state contracts", () => {
  it("reports missing Supabase prerequisites as MISCONFIGURED", () => {
    const capabilities = getAuthCapabilities({});
    assert.equal(capabilities.emailPassword, AUTH_CAPABILITY_STATE.MISCONFIGURED);
    assert.equal(capabilities.google, AUTH_CAPABILITY_STATE.MISCONFIGURED);
    assert.equal(capabilities.supabaseConfigured, false);
  });

  it("reports email/password ready while Google remains disabled until provider configuration is attested", () => {
    const capabilities = getAuthCapabilities(configuredEnv);
    assert.equal(capabilities.emailPassword, AUTH_CAPABILITY_STATE.READY);
    assert.equal(capabilities.google, AUTH_CAPABILITY_STATE.DISABLED);
    assert.equal(capabilities.googleReason, "GOOGLE_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION");
    assert.equal(capabilities.googleAudit.configurationEvidence, "NOT_VERIFIED");
    assert.equal(capabilities.googleAudit.clientIdExpected, true);
    assert.equal(capabilities.googleAudit.clientSecretExpected, true);
    assert.equal(capabilities.googleAudit.clientCredentialsLocation, "SUPABASE_DASHBOARD_ONLY");
    assert.equal(capabilities.googleAudit.expectedProviderCallbackUri, "https://auth.example.supabase.co/auth/v1/callback");
  });

  it("does not treat an unverified public Google flag as READY and supports DEGRADED", () => {
    const unverified = getAuthCapabilities({
      ...configuredEnv,
      NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH: "true",
    });
    assert.equal(unverified.google, AUTH_CAPABILITY_STATE.MISCONFIGURED);
    assert.equal(unverified.googleReason, "GOOGLE_AUTH_CONFIGURATION_UNATTESTED");

    markAuthProviderDegraded("google", "GOOGLE_AUTH_TIMEOUT");
    try {
      assert.equal(getAuthCapabilities({
        ...configuredEnv,
        NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH: "true",
        NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_VERIFIED: "true",
      }).google, AUTH_CAPABILITY_STATE.DEGRADED);
    } finally {
      clearAuthProviderDegraded("google");
      resetAuthCapabilityRuntimeForTests();
    }
  });

  it("defines the required auth states and rejects an impossible transition", () => {
    assert.deepEqual(Object.values(AUTH_STATE).sort(), [
      "AUTHENTICATING",
      "ERROR",
      "INITIALIZING",
      "REFRESHING",
      "SIGNED_IN",
      "SIGNED_OUT",
      "SIGNING_OUT",
    ].sort());
    assert.equal(canTransitionAuthState(AUTH_STATE.INITIALIZING, AUTH_STATE.AUTHENTICATING), true);
    assert.equal(canTransitionAuthState(AUTH_STATE.AUTHENTICATING, AUTH_STATE.SIGNED_IN), true);
    assert.equal(canTransitionAuthState(AUTH_STATE.SIGNED_IN, AUTH_STATE.REFRESHING), true);
    assert.equal(canTransitionAuthState(AUTH_STATE.SIGNED_IN, AUTH_STATE.SIGNING_OUT), true);
    assert.equal(canTransitionAuthState(AUTH_STATE.INITIALIZING, AUTH_STATE.SIGNING_OUT), false);
  });
});

describe("Auth identity closure — normalization and UI safety", () => {
  it("normalizes only typed UUID identities and preserves non-UUID legacy subjects", () => {
    const uuid = "11111111-1111-4111-8111-111111111111";
    assert.equal(normalizeSubjectId(`student:${uuid}`), uuid);
    assert.equal(normalizeSubjectId(`user:${uuid}`), uuid);
    assert.equal(normalizeUuidSubjectId(`expert:${uuid}`), uuid);
    assert.equal(normalizeSubjectId("student:24110001"), "student:24110001");
    assert.equal(normalizeUuidSubjectId("student:24110001"), null);
  });

  it("never returns a raw JSON auth envelope to the UI", () => {
    const translated = translateAuthError({ message: '{"code":"provider_error","message":"secret detail"}' });
    assert.equal(typeof translated, "string");
    assert.equal(translated.includes("provider_error"), false);
    assert.equal(translated.includes("secret detail"), false);
  });

  it("allows only presentation profile fields and never promotes privilege fields", () => {
    assert.deepEqual(sanitizeProfileUpdates({
      fullName: "Sinh viên",
      bio: "Ghi chú an toàn",
      role: "ADMIN",
      trustScore: 100,
      verifiedStudent: true,
      email: "attacker@example.com",
      accessToken: "credential",
    }), {
      fullName: "Sinh viên",
      bio: "Ghi chú an toàn",
    });
  });

  it("emits a credential-free cross-tab logout signal after clearing the application session", async () => {
    const previousWindow = globalThis.window;
    const previousFetch = globalThis.fetch;
    const previousBroadcastChannel = globalThis.BroadcastChannel;
    const previousSignOut = supabase.auth.signOut;
    const values = new Map();
    const storage = {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
    };
    const channels = [];
    const calls = [];

    class TestBroadcastChannel {
      constructor(name) {
        this.name = name;
        this.message = null;
        this.closed = false;
        channels.push(this);
      }

      postMessage(message) {
        this.message = message;
      }

      close() {
        this.closed = true;
      }
    }

    globalThis.window = { localStorage: storage, sessionStorage: storage };
    globalThis.BroadcastChannel = TestBroadcastChannel;
    globalThis.fetch = async (url, options) => {
      calls.push({ url: String(url), options });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    };
    supabase.auth.signOut = async () => ({ error: null });

    try {
      await signOutSupabase();
      assert.equal(calls[0].options.credentials, "include");
      assert.match(calls[0].url, /\/api\/auth\/session\/logout$/);
      assert.equal(channels.length, 1);
      assert.equal(channels[0].name, "studenthub-auth");
      assert.deepEqual(channels[0].message, { type: "SIGNED_OUT" });
      assert.equal(channels[0].closed, true);
      assert.match(values.get(AUTH_LOGOUT_SIGNAL_KEY), /^\d+$/);
    } finally {
      supabase.auth.signOut = previousSignOut;
      if (previousWindow === undefined) delete globalThis.window;
      else globalThis.window = previousWindow;
      globalThis.fetch = previousFetch;
      if (previousBroadcastChannel === undefined) delete globalThis.BroadcastChannel;
      else globalThis.BroadcastChannel = previousBroadcastChannel;
    }
  });

  it("keeps the application session and server role boundary explicit", () => {
    const authContext = readFileSync(new URL("../../src/lib/auth/AuthContext.jsx", import.meta.url), "utf8");
    const authService = readFileSync(new URL("../../src/lib/auth/authService.js", import.meta.url), "utf8");
    const authState = readFileSync(new URL("../../src/lib/auth/authStateMachine.js", import.meta.url), "utf8");
    const realtime = readFileSync(new URL("../../src/components/providers/RealtimeContext.jsx", import.meta.url), "utf8");
    const expertQualification = readFileSync(new URL("../../src/lib/server/expert/ExpertQualificationService.js", import.meta.url), "utf8");
    const sessionRepository = readFileSync(new URL("../../src/lib/security/identity/PostgresSessionRepository.js", import.meta.url), "utf8");
    const sessionRoute = readFileSync(new URL("../../src/app/api/auth/session/route.js", import.meta.url), "utf8");

    assert.match(authContext, /AUTH_STATE\.INITIALIZING/);
    assert.match(authContext, /applicationSessionReadyRef\.current/);
    assert.match(authContext, /formatProfile\(applicationUser, \{ authoritative: true \}\)/);
    assert.match(authContext, /AUTH_LOGOUT_SIGNAL_KEY/);
    assert.match(authContext, /BroadcastChannel\(AUTH_LOGOUT_CHANNEL\)/);
    assert.match(authContext, /authEpochRef\.current/);
    assert.doesNotMatch(authContext, /setSession\(\{ user: currentSession\.user/);
    assert.doesNotMatch(authService, /fetch\([^\n]+\/api\/auth\/(?:login|register|sync|me)/);
    assert.doesNotMatch(authService, /body:\s*JSON\.stringify\(\{[\s\S]{0,240}password\s*:/);
    assert.match(sessionRoute, /roles: principal\.roles/);
    assert.match(sessionRoute, /emailVerified: attributes\.emailVerified === true/);
    assert.match(authState, /AUTH_STATE\.INITIALIZING/);
    assert.match(realtime, /authState === "SIGNED_IN"/);
    assert.match(sessionRepository, /from auth\.users u/i);
    assert.match(sessionRepository, /u\.email_confirmed_at/i);
    assert.match(sessionRepository, /private\.user_roles/i);
    assert.match(expertQualification, /INSERT INTO private\.user_roles/i);
    assert.match(expertQualification, /r\.code = 'EXPERT'/i);
  });
});
