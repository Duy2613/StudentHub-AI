// frontend/src/lib/supabase/client.js
//
// Supabase client with a memory-only auth adapter.
// Provider access/refresh credentials are transient exchange material. They
// must never be persisted in Web Storage; the application session boundary is
// the server-issued HttpOnly studenthub_session cookie.

import { createClient } from "@supabase/supabase-js";

const envUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const envAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!envUrl || !envAnonKey) {
  if (typeof window !== "undefined") {
    console.warn(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL hoặc public key chưa được cấu hình. Auth is disabled until the deployment supplies the approved Supabase configuration."
    );
  }
}

export const supabaseConfigured = Boolean(envUrl && envAnonKey);

const memoryStorage = new Map();

function isPkceVerifierKey(key) {
  return String(key || "").toLowerCase().includes("code-verifier");
}

function getSessionStorage() {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage || null;
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[Supabase] Session-scoped PKCE storage is unavailable.", error?.name || "STORAGE_ERROR");
    }
    return null;
  }
}

/**
 * Compatibility-preserving Supabase storage adapter.
 *
 * Supabase still expects a storage-shaped object, but every value remains in
 * process memory for the current page. Preferences and non-sensitive profile
 * caches are owned by their callers and are deliberately not handled here.
 */
export const dynamicAuthStorage = {
  getItem: (key) => {
    if (typeof window === "undefined") return null;
    if (isPkceVerifierKey(key)) {
      try {
        return window.sessionStorage.getItem(key) || memoryStorage.get(key) || null;
      } catch {
        return memoryStorage.get(key) || null;
      }
    }
    return memoryStorage.get(key) || null;
  },
  setItem: (key, value) => {
    if (typeof window === "undefined") return;
    // A PKCE verifier must survive the full-page provider redirect. It is not
    // an application session or provider token, so it is kept only in the
    // current tab's sessionStorage and is removed by Supabase after exchange.
    if (isPkceVerifierKey(key)) {
      const storage = getSessionStorage();
      if (storage) {
        try {
          storage.setItem(key, value);
          return;
        } catch {
          // Fall through to memory so a same-document callback can still work.
        }
      }
    }
    memoryStorage.set(key, value);
  },
  removeItem: (key) => {
    if (typeof window === "undefined") return;
    if (isPkceVerifierKey(key)) {
      const storage = getSessionStorage();
      try {
        storage?.removeItem(key);
      } catch {
        // Best-effort cleanup; Supabase will retry removal on the next flow.
      }
    }
    memoryStorage.delete(key);
  },
};

export function clearPkceVerifierStorage() {
  const storage = getSessionStorage();
  if (!storage) return;
  try {
    for (let index = storage.length - 1; index >= 0; index -= 1) {
      const key = storage.key(index);
      if (isPkceVerifierKey(key)) storage.removeItem(key);
    }
  } catch {
    // Storage cleanup must never prevent logout or navigation.
  }
}

export const supabase = createClient(
  envUrl || "https://placeholder.supabase.co",
  envAnonKey || "placeholder-anon-key",
  {
    auth: {
      storage: dynamicAuthStorage,
      persistSession: typeof window !== "undefined",
      autoRefreshToken: typeof window !== "undefined",
      detectSessionInUrl: typeof window !== "undefined",
      flowType: "pkce",
    },
  }
);
