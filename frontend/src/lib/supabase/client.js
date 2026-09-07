// frontend/src/lib/supabase/client.js
//
// Supabase client with a memory-only auth adapter.
// Provider access/refresh credentials are transient exchange material. They
// must never be persisted in Web Storage; the application session boundary is
// the server-issued HttpOnly studenthub_session cookie.

import { createClient } from "@supabase/supabase-js";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Never let an absent local configuration silently become a real network
// request to a fake Supabase host. The fallback client below is retained for
// compatibility with existing imports/tests, while auth flows use this
// explicit readiness flag before calling Supabase.
const hasUsableSupabaseUrl = Boolean(
  envUrl && !/placeholder|your[-_ ]?project|example\.com/i.test(envUrl)
);
const hasUsableSupabaseAnonKey = Boolean(
  envAnonKey && !/placeholder|your[-_ ]?anon|change[-_ ]?me/i.test(envAnonKey)
);

export const isSupabaseConfigured = hasUsableSupabaseUrl && hasUsableSupabaseAnonKey;

export function createSupabaseConfigurationError() {
  const error = new Error(
    "Supabase Auth chưa được cấu hình. Hãy điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_ANON_KEY trong frontend/.env.local rồi khởi động lại frontend."
  );
  error.code = "SUPABASE_NOT_CONFIGURED";
  return error;
}

if (!isSupabaseConfigured) {
  if (typeof window !== "undefined") {
    console.warn(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL hoặc NEXT_PUBLIC_SUPABASE_ANON_KEY chưa được cấu hình. Sử dụng chế độ demo và in-memory auth."
    );
  }
}

const memoryStorage = new Map();

/**
 * Compatibility-preserving Supabase storage adapter.
 *
 * Supabase still expects a storage-shaped object, but every value remains in
 * process memory for the current page. Preferences and non-sensitive profile
 * caches are owned by their callers and are deliberately not handled here.
 */
export const dynamicAuthStorage = {
  getItem: (key) => {
    return typeof window === "undefined" ? null : memoryStorage.get(key) || null;
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    memoryStorage.set(key, value);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    memoryStorage.delete(key);
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
