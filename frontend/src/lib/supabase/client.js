// frontend/src/lib/supabase/client.js
//
// Supabase Client với Custom Dynamic Storage Adapter an toàn tuyệt đối:
// - Khi người dùng tick "Ghi nhớ đăng nhập" (Remember Me = true): Lưu trữ lâu dài qua localStorage.
// - Khi không tick (Remember Me = false): Lưu trữ trong sessionStorage (tự động xóa khi đóng tab/trình duyệt).
// - Fallback an toàn qua In-Memory Storage khi trình duyệt chặn cookie/storage (Incognito mode, Safari sandbox).

import { createClient } from "@supabase/supabase-js";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!envUrl || !envAnonKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY chưa được cấu hình. Sử dụng chế độ demo và in-memory auth."
    );
  }
}

const memoryStorage = new Map();

/**
 * Dynamic Storage Adapter: Chuyển đổi linh hoạt giữa localStorage và sessionStorage với try-catch an toàn
 */
export const dynamicAuthStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    try {
      const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";
      if (isRemembered) {
        return localStorage.getItem(key) || sessionStorage.getItem(key) || memoryStorage.get(key) || null;
      }
      return sessionStorage.getItem(key) || memoryStorage.get(key) || null;
    } catch {
      return memoryStorage.get(key) || null;
    }
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    try {
      memoryStorage.set(key, value);
      const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";
      if (isRemembered) {
        localStorage.setItem(key, value);
        sessionStorage.setItem(key, value);
      } else {
        sessionStorage.setItem(key, value);
        localStorage.removeItem(key);
      }
    } catch {
      memoryStorage.set(key, value);
    }
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    try {
      memoryStorage.delete(key);
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    } catch {
      memoryStorage.delete(key);
    }
  },
};

export const supabase = createClient(
  envUrl || "https://placeholder.supabase.co",
  envAnonKey || "placeholder-anon-key",
  {
    auth: {
      storage: dynamicAuthStorage,
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
      detectSessionInUrl: typeof window !== "undefined",
    },
  }
);
