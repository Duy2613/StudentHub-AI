// frontend/src/lib/supabase/client.js
//
// Supabase Client với Custom Dynamic Storage Adapter:
// - Khi người dùng tick "Ghi nhớ đăng nhập" (Remember Me = true): Lưu trữ lâu dài qua localStorage.
// - Khi không tick (Remember Me = false): Lưu trữ trong sessionStorage (tự động xóa khi đóng tab/trình duyệt).

import { createClient } from "@supabase/supabase-js";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!envUrl || !envAnonKey) {
  console.error(
    "[Supabase] Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY trong .env.local — mọi chức năng đăng nhập/đăng ký sẽ không hoạt động cho tới khi thêm vào."
  );
}

/**
 * Dynamic Storage Adapter: Chuyển đổi linh hoạt giữa localStorage và sessionStorage
 */
export const dynamicAuthStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";
    if (isRemembered) {
      return localStorage.getItem(key) || sessionStorage.getItem(key);
    }
    return sessionStorage.getItem(key);
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";
    if (isRemembered) {
      localStorage.setItem(key, value);
      sessionStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(
  envUrl || "https://placeholder.supabase.co",
  envAnonKey || "placeholder-anon-key",
  {
    auth: {
      storage: dynamicAuthStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);
