"use client";

// frontend/src/lib/auth/AuthContext.jsx
//
// Trình quản lý xác thực & trạng thái người dùng (Auth Context Provider):
// - Kiến trúc State Machine chống vòng lặp vô hạn (Infinite Loop Prevention)
// - Bọc 100% try/catch với Diagnostic Logging [AUTH_ERROR] & [AUTH_INFO]
// - Authenticated UI state is established only after the server-owned opaque
//   HttpOnly session exists; provider proof remains transient.
// - Tự động định dạng Profile với đầy đủ thuộc tính an toàn (Zero undefined crash)

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  exchangeApplicationSession,
  getApplicationSession,
  getOwnProfile,
  signOutSupabase,
  updateUserProfile as updateUserProfileService,
  syncBackendUser,
  getStoredToken,
  logAuthError,
  logAuthInfo,
} from "./authService";

const AuthContext = createContext(null);

const DEMO_STUDENT = {
  id: "demo-student-01",
  email: "student.hust@sis.hust.edu.vn",
  fullName: "Duy Nguyễn",
  role: "student",
  avatarId: "student-tech",
  avatarUrl: null,
  university: "Đại học Bách Khoa Hà Nội (HUST)",
  major: "Kỹ thuật Phần mềm & Trí tuệ Nhân tạo",
  academicYear: "K65 (2023 - 2027)",
  expertTitle: "Kỹ sư Trưởng AI",
  expertField: "Trí tuệ nhân tạo (AI & Machine Learning)",
  experienceYears: "3+ năm",
  bio: "Sinh viên đam mê nghiên cứu Machine Learning, Next.js và đồng hành cùng StudentHub AI.",
  trustScore: 80,
  verifiedStudent: true,
  verifiedExpert: false,
  onboarded: true,
  badges: ["🎓 Sinh Viên Xác Thực", "🤖 AI Explorer", "Học Giả Tích Cực"],
  rating: 4.95,
  answersCount: 16,
  questionsCount: 7,
};

const DEMO_EXPERT = {
  id: "demo-expert-01",
  email: "expert.ai@studenthub.ai",
  fullName: "TS. Nguyễn Minh Đức",
  role: "expert",
  avatarId: "expert-ai",
  avatarUrl: null,
  university: "Đại học Quốc gia Hà Nội (VNU)",
  major: "Khoa học Máy tính",
  academicYear: "Giảng viên",
  expertTitle: "Chuyên gia AI & Deep Learning",
  expertField: "Trí tuệ nhân tạo (AI & Machine Learning)",
  experienceYears: "6+ năm kinh nghiệm",
  bio: "Tiến sĩ Khoa học Máy tính. Chuyên gia nghiên cứu về Large Language Models (LLMs) & Deep Learning. Cố vấn học thuật uy tín của StudentHub AI.",
  trustScore: 99,
  verifiedStudent: false,
  verifiedExpert: true,
  onboarded: true,
  badges: ["⭐ Chuyên Gia Uy Tín", "Cố Vấn Xuất Sắc", "Top 1 Giải Đáp"],
  rating: 4.98,
  answersCount: 380,
  questionsCount: 2,
};

function getClientStorage(storageName) {
  if (typeof window === "undefined") return null;
  try {
    return window[storageName] || null;
  } catch (error) {
    logAuthError(`AuthContext:storage:${storageName}`, error);
    return null;
  }
}

function readClientStorage(storageName, key) {
  const storage = getClientStorage(storageName);
  if (!storage) return null;
  try {
    return storage.getItem(key);
  } catch (error) {
    logAuthError(`AuthContext:storage:${storageName}:read`, error);
    return null;
  }
}

function writeClientStorage(storageName, key, value) {
  const storage = getClientStorage(storageName);
  if (!storage) return false;
  try {
    storage.setItem(key, value);
    return true;
  } catch (error) {
    logAuthError(`AuthContext:storage:${storageName}:write`, error);
    return false;
  }
}

function removeClientStorage(storageName, key) {
  const storage = getClientStorage(storageName);
  if (!storage) return;
  try {
    storage.removeItem(key);
  } catch (error) {
    logAuthError(`AuthContext:storage:${storageName}:remove`, error);
  }
}

function isRememberedSession() {
  return readClientStorage("localStorage", "studenthub_remember_me") === "true";
}

/**
 * Định dạng Profile chuẩn hóa an toàn từ User Object
 */
function formatProfile(user, serverProfile = null) {
  if (!user) return null;

  let cached = {};
  if (typeof window !== "undefined") {
    try {
      const s = isRememberedSession()
        ? readClientStorage("localStorage", "studenthub_user_profile") || readClientStorage("sessionStorage", "studenthub_user_profile")
        : readClientStorage("sessionStorage", "studenthub_user_profile");
      if (s) cached = JSON.parse(s);
    } catch (err) {
      logAuthError("formatProfile:parseCache", err);
    }
  }

  const authoritativeProfile = serverProfile || user.serverProfile || {};
  const roles = Array.isArray(user.roles)
    ? user.roles.map((value) => String(value).toUpperCase())
    : [];
  const rawRole = roles.includes("ADMIN")
    ? "admin"
    : roles.includes("EXPERT")
      ? "expert"
      : "student";
  const isExpert = rawRole === "expert";
  // Provider metadata and browser cache are presentation hints only. The
  // server profile projection supplies mutable fields; role and verification
  // remain derived from the server-owned session/profile contract.
  const email = user.email || user.Email || "";
  const fullName = authoritativeProfile.fullName || user.displayName || user.fullName || cached.fullName || "Người dùng StudentHub";
  const isEdu = authoritativeProfile.universityEmailVerified === true;
  const explicitTrustScore = [
    authoritativeProfile.reputationScore,
    authoritativeProfile.trustScore,
  ].find((value) => typeof value === "number" && Number.isFinite(value));

  return {
    id: String(user.id || user.userId || cached.id || "user-1"),
    email: email,
    fullName: fullName,
    role: rawRole,
    emailVerified: user.emailVerified === true,
    avatarId: authoritativeProfile.avatarId || cached.avatarId || (isExpert ? "expert-ai" : "student-tech"),
    avatarUrl: authoritativeProfile.avatarUrl || cached.avatarUrl || null,
    university: authoritativeProfile.university || cached.university || (isEdu ? "Đã xác minh theo nguồn tổ chức" : "Chưa cập nhật"),
    major: authoritativeProfile.major || cached.major || "Khoa học & Kỹ thuật",
    academicYear: authoritativeProfile.academicYear || cached.academicYear || "2024-2028",
    expertTitle: authoritativeProfile.expertTitle || cached.expertTitle || "Chuyên gia Tư vấn & Nghiên cứu",
    expertField: authoritativeProfile.expertField || cached.expertField || "Trí tuệ nhân tạo (AI & Machine Learning)",
    experienceYears: authoritativeProfile.experienceYears || cached.experienceYears || "3+ năm kinh nghiệm",
    bio: authoritativeProfile.bio || cached.bio || (isExpert ? "Chuyên gia giải đáp học thuật và định hướng nghiên cứu cho sinh viên." : "Sinh viên đam mê học tập, khám phá công nghệ và AI."),
    trustScore: explicitTrustScore ?? null,
    reputationScore: explicitTrustScore ?? null,
    githubUsername: cached.github_username || cached.githubUsername || null,
    topRepos: cached.top_repos || cached.topRepos || [],
    verifiedStudent: isEdu,
    verifiedExpert: isExpert,
    onboarded: authoritativeProfile.onboardingCompleted === true || authoritativeProfile.onboarded === true,
    badges: cached.badges || (isExpert ? ["⭐ Chuyên Gia Uy Tín", "Cố Vấn Xuất Sắc", "Top Người Giải Đáp"] : ["Sinh Viên Tiên Phong", "Học Giả Tích Cực"]),
    rating: cached.rating || 4.95,
    answersCount: cached.answersCount || (isExpert ? 24 : 3),
    questionsCount: cached.questionsCount || (isExpert ? 2 : 8),
  };
}

function normalizeApplicationUser(user) {
  const roles = Array.isArray(user?.roles)
    ? user.roles.map((value) => String(value).toUpperCase())
    : [];
  const primaryRole = roles.includes("ADMIN")
    ? "admin"
    : roles.includes("EXPERT")
      ? "expert"
      : "student";
  return {
    id: String(user?.id || user?.userId || ""),
    userId: String(user?.userId || user?.id || ""),
    email: String(user?.email || "").trim().toLowerCase(),
    emailVerified: user?.emailVerified === true,
    role: primaryRole,
    roles,
    authProvider: user?.authProvider || "supabase",
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Idempotency tracking ref để tránh loop vô hạn
  const lastSessionTokenRef = useRef(null);
  const applicationSessionReadyRef = useRef(false);

  // Khởi tạo Auth khi Mount (Single execution)
  useEffect(() => {
    let mounted = true;
    logAuthInfo("AuthProvider", "Bắt đầu khởi tạo Auth State.");

    const initAuth = async () => {
      try {
        if (typeof window === "undefined") return;

        const isRemembered = isRememberedSession();

        // 1. Restore the server-authoritative opaque session first. Provider
        // credentials may be absent after reload by design.
        const applicationState = await getApplicationSession();
        if (applicationState.authenticated && applicationState.user && mounted) {
          applicationSessionReadyRef.current = true;
          const applicationUser = normalizeApplicationUser(applicationState.user);
          const ownProfile = await getOwnProfile();
          setSession({ user: applicationUser, authority: "APPLICATION_SESSION" });
          setProfile(formatProfile(applicationUser, ownProfile.profile));
          setIsDemoMode(false);
          setIsLoading(false);
          logAuthInfo("AuthProvider", "Đã nạp phiên HttpOnly do máy chủ quản lý.");
          return;
        }
        if (applicationState.unavailable) {
          logAuthError("AuthProvider:applicationSession", { code: applicationState.code });
        }

        // 2. A current Supabase proof is accepted only long enough to create
        // the opaque application session.
        const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          logAuthError("AuthProvider:getSession", sessionError);
        }

        if (currentSession?.user && mounted) {
          lastSessionTokenRef.current = currentSession.access_token;
          const exchanged = await exchangeApplicationSession(currentSession.access_token);
          if (exchanged.success && mounted) {
            applicationSessionReadyRef.current = true;
            const refreshedApplicationState = await getApplicationSession();
            const applicationUser = refreshedApplicationState.authenticated && refreshedApplicationState.user
              ? normalizeApplicationUser(refreshedApplicationState.user)
              : normalizeApplicationUser({
                id: exchanged.session?.userId || currentSession.user.id,
                userId: exchanged.session?.userId || currentSession.user.id,
                email: exchanged.session?.email || currentSession.user.email,
                emailVerified: exchanged.session?.emailVerified === true,
                roles: ["STUDENT"],
              });
            const ownProfile = await getOwnProfile();
            setSession({ user: applicationUser, authority: "APPLICATION_SESSION" });
            setProfile(formatProfile(applicationUser, ownProfile.profile));
            setIsDemoMode(false);
            setIsLoading(false);
            logAuthInfo("AuthProvider", "Đã trao đổi proof Supabase sang phiên HttpOnly.");
            return;
          }
          logAuthError("AuthProvider:sessionExchange", { code: exchanged.code });
        }

        // 3. Demo mode is an explicit local presentation mode. It is checked
        // only after authoritative application/provider identities so stale
        // demo cache can never shadow a real server session.
        const savedDemo = isRemembered
          ? readClientStorage("localStorage", "studenthub_demo_user") || readClientStorage("sessionStorage", "studenthub_demo_user")
          : readClientStorage("sessionStorage", "studenthub_demo_user");

        if (savedDemo) {
          try {
            const parsed = JSON.parse(savedDemo);
            if (mounted) {
              setSession({ user: parsed });
              setProfile(parsed);
              setIsDemoMode(true);
              setIsLoading(false);
              logAuthInfo("AuthProvider", "Khôi phục phiên Demo Mode.");
              return;
            }
          } catch (e) {
            logAuthError("AuthProvider:parseDemo", e);
          }
        }

        // 4. No authoritative session is available.
        if (mounted) {
          applicationSessionReadyRef.current = false;
          setSession(null);
          setProfile(null);
          setIsLoading(false);
          logAuthInfo("AuthProvider", "Khách vãng lai (Chưa đăng nhập).");
        }
      } catch (err) {
        logAuthError("AuthProvider:initAuth", err);
        if (mounted) setIsLoading(false);
      }
    };

    let listener;

    // 5. Subscribe only after the authoritative initialization read/exchange
    // completes. This prevents Supabase's INITIAL_SESSION callback from
    // racing the cookie restore and replaying a one-time provider proof.
    const subscribeToAuthChanges = () => {
      if (!mounted) return;
      const { data } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return;

        if (_event === "INITIAL_SESSION" && applicationSessionReadyRef.current) {
          return;
        }

        const newToken = newSession?.access_token || null;
        // Tránh lặp vô hạn nếu token không thay đổi
        if (newToken && newToken === lastSessionTokenRef.current && _event !== "SIGNED_OUT") {
          return;
        }

        lastSessionTokenRef.current = newToken;
        logAuthInfo("AuthProvider:onAuthStateChange", `Sự kiện: ${_event}`);

        if (newSession?.user && newToken) {
          const exchanged = await exchangeApplicationSession(newToken);
          if (!mounted) return;
          if (exchanged.success) {
            applicationSessionReadyRef.current = true;
            const refreshedApplicationState = await getApplicationSession();
            const applicationUser = refreshedApplicationState.authenticated && refreshedApplicationState.user
              ? normalizeApplicationUser(refreshedApplicationState.user)
              : normalizeApplicationUser({
                id: exchanged.session?.userId || newSession.user?.id,
                userId: exchanged.session?.userId || newSession.user?.id,
                email: exchanged.session?.email || newSession.user?.email,
                emailVerified: exchanged.session?.emailVerified === true,
                roles: ["STUDENT"],
              });
            const ownProfile = await getOwnProfile();
            setSession({ user: applicationUser, authority: "APPLICATION_SESSION" });
            setProfile(formatProfile(applicationUser, ownProfile.profile));
            setIsDemoMode(false);
          } else {
            applicationSessionReadyRef.current = false;
            setSession(null);
            setProfile(null);
            setIsDemoMode(false);
            logAuthError("AuthProvider:onAuthStateChange:exchange", { code: exchanged.code });
          }
        } else if (_event === "SIGNED_OUT") {
          applicationSessionReadyRef.current = false;
          setSession(null);
          setProfile(null);
          setIsDemoMode(false);
        }
      });
      listener = data;
    };

    initAuth().finally(subscribeToAuthChanges);

    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  /**
   * Đảm bảo đồng bộ với ASP.NET Core Backend
   */
  const ensureSynced = useCallback(async (fullName = "") => {
    logAuthInfo("ensureSynced", "Bắt đầu gọi đồng bộ sang ASP.NET Core.");
    try {
      if (session?.user) {
        const token = getStoredToken();
        if (!token) {
          return { success: false, code: "TRANSIENT_PROVIDER_PROOF_UNAVAILABLE" };
        }
        const payload = {
          ...session.user,
          fullName: fullName || profile?.fullName || session.user.email,
        };
        const synced = await syncBackendUser(payload, token);
        return synced
          ? { success: true }
          : { success: false, code: "BACKEND_SYNC_UNAVAILABLE" };
      }
      return { success: false, code: "AUTHENTICATED_SESSION_REQUIRED" };
    } catch (err) {
      logAuthError("ensureSynced", err);
      return { success: false, error: err };
    }
  }, [session]);

  /**
   * Đăng nhập chế độ Demo
   */
  const loginAsDemo = useCallback((role = "student", rememberMe = false) => {
    logAuthInfo("loginAsDemo", `Kích hoạt Demo Mode cho vai trò: ${role}`);
    try {
      const demoData = role === "expert" ? DEMO_EXPERT : DEMO_STUDENT;
      setSession({ user: demoData });
      setProfile(demoData);
      setIsDemoMode(true);
      if (typeof window !== "undefined") {
        if (rememberMe) {
          writeClientStorage("localStorage", "studenthub_demo_user", JSON.stringify(demoData));
          writeClientStorage("sessionStorage", "studenthub_demo_user", JSON.stringify(demoData));
          writeClientStorage("localStorage", "studenthub_remember_me", "true");
        } else {
          writeClientStorage("sessionStorage", "studenthub_demo_user", JSON.stringify(demoData));
          removeClientStorage("localStorage", "studenthub_demo_user");
          removeClientStorage("localStorage", "studenthub_remember_me");
        }
      }
    } catch (err) {
      logAuthError("loginAsDemo", err);
    }
  }, []);

  /**
   * Cập nhật thông tin hồ sơ
   */
  const updateProfile = useCallback(
    async (profileUpdates) => {
      logAuthInfo("updateProfile", "Bắt đầu cập nhật thông tin hồ sơ.");
      try {
        if (isDemoMode) {
          const merged = { ...(profile || {}), ...profileUpdates };
          setProfile(merged);
          return merged;
        }
        const savedProfile = await updateUserProfileService(profileUpdates);
        const nextProfile = formatProfile(session?.user, savedProfile);
        setProfile(nextProfile);
        return nextProfile;
      } catch (err) {
        logAuthError("updateProfile", err);
        throw err;
      }
    },
    [isDemoMode, profile, session]
  );

  /**
   * Đăng xuất toàn bộ phiên
   */
  const signOut = useCallback(async () => {
    logAuthInfo("signOut", "Đang đăng xuất...");
    try {
      lastSessionTokenRef.current = null;
      applicationSessionReadyRef.current = false;
      setIsDemoMode(false);
      await signOutSupabase();
      setSession(null);
      setProfile(null);
      logAuthInfo("signOut", "Đăng xuất thành công.");
    } catch (err) {
      logAuthError("signOut", err);
      setSession(null);
      setProfile(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        isLoading,
        isDemoMode,
        loginAsDemo,
        ensureSynced,
        signOut,
        updateProfile,
        refreshProfile: async () => {
          if (session?.user) {
            const ownProfile = await getOwnProfile();
            if (ownProfile.success) setProfile(formatProfile(session.user, ownProfile.profile));
          }
        },
      }}
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
