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
import { hasCanonicalSession, isModeratorEligible, normalizeExpertLifecycleState, EXPERT_LIFECYCLE_STATE, PROFILE_STATUS } from "./presentationState";
export { PROFILE_STATUS };

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

const SAFE_PROFILE_FIELDS = new Set([
  "displayName",
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
function formatProfile(user, { authoritative = false, durableProfile = null } = {}) {
  if (!user) return null;

  const userId = normalizeSubjectId(user.id || user.Id || user.userId);
  // The application session and public.profiles projection are the only
  // identity inputs. Provider metadata, browser storage, and presentation
  // fixtures never create a principal or grant a role.
  const serverRoles = Array.isArray(user.roles) ? user.roles.map((role) => String(role).toUpperCase()) : [];
  const source = authoritative ? (durableProfile || {}) : {};
  const email = user.email || user.Email || "";
  const fullName = source.fullName || source.displayName || user.fullName || user.FullName || email.split("@")[0] || "Người dùng StudentHub";
  return {
    id: userId || "",
    email,
    fullName,
    role: "student",
    avatarId: source.avatarId || null,
    avatarUrl: source.avatarUrl || null,
    university: source.university || null,
    major: source.major || null,
    academicYear: source.academicYear || null,
    expertTitle: null,
    expertField: null,
    experienceYears: null,
    bio: source.bio || null,
    trustScore: null,
    reputationScore: null,
    githubUsername: source.githubUsername || null,
    topRepos: [],
    verifiedStudent: false,
    verifiedExpert: false,
    onboarded: user.onboarded === true || source.onboarded === true,
    badges: [],
    rating: null,
    answersCount: 0,
    questionsCount: 0,
    createdAt: source.createdAt || null,
    updatedAt: source.updatedAt || null,
    serverRoles,
    emailVerified: user.emailVerified === true,
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
    roles: Array.isArray(exchangeSession.roles) && exchangeSession.roles.length ? exchangeSession.roles : ["STUDENT"],
    onboarded: false,
  });
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [profileStatus, setProfileStatus] = useState(PROFILE_STATUS.IDLE);
  const [profileError, setProfileError] = useState(null);
  const [expertLifecycleState, setExpertLifecycleState] = useState(EXPERT_LIFECYCLE_STATE.NONE);
  const [expertApplication, setExpertApplication] = useState(null);
  const [verifiedDomains, setVerifiedDomains] = useState([]);
  const [expertLoading, setExpertLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
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

    const hydrateApplicationProfile = async (applicationUser, operationEpoch) => {
      setProfileStatus(PROFILE_STATUS.LOADING);
      setProfileError(null);
      try {
        const result = await authApi?.getUserProfile?.();
        if (!mounted || authEpochRef.current !== operationEpoch) return;
        if (result?.success && result?.profile) {
          setProfile(formatProfile(applicationUser, { authoritative: true, durableProfile: result.profile }));
          setProfileStatus(PROFILE_STATUS.FOUND);
        } else if (result?.code?.includes("404") || result?.code === "PROFILE_NOT_FOUND" || result?.code === "NOT_FOUND") {
          setProfileStatus(PROFILE_STATUS.NOT_FOUND);
        } else {
          setProfileStatus(PROFILE_STATUS.ERROR);
          setProfileError(result?.code || "PROFILE_LOAD_FAILED");
        }
      } catch (error) {
        if (mounted && authEpochRef.current === operationEpoch) {
          setProfileStatus(PROFILE_STATUS.ERROR);
          setProfileError(error?.message || "PROFILE_LOAD_FAILED");
        }
        logAuthError("AuthProvider:hydrateProfile", error);
      }
    };

    const applyApplicationUser = (userLike, operationEpoch = authEpochRef.current) => {
      if (!mounted || authEpochRef.current !== operationEpoch) return false;
      const applicationUser = normalizeApplicationUser(userLike);
      if (!applicationUser.id) return false;
      applicationSessionReadyRef.current = true;
      setSession({ user: applicationUser, authority: "APPLICATION_SESSION" });
      setProfile(formatProfile(applicationUser, { authoritative: true }));
      setProfileStatus(PROFILE_STATUS.LOADING);
      void hydrateApplicationProfile(applicationUser, operationEpoch);
      transitionAuthState(AUTH_STATE.SIGNED_IN);
      return true;
    };

    const resolveExchangedApplicationUser = async (exchangeResult) => {
      const fallbackUser = applicationUserFromExchange(exchangeResult?.session);
      try {
        // The exchange response is intentionally minimal. Read the new opaque
        // session once more so server-owned roles (including moderator) are
        // available immediately without trusting provider metadata.
        const authoritativeState = await authApi?.getApplicationSession?.();
        if (authoritativeState?.authenticated && authoritativeState.user) {
          return normalizeApplicationUser(authoritativeState.user);
        }
      } catch (error) {
        logAuthError("AuthProvider:refreshExchangedSession", error);
      }
      return fallbackUser;
    };

    const initAuth = async () => {
      const operationEpoch = authEpochRef.current;
      let applicationSessionUnavailable = false;
      try {
        if (typeof window === "undefined") return;

        // Resolve the canonical session before any route can classify the
        // principal as anonymous. Unknown and anonymous are different states.
        [authApi, { supabase: supabaseClient }] = await Promise.all([
          loadAuthModule(),
          loadSupabaseModule(),
        ]);
        if (!mounted || authEpochRef.current !== operationEpoch) return;
        logAuthInfo("AuthProvider", "Bắt đầu khởi tạo Auth State.");
        transitionAuthState(AUTH_STATE.AUTHENTICATING);

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
            const exchangedUser = await resolveExchangedApplicationUser(exchanged);
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
            setProfileStatus(PROFILE_STATUS.IDLE);
            setProfileError(null);
            setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
            setExpertApplication(null);
            setVerifiedDomains([]);
            transitionAuthState(AUTH_STATE.ERROR, { code: applicationState.code || "APPLICATION_SESSION_UNAVAILABLE" });
          }
          return;
        }

        // 3. No authoritative session is available.
        if (mounted && authEpochRef.current === operationEpoch) {
          applicationSessionReadyRef.current = false;
          setSession(null);
          setProfile(null);
          setProfileStatus(PROFILE_STATUS.IDLE);
          setProfileError(null);
          setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
          setExpertApplication(null);
          setVerifiedDomains([]);
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
        setProfileStatus(PROFILE_STATUS.IDLE);
        setProfileError(null);
        setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
        setExpertApplication(null);
        setVerifiedDomains([]);
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
      const exchangedUser = exchanged.success ? await resolveExchangedApplicationUser(exchanged) : null;
      if (exchanged.success && applyApplicationUser(exchangedUser, operationEpoch)) {
        lastSessionTokenRef.current = newToken;
        return;
      }

      applicationSessionReadyRef.current = false;
      setSession(null);
      setProfile(null);
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

    void (async () => {
      await initAuth();
      if (mounted) subscribeToAuthChanges();
    })();

    return () => {
      mounted = false;
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
      setProfileStatus(PROFILE_STATUS.IDLE);
      setProfileError(null);
      setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
      setExpertApplication(null);
      setVerifiedDomains([]);
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
   * Cập nhật thông tin hồ sơ
   */
  const updateProfile = useCallback(
    async (profileUpdates) => {
      logAuthInfo("updateProfile", "Bắt đầu cập nhật thông tin hồ sơ:", profileUpdates);
      try {
        const safeUpdates = sanitizeProfileUpdates(profileUpdates);
        if (!hasCanonicalSession(session)) {
          const error = new Error("Cần đăng nhập bằng phiên StudentHub để cập nhật hồ sơ.");
          error.code = "AUTHENTICATION_REQUIRED";
          throw error;
        }
        const authApi = await loadAuthModule();
        const durableProfile = await authApi.updateUserProfile(safeUpdates);
        const nextUser = durableProfile?.onboarded === true && session.user.onboarded !== true
          ? { ...session.user, onboarded: true }
          : session.user;
        if (nextUser !== session.user) {
          setSession((current) => current?.user?.id === nextUser.id
            ? { ...current, user: nextUser }
            : current);
        }
        const nextProfile = formatProfile(nextUser, { authoritative: true, durableProfile });
        setProfile(nextProfile);
        setProfileStatus(PROFILE_STATUS.FOUND);
        return nextProfile;
      } catch (err) {
        logAuthError("updateProfile", err);
        throw err;
      }
    },
    [session]
  );

  const refreshExpertQualification = useCallback(async (signal) => {
    if (!hasCanonicalSession(session)) {
      setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
      setExpertApplication(null);
      setVerifiedDomains([]);
      return null;
    }
    setExpertLoading(true);
    try {
      const res = await fetch("/api/expert/qualification", {
        credentials: "include",
        cache: "no-store",
        signal,
      });
      if (res.ok) {
        const payload = await res.json().catch(() => null);
        const data = payload?.data || {};
        const nextLifecycle = normalizeExpertLifecycleState(data.state);
        setExpertLifecycleState(nextLifecycle);
        setExpertApplication(data.application || null);
        setVerifiedDomains(Array.isArray(data.application?.approvedDomains) ? data.application.approvedDomains : []);
        return data;
      }
    } catch (error) {
      if (!signal?.aborted) {
        logAuthError("refreshExpertQualification", error);
      }
    } finally {
      if (!signal?.aborted) setExpertLoading(false);
    }
    return null;
  }, [session]);

  // Unified single-point qualification ownership for all surfaces
  useEffect(() => {
    if (!hasCanonicalSession(session)) {
      setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
      setExpertApplication(null);
      setVerifiedDomains([]);
      return undefined;
    }
    const controller = new AbortController();
    void refreshExpertQualification(controller.signal);
    return () => controller.abort("expert-qualification-session-changed");
  }, [session, refreshExpertQualification]);

  const refreshProfile = useCallback(async () => {
    if (!session?.user) return null;
    if (!hasCanonicalSession(session)) {
      setProfileStatus(PROFILE_STATUS.IDLE);
      return null;
    }
    setProfileStatus(PROFILE_STATUS.LOADING);
    setProfileError(null);
    try {
      const authApi = await loadAuthModule();
      const result = await authApi.getUserProfile();
      if (result.success && result.profile) {
        const nextProfile = formatProfile(session.user, { authoritative: true, durableProfile: result.profile });
        setProfile(nextProfile);
        setProfileStatus(PROFILE_STATUS.FOUND);
        return nextProfile;
      }
      if (result?.code?.includes("404") || result?.code === "PROFILE_NOT_FOUND") {
        setProfileStatus(PROFILE_STATUS.NOT_FOUND);
      } else {
        setProfileStatus(PROFILE_STATUS.ERROR);
        setProfileError(result?.code || "PROFILE_LOAD_FAILED");
      }
    } catch (error) {
      setProfileStatus(PROFILE_STATUS.ERROR);
      setProfileError(error?.message || "PROFILE_LOAD_FAILED");
      logAuthError("refreshProfile", error);
    }
    return profile;
  }, [profile, session]);

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
      const authApi = await loadAuthModule();
      await authApi.signOutSupabase();
      setSession(null);
      setProfile(null);
      setProfileStatus(PROFILE_STATUS.IDLE);
      setProfileError(null);
      setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
      setExpertApplication(null);
      setVerifiedDomains([]);
      transitionAuthState(AUTH_STATE.SIGNED_OUT);
      logAuthInfo("signOut", "Đăng xuất thành công.");
    } catch (err) {
      logAuthError("signOut", err);
      setSession(null);
      setProfile(null);
      setProfileStatus(PROFILE_STATUS.IDLE);
      setProfileError(null);
      setExpertLifecycleState(EXPERT_LIFECYCLE_STATE.NONE);
      setExpertApplication(null);
      setVerifiedDomains([]);
      transitionAuthState(AUTH_STATE.SIGNED_OUT);
    }
  }, [transitionAuthState]);

  const isAuthenticated = hasCanonicalSession(session);
  const status = authState === AUTH_STATE.SIGNED_IN
    ? "READY"
    : authState === AUTH_STATE.SIGNED_OUT
      ? "ANONYMOUS"
      : authState === AUTH_STATE.ERROR
        ? "ERROR"
        : "UNKNOWN";
  const ready = status !== "UNKNOWN";

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user || null,
        profile,
        profileStatus,
        profileError,
        PROFILE_STATUS,
        expertLifecycleState,
        expertApplication,
        verifiedDomains,
        expertLoading,
        refreshExpertQualification,
        isLoading,
        authState,
        status,
        ready,
        authenticated: isAuthenticated,
        authError,
        isAuthenticated,
        moderatorEligible: isModeratorEligible(session),
        ensureSynced,
        signOut,
        updateProfile,
        refreshProfile,
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
