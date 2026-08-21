"use client";

// lib/auth/AuthContext.jsx
//
// Quản lý trạng thái xác thực và hồ sơ người dùng (Sinh viên / Chuyên gia uy tín):
//  - session: phiên đăng nhập Supabase
//  - profile: hồ sơ đầy đủ kết hợp từ Supabase User Metadata và Backend API
//  - loginAsDemo: hỗ trợ trải nghiệm demo nhanh (Demo Sinh viên / Demo Chuyên gia)
//  - updateProfile: cập nhật nhanh avatar, vai trò, thông tin học vấn / chuyên môn

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase/client";
import { getMe, syncProfile, signOutSupabase, updateUserProfile } from "./authService";

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

function formatProfile(user, backendData = null) {
  if (!user) return null;

  const meta = user.user_metadata || {};
  const email = user.email || "";
  const isEdu = /(\.edu$|\.edu\.\w+$|@[\w.-]+\.ac\.\w+$)/i.test(email);
  const isExpert = meta.role === "expert";

  return {
    id: user.id,
    email: email,
    fullName: meta.full_name || meta.name || user.name || "Người dùng StudentHub",
    role: meta.role || "student",
    avatarId: meta.avatar_id || (isExpert ? "expert-ai" : "student-tech"),
    avatarUrl: meta.avatar_url || null,
    university: meta.university || (isEdu ? "Đại học Thành viên (Email Edu)" : "Chưa cập nhật"),
    major: meta.major || "Khoa học & Kỹ thuật",
    academicYear: meta.academic_year || "2024-2028",
    expertTitle: meta.expert_title || "Chuyên gia Tư vấn & Nghiên cứu",
    expertField: meta.expert_field || "Trí tuệ nhân tạo (AI & Machine Learning)",
    experienceYears: meta.experience_years || "3+ năm kinh nghiệm",
    bio: meta.bio || (isExpert ? "Chuyên gia giải đáp học thuật và định hướng nghiên cứu cho sinh viên." : "Sinh viên đam mê học tập, khám phá công nghệ và AI."),
    trustScore: meta.trust_score || (isExpert ? 98 : isEdu ? 80 : 50),
    verifiedStudent: meta.verified_student !== undefined ? meta.verified_student : isEdu,
    verifiedExpert: isExpert || meta.verified_expert === true,
    onboarded: meta.onboarded === true,
    badges: meta.badges || (isExpert ? ["⭐ Chuyên Gia Uy Tín", "Cố Vấn Xuất Sắc", "Top Người Giải Đáp"] : ["Sinh Viên Tiên Phong", "Học Giả Tích Cực"]),
    rating: meta.rating || 4.95,
    answersCount: meta.answers_count || (isExpert ? 24 : 3),
    questionsCount: meta.questions_count || (isExpert ? 2 : 8),
    ...(backendData || {}),
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const syncedRef = useRef(false);

  // Khởi tạo Auth 1 lần duy nhất khi Mount
  useEffect(() => {
    let mounted = true;

    // 1. Kiểm tra demo mode đã lưu
    if (typeof window !== "undefined") {
      const savedDemo = localStorage.getItem("studenthub_demo_user");
      if (savedDemo) {
        try {
          const parsed = JSON.parse(savedDemo);
          if (mounted) {
            setSession({ user: { id: parsed.id, email: parsed.email, user_metadata: parsed } });
            setProfile(parsed);
            setIsDemoMode(true);
            setIsLoading(false);
            return;
          }
        } catch {
          // ignore
        }
      }
    }

    // 2. Lấy session hiện tại từ Supabase
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (!mounted) return;
      if (currentSession?.user) {
        setSession(currentSession);
        setProfile(formatProfile(currentSession.user));
        // Thử lấy thêm dữ liệu từ backend một cách bất đồng bộ
        getMe().then((beData) => {
          if (mounted && beData) {
            setProfile(formatProfile(currentSession.user, beData));
          }
        }).catch(() => {});
      } else {
        setSession(null);
        setProfile(null);
      }
      setIsLoading(false);
    });

    // 3. Lắng nghe thay đổi trạng thái Auth
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      if (newSession?.user) {
        setSession(newSession);
        setProfile(formatProfile(newSession.user));
        setIsDemoMode(false);
      } else {
        // Chỉ xóa nếu không đang trong demo mode
        const hasDemo = typeof window !== "undefined" && localStorage.getItem("studenthub_demo_user");
        if (!hasDemo) {
          setSession(null);
          setProfile(null);
          syncedRef.current = false;
        }
      }
      setIsLoading(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const ensureSynced = useCallback(
    async (fullName) => {
      if (syncedRef.current || isDemoMode) return;
      try {
        await syncProfile(fullName);
      } catch (err) {
        console.warn("[ensureSynced] Backend sync non-blocking:", err.message);
      }
      syncedRef.current = true;
    },
    [isDemoMode]
  );

  /**
   * Đăng nhập nhanh chế độ Demo (không cần SMTP)
   */
  const loginAsDemo = useCallback((role = "student") => {
    const demoData = role === "expert" ? DEMO_EXPERT : DEMO_STUDENT;
    setSession({ user: { id: demoData.id, email: demoData.email, user_metadata: demoData } });
    setProfile(demoData);
    setIsDemoMode(true);
    if (typeof window !== "undefined") {
      localStorage.setItem("studenthub_demo_user", JSON.stringify(demoData));
    }
  }, []);

  /**
   * Cập nhật thông tin hồ sơ
   */
  const updateProfile = useCallback(
    async (profileUpdates) => {
      if (isDemoMode) {
        const merged = { ...(profile || {}), ...profileUpdates };
        setProfile(merged);
        if (typeof window !== "undefined") {
          localStorage.setItem("studenthub_demo_user", JSON.stringify(merged));
        }
        return merged;
      }

      const updatedUser = await updateUserProfile(profileUpdates);
      if (updatedUser) {
        const newProf = formatProfile(updatedUser);
        setProfile(newProf);
        return newProf;
      }
    },
    [isDemoMode, profile]
  );

  const signOut = useCallback(async () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("studenthub_demo_user");
    }
    setIsDemoMode(false);
    await signOutSupabase().catch(() => {});
    setSession(null);
    setProfile(null);
    syncedRef.current = false;
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
