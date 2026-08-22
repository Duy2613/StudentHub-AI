// lib/auth/authService.js
//
// Kết nối trực tiếp với Backend ASP.NET Core API của StudentHub & Supabase Auth:
// - POST /api/auth/register: Đăng ký tài khoản (hashing bằng PasswordHasher, lưu DB)
// - POST /api/auth/login: Đăng nhập (trả về JWT Token 24h & thông tin User)
// - POST /api/auth/sync: Đồng bộ tài khoản sau khi đăng nhập OAuth / Email
// - GET /api/auth/me: Lấy thông tin user hiện tại qua JWT Bearer Token
// - GET /api/users: Lấy danh sách cộng đồng sinh viên & chuyên gia
// - Tích hợp Supabase Auth với cơ chế "Remember Me" (Ghi nhớ đăng nhập) linh hoạt

import { supabase } from "@/lib/supabase/client";

const API_BASE = typeof window !== "undefined"
  ? "" // Gọi qua Next.js Route Proxy cùng domain để tránh CORS Preflight 405
  : (process.env.NEXT_PUBLIC_API_URL || "https://studenthub-api-8fqp.onrender.com");

// ---------------- Helper Dịch Lỗi Tiếng Việt ----------------

export function translateAuthError(error) {
  if (!error) return "Đã xảy ra lỗi, vui lòng thử lại.";
  const msg = typeof error === "string" ? error : error.message || error.error_description || "";
  const lower = msg.toLowerCase();

  if (lower.includes("đã được đăng ký thông qua tài khoản google") || lower.includes("tiếp tục với google")) {
    return msg;
  }
  if (lower.includes("email already exists") || lower.includes("already registered") || lower.includes("user already registered") || lower.includes("đã tồn tại")) {
    return "Email này đã được sử dụng. Vui lòng chuyển sang Đăng nhập hoặc sử dụng 'Continue with Google'.";
  }
  if (lower.includes("invalid email or password") || lower.includes("invalid login credentials") || lower.includes("invalid_credentials") || lower.includes("không chính xác")) {
    return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
  }
  if (lower.includes("password should be at least 6") || lower.includes("weak_password") || lower.includes("tối thiểu 6")) {
    return "Mật khẩu phải có độ dài tối thiểu 6 ký tự.";
  }
  if (lower.includes("error sending confirmation email") || lower.includes("rate limit") || lower.includes("over_email_send_rate_limit") || lower.includes("confirmation email")) {
    return "Dịch vụ gửi email xác thực đang quá tải hoặc gặp sự cố. Bạn có thể sử dụng Đăng nhập bằng Google/GitHub hoặc Đăng nhập nhanh để tiếp tục.";
  }
  if (lower.includes("token has expired") || lower.includes("otp expired")) {
    return "Mã OTP 6 số đã hết hạn. Vui lòng nhấn 'Gửi lại mã'.";
  }
  if (lower.includes("invalid token") || lower.includes("token is invalid") || lower.includes("otp invalid")) {
    return "Mã xác nhận OTP 6 số không chính xác. Vui lòng kiểm tra lại trong hộp thư của bạn.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch") || lower.includes("cold start")) {
    return "Đang kết nối tới máy chủ Backend (Render Cold Start). Vui lòng thử lại sau giây lát...";
  }

  return msg || "Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.";
}

// ---------------- Token & Remember Me Helper ----------------

export function setRememberMePreference(rememberMe) {
  if (typeof window === "undefined") return;
  if (rememberMe) {
    localStorage.setItem("studenthub_remember_me", "true");
  } else {
    localStorage.removeItem("studenthub_remember_me");
  }
}

export function getStoredToken() {
  if (typeof window === "undefined") return null;
  const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";
  if (isRemembered) {
    return localStorage.getItem("studenthub_jwt_token") || sessionStorage.getItem("studenthub_jwt_token");
  }
  return sessionStorage.getItem("studenthub_jwt_token");
}

export function setStoredToken(token, rememberMe = false) {
  if (typeof window === "undefined") return;
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
}

// ---------------- Backend ASP.NET Core API Auth ----------------

/**
 * Đăng ký tài khoản trực tiếp qua Backend ASP.NET Core: POST /api/auth/register
 */
export async function registerBackend(email, password, fullName) {
  const cleanEmail = email.trim();

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
    throw new Error(data?.message || "Đăng ký thất bại.");
  }

  // Tự động đăng nhập ngay sau khi đăng ký thành công để lấy JWT Token
  return await loginBackend(cleanEmail, password, false);
}

/**
 * Đăng nhập qua Backend ASP.NET Core: POST /api/auth/login
 */
export async function loginBackend(email, password, rememberMe = false) {
  const cleanEmail = email.trim();

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
    throw new Error(data?.message || "Đăng nhập thất bại.");
  }

  if (data?.token) {
    setStoredToken(data.token, rememberMe);
  }

  return data;
}

/**
 * Đồng bộ người dùng với ASP.NET Core Backend sau khi đăng nhập: POST /api/auth/sync
 */
export async function syncBackendUser(userData = {}, token = null) {
  const activeToken = token || getStoredToken();
  try {
    const res = await fetch(`${API_BASE}/api/auth/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(activeToken ? { Authorization: `Bearer ${activeToken}` } : {}),
      },
      body: JSON.stringify({
        id: userData.id,
        email: userData.email,
        fullName: userData.fullName || userData.full_name || userData.name,
        role: userData.role || "student",
        avatarUrl: userData.avatarUrl || userData.avatar_url,
        githubUsername: userData.githubUsername || userData.github_username,
        reputationScore: userData.reputationScore || userData.reputation_score || 50,
      }),
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[Backend Sync Warning]:", err);
    return null;
  }
}

/**
 * Lấy thông tin user hiện tại: GET /api/auth/me
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

    const data = await res.json();
    return data?.user || data;
  } catch {
    return null;
  }
}

/**
 * Lấy danh sách cộng đồng người dùng: GET /api/users
 */
export async function getUsersBackend() {
  try {
    const res = await fetch(`${API_BASE}/api/users`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

// ---------------- Supabase OTP & Authentication ----------------

/**
 * Bước 1 của đăng ký: tạo tài khoản, gửi email mã OTP 6 số xác nhận.
 */
export async function signUpWithEmail(email, password, fullName) {
  const cleanEmail = email.trim();
  const isEdu = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test(cleanEmail);

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

  if (error) throw new Error(translateAuthError(error));

  if (data?.user) {
    const identities = data.user.identities || [];
    const isGoogleAccount = identities.length === 0 || identities.every((i) => i.provider === "google");

    if (isGoogleAccount) {
      throw new Error(
        "Email này đã được đăng ký thông qua tài khoản Google từ trước. Bạn không thể đăng ký bằng Mật khẩu cho email này. Vui lòng sử dụng 'Continue with Google' để đăng nhập."
      );
    }
  }

  // Tự động đồng bộ tài khoản vào Backend ASP.NET Core DB
  registerBackend(cleanEmail, password, fullName).catch(() => {});

  return data;
}

/**
 * Bước 2 của đăng ký: xác thực mã OTP 6 số nhận qua email.
 */
export async function verifySignupOtp(email, token) {
  const cleanToken = (token || "").trim();
  if (cleanToken.length !== 6 || !/^\d+$/.test(cleanToken)) {
    throw new Error("Mã xác nhận phải gồm đúng 6 chữ số.");
  }

  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: cleanToken,
    type: "email",
  });

  if (error) throw new Error(translateAuthError(error));
  return data;
}

/**
 * Gửi lại mã xác nhận OTP 6 số về email.
 */
export async function resendSignupOtp(email) {
  const { data, error } = await supabase.auth.resend({
    type: "signup",
    email: email.trim(),
  });
  if (error) throw new Error(translateAuthError(error));
  return data;
}

export async function signInWithPassword(email, password, rememberMe = false) {
  const cleanEmail = email.trim();
  setRememberMePreference(rememberMe);

  // Ưu tiên đăng nhập qua Backend ASP.NET Core API
  try {
    const backendResult = await loginBackend(cleanEmail, password, rememberMe);
    if (backendResult?.user) {
      return { user: backendResult.user, token: backendResult.token };
    }
  } catch (backendErr) {
    if (backendErr.message?.includes("Invalid") || backendErr.message?.includes("không chính xác")) {
      throw new Error("Email hoặc mật khẩu không chính xác.");
    }
  }

  // Fallback qua Supabase
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });
  if (error) throw new Error(translateAuthError(error));

  if (data?.session?.access_token) {
    setStoredToken(data.session.access_token, rememberMe);
  }

  return data;
}

export function signInWithGoogle() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/callback` },
  });
}

export function signInWithGitHub() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return supabase.auth.signInWithOAuth({
    provider: "github",
    options: {
      redirectTo: `${origin}/callback`,
      scopes: "read:user user:email",
    },
  });
}

export async function signOutSupabase() {
  setStoredToken(null);
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("studenthub_user_profile");
    sessionStorage.removeItem("studenthub_demo_user");
    localStorage.removeItem("studenthub_user_profile");
    localStorage.removeItem("studenthub_demo_user");
    localStorage.removeItem("studenthub_remember_me");
  }
  const { error } = await supabase.auth.signOut().catch(() => ({}));
  if (error) throw new Error(translateAuthError(error));
}

export async function updateUserProfile(profileData) {
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
  syncBackendUser(profileData).catch(() => {});

  return data?.user || profileData;
}

export async function syncProfile(fullName) {
  return await syncBackendUser({ fullName });
}

export async function getMe() {
  return await getMeBackend();
}
