"use client";

// lib/auth/AuthContext.jsx
//
// Quản lý 2 tầng trạng thái:
//  - session: phiên đăng nhập Supabase (do Supabase SDK tự quản lý, tự
//    refresh token, không cần Frontend tự làm gì thêm)
//  - profile: hồ sơ User bên StudentHub backend (id, role, trustScore...),
//    lấy về bằng GET /api/auth/me sau khi có session

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { getMe, syncProfile, signOutSupabase } from "./authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const syncedRef = useRef(false);

  const loadProfile = useCallback(async () => {
    try {
      const me = await getMe();
      setProfile(me);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      setSession(currentSession);
      if (currentSession) loadProfile();
      setIsLoading(false);
    });

    // Lắng nghe mọi thay đổi: đăng nhập, đăng xuất, token tự refresh —
    // Supabase SDK tự lo việc refresh, Frontend chỉ cần lắng nghe kết quả.
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadProfile();
      } else {
        setProfile(null);
        syncedRef.current = false;
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [loadProfile]);

  /**
   * Gọi /api/auth/sync — dùng ref để tránh gọi lặp lại nhiều lần không
   * cần thiết trong 1 phiên (ví dụ khi onAuthStateChange bắn nhiều sự kiện
   * liên tiếp lúc mới đăng nhập).
   */
  const ensureSynced = useCallback(
    async (fullName) => {
      if (syncedRef.current) return;
      await syncProfile(fullName);
      syncedRef.current = true;
      await loadProfile();
    },
    [loadProfile]
  );

  const signOut = useCallback(async () => {
    await signOutSupabase();
    setSession(null);
    setProfile(null);
    syncedRef.current = false;
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, profile, isLoading, ensureSynced, signOut, refreshProfile: loadProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth phải được dùng bên trong <AuthProvider>");
  }
  return ctx;
}
