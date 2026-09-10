// frontend/src/lib/auth/authCapabilities.js
//
// Authentication capability truth is intentionally separate from the button
// components. A provider is operational only when its local prerequisites are
// present and its provider configuration has been explicitly attested.

/** @typedef {'READY' | 'DISABLED' | 'DEGRADED' | 'MISCONFIGURED'} ProviderState */

export const AUTH_CAPABILITY_STATE = Object.freeze({
  READY: "READY",
  DISABLED: "DISABLED",
  DEGRADED: "DEGRADED",
  MISCONFIGURED: "MISCONFIGURED",
});

export const GOOGLE_AUTH_DISABLED_MESSAGE =
  "Đăng nhập bằng Google hiện chưa được kích hoạt trên hệ thống máy chủ (Unsupported provider). Bạn vẫn có thể đăng nhập bằng Email/Mật khẩu hoặc yêu cầu quản trị viên cấu hình Google OAuth trong Supabase Dashboard.";

export const AUTH_CONFIGURATION_MESSAGE =
  "Dịch vụ đăng nhập hiện chưa được cấu hình đầy đủ. Vui lòng thử lại sau hoặc liên hệ quản trị viên.";

export const AUTH_PROVIDER_DEGRADED_MESSAGE =
  "Dịch vụ đăng nhập đang tạm thời không ổn định. Vui lòng thử lại sau.";

const runtimeIssues = new Map();

// Next.js replaces direct NEXT_PUBLIC_* reads in the browser bundle. Passing a
// small explicit snapshot keeps the server render and client hydration on the
// same capability inputs; iterating over process.env would leave the browser
// with an empty dynamic object and produce divergent provider messages.
function runtimeEnvironment() {
  if (typeof process === "undefined") return {};
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_SUPABASE_EMAIL_PASSWORD_AUTH: process.env.NEXT_PUBLIC_SUPABASE_EMAIL_PASSWORD_AUTH,
    NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH: process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH,
    NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_VERIFIED: process.env.NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_VERIFIED,
    NEXT_PUBLIC_SUPABASE_GITHUB_AUTH: process.env.NEXT_PUBLIC_SUPABASE_GITHUB_AUTH,
    NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL: process.env.NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL,
    NEXT_PUBLIC_STUDENTHUB_LOCAL_E2E: process.env.NEXT_PUBLIC_STUDENTHUB_LOCAL_E2E,
  };
}

function envValue(env, key) {
  const value = env?.[key];
  return typeof value === "string" ? value.trim() : "";
}

function isTrue(env, key) {
  return envValue(env, key).toLowerCase() === "true";
}

function isFalse(env, key) {
  return envValue(env, key).toLowerCase() === "false";
}

function hasUsableSupabaseConfiguration(env) {
  const rawUrl = envValue(env, "NEXT_PUBLIC_SUPABASE_URL");
  const key = envValue(env, "NEXT_PUBLIC_SUPABASE_ANON_KEY")
    || envValue(env, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY");
  if (!rawUrl || !key || rawUrl.includes("placeholder") || key.includes("placeholder")) return false;
  try {
    const url = new URL(rawUrl);
    const loopback = new Set(["127.0.0.1", "localhost", "::1"]).has(url.hostname.toLowerCase());
    const localE2EHttp = isTrue(env, "NEXT_PUBLIC_STUDENTHUB_LOCAL_E2E");
    return Boolean(url.hostname)
      && (url.protocol === "https:" || (localE2EHttp && loopback && url.protocol === "http:"));
  } catch {
    return false;
  }
}

function runtimeIssue(provider) {
  return runtimeIssues.get(provider) || null;
}

function providerResult(provider, configuredState, messages) {
  const issue = runtimeIssue(provider);
  if (issue) {
    return {
      state: AUTH_CAPABILITY_STATE.DEGRADED,
      reason: issue.code,
      message: AUTH_PROVIDER_DEGRADED_MESSAGE,
    };
  }
  return {
    state: configuredState,
    reason: messages.reason,
    message: messages.message,
  };
}

/**
 * Record a non-secret runtime failure without turning it into a false READY
 * capability. Callers should pass a stable provider error code, never a token
 * or raw provider response.
 */
export function markAuthProviderDegraded(provider, code = "AUTH_PROVIDER_DEGRADED") {
  const name = String(provider || "").trim().toLowerCase();
  if (!name) return;
  runtimeIssues.set(name, { code: String(code).slice(0, 120) });
}

export function clearAuthProviderDegraded(provider) {
  runtimeIssues.delete(String(provider || "").trim().toLowerCase());
}

export function resetAuthCapabilityRuntimeForTests() {
  runtimeIssues.clear();
}

/**
 * @param {Record<string, string|undefined>} [env]
 * @returns {object}
 */
export function getAuthCapabilities(env = runtimeEnvironment()) {
  const supabaseConfigured = hasUsableSupabaseConfiguration(env);

  const emailConfiguredState = !supabaseConfigured
    ? AUTH_CAPABILITY_STATE.MISCONFIGURED
    : isFalse(env, "NEXT_PUBLIC_SUPABASE_EMAIL_PASSWORD_AUTH")
      ? AUTH_CAPABILITY_STATE.DISABLED
      : AUTH_CAPABILITY_STATE.READY;
  const emailResult = providerResult("email_password", emailConfiguredState, {
    reason: !supabaseConfigured
      ? "SUPABASE_AUTH_ENV_MISSING"
      : emailConfiguredState === AUTH_CAPABILITY_STATE.DISABLED
        ? "EMAIL_PASSWORD_DISABLED_BY_CONFIGURATION"
        : undefined,
    message: !supabaseConfigured
      ? AUTH_CONFIGURATION_MESSAGE
      : emailConfiguredState === AUTH_CAPABILITY_STATE.DISABLED
        ? "Đăng nhập bằng Email/Mật khẩu hiện chưa được kích hoạt. Vui lòng thử lại sau hoặc liên hệ quản trị viên."
        : "Email/Mật khẩu đã sẵn sàng.",
  });

  // A public flag is an operator attestation, not a dashboard API probe. The
  // second flag makes that distinction explicit and prevents a guessed env
  // value from being reported as a verified Google flow.
  const googleExplicitlyEnabled = isTrue(env, "NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH");
  const googleDashboardAttested = isTrue(env, "NEXT_PUBLIC_SUPABASE_GOOGLE_AUTH_VERIFIED");
  const googleConfiguredState = !supabaseConfigured
    ? AUTH_CAPABILITY_STATE.MISCONFIGURED
    : !googleExplicitlyEnabled
      ? AUTH_CAPABILITY_STATE.DISABLED
      : !googleDashboardAttested
        ? AUTH_CAPABILITY_STATE.MISCONFIGURED
        : AUTH_CAPABILITY_STATE.READY;
  const googleResult = providerResult("google", googleConfiguredState, {
    reason: !supabaseConfigured
      ? "SUPABASE_AUTH_ENV_MISSING"
      : !googleExplicitlyEnabled
        ? "GOOGLE_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION"
        : !googleDashboardAttested
          ? "GOOGLE_AUTH_CONFIGURATION_UNATTESTED"
          : undefined,
    message: !supabaseConfigured
      ? AUTH_CONFIGURATION_MESSAGE
      : !googleExplicitlyEnabled
        ? GOOGLE_AUTH_DISABLED_MESSAGE
        : !googleDashboardAttested
          ? "Google OAuth có cờ cấu hình nhưng chưa có bằng chứng cấu hình provider trong Supabase Dashboard."
          : "Google OAuth đã được cấu hình theo attestation của môi trường.",
  });

  const githubExplicitlyEnabled = isTrue(env, "NEXT_PUBLIC_SUPABASE_GITHUB_AUTH");
  const githubConfiguredState = !supabaseConfigured
    ? AUTH_CAPABILITY_STATE.MISCONFIGURED
    : githubExplicitlyEnabled
      ? AUTH_CAPABILITY_STATE.READY
      : AUTH_CAPABILITY_STATE.DISABLED;
  const githubResult = providerResult("github", githubConfiguredState, {
    reason: !supabaseConfigured
      ? "SUPABASE_AUTH_ENV_MISSING"
      : githubExplicitlyEnabled ? undefined : "GITHUB_AUTH_DISABLED_BY_CONFIGURATION",
    message: !supabaseConfigured
      ? AUTH_CONFIGURATION_MESSAGE
      : githubExplicitlyEnabled
        ? "GitHub OAuth đã sẵn sàng theo cấu hình môi trường."
        : "GitHub OAuth hiện chưa được kích hoạt trên hệ thống máy chủ.",
  });

  const redirectUri = envValue(env, "NEXT_PUBLIC_SUPABASE_AUTH_REDIRECT_URL");
  let expectedProviderCallbackUri = null;
  try {
    const supabaseUrl = new URL(envValue(env, "NEXT_PUBLIC_SUPABASE_URL"));
    expectedProviderCallbackUri = `${supabaseUrl.origin}/auth/v1/callback`;
  } catch {
    // Keep the audit projection safe and explicit when the Supabase URL is
    // absent or malformed; no provider callback can be asserted then.
  }
  return {
    emailPassword: emailResult.state,
    emailPasswordReason: emailResult.reason,
    emailPasswordMessage: emailResult.message,
    google: googleResult.state,
    googleReason: googleResult.reason,
    googleMessage: googleResult.message,
    github: githubResult.state,
    githubReason: githubResult.reason,
    githubMessage: githubResult.message,
    supabaseConfigured,
    googleAudit: Object.freeze({
      providerEnabled: googleExplicitlyEnabled,
      dashboardAttested: googleDashboardAttested,
      clientIdExpected: true,
      clientSecretExpected: true,
      clientCredentialsLocation: "SUPABASE_DASHBOARD_ONLY",
      expectedProviderCallbackUri,
      redirectUriConfigured: Boolean(redirectUri),
      redirectUri: redirectUri || null,
      configurationEvidence: googleResult.state === AUTH_CAPABILITY_STATE.READY
        ? "ENV_ATTESTATION_ONLY"
        : "NOT_VERIFIED",
    }),
  };
}
