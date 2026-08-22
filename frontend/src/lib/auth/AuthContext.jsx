"use client";

// lib/auth/AuthContext.jsx
//
// Quản lý xác thực và hồ sơ người dùng kết nối trực tiếp ASP.NET Core Backend + Supabase:
//  - Tự động đọc JWT Token và lấy hồ sơ từ GET /api/auth/me
//  - Quản lý phiên đăng nhập, vai trò Sinh viên & Chuyên gia uy tín
//  - Hỗ trợ cơ chế "Ghi nhớ đăng nhập" (Remember Me) linh hoạt qua dynamic storage
//  - Hỗ trợ cập nhật avatar, trường học, chuyên môn tức thì

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  getMeBackend,
  signOutSupabase,
  updateUserProfile,
  syncBackendUser,
  getStoredToken,
  setStoredToken,
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

function formatProfile(user) {
  if (!user) return null;

  let cached = {};
  if (typeof window !== "undefined") {
    try {
      const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";
      const s = isRemembered
        ? localStorage.getItem("studenthub_user_profile") || sessionStorage.getItem("studenthub_user_profile")
        : sessionStorage.getItem("studenthub_user_profile");
      if (s) cached = JSON.parse(s);
    } catch {}
  }

  const meta = user.user_metadata || {};
  const email = user.email || user.Email || cached.email || "";
  const fullName = user.fullName || user.FullName || meta.full_name || meta.name || cached.fullName || "Người dùng StudentHub";
  const rawRole = (user.role || user.Role || meta.role || cached.role || "student").toLowerCase();
  const isExpert = rawRole === "expert";
  const isEdu = user.universityEmailVerified || user.UniversityEmailVerified || /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test(email);

  return {
    id: String(user.id || user.Id || cached.id || "user-1"),
    email: email,
    fullName: fullName,
    role: isExpert ? "expert" : "student",
    avatarId: cached.avatarId || meta.avatar_id || (isExpert ? "expert-ai" : "student-tech"),
    avatarUrl: cached.avatarUrl || meta.avatar_url || null,
    university: cached.university || meta.university || (isEdu ? "Đại học Thành viên (Email Edu)" : "Chưa cập nhật"),
    major: cached.major || meta.major || "Khoa học & Kỹ thuật",
    academicYear: cached.academicYear || meta.academic_year || "2024-2028",
    expertTitle: cached.expertTitle || meta.expert_title || "Chuyên gia Tư vấn & Nghiên cứu",
    expertField: cached.expertField || meta.expert_field || "Trí tuệ nhân tạo (AI & Machine Learning)",
    experienceYears: cached.experienceYears || meta.experience_years || "3+ năm kinh nghiệm",
    bio: cached.bio || meta.bio || (isExpert ? "Chuyên gia giải đáp học thuật và định hướng nghiên cứu cho sinh viên." : "Sinh viên đam mê học tập, khám phá công nghệ và AI."),
    trustScore: user.reputation_score || user.reputationScore || user.trustScore || user.TrustScore || cached.reputation_score || cached.trustScore || meta.reputation_score || meta.trust_score || (isExpert ? 98 : isEdu ? 80 : 50),
    reputationScore: user.reputation_score || user.reputationScore || cached.reputation_score || meta.reputation_score || (isExpert ? 98 : isEdu ? 80 : 50),
    githubUsername: cached.github_username || cached.githubUsername || meta.github_username || meta.user_name || null,
    topRepos: cached.top_repos || cached.topRepos || meta.top_repos || [],
    verifiedStudent: user.universityEmailVerified || user.UniversityEmailVerified || meta.verified_student || isEdu,
    verifiedExpert: isExpert || meta.verified_expert === true,
    onboarded: cached.onboarded === true || meta.onboarded === true,
    badges: cached.badges || meta.badges || (isExpert ? ["⭐ Chuyên Gia Uy Tín", "Cố Vấn Xuất Sắc", "Top Người Giải Đáp"] : ["Sinh Viên Tiên Phong", "Học Giả Tích Cực"]),
    rating: cached.rating || meta.rating || 4.95,
    answersCount: cached.answersCount || meta.answers_count || (isExpert ? 24 : 3),
    questionsCount: cached.questionsCount || meta.questions_count || (isExpert ? 2 : 8),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Khởi tạo Auth khi Mount
  useEffect(() => {
    let mounted = true;

    if (typeof window === "undefined") return;

    const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";

    // 1. Kiểm tra demo mode
    const savedDemo = isRemembered
      ? localStorage.getItem("studenthub_demo_user") || sessionStorage.getItem("studenthub_demo_user")
      : sessionStorage.getItem("studenthub_demo_user");

    if (savedDemo) {
      try {
        const parsed = JSON.parse(savedDemo);
        if (mounted) {
          setSession({ user: parsed });
          setProfile(parsed);
          setIsDemoMode(true);
          setIsLoading(false);
          return;
        }
      } catch {}
    }

    // 2. Kiểm tra Backend JWT Token
    getMeBackend().then((backendUser) => {
      if (!mounted) return;
      if (backendUser) {
        setSession({ user: backendUser });
        setProfile(formatProfile(backendUser));
        setIsLoading(false);
        return;
      }

      // 3. Kiểm tra Supabase session
      supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
        if (!mounted) return;
        if (currentSession?.user) {
          setSession(currentSession);
          setProfile(formatProfile(currentSession.user));
        } else {
          setSession(null);
          setProfile(null);
        }
        setIsLoading(false);
      });
    }).catch(() => {
      if (mounted) setIsLoading(false);
    });

    // 4. Lắng nghe Supabase OAuth (Google)
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setProfile(formatProfile(newSession.user));
        setIsDemoMode(false);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const ensureSynced = useCallback(async (fullName) => {
    if (session?.user) {
      await syncBackendUser(session.user);
    }
    return { success: true };
  }, [session]);

  /**
   * Đăng nhập nhanh chế độ Demo
   */
  const loginAsDemo = useCallback((role = "student", rememberMe = false) => {
    const demoData = role === "expert" ? DEMO_EXPERT : DEMO_STUDENT;
    setSession({ user: demoData });
    setProfile(demoData);
    setIsDemoMode(true);
    if (typeof window !== "undefined") {
      if (rememberMe) {
        localStorage.setItem("studenthub_demo_user", JSON.stringify(demoData));
        sessionStorage.setItem("studenthub_demo_user", JSON.stringify(demoData));
        localStorage.setItem("studenthub_remember_me", "true");
      } else {
        sessionStorage.setItem("studenthub_demo_user", JSON.stringify(demoData));
        localStorage.removeItem("studenthub_demo_user");
        localStorage.removeItem("studenthub_remember_me");
      }
    }
  }, []);

  /**
   * Cập nhật thông tin hồ sơ
   */
  const updateProfile = useCallback(
    async (profileUpdates) => {
      const merged = { ...(profile || {}), ...profileUpdates };
      setProfile(merged);
      if (typeof window !== "undefined") {
        const isRemembered = localStorage.getItem("studenthub_remember_me") === "true";
        if (isRemembered) {
          localStorage.setItem("studenthub_user_profile", JSON.stringify(merged));
          sessionStorage.setItem("studenthub_user_profile", JSON.stringify(merged));
        } else {
          sessionStorage.setItem("studenthub_user_profile", JSON.stringify(merged));
          localStorage.removeItem("studenthub_user_profile");
        }
      }
      await updateUserProfile(profileUpdates);
      return merged;
    },
    [profile]
  );

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("studenthub_demo_user");
      sessionStorage.removeItem("studenthub_user_profile");
      sessionStorage.removeItem("studenthub_jwt_token");
      localStorage.removeItem("studenthub_demo_user");
      localStorage.removeItem("studenthub_user_profile");
      localStorage.removeItem("studenthub_jwt_token");
      localStorage.removeItem("studenthub_remember_me");
      setStoredToken(null);
    }
    setIsDemoMode(false);
    await signOutSupabase().catch(() => {});
    setSession(null);
    setProfile(null);
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
        refreshProfile: () => {
          if (session?.user) {
            setProfile(formatProfile(session.user));
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
