// frontend/src/lib/auth/authService.js
//
// Hệ thống dịch vụ xác thực trung tâm (Auth Core Service) kết nối Supabase Auth + ASP.NET Core Backend:
// - Bọc 100% try/catch toàn diện với chuẩn Diagnostic Logging: [AUTH_ERROR] & [AUTH_INFO]
// - Interceptor bắt và dịch chính xác toàn bộ mã lỗi Supabase & ASP.NET Core sang tiếng Việt
// - Provider bearer proof is kept in memory only and exchanged for an opaque
//   server-issued HttpOnly cookie before the UI claims an authenticated session.
// - "Remember Me" stores preferences/demo data only, never credentials.

import { supabase } from "../supabase/client.js";

const API_BASE = typeof window !== "undefined"
  ? "" // Sử dụng Next.js Route Proxy cùng origin để triệt tiêu lỗi CORS Preflight
  : (process.env.NEXT_PUBLIC_API_URL || "https://studenthub-api-8fqp.onrender.com");

let volatileToken = null;
let exchangeInFlight = null;
let lastExchangedToken = null;
let lastExchangeResult = null;

function getBrowserStorage(storageName) {
  if (typeof window === "undefined") return null;
  try {
    return window[storageName] || null;
  } catch (error) {
    logAuthError(`storage:${storageName}`, error);
    return null;
  }
}

function readBrowserStorage(storageName, key) {
  const storage = getBrowserStorage(storageName);
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (error) {
    logAuthError(`storage:${storageName}:read`, error);
    return null;
  }
}

function writeBrowserStorage(storageName, key, value) {
  const storage = getBrowserStorage(storageName);
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    logAuthError(`storage:${storageName}:write`, error);
    return false;
  }
}

function removeBrowserStorage(storageName, key) {
  const storage = getBrowserStorage(storageName);
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch (error) {
    logAuthError(`storage:${storageName}:remove`, error);
  }
}

function isRememberedSession() {
  return readBrowserStorage("localStorage", "studenthub_remember_me") === "true";
}

const SAFE_PROFILE_FIELDS = new Set([
  "fullName",
  "full_name",
  "avatarId",
  "avatar_id",
  "avatarUrl",
  "avatar_url",
  "university",
  "major",
  "academicYear",
  "academic_year",
  "bio",
  "githubUsername",
  "github_username",
]);

export function sanitizeProfileUpdates(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key]) => SAFE_PROFILE_FIELDS.has(key)));
}

// =========================================================================
// 1. CHUẨN HÓA LOGGING & INTERCEPTOR DỊCH MÃ LỖI (DIAGNOSTIC LOGGING)
// =========================================================================

function redactAuthLogText(value) {
  return String(value || "")
    .replace(/bearer\s+[a-z0-9._-]+/gi, "Bearer [REDACTED]")
    .replace(/(password|token|otp|secret|key)\s*[:=]\s*[^\s,;]+/gi, "$1=[REDACTED]")
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "[REDACTED_EMAIL]")
    .slice(0, 300);
}

export function logAuthError(functionName, error, extraContext = null) {
  const detail = error?.name || error?.code || (typeof error === "string" ? "AUTH_ERROR" : "AUTH_ERROR");
  const safeContext = extraContext && typeof extraContext === "object"
    ? Object.fromEntries(Object.entries(extraContext).slice(0, 8).map(([key, value]) => [key, redactAuthLogText(value)]))
    : "";
  console.error(`[AUTH_ERROR] - [${redactAuthLogText(functionName)}] - ${detail}`, safeContext);
}

export function logAuthInfo(functionName, message, data = null) {
  const safeData = data && typeof data === "object"
    ? Object.fromEntries(Object.entries(data).filter(([key]) => !/token|password|secret|cookie|authorization|key/i.test(key)).slice(0, 8))
    : "";
  console.log(`[AUTH_INFO] - [${redactAuthLogText(functionName)}] - ${redactAuthLogText(message)}`, safeData);
}

import {
  AUTH_CAPABILITY_STATE,
  AUTH_CONFIGURATION_MESSAGE,
  getAuthCapabilities,
  markAuthProviderDegraded,
  GOOGLE_AUTH_DISABLED_MESSAGE,
} from "./authCapabilities.js";
import { AUTH_LOGOUT_CHANNEL, AUTH_LOGOUT_SIGNAL_KEY } from "./authStateMachine.js";

export { getAuthCapabilities } from "./authCapabilities.js";
export { AUTH_LOGOUT_SIGNAL_KEY } from "./authStateMachine.js";

function extractAuthErrorText(error) {
  const candidate = typeof error === "string"
    ? error
    : error?.message || error?.error_description || error?.code || "";
  const text = String(candidate || "").trim();
  if (!text) return "";

  // Supabase and proxy layers sometimes put a JSON envelope inside message.
  // Parse it only for classification; never return the raw envelope to UI.
  if ((text.startsWith("{") && text.endsWith("}")) || (text.startsWith("[") && text.endsWith("]"))) {
    try {
      const parsed = JSON.parse(text);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        // Keep only a stable machine code for classification. A nested
        // provider message may contain secrets or internal implementation
        // details and is never promoted to the fallback UI text.
        return String(parsed.code || parsed.error_code || parsed.error || "").trim();
      }
      return "";
    } catch {
      return "";
    }
  }
  return text;
}

function isSafeUserMessage(text) {
  return Boolean(text)
    && text.length <= 180
    && !/[{}[\]]/.test(text)
    && !/bearer\s|authorization\s*:|access[_ -]?token|refresh[_ -]?token|supabase/i.test(text);
}

/**
 * Interceptor dịch mã lỗi Supabase & API sang tiếng Việt chuẩn xác.
 * Unknown JSON/provider envelopes are classified but never rendered verbatim.
 */
export function translateAuthError(error) {
  if (!error) return "Đã xảy ra lỗi, vui lòng thử lại.";

  const candidate = typeof error === "string"
    ? error
    : error?.message || error?.error_description || error?.code || "";
  const candidateText = String(candidate || "").trim();
  const structuredEnvelope = (candidateText.startsWith("{") && candidateText.endsWith("}"))
    || (candidateText.startsWith("[") && candidateText.endsWith("]"));
  const rawMsg = extractAuthErrorText(error);
    
  const lower = rawMsg.toLowerCase();

  if (lower.includes("supabase_auth_env_missing") || lower.includes("legacy_auth_disabled")) {
    return AUTH_CONFIGURATION_MESSAGE;
  }
  if (lower.includes("google_auth_configuration_unattested")) {
    return "Google OAuth chưa được xác nhận cấu hình trong Supabase Dashboard.";
  }

  // Lỗi provider chưa được bật hoặc cấu hình thiếu (Google OAuth 400 validation_failed: Unsupported provider)
  if (
    lower.includes("unsupported provider") ||
    lower.includes("provider is not enabled") ||
    lower.includes("validation_failed") ||
    lower.includes("provider_not_enabled")
  ) {
    return GOOGLE_AUTH_DISABLED_MESSAGE;
  }

  // Đã đăng ký qua Google OAuth trước đó
  if (lower.includes("đã được đăng ký thông qua tài khoản google") || lower.includes("tiếp tục với google")) {
    return isSafeUserMessage(rawMsg) ? rawMsg : "Tài khoản này đã liên kết với Google. Vui lòng chọn đúng phương thức đăng nhập.";
  }

  // Lỗi trùng lặp email / tài khoản
  if (
    lower.includes("email already exists") ||
    lower.includes("user already registered") ||
    lower.includes("already registered") ||
    lower.includes("user_already_exists") ||
    lower.includes("identity_already_exists") ||
    lower.includes("đã tồn tại")
  ) {
    return "Email này đã được sử dụng. Vui lòng chuyển sang Đăng nhập hoặc sử dụng Email/Mật khẩu.";
  }

  // Lỗi không tìm thấy tài khoản
  if (lower.includes("user not found") || lower.includes("user_not_found")) {
    return "Không tìm thấy tài khoản với email này.";
  }

  // Lỗi sai thông tin đăng nhập
  if (
    lower.includes("invalid email or password") ||
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_credentials") ||
    lower.includes("wrong password") ||
    lower.includes("không chính xác")
  ) {
    return "Email hoặc mật khẩu không chính xác.";
  }

  // Lỗi mật khẩu yếu
  if (
    lower.includes("password should be at least") ||
    lower.includes("weak_password") ||
    lower.includes("tối thiểu 6") ||
    lower.includes("password is too short")
  ) {
    return "Mật khẩu phải có độ dài tối thiểu 6 ký tự.";
  }

  // Lỗi Email chưa được xác thực
  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    return "Email chưa được xác thực. Vui lòng kiểm tra hộp thư của bạn.";
  }

  // Lỗi gửi email / giới hạn tần suất gửi (Rate Limit)
  if (
    lower.includes("error sending confirmation email") ||
    lower.includes("rate limit") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("over_request_rate_limit") ||
    lower.includes("too many requests")
  ) {
    return "Hệ thống đang quá tải hoặc bạn đã thử quá nhiều lần (Rate Limit). Vui lòng đợi trong giây lát rồi thử lại.";
  }

  // Lỗi OTP hết hạn hoặc không đúng
  if (lower.includes("token has expired") || lower.includes("otp expired") || lower.includes("otp_expired")) {
    return "Mã OTP 6 số đã hết hạn. Vui lòng nhấn 'Gửi lại mã OTP'.";
  }
  if (
    lower.includes("invalid token") ||
    lower.includes("token is invalid") ||
    lower.includes("otp invalid") ||
    lower.includes("token has been revoked")
  ) {
    return "Mã xác thực OTP 6 số không chính xác. Vui lòng kiểm tra lại trong hộp thư của bạn.";
  }

  // Lỗi kết nối máy chủ
  if (
    lower.includes("network") ||
    lower.includes("failed to fetch") ||
    lower.includes("connection refused") ||
    lower.includes("cold start") ||
    lower.includes("timeout")
  ) {
    return "Đang kết nối tới máy chủ Backend (Render Cold Start). Vui lòng thử lại sau vài giây...";
  }

  return !structuredEnvelope && isSafeUserMessage(rawMsg)
    ? rawMsg
    : "Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.";
}

// =========================================================================
// 2. TRANSIENT TOKEN & PREFERENCE HELPERS
// =========================================================================

export function setRememberMePreference(rememberMe) {
  if (typeof window === "undefined") return;
  if (rememberMe) {
    writeBrowserStorage("localStorage", "studenthub_remember_me", "true");
  } else {
    removeBrowserStorage("localStorage", "studenthub_remember_me");
  }
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  return volatileToken;
}

export function setStoredToken(token) {
  if (typeof window === "undefined") return;
  volatileToken = typeof token === "string" && token ? token : null;
}

function resetExchangeState() {
  volatileToken = null;
  exchangeInFlight = null;
  lastExchangedToken = null;
  lastExchangeResult = null;
}

/**
 * Exchanges one verified upstream proof for the server-owned opaque session.
 * The response intentionally contains no credential and the browser relies on
 * the HttpOnly cookie set by the same-origin route.
 */
export async function exchangeApplicationSession(upstreamToken) {
  if (typeof window === "undefined") {
    return { success: false, code: "BROWSER_CONTEXT_REQUIRED" };
  }
  if (typeof upstreamToken !== "string" || !upstreamToken.trim()) {
    return { success: false, code: "UPSTREAM_TOKEN_REQUIRED" };
  }
  if (lastExchangedToken === upstreamToken && lastExchangeResult?.success) {
    return lastExchangeResult;
  }
  if (exchangeInFlight?.token === upstreamToken) {
    return exchangeInFlight.promise;
  }

  const promise = (async () => {
    try {
      const res = await fetch(`${API_BASE}/api/auth/session/exchange`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${upstreamToken}`,
        },
        body: "{}",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.success !== true || !data?.session) {
        return {
          success: false,
          code: data?.error?.code || `SESSION_EXCHANGE_HTTP_${res.status}`,
        };
      }

      const result = { success: true, session: data.session };
      lastExchangedToken = upstreamToken;
      lastExchangeResult = result;
      return result;
    } catch (error) {
      logAuthError("exchangeApplicationSession", error);
      return { success: false, code: "SESSION_EXCHANGE_NETWORK_FAILURE" };
    } finally {
      volatileToken = null;
    }
  })();

  exchangeInFlight = { token: upstreamToken, promise };
  try {
    return await promise;
  } finally {
    if (exchangeInFlight?.promise === promise) exchangeInFlight = null;
  }
}

/**
 * Reads only the server-authoritative cookie session.  Dependency failure is
 * distinct from a normal signed-out state so callers cannot silently promote
 * an unavailable identity service to an authenticated UI.
 */
export async function getApplicationSession() {
  if (typeof window === "undefined") {
    return { authenticated: false, unavailable: false, user: null, code: "BROWSER_CONTEXT_REQUIRED" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/auth/session`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.authenticated === true && data?.user) {
      return { authenticated: true, unavailable: false, user: data.user, code: null };
    }
    return {
      authenticated: false,
      unavailable: res.status >= 500,
      user: null,
      code: data?.error?.code || `SESSION_READ_HTTP_${res.status}`,
    };
  } catch (error) {
    logAuthError("getApplicationSession", error);
    return { authenticated: false, unavailable: true, user: null, code: "SESSION_READ_NETWORK_FAILURE" };
  }
}

// =========================================================================
// 3. APPLICATION SESSION ONLY
// =========================================================================

function legacyAuthDisabled() {
  const error = new Error("Legacy backend authentication is disabled.");
  error.code = "LEGACY_AUTH_DISABLED";
  return error;
}

function notifyAuthLogout() {
  if (typeof window === "undefined") return;
  try {
    if (typeof BroadcastChannel === "function") {
      const channel = new BroadcastChannel(AUTH_LOGOUT_CHANNEL);
      channel.postMessage({ type: "SIGNED_OUT" });
      channel.close();
    }
  } catch (error) {
    logAuthError("logout:broadcast", error);
  }
  // Timestamp-only fallback is not a credential and gives older browsers a
  // cross-tab signal through the storage event.
  writeBrowserStorage("localStorage", AUTH_LOGOUT_SIGNAL_KEY, String(Date.now()));
}

// These names remain exported for old callers, but they deliberately cannot
// send passwords or independently establish an identity outside Supabase.
export async function loginBackend() {
  throw legacyAuthDisabled();
}

export async function registerBackend() {
  throw legacyAuthDisabled();
}

export async function syncBackendUser() {
  logAuthInfo("syncBackendUser", "Bỏ qua legacy profile sync; application session là nguồn danh tính duy nhất.");
  return null;
}

/** Resolves the current user from the server-owned application session only. */
export async function getMeBackend() {
  const applicationSession = await getApplicationSession();
  return applicationSession.authenticated ? applicationSession.user : null;
}

// =========================================================================
// 4. SUPABASE AUTH INTEGRATION (EMAIL, OTP, GOOGLE, GITHUB)
// =========================================================================

/**
 * Đăng ký tài khoản: Gửi thông tin và nhận mã OTP 6 số qua email
 */
export async function signUpWithEmail(email, password, fullName) {
  const cleanEmail = (email || "").trim();
  logAuthInfo("signUpWithEmail", `Bắt đầu đăng ký cho email: ${cleanEmail}`);

  try {
    const capabilities = getAuthCapabilities();
    if (capabilities.emailPassword !== AUTH_CAPABILITY_STATE.READY) {
      const error = new Error(capabilities.emailPasswordMessage);
      error.code = capabilities.emailPasswordReason || "EMAIL_PASSWORD_UNAVAILABLE";
      throw error;
    }
    if (String(password || "").length < 6) {
      const error = new Error("Password should be at least 6 characters");
      error.code = "weak_password";
      throw new Error(translateAuthError(error));
    }

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_id: "student-tech",
          onboarded: false,
        },
      },
    });

    if (error) {
      logAuthError("signUpWithEmail", error);
      throw new Error(translateAuthError(error));
    }

    if (data?.user) {
      const identities = data.user.identities || [];
      const isGoogleAccount = identities.length > 0 && identities.every((i) => i.provider === "google");

      if (isGoogleAccount) {
        const err = new Error(
          "Email này đã được đăng ký thông qua tài khoản Google từ trước. Vui lòng sử dụng 'Continue with Google' để đăng nhập."
        );
        logAuthError("signUpWithEmail", err);
        throw err;
      }
    }

    logAuthInfo("signUpWithEmail", "Đã gửi mã OTP 6 số thành công.");
    return data;
  } catch (error) {
    logAuthError("signUpWithEmail", error);
    throw error;
  }
}

/**
 * Xác thực mã OTP 6 số
 */
export async function verifySignupOtp(email, token) {
  const cleanToken = (token || "").trim();
  const cleanEmail = (email || "").trim();

  if (cleanToken.length !== 6 || !/^\d+$/.test(cleanToken)) {
    const err = new Error("Mã xác nhận phải gồm đúng 6 chữ số.");
    logAuthError("verifySignupOtp", err);
    throw err;
  }

  logAuthInfo("verifySignupOtp", `Đang xác thực OTP cho: ${cleanEmail}`);

  try {
    const capabilities = getAuthCapabilities();
    if (capabilities.emailPassword !== AUTH_CAPABILITY_STATE.READY) {
      const error = new Error(capabilities.emailPasswordMessage);
      error.code = capabilities.emailPasswordReason || "EMAIL_PASSWORD_UNAVAILABLE";
      throw error;
    }
    const { data, error } = await supabase.auth.verifyOtp({
      email: cleanEmail,
      token: cleanToken,
      type: "email",
    });

    if (error) {
      logAuthError("verifySignupOtp", error);
      throw new Error(translateAuthError(error));
    }

    if (data?.session?.access_token) {
      setStoredToken(data.session.access_token, true);
      const exchanged = await exchangeApplicationSession(data.session.access_token);
      if (!exchanged.success) {
        const exchangeError = new Error("Không thể tạo phiên đăng nhập an toàn. Vui lòng thử lại.");
        exchangeError.code = exchanged.code;
        throw exchangeError;
      }
      const applicationState = await getApplicationSession();
      if (!applicationState.authenticated || !applicationState.user) {
        const sessionError = new Error("Không thể xác nhận application session an toàn.");
        sessionError.code = applicationState.code || "APPLICATION_SESSION_NOT_CONFIRMED";
        throw sessionError;
      }
      data.applicationUser = applicationState.user;
    } else {
      const sessionError = new Error("Email đã xác thực nhưng chưa tạo được phiên đăng nhập an toàn.");
      sessionError.code = "APPLICATION_SESSION_NOT_CREATED";
      throw sessionError;
    }

    logAuthInfo("verifySignupOtp", "Xác thực OTP thành công.");
    return data;
  } catch (error) {
    logAuthError("verifySignupOtp", error);
    throw error;
  }
}

/**
 * Gửi lại mã OTP 6 số
 */
export async function resendSignupOtp(email) {
  const cleanEmail = (email || "").trim();
  logAuthInfo("resendSignupOtp", `Gửi lại mã OTP cho: ${cleanEmail}`);

  try {
    const capabilities = getAuthCapabilities();
    if (capabilities.emailPassword !== AUTH_CAPABILITY_STATE.READY) {
      const error = new Error(capabilities.emailPasswordMessage);
      error.code = capabilities.emailPasswordReason || "EMAIL_PASSWORD_UNAVAILABLE";
      throw error;
    }
    const { data, error } = await supabase.auth.resend({
      type: "signup",
      email: cleanEmail,
    });

    if (error) {
      logAuthError("resendSignupOtp", error);
      throw new Error(translateAuthError(error));
    }

    logAuthInfo("resendSignupOtp", "Đã gửi lại mã OTP thành công.");
    return data;
  } catch (error) {
    logAuthError("resendSignupOtp", error);
    throw error;
  }
}

/**
 * Đăng nhập bằng Email & Mật khẩu
 */
export async function signInWithPassword(email, password, rememberMe = false) {
  const cleanEmail = (email || "").trim();
  setRememberMePreference(rememberMe);
  logAuthInfo("signInWithPassword", `Bắt đầu đăng nhập: ${cleanEmail} (Remember: ${rememberMe})`);

  try {
    const capabilities = getAuthCapabilities();
    if (capabilities.emailPassword !== AUTH_CAPABILITY_STATE.READY) {
      const error = new Error(capabilities.emailPasswordMessage);
      error.code = capabilities.emailPasswordReason || "EMAIL_PASSWORD_UNAVAILABLE";
      throw error;
    }
    // Supabase/OIDC is the sole end-user identity authority. The external
    // ASP.NET service remains a profile-sync compatibility dependency and may
    // not independently establish an authenticated application session.
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error) {
      logAuthError("signInWithPassword", error);
      throw new Error(translateAuthError(error));
    }

    if (data?.session?.access_token) {
      setStoredToken(data.session.access_token, rememberMe);
      const exchanged = await exchangeApplicationSession(data.session.access_token);
      if (!exchanged.success) {
        const exchangeError = new Error("Không thể tạo phiên đăng nhập an toàn. Vui lòng thử lại.");
        exchangeError.code = exchanged.code;
        throw exchangeError;
      }
      const applicationState = await getApplicationSession();
      if (!applicationState.authenticated || !applicationState.user) {
        const sessionError = new Error("Không thể xác nhận application session an toàn.");
        sessionError.code = applicationState.code || "APPLICATION_SESSION_NOT_CONFIRMED";
        throw sessionError;
      }
      data.applicationUser = applicationState.user;
    } else {
      const sessionError = new Error("Không thể tạo phiên đăng nhập an toàn. Vui lòng thử lại.");
      sessionError.code = "APPLICATION_SESSION_NOT_CREATED";
      throw sessionError;
    }

    logAuthInfo("signInWithPassword", "Đăng nhập Supabase thành công.");
    return data;
  } catch (error) {
    logAuthError("signInWithPassword", error);
    throw error;
  }
}

/**
 * Đăng nhập OAuth Google
 */
export async function signInWithGoogle() {
  logAuthInfo("signInWithGoogle", "Khởi tạo luồng Google OAuth.");
  const capabilities = getAuthCapabilities();
  if (capabilities.google !== AUTH_CAPABILITY_STATE.READY) {
    const disabledError = new Error(capabilities.googleMessage);
    disabledError.code = capabilities.googleReason || "GOOGLE_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION";
    logAuthError("signInWithGoogle:capabilityGuard", disabledError);
    throw disabledError;
  }

  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/callback` },
    });

    if (error) {
      logAuthError("signInWithGoogle", error);
      if (/unsupported provider|provider is not enabled|validation_failed/i.test(String(error.message || error.code || ""))) {
        markAuthProviderDegraded("google", "GOOGLE_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION");
      }
      throw new Error(translateAuthError(error));
    }

    return data;
  } catch (error) {
    logAuthError("signInWithGoogle", error);
    if (/unsupported provider|provider is not enabled|validation_failed/i.test(String(error?.message || error?.code || ""))) {
      markAuthProviderDegraded("google", "GOOGLE_AUTH_BLOCKED_BY_PROVIDER_CONFIGURATION");
    }
    throw new Error(translateAuthError(error));
  }
}

/**
 * Đăng nhập OAuth GitHub
 */
export async function signInWithGitHub() {
  logAuthInfo("signInWithGitHub", "Khởi tạo luồng GitHub OAuth.");
  const capabilities = getAuthCapabilities();
  if (capabilities.github !== AUTH_CAPABILITY_STATE.READY) {
    const disabledError = new Error(capabilities.githubMessage);
    disabledError.code = capabilities.githubReason || "GITHUB_AUTH_UNAVAILABLE";
    throw disabledError;
  }
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: {
        redirectTo: `${origin}/callback`,
        scopes: "read:user user:email repo",
      },
    });

    if (error) {
      logAuthError("signInWithGitHub", error);
      throw new Error(translateAuthError(error));
    }

    return data;
  } catch (error) {
    logAuthError("signInWithGitHub", error);
    throw error;
  }
}

/**
 * Đăng xuất an toàn toàn bộ phiên
 */
export async function signOutSupabase() {
  logAuthInfo("signOutSupabase", "Bắt đầu đăng xuất và xóa phiên.");
  try {
    if (typeof window !== "undefined") {
      try {
        const logoutResponse = await fetch(`${API_BASE}/api/auth/session/logout`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
        });
        if (!logoutResponse.ok && logoutResponse.status !== 401) {
          logAuthError("signOutSupabase:applicationSession", new Error(`Logout HTTP ${logoutResponse.status}`));
        }
      } catch (error) {
        logAuthError("signOutSupabase:applicationSession", error);
      }

      resetExchangeState();
      removeBrowserStorage("sessionStorage", "studenthub_user_profile");
      removeBrowserStorage("sessionStorage", "studenthub_demo_user");
      // Remove credentials left by pre-migration releases. No new secret is
      // ever written to either Web Storage API.
      removeBrowserStorage("sessionStorage", "studenthub_jwt_token");
      removeBrowserStorage("localStorage", "studenthub_user_profile");
      removeBrowserStorage("localStorage", "studenthub_demo_user");
      removeBrowserStorage("localStorage", "studenthub_jwt_token");
      removeBrowserStorage("localStorage", "studenthub_remember_me");
      notifyAuthLogout();
    }

    const { error } = await supabase.auth.signOut().catch(() => ({ error: null }));
    if (error) {
      logAuthError("signOutSupabase", error);
    }
    logAuthInfo("signOutSupabase", "Đã xóa trạng thái trình duyệt; kết quả thu hồi phiên máy chủ đã được xử lý riêng.");
  } catch (error) {
    logAuthError("signOutSupabase", error);
  }
}

/**
 * Cập nhật hồ sơ người dùng
 */
export async function updateUserProfile(profileData) {
  const safeProfileData = sanitizeProfileUpdates(profileData);
  logAuthInfo("updateUserProfile", "Cập nhật các trường hồ sơ không đặc quyền.");
  try {
    if (typeof window !== "undefined") {
      const storageName = isRememberedSession() ? "localStorage" : "sessionStorage";
      const cached = readBrowserStorage(storageName, "studenthub_user_profile");
      let current = {};
      try {
        current = cached ? JSON.parse(cached) : {};
      } catch (error) {
        logAuthError("updateUserProfile:parseCache", error);
      }
      writeBrowserStorage(storageName, "studenthub_user_profile", JSON.stringify({ ...current, ...safeProfileData }));
    }

    const { data } = await supabase.auth.updateUser({
      data: safeProfileData,
    }).catch(() => ({ data: { user: null } }));

    return data?.user || safeProfileData;
  } catch (error) {
    logAuthError("updateUserProfile", error);
    return safeProfileData;
  }
}
