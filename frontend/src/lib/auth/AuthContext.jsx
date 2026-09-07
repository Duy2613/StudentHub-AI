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
import { AUTH_LOGOUT_CHANNEL, AUTH_LOGOUT_SIGNAL_KEY, AUTH_STATE, canTransitionAuthState } from "./authStateMachine";
import { normalizeSubjectId } from "@/lib/security/identity/normalizeSubjectId";

let authModulePromise;
let supabaseModulePromise;

function loadAuthModule() {
  authModulePromise ||= import("./authService");
  return authModulePromise;
}

function loadSupabaseModule() {
  supabaseModulePromise ||= import("@/lib/supabase/client");
  return supabaseModulePromise;
}

function scheduleAuthBootstrap(callback) {
  if (typeof window === "undefined") return () => {};

  // Keep the provider graph out of the first render and give the route's
  // text/CSS a chance to paint before Supabase and authService are fetched.
  let idleId;
  const delayId = window.setTimeout(() => {
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(callback, { timeout: 1800 });
    } else {
      callback();
    }
  }, 1200);

  return () => {
    window.clearTimeout(delayId);
    if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
  };
}

function logAuthError(functionName, error, extraContext = null) {
  if (process.env.NODE_ENV === "production") return;
  const detail = error?.name || error?.code || (typeof error === "string" ? error : "AUTH_ERROR");
  console.error(`[AUTH_ERROR] - [${functionName}] - ${detail}`, extraContext || "");
}

function logAuthInfo(functionName, message) {
  if (process.env.NODE_ENV === "production") return;
  console.info(`[AUTH_INFO] - [${functionName}] - ${message}`);
}

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

const SAFE_PROFILE_FIELDS = new Set([
  "fullName",
  "full_name",
  "avatarId",
  "avatar_id",
  "avatarUrl",
  "avatar_url",
  "university",
  "major",
  "academicYear",
  "academic_year",
  "bio",
  "githubUsername",
  "github_username",
]);

function sanitizeProfileUpdates(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key]) => SAFE_PROFILE_FIELDS.has(key)));
}

/**
 * Định dạng Profile chuẩn hóa an toàn từ User Object
 */
function formatProfile(user, { authoritative = false, demo = false } = {}) {
  if (!user) return null;

  let cached = {};
  const userId = normalizeSubjectId(user.id || user.Id || user.userId);
  if (typeof window !== "undefined") {
    try {
      const s = isRememberedSession()
        ? readClientStorage("localStorage", "studenthub_user_profile") || readClientStorage("sessionStorage", "studenthub_user_profile")
        : readClientStorage("sessionStorage", "studenthub_user_profile");
      if (s) {
        const parsed = JSON.parse(s);
        if (parsed?.id && normalizeSubjectId(parsed.id) === userId) cached = parsed;
      }
    } catch (err) {
      logAuthError("formatProfile:parseCache", err);
    }
  }

  // Provider metadata and cached profile fields are presentation inputs only.
  // The application session is the only source allowed to grant role or
  // verification labels for a real user.
  const meta = demo ? user.user_metadata || {} : {};
  const serverRoles = Array.isArray(user.roles) ? user.roles.map((role) => String(role).toUpperCase()) : [];
  const rawRole = authoritative
    ? (serverRoles.includes("EXPERT") ? "expert" : "student")
    : demo
      ? String(user.role || "student").toLowerCase()
      : "student";
  const email = user.email || user.Email || cached.email || "";
  const fullName = user.fullName || user.FullName || meta.full_name || meta.name || cached.fullName || "Người dùng StudentHub";
  const isExpert = rawRole === "expert";
  // An email suffix is only a candidate for verification. It is not proof and
  // must never grant a verified-student label or a reputation score.
  const isEdu = authoritative
    ? user.emailVerified === true
    : demo && (user.universityEmailVerified === true || user.UniversityEmailVerified === true || meta.verified_student === true);
  const explicitTrustScore = demo
    ? [
        user.reputation_score,
        user.reputationScore,
        user.trustScore,
        user.TrustScore,
        meta.reputation_score,
        meta.trust_score,
      ].find((value) => Number.isFinite(Number(value)))
    : null;

  return {
    id: userId || String(cached.id || ""),
    email: email,
    fullName: fullName,
    role: isExpert ? "expert" : "student",
    avatarId: cached.avatarId || meta.avatar_id || (isExpert ? "expert-ai" : "student-tech"),
    avatarUrl: cached.avatarUrl || meta.avatar_url || null,
    university: cached.university || meta.university || (isEdu ? "Đã xác minh theo nguồn tổ chức" : "Chưa cập nhật"),
    major: cached.major || meta.major || "Khoa học & Kỹ thuật",
    academicYear: cached.academicYear || meta.academic_year || "2024-2028",
    expertTitle: cached.expertTitle || meta.expert_title || "Chuyên gia Tư vấn & Nghiên cứu",
    expertField: cached.expertField || meta.expert_field || "Trí tuệ nhân tạo (AI & Machine Learning)",
    experienceYears: cached.experienceYears || meta.experience_years || "3+ năm kinh nghiệm",
    bio: cached.bio || meta.bio || (isExpert ? "Chuyên gia giải đáp học thuật và định hướng nghiên cứu cho sinh viên." : "Sinh viên đam mê học tập, khám phá công nghệ và AI."),
    trustScore: explicitTrustScore ?? 50,
    reputationScore: explicitTrustScore ?? 50,
    githubUsername: cached.github_username || cached.githubUsername || meta.github_username || meta.user_name || null,
    topRepos: cached.top_repos || cached.topRepos || meta.top_repos || [],
    verifiedStudent: isEdu,
    verifiedExpert: authoritative ? serverRoles.includes("EXPERT") || user.expertStatus === "ACTIVE" : demo && (isExpert || meta.verified_expert === true),
    onboarded: authoritative ? user.onboarded === true : demo ? cached.onboarded === true || meta.onboarded === true : false,
    badges: cached.badges || meta.badges || (isExpert ? ["⭐ Chuyên Gia Uy Tín", "Cố Vấn Xuất Sắc", "Top Người Giải Đáp"] : ["Sinh Viên Tiên Phong", "Học Giả Tích Cực"]),
    rating: cached.rating || meta.rating || 4.95,
    answersCount: cached.answersCount || meta.answers_count || (isExpert ? 24 : 3),
    questionsCount: cached.questionsCount || meta.questions_count || (isExpert ? 2 : 8),
  };
}

function normalizeApplicationUser(user) {
  const roles = Array.isArray(user?.roles)
    ? [...new Set(user.roles.map((role) => String(role).trim().toUpperCase()).filter(Boolean))]
    : [];
  const id = normalizeSubjectId(user?.id || user?.userId);
  const primaryRole = String(roles.includes("EXPERT") ? "expert" : "student").toLowerCase();
  return {
    ...user,
    id,
    userId: id,
    role: primaryRole,
    roles,
  };
}

function applicationUserFromExchange(exchangeSession) {
  if (!exchangeSession?.userId) return null;
  return normalizeApplicationUser({
    userId: exchangeSession.userId,
    email: exchangeSession.email || "",
    emailVerified: exchangeSession.emailVerified === true,
    authProvider: exchangeSession.authProvider || "supabase",
    roles: ["STUDENT"],
    onboarded: false,
  });
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [authState, setAuthState] = useState(AUTH_STATE.INITIALIZING);
  const [authError, setAuthError] = useState(null);

  // Idempotency tracking ref để tránh loop vô hạn
  const lastSessionTokenRef = useRef(null);
  const applicationSessionReadyRef = useRef(false);
  const authStateRef = useRef(AUTH_STATE.INITIALIZING);
  const authEpochRef = useRef(0);

  const transitionAuthState = useCallback((nextState, error = null) => {
    const previousState = authStateRef.current;
    if (previousState === nextState) return false;
    if (!canTransitionAuthState(previousState, nextState)) {
      logAuthError("AuthProvider:illegalTransition", { code: `${previousState}->${nextState}` });
      return false;
    }
    authStateRef.current = nextState;
    setAuthState(nextState);
    setIsLoading([AUTH_STATE.INITIALIZING, AUTH_STATE.AUTHENTICATING, AUTH_STATE.REFRESHING, AUTH_STATE.SIGNING_OUT].includes(nextState));
    if (nextState === AUTH_STATE.ERROR) {
      setAuthError({
        code: String(error?.code || error?.name || "AUTHENTICATION_FAILED").slice(0, 120),
        message: "Không thể xác thực phiên đăng nhập. Vui lòng thử lại hoặc quay về Trang chủ.",
      });
    } else if (nextState !== AUTH_STATE.INITIALIZING) {
      setAuthError(null);
    }
    return true;
  }, []);

  // Khởi tạo Auth khi Mount (Single execution)
  useEffect(() => {
    let mounted = true;
    let listener;
    let supabaseClient;
    let authApi;
    let eventQueue = Promise.resolve();

    const applyApplicationUser = (userLike, operationEpoch = authEpochRef.current) => {
      if (!mounted || authEpochRef.current !== operationEpoch) return false;
      const applicationUser = normalizeApplicationUser(userLike);
      if (!applicationUser.id) return false;
      applicationSessionReadyRef.current = true;
      setSession({ user: applicationUser, authority: "APPLICATION_SESSION" });
      setProfile(formatProfile(applicationUser, { authoritative: true }));
      setIsDemoMode(false);
      transitionAuthState(AUTH_STATE.SIGNED_IN);
      return true;
    };

    const initAuth = async () => {
      const operationEpoch = authEpochRef.current;
      let applicationSessionUnavailable = false;
      try {
        if (typeof window === "undefined") return;

        // Auth is a post-paint capability. The route can render its public
        // shell while this optional provider graph is fetched on idle.
        [authApi, { supabase: supabaseClient }] = await Promise.all([
          loadAuthModule(),
          loadSupabaseModule(),
        ]);
        if (!mounted || authEpochRef.current !== operationEpoch) return;
        logAuthInfo("AuthProvider", "Bắt đầu khởi tạo Auth State.");
        transitionAuthState(AUTH_STATE.AUTHENTICATING);

        const isRemembered = isRememberedSession();

        // 1. Restore the server-authoritative opaque session first. Provider
        // credentials may be absent after reload by design.
        const applicationState = await authApi.getApplicationSession();
        if (applicationState.authenticated && applicationState.user && mounted) {
          applyApplicationUser(applicationState.user, operationEpoch);
          logAuthInfo("AuthProvider", "Đã nạp phiên HttpOnly do máy chủ quản lý.");
          return;
        }
        if (applicationState.unavailable) {
          applicationSessionUnavailable = true;
          logAuthError("AuthProvider:applicationSession", { code: applicationState.code });
        }

        // 2. A current Supabase proof is accepted only long enough to create
        // the opaque application session.
        const capabilities = authApi.getAuthCapabilities();
        const { data: { session: currentSession } = {}, error: sessionError } = capabilities.supabaseConfigured
          ? await supabaseClient.auth.getSession()
          : { data: { session: null }, error: null };
        if (sessionError) {
          logAuthError("AuthProvider:getSession", sessionError);
        }

        if (currentSession?.user && mounted && authEpochRef.current === operationEpoch) {
          const exchanged = await authApi.exchangeApplicationSession(currentSession.access_token);
          if (exchanged.success && mounted && authEpochRef.current === operationEpoch) {
            const exchangedUser = applicationUserFromExchange(exchanged.session);
            if (applyApplicationUser(exchangedUser, operationEpoch)) {
              lastSessionTokenRef.current = currentSession.access_token;
              logAuthInfo("AuthProvider", "Đã trao đổi proof Supabase sang phiên HttpOnly.");
              return;
            }
          }
          logAuthError("AuthProvider:sessionExchange", { code: exchanged.code });
        }

        if (applicationSessionUnavailable) {
          if (mounted && authEpochRef.current === operationEpoch) {
            applicationSessionReadyRef.current = false;
            setSession(null);
            setProfile(null);
            setIsDemoMode(false);
            transitionAuthState(AUTH_STATE.ERROR, { code: applicationState.code || "APPLICATION_SESSION_UNAVAILABLE" });
          }
          return;
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
            if (mounted && authEpochRef.current === operationEpoch) {
              setSession({ user: parsed });
              setProfile(parsed);
              setIsDemoMode(true);
              transitionAuthState(AUTH_STATE.SIGNED_OUT);
              logAuthInfo("AuthProvider", "Khôi phục phiên Demo Mode.");
              return;
            }
          } catch (e) {
            logAuthError("AuthProvider:parseDemo", e);
          }
        }

        // 4. No authoritative session is available.
        if (mounted && authEpochRef.current === operationEpoch) {
          applicationSessionReadyRef.current = false;
          setSession(null);
          setProfile(null);
          transitionAuthState(AUTH_STATE.SIGNED_OUT);
          logAuthInfo("AuthProvider", "Khách vãng lai (Chưa đăng nhập).");
        }
      } catch (err) {
        logAuthError("AuthProvider:initAuth", err);
        if (mounted && authEpochRef.current === operationEpoch) transitionAuthState(AUTH_STATE.ERROR, err);
      }
    };

    // 5. Subscribe only after the authoritative initialization read/exchange
    // completes. This prevents Supabase's INITIAL_SESSION callback from
    // racing the cookie restore and replaying a one-time provider proof.
    const reconcileAuthEvent = async (_event, newSession, operationEpoch) => {
      if (!mounted || authEpochRef.current !== operationEpoch) return;

      if (_event === "SIGNED_OUT") {
        authEpochRef.current += 1;
        lastSessionTokenRef.current = null;
        applicationSessionReadyRef.current = false;
        setSession(null);
        setProfile(null);
        setIsDemoMode(false);
        transitionAuthState(AUTH_STATE.SIGNED_OUT);
        return;
      }

      const newToken = newSession?.access_token || null;
      if (!newToken) {
        transitionAuthState(AUTH_STATE.SIGNED_OUT);
        return;
      }

      if (_event === "TOKEN_REFRESHED") transitionAuthState(AUTH_STATE.REFRESHING);
      else transitionAuthState(AUTH_STATE.AUTHENTICATING);

      // A rotated provider token must not create a second application session
      // while the existing HttpOnly session is still authoritative.
      const currentApplicationState = await authApi.getApplicationSession();
      if (!mounted || authEpochRef.current !== operationEpoch) return;
      if (currentApplicationState.authenticated && currentApplicationState.user) {
        applyApplicationUser(currentApplicationState.user, operationEpoch);
        return;
      }

      const exchanged = await authApi.exchangeApplicationSession(newToken);
      if (!mounted || authEpochRef.current !== operationEpoch) return;
      const exchangedUser = exchanged.success ? applicationUserFromExchange(exchanged.session) : null;
      if (exchanged.success && applyApplicationUser(exchangedUser, operationEpoch)) {
        lastSessionTokenRef.current = newToken;
        return;
      }

      applicationSessionReadyRef.current = false;
      setSession(null);
      setProfile(null);
      setIsDemoMode(false);
      transitionAuthState(AUTH_STATE.ERROR, { code: exchanged.code || "SESSION_EXCHANGE_FAILED" });
      logAuthError("AuthProvider:onAuthStateChange:exchange", { code: exchanged.code });
    };

    const subscribeToAuthChanges = () => {
      if (!mounted || !supabaseClient || !authApi) return;
      if (!authApi.getAuthCapabilities().supabaseConfigured) return;
      const { data } = supabaseClient.auth.onAuthStateChange(async (_event, newSession) => {
        if (!mounted) return;

        if (_event === "INITIAL_SESSION" && applicationSessionReadyRef.current) {
          return;
        }

        logAuthInfo("AuthProvider:onAuthStateChange", `Sự kiện: ${_event}`);
        // Supabase can emit several callbacks during refresh/redirect. Queue
        // reconciliation so one event produces one ordered state transition.
        const operationEpoch = authEpochRef.current;
        eventQueue = eventQueue
          .then(() => reconcileAuthEvent(_event, newSession, operationEpoch))
          .catch((error) => {
            if (mounted && authEpochRef.current === operationEpoch) transitionAuthState(AUTH_STATE.ERROR, error);
            logAuthError("AuthProvider:onAuthStateChange", error);
          });
      });
      listener = data;
    };

    const cancelBootstrap = scheduleAuthBootstrap(async () => {
      await initAuth();
      if (mounted) subscribeToAuthChanges();
    });

    return () => {
      mounted = false;
      cancelBootstrap();
      listener?.subscription?.unsubscribe();
    };
  }, [transitionAuthState]);

  // A logout in another tab must invalidate this tab's private UI and its
  // provider proof. The epoch prevents a slower hydration/exchange response
  // from restoring the old principal after the peer logout wins the race.
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    let channel = null;

    const clearFromPeer = () => {
      authEpochRef.current += 1;
      lastSessionTokenRef.current = null;
      applicationSessionReadyRef.current = false;
      setSession(null);
      setProfile(null);
      setIsDemoMode(false);
      if (authStateRef.current !== AUTH_STATE.SIGNED_OUT) {
        transitionAuthState(AUTH_STATE.SIGNED_OUT);
      }
      void loadSupabaseModule()
        .then(({ supabase }) => supabase.auth.signOut())
        .catch((error) => logAuthError("AuthProvider:peerLogout", error));
    };

    const onStorage = (event) => {
      if (event.key === AUTH_LOGOUT_SIGNAL_KEY && event.newValue) clearFromPeer();
    };
    const onBroadcast = (event) => {
      if (event?.data?.type === "SIGNED_OUT") clearFromPeer();
    };

    window.addEventListener("storage", onStorage);
    try {
      if (typeof BroadcastChannel === "function") {
        channel = new BroadcastChannel(AUTH_LOGOUT_CHANNEL);
        channel.addEventListener("message", onBroadcast);
      }
    } catch (error) {
      logAuthError("AuthProvider:peerLogoutChannel", error);
    }

    return () => {
      window.removeEventListener("storage", onStorage);
      channel?.removeEventListener("message", onBroadcast);
      channel?.close();
    };
  }, [transitionAuthState]);

  /**
   * Đảm bảo đồng bộ với ASP.NET Core Backend
   */
  const ensureSynced = useCallback(async () => {
    logAuthInfo("ensureSynced", "Kiểm tra application session authoritative.");
    try {
      if (session?.user?.id && session.authority === "APPLICATION_SESSION") {
        const authApi = await loadAuthModule();
        const authoritative = await authApi.getApplicationSession();
        return authoritative.authenticated
          ? { success: true }
          : { success: false, code: authoritative.code || "AUTHENTICATED_SESSION_REQUIRED" };
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
      // Demo is intentionally not an authenticated principal.
      if (authStateRef.current !== AUTH_STATE.SIGNED_OUT) transitionAuthState(AUTH_STATE.SIGNED_OUT);
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
  }, [transitionAuthState]);

  /**
   * Cập nhật thông tin hồ sơ
   */
  const updateProfile = useCallback(
    async (profileUpdates) => {
      logAuthInfo("updateProfile", "Bắt đầu cập nhật thông tin hồ sơ:", profileUpdates);
      try {
        const safeUpdates = sanitizeProfileUpdates(profileUpdates);
        const merged = { ...(profile || {}), ...safeUpdates };
        setProfile(merged);
        if (typeof window !== "undefined") {
          const storageName = isRememberedSession() ? "localStorage" : "sessionStorage";
          writeClientStorage(storageName, "studenthub_user_profile", JSON.stringify(merged));
        }
        const authApi = await loadAuthModule();
        await authApi.updateUserProfile(safeUpdates);
        return merged;
      } catch (err) {
        logAuthError("updateProfile", err);
        return profile;
      }
    },
    [profile]
  );

  /**
   * Đăng xuất toàn bộ phiên
   */
  const signOut = useCallback(async () => {
    logAuthInfo("signOut", "Đang đăng xuất...");
    try {
      authEpochRef.current += 1;
      transitionAuthState(AUTH_STATE.SIGNING_OUT);
      lastSessionTokenRef.current = null;
      applicationSessionReadyRef.current = false;
      setIsDemoMode(false);
      const authApi = await loadAuthModule();
      await authApi.signOutSupabase();
      setSession(null);
      setProfile(null);
      transitionAuthState(AUTH_STATE.SIGNED_OUT);
      logAuthInfo("signOut", "Đăng xuất thành công.");
    } catch (err) {
      logAuthError("signOut", err);
      setSession(null);
      setProfile(null);
      transitionAuthState(AUTH_STATE.SIGNED_OUT);
    }
  }, [transitionAuthState]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        isLoading,
        authState,
        authError,
        isDemoMode,
        loginAsDemo,
        ensureSynced,
        signOut,
        updateProfile,
        refreshProfile: () => {
          if (session?.user) {
            setProfile(formatProfile(session.user, { authoritative: session.authority === "APPLICATION_SESSION", demo: isDemoMode }));
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
