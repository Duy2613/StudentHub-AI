// frontend/src/lib/auth/authService.js
//
// Hệ thống dịch vụ xác thực trung tâm (Auth Core Service) kết nối Supabase Auth + ASP.NET Core Backend:
// - Bọc 100% try/catch toàn diện với chuẩn Diagnostic Logging: [AUTH_ERROR] & [AUTH_INFO]
// - Interceptor bắt và dịch chính xác toàn bộ mã lỗi Supabase & ASP.NET Core sang tiếng Việt
// - Cơ chế đồng bộ Bearer Token sang POST /api/auth/sync tuần tự, chống lệch pha (Async Mismatch)
// - Hỗ trợ "Remember Me" chuyển đổi linh hoạt localStorage / sessionStorage / in-memory

import { supabase } from "@/lib/supabase/client";

const API_BASE = typeof window !== "undefined"
  ? "" // Sử dụng Next.js Route Proxy cùng origin để triệt tiêu lỗi CORS Preflight
  : (process.env.NEXT_PUBLIC_API_URL || "https://studenthub-api-8fqp.onrender.com");

// =========================================================================
// 1. CHUẨN HÓA LOGGING & INTERCEPTOR DỊCH MÃ LỖI (DIAGNOSTIC LOGGING)
// =========================================================================

export function logAuthError(functionName, error, extraContext = null) {
  const detail = error?.message || error?.error_description || (typeof error === "string" ? error : JSON.stringify(error));
  console.error(`[AUTH_ERROR] - [${functionName}] - Chi tiết:`, detail, extraContext ? { extraContext } : "");
}

export function logAuthInfo(functionName, message, data = null) {
  console.log(`[AUTH_INFO] - [${functionName}] - ${message}`, data ? data : "");
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
    return "Đang kết nối tới máy chủ Backend (Render Cold Start). Vui lòng thử lại sau vài giây...";
  }

  return rawMsg || "Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.";
}

// =========================================================================
// 2. TOKEN & PREFERENCE STORAGE HELPERS (AN TOÀN CHỐNG CRASH)
// =========================================================================

export function setRememberMePreference(rememberMe) {
  if (typeof window === "undefined") return;
  try {
    if (rememberMe) {
      localStorage.setItem("studenthub_remember_me", "true");
    } else {
      localStorage.removeItem("studenthub_remember_me");
    }
  } catch (err) {
    logAuthError("setRememberMePreference", err);
  }
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  try {
    const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";
    if (isRemembered) {
      return localStorage.getItem("studenthub_jwt_token") || sessionStorage.getItem("studenthub_jwt_token");
    }
    return sessionStorage.getItem("studenthub_jwt_token");
  } catch (err) {
    logAuthError("getStoredToken", err);
    return null;
  }
}

export function setStoredToken(token, rememberMe = false) {
  if (typeof window === "undefined") return;
  try {
    if (token) {
      if (rememberMe) {
        localStorage.setItem("studenthub_jwt_token", token);
        sessionStorage.setItem("studenthub_jwt_token", token);
        localStorage.setItem("studenthub_remember_me", "true");
      } else {
        sessionStorage.setItem("studenthub_jwt_token", token);
        localStorage.removeItem("studenthub_jwt_token");
        localStorage.removeItem("studenthub_remember_me");
      }
    } else {
      sessionStorage.removeItem("studenthub_jwt_token");
      localStorage.removeItem("studenthub_jwt_token");
      localStorage.removeItem("studenthub_remember_me");
    }
  } catch (err) {
    logAuthError("setStoredToken", err);
  }
}

// =========================================================================
// 3. ASP.NET CORE BACKEND API AUTH & SYNC
// =========================================================================

/**
 * Đăng nhập Backend ASP.NET Core: POST /api/auth/login
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
      logAuthInfo("loginBackend", "Đã lưu JWT Token thành công.");
    }

    return data;
  } catch (error) {
    logAuthError("loginBackend", error);
    throw error;
  }
}

/**
 * Đăng ký Backend ASP.NET Core: POST /api/auth/register
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
 * Đồng bộ người dùng với ASP.NET Core Backend: POST /api/auth/sync
 * BẮT BUỘC gửi Bearer Token để Backend phân giải và nhận diện
 */
export async function syncBackendUser(userData = {}, explicitToken = null) {
  const activeToken = explicitToken || getStoredToken();
  logAuthInfo("syncBackendUser", `Đang gọi POST /api/auth/sync cho: ${userData?.email || userData?.id}`);

  try {
    const res = await fetch(`${API_BASE}/api/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: JSON.stringify({
        id: userData.id || userData.Id,
        email: userData.email || userData.Email,
        fullName: userData.fullName || userData.full_name || userData.name || userData.FullName,
        role: userData.role || userData.Role || "student",
        avatarUrl: userData.avatarUrl || userData.avatar_url || userData.AvatarUrl,
        githubUsername: userData.githubUsername || userData.github_username || userData.GithubUsername,
        reputationScore: userData.reputationScore || userData.reputation_score || userData.ReputationScore || 50,
      }),
    });

    if (!res.ok) {
      logAuthError("syncBackendUser", new Error(`Sync HTTP ${res.status}: ${res.statusText}`));
      return null;
    }

    const data = await res.json().catch(() => null);
    logAuthInfo("syncBackendUser", "Đồng bộ ASP.NET Core thành công.");
    return data;
  } catch (error) {
    logAuthError("syncBackendUser", error);
    return null;
  }
}

/**
 * Lấy thông tin user hiện tại qua JWT Bearer: GET /api/auth/me
 */
export async function getMeBackend() {
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

// =========================================================================
// 4. SUPABASE AUTH INTEGRATION (EMAIL, OTP, GOOGLE, GITHUB)
// =========================================================================

/**
 * Đăng ký tài khoản: Gửi thông tin và nhận mã OTP 6 số qua email
 */
export async function signUpWithEmail(email, password, fullName) {
  const cleanEmail = (email || "").trim();
  const isEdu = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test(cleanEmail);
  logAuthInfo("signUpWithEmail", `Bắt đầu đăng ký cho email: ${cleanEmail}`);

  try {
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          full_name: fullName,
          role: "student",
          avatar_id: "student-tech",
          trust_score: isEdu ? 80 : 50,
          verified_student: isEdu,
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

    // Tự động đồng bộ trước sang Backend ASP.NET Core DB
    registerBackend(cleanEmail, password, fullName).catch(() => {});

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
      await syncBackendUser(data.user, data.session.access_token);
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
    // 1. Thử đăng nhập qua Backend ASP.NET Core
    try {
      const backendResult = await loginBackend(cleanEmail, password, rememberMe);
      if (backendResult?.user && backendResult?.token) {
        logAuthInfo("signInWithPassword", "Đăng nhập ASP.NET Core thành công.");
        return { user: backendResult.user, token: backendResult.token };
      }
    } catch (backendErr) {
      logAuthInfo("signInWithPassword", "Chuyển sang đăng nhập Supabase Auth.");
    }

    // 2. Đăng nhập qua Supabase Auth
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
      // Gọi đồng bộ sang ASP.NET Core Backend
      await syncBackendUser(data.user, data.session.access_token);
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
    setStoredToken(null);
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("studenthub_user_profile");
      sessionStorage.removeItem("studenthub_demo_user");
      sessionStorage.removeItem("studenthub_jwt_token");
      localStorage.removeItem("studenthub_user_profile");
      localStorage.removeItem("studenthub_demo_user");
      localStorage.removeItem("studenthub_jwt_token");
      localStorage.removeItem("studenthub_remember_me");
    }

    const { error } = await supabase.auth.signOut().catch(() => ({ error: null }));
    if (error) {
      logAuthError("signOutSupabase", error);
    }
    logAuthInfo("signOutSupabase", "Đã xóa toàn bộ token và phiên làm việc.");
  } catch (error) {
    logAuthError("signOutSupabase", error);
  }
}

/**
 * Cập nhật hồ sơ người dùng
 */
export async function updateUserProfile(profileData) {
  logAuthInfo("updateUserProfile", "Cập nhật thông tin hồ sơ:", profileData);
  try {
    if (typeof window !== "undefined") {
      const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";
      const storage = isRemembered ? localStorage : sessionStorage;
      const cached = storage.getItem("studenthub_user_profile");
      const current = cached ? JSON.parse(cached) : {};
      const updated = { ...current, ...profileData };
      storage.setItem("studenthub_user_profile", JSON.stringify(updated));
    }

    const { data } = await supabase.auth.updateUser({
      data: profileData,
    }).catch(() => ({ data: { user: null } }));

    // Đồng bộ sang ASP.NET Core Backend
    await syncBackendUser(profileData);

    return data?.user || profileData;
  } catch (error) {
    logAuthError("updateUserProfile", error);
    return profileData;
  }
}
