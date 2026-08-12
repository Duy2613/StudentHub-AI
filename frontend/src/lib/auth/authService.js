// lib/auth/authService.js
//
// Toàn bộ authentication chuyển sang dùng Supabase Auth theo đúng chỉ đạo
// từ backend — Frontend không tự hash password, không tự tạo OTP, không
// tự gửi SMTP, không tự giữ Google Client Secret. Sau khi Supabase xác
// thực xong, gọi backend /api/auth/sync và /api/auth/me bằng access_token
// của Supabase.

import { supabase } from "@/lib/supabase/client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

// ---------------- Supabase Auth ----------------

/**
 * Bước 1 của đăng ký: tạo tài khoản, Supabase tự gửi email OTP xác nhận.
 */
export async function signUpWithEmail(email, password, fullName) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Bước 2 của đăng ký: xác nhận mã OTP người dùng nhận qua email.
 *
 * TODO đã tra cứu tài liệu Supabase chính thức: type "signup" và
 * "magiclink" đã DEPRECATED — giá trị đúng hiện tại cho OTP gửi qua email
 * (bao gồm cả xác nhận đăng ký) là "email". Nếu backend cấu hình khác đi,
 * cần đổi lại type ở đây.
 */
export async function verifySignupOtp(email, token) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Gửi lại email OTP nếu người dùng không nhận được / mã hết hạn.
 *
 * QUAN TRỌNG: dùng type "signup" ở đây (KHÔNG phải "email" như verifyOtp
 * phía trên) — dù tài liệu Supabase liệt kê "signup" là deprecated, tra
 * cứu thực tế cho thấy endpoint resend() vẫn từ chối type "email" với lỗi
 * "Missing one of these types: signup, email_change, sms, phone_change"
 * — tức 2 hàm verifyOtp và resend dùng 2 tập giá trị type khác nhau dù
 * nhìn giống nhau. Đừng "sửa cho đồng bộ" nếu thấy khác nhau — đây là chủ đích.
 */
export async function resendSignupOtp(email) {
  const { error } = await supabase.auth.resend({ type: "signup", email });
  if (error) throw new Error(error.message);
}

export async function signInWithPassword(email, password) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

/**
 * Redirect toàn trang sang Google qua Supabase OAuth. Supabase tự quản lý
 * Google Client Secret ở phía họ — Frontend không đụng vào việc đó.
 */
export function signInWithGoogle() {
  return supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/callback` },
  });
}

export async function signOutSupabase() {
  const { error } = await supabase.auth.signOut();
  if (error) throw new Error(error.message);
}

// ---------------- Backend StudentHub API ----------------

async function authorizedFetch(path, options = {}) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error("Chưa đăng nhập (không có session Supabase).");
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Lỗi gọi API (HTTP ${res.status})`);
  }

  return res.json();
}

/**
 * Gọi sau khi Supabase signUp/login/Google OAuth thành công, để backend
 * tạo/cập nhật User StudentHub tương ứng với SupabaseUserId lấy từ JWT.
 *
 * QUYẾT ĐỊNH: khi ĐĂNG NHẬP LẠI (không phải lần đăng ký đầu), không có
 * fullName mới để gửi — body sẽ không kèm field này. Vì backend mô tả
 * hành vi endpoint là "tạo/cập nhật" (upsert theo SupabaseUserId), gửi
 * thiếu field này chỉ nên coi là "giữ nguyên giá trị đã có", không phải
 * xoá tên đã lưu. Nếu backend implement /api/auth/sync theo kiểu ghi đè
 * toàn bộ record (không phải partial update), cần báo lại để đổi cách này.
 */
export function syncProfile(fullName) {
  return authorizedFetch("/api/auth/sync", {
    method: "POST",
    body: JSON.stringify(fullName ? { fullName } : {}),
  });
}

/**
 * Lấy thông tin User StudentHub (id, role, trustScore,
 * universityEmailVerified...) sau khi đã đăng nhập.
 */
export function getMe() {
  return authorizedFetch("/api/auth/me");
}
