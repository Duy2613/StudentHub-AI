// lib/auth/authService.js
//
// Toàn bộ authentication chuyển sang dùng Supabase Auth theo đúng chỉ đạo
// từ backend — Frontend không tự hash password, không tự tạo OTP, không
// tự gửi SMTP, không tự giữ Google Client Secret. Sau khi Supabase xác
// thực xong, gọi backend /api/auth/sync và /api/auth/me bằng access_token
// của Supabase, đồng thời quản lý metadata profile an toàn.

import { supabase } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ---------------- Helper Dịch Lỗi Tiếng Việt ----------------

export function translateAuthError(error) {
  if (!error) return "Đã xảy ra lỗi, vui lòng thử lại.";
  const msg = typeof error === "string" ? error : error.message || "";
  const lower = msg.toLowerCase();

  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return "Email hoặc mật khẩu không chính xác. Vui lòng kiểm tra lại.";
  }
  if (lower.includes("email not confirmed") || lower.includes("email_not_confirmed")) {
    return "Email chưa được xác thực. Vui lòng kiểm tra hộp thư (kể cả thư rác) để lấy mã xác nhận.";
  }
  if (lower.includes("user already registered") || lower.includes("already registered")) {
    return "Email này đã được đăng ký tài khoản. Vui lòng chuyển sang Đăng nhập.";
  }
  if (lower.includes("password should be at least 6") || lower.includes("weak_password")) {
    return "Mật khẩu phải có độ dài tối thiểu 6 ký tự.";
  }
  if (lower.includes("rate limit") || lower.includes("too many requests") || lower.includes("over_email_send_rate_limit")) {
    return "Bạn thao tác quá nhanh hoặc gửi quá nhiều yêu cầu. Vui lòng chờ 1-2 phút rồi thử lại.";
  }
  if (lower.includes("token has expired") || lower.includes("otp expired")) {
    return "Mã xác nhận đã hết hạn. Vui lòng nhấn 'Gửi lại mã'.";
  }
  if (lower.includes("invalid token") || lower.includes("token is invalid")) {
    return "Mã xác nhận không chính xác. Vui lòng kiểm tra lại 6 chữ số trong email.";
  }
  if (lower.includes("network") || lower.includes("failed to fetch")) {
    return "Không thể kết nối máy chủ. Vui lòng kiểm tra kết nối mạng của bạn.";
  }

  return msg || "Đã xảy ra lỗi trong quá trình xác thực. Vui lòng thử lại.";
}

// ---------------- Supabase Auth ----------------

/**
 * Bước 1 của đăng ký: tạo tài khoản, Supabase tự gửi email OTP xác nhận.
 */
export async function signUpWithEmail(email, password, fullName) {
  const isEdu = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test((email || "").trim());
  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
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
  return data;
}

/**
 * Bước 2 của đăng ký: xác nhận mã OTP người dùng nhận qua email.
 */
export async function verifySignupOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email: email.trim(),
    token: token.trim(),
    type: "email",
  });
  if (error) throw new Error(translateAuthError(error));
  return data;
}

/**
 * Gửi lại email OTP nếu người dùng không nhận được / mã hết hạn.
 */
export async function resendSignupOtp(email) {
  const { error } = await supabase.auth.resend({ type: "signup", email: email.trim() });
  if (error) throw new Error(translateAuthError(error));
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  if (error) throw new Error(translateAuthError(error));
  return data;
}

/**
 * Redirect toàn trang sang Google qua Supabase OAuth.
 */
export function signInWithGoogle() {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${origin}/callback` },
  });
}

export async function signOutSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(translateAuthError(error));
}

/**
 * Cập nhật thông tin User Metadata trong Supabase Auth (role, avatar, bio, trường...)
 */
export async function updateUserProfile(profileData) {
  const { data, error } = await supabase.auth.updateUser({
    data: profileData,
  });
  if (error) throw new Error(translateAuthError(error));
  return data.user;
}

// ---------------- Backend StudentHub API ----------------

async function authorizedFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Chưa đăng nhập (không có session Supabase).");
  }

  if (!API_BASE) {
    console.warn("[API] NEXT_PUBLIC_API_URL chưa được cấu hình, dùng fallback profile.");
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const res = await fetch(`${API_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        ...(options.headers || {}),
      },
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      throw new Error(body?.message || `Lỗi gọi API (HTTP ${res.status})`);
    }

    return await res.json();
  } catch (err) {
    clearTimeout(timeoutId);
    console.warn(`[API] Lỗi khi gọi ${path}:`, err.message);
    throw err;
  }
}

/**
 * Đồng bộ hồ sơ sang backend với cơ chế graceful fallback.
 */
export async function syncProfile(fullName) {
  try {
    return await authorizedFetch("/api/auth/sync", {
      method: "POST",
      body: JSON.stringify(fullName ? { fullName } : {}),
    });
  } catch (err) {
    console.warn("[syncProfile] Không thể đồng bộ backend (đang chạy chế độ client profile):", err.message);
    return { success: true, fallback: true };
  }
}

/**
 * Lấy thông tin User StudentHub sau khi đã đăng nhập.
 */
export async function getMe() {
  try {
    return await authorizedFetch("/api/auth/me");
  } catch (err) {
    console.warn("[getMe] Backend tạm thời không khả dụng, sử dụng Supabase metadata.");
    return null;
  }
}
