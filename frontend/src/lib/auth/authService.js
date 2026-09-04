// frontend/src/lib/auth/authService.js
//
// Hệ thống dịch vụ xác thực trung tâm (Auth Core Service) kết nối Supabase Auth + ASP.NET Core Backend:
// - Bọc 100% try/catch toàn diện với chuẩn Diagnostic Logging: [AUTH_ERROR] & [AUTH_INFO]
// - Interceptor bắt và dịch chính xác toàn bộ mã lỗi Supabase & ASP.NET Core sang tiếng Việt
// - Provider bearer proof is kept in memory only and exchanged for an opaque
//   server-issued HttpOnly cookie before the UI claims an authenticated session.
// - "Remember Me" stores preferences/demo data only, never credentials.

import { supabase } from "../supabase/client.js";

// Canonical browser auth is same-origin. The optional base is retained only
// for explicitly invoked OWNER_COMPAT adapters; there is no implicit remote
// fallback that can become an authentication prerequisite.
const API_BASE = typeof window !== "undefined"
  ? ""
  : (process.env.NEXT_PUBLIC_API_URL || process.env.STUDENTHUB_BACKEND_URL || "");

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

/**
 * Interceptor dịch mã lỗi Supabase & ASP.NET Core API sang tiếng Việt chuẩn xác
 */
export function translateAuthError(error) {
  if (!error) return "Đã xảy ra lỗi, vui lòng thử lại.";
  
  const rawMsg = typeof error === "string" 
    ? error 
    : error?.message || error?.error_description || error?.code || "";
    
  const lower = rawMsg.toLowerCase();

  // Đã đăng ký qua Google OAuth trước đó
  if (lower.includes("đã được đăng ký thông qua tài khoản google") || lower.includes("tiếp tục với google")) {
    return rawMsg;
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
    return "Email này đã được sử dụng. Vui lòng chuyển sang Đăng nhập hoặc sử dụng 'Continue with Google'.";
  }

  // Lỗi sai thông tin đăng nhập
  if (
    lower.includes("invalid email or password") ||
    lower.includes("invalid login credentials") ||
    lower.includes("invalid_credentials") ||
    lower.includes("wrong password") ||
    lower.includes("không chính xác")
  ) {
    return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
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
    return "Email của bạn chưa được xác thực qua mã OTP. Vui lòng hoàn tất bước nhập mã OTP.";
  }

  // Lỗi gửi email / giới hạn tần suất gửi (Rate Limit)
  if (
    lower.includes("error sending confirmation email") ||
    lower.includes("rate limit") ||
    lower.includes("over_email_send_rate_limit") ||
    lower.includes("over_request_rate_limit") ||
    lower.includes("too many requests")
  ) {
    return "Hệ thống đang quá tải yêu cầu gửi mã. Vui lòng thử lại sau 60 giây hoặc sử dụng Đăng nhập Google.";
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
    return "Đang kết nối tới máy chủ xác thực. Vui lòng thử lại sau vài giây.";
  }

  return rawMsg || "Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.";
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
// 3. OWNER_COMPAT ADAPTERS (NON-CANONICAL)
// =========================================================================

/**
 * Legacy OWNER_COMPAT login: POST /api/auth/login.
 * Canonical browser auth never calls this adapter.
 */
export async function loginBackend(email, password, rememberMe = false) {
  const cleanEmail = (email || "").trim();
  logAuthInfo("loginBackend", `Đang đăng nhập ASP.NET Core cho: ${cleanEmail}`);

  try {
    const res = await fetch(`${API_BASE}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const err = new Error(data?.message || `Đăng nhập Backend thất bại (HTTP ${res.status})`);
      logAuthError("loginBackend", err);
      throw err;
    }

    if (data?.token) {
      setStoredToken(data.token, rememberMe);
      logAuthInfo("loginBackend", "Đã giữ JWT tạm thời trong bộ nhớ cho luồng tương thích.");
    }

    return data;
  } catch (error) {
    logAuthError("loginBackend", error);
    throw error;
  }
}

/**
 * Legacy OWNER_COMPAT registration: POST /api/auth/register.
 * Canonical signup never calls this adapter.
 */
export async function registerBackend(email, password, fullName) {
  const cleanEmail = (email || "").trim();
  logAuthInfo("registerBackend", `Đang đăng ký ASP.NET Core cho: ${cleanEmail}`);

  try {
    const res = await fetch(`${API_BASE}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: cleanEmail,
        password: password,
        fullName: fullName,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      const err = new Error(data?.message || `Đăng ký Backend thất bại (HTTP ${res.status})`);
      logAuthError("registerBackend", err);
      throw err;
    }

    logAuthInfo("registerBackend", "Tạo tài khoản ASP.NET Core thành công.");
    return data;
  } catch (error) {
    logAuthError("registerBackend", error);
    throw error;
  }
}

/**
 * Legacy-compatible metadata sync: POST /api/auth/sync.
 * The route is same-origin and is not a prerequisite for canonical session
 * exchange; callers must treat its result as best-effort compatibility data.
 */
export async function syncBackendUser(userData = {}, explicitToken = null) {
  let activeToken = explicitToken || getStoredToken();
  if (!activeToken && typeof window !== "undefined") {
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData?.session?.access_token) {
        activeToken = sessionData.session.access_token;
      }
    } catch {
      // Ignore transient storage read error
    }
  }

  logAuthInfo("syncBackendUser", "Đang gọi POST /api/auth/sync với metadata hiển thị an toàn.");

  try {
    const res = await fetch(`${API_BASE}/api/auth/sync`, {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: JSON.stringify({
        fullName: userData.fullName || userData.full_name || userData.name || userData.FullName,
        avatarUrl: userData.avatarUrl || userData.avatar_url || userData.AvatarUrl,
      }),
    });

    if (!res.ok) {
      const errPayload = await res.json().catch(() => null);
      const errCode = errPayload?.error?.code || `HTTP_${res.status}`;
      logAuthError("syncBackendUser", new Error(`Sync HTTP ${res.status} (${errCode}): ${res.statusText}`));
      return null;
    }

    const data = await res.json().catch(() => null);
    if (activeToken && data?.session) {
      lastExchangedToken = activeToken;
      lastExchangeResult = { success: true, session: data.session };
    }
    logAuthInfo("syncBackendUser", "Đồng bộ xác thực StudentHub thành công.");
    return data;
  } catch (error) {
    logAuthError("syncBackendUser", error);
    return null;
  }
}

/**
 * Resolves the current user from the opaque application session first, with a
 * page-memory-only legacy backend bearer fallback during migration.
 */
export async function getMeBackend() {
  const applicationSession = await getApplicationSession();
  if (applicationSession.authenticated) return applicationSession.user;

  const token = getStoredToken();
  if (!token) return null;

  try {
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        setStoredToken(null);
      }
      return null;
    }

    const data = await res.json().catch(() => null);
    return data?.user || data;
  } catch (error) {
    logAuthError("getMeBackend", error);
    return null;
  }
}

/**
 * Reads the server-owned profile projection. The response is the only source
 * used by the application for onboarding state and profile authority.
 */
export async function getOwnProfile() {
  if (typeof window === "undefined") {
    return { success: false, profile: null, code: "BROWSER_CONTEXT_REQUIRED" };
  }

  try {
    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data?.success === true && data?.profile) {
      return { success: true, profile: data.profile, code: null };
    }
    return {
      success: false,
      profile: null,
      code: data?.error?.code || `PROFILE_READ_HTTP_${res.status}`,
    };
  } catch (error) {
    logAuthError("getOwnProfile", error);
    return { success: false, profile: null, code: "PROFILE_READ_NETWORK_FAILURE" };
  }
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
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          avatar_id: "student-tech",
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
  try {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${origin}/callback` },
    });

    if (error) {
      logAuthError("signInWithGoogle", error);
      throw new Error(translateAuthError(error));
    }

    return data;
  } catch (error) {
    logAuthError("signInWithGoogle", error);
    throw error;
  }
}

/**
 * Đăng nhập OAuth GitHub
 */
export async function signInWithGitHub() {
  logAuthInfo("signInWithGitHub", "Khởi tạo luồng GitHub OAuth.");
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
  const safeFields = {};
  for (const field of ["fullName", "avatarId", "avatarUrl", "university", "major", "academicYear", "bio", "onboardingCompleted"]) {
    if (Object.hasOwn(profileData || {}, field)) safeFields[field] = profileData[field];
  }
  logAuthInfo("updateUserProfile", "Cập nhật hồ sơ qua API sở hữu máy chủ.");

  try {
    if (typeof window === "undefined") {
      throw new Error("BROWSER_CONTEXT_REQUIRED");
    }

    const res = await fetch(`${API_BASE}/api/users/profile`, {
      method: "PUT",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safeFields),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success !== true || !data?.profile) {
      const error = new Error(data?.error?.message || `Profile update failed (HTTP ${res.status}).`);
      error.code = data?.error?.code || `PROFILE_UPDATE_HTTP_${res.status}`;
      error.status = res.status;
      throw error;
    }

    // Cache only non-authoritative display fields for fast paint. Role,
    // verification, reputation, and onboarding state are never read from it.
    const cacheFields = Object.fromEntries(
      ["fullName", "avatarId", "avatarUrl", "university", "major", "academicYear", "bio"]
        .filter((field) => Object.hasOwn(data.profile, field))
        .map((field) => [field, data.profile[field]])
    );
    if (typeof window !== "undefined") {
      const storageName = isRememberedSession() ? "localStorage" : "sessionStorage";
      writeBrowserStorage(storageName, "studenthub_user_profile", JSON.stringify(cacheFields));
    }

    return data.profile;
  } catch (error) {
    logAuthError("updateUserProfile", error);
    throw error;
  }
}
