"use client";

// app/register/page.jsx
//
// Trang Đăng Ký StudentHub AI (Saffron Finance x Meer Mohsin x uAvionix):
// - Vỏ bọc SaffronAuthContainer với Swiss Grid & Realtime Fluid Canvas (meermohsin.me)
// - Bảng điều khiển SaffronAuthDeck với Radar phát hiện email trường .edu (+30 điểm uy tín)
// - Xác thực 2 bước với Settigation Orbit OTP v3 (vòng quay thiên văn Saffron/Teal)
// - Aerospace Avionics Telemetry HUD (usavionix.com)

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ShieldAlert, RefreshCw, LogIn } from "lucide-react";
import SaffronAuthContainer from "@/components/auth/SaffronAuthContainer";
import SaffronAuthDeck from "@/components/auth/SaffronAuthDeck";
import { useAuth, PROFILE_STATUS } from "@/lib/auth/AuthContext";
import { normalizeAuthReturnPath, postAuthDestination } from "@/lib/auth/authRedirects";

export default function RegisterPage() {
  const router = useRouter();
  const { isAuthenticated, profile, profileStatus, ready, status, refreshProfile } = useAuth();

  useEffect(() => {
    if (!ready || status !== "READY" || !isAuthenticated) return;
    const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
    const next = normalizeAuthReturnPath(params?.get("next") || params?.get("returnPath"));

    if (profileStatus === PROFILE_STATUS.FOUND) {
      router.replace(postAuthDestination({ next, onboarded: profile?.onboarded === true }));
    } else if (profileStatus === PROFILE_STATUS.NOT_FOUND) {
      router.replace("/onboarding");
    }
  }, [isAuthenticated, profile?.onboarded, profileStatus, ready, router, status]);

  if (ready && status === "READY" && isAuthenticated) {
    if (profileStatus === PROFILE_STATUS.LOADING) {
      return (
        <SaffronAuthContainer>
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <Loader2 className="animate-spin text-amber-400 mb-4" size={32} />
            <h2 className="text-lg font-medium text-white">Đang kiểm tra tài khoản...</h2>
            <p className="text-xs text-slate-400 mt-1">Đang chuyển hướng bạn đến bảng làm việc an toàn.</p>
          </div>
        </SaffronAuthContainer>
      );
    }

    if (profileStatus === PROFILE_STATUS.ERROR) {
      return (
        <SaffronAuthContainer>
          <div className="flex flex-col items-center justify-center p-8 text-center min-h-[300px]">
            <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-400 mb-4">
              <ShieldAlert size={24} />
            </div>
            <h2 className="text-lg font-medium text-white">Không thể kết nối đến máy chủ hồ sơ</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Phiên đăng nhập của bạn hợp lệ nhưng hệ thống chưa thể tải dữ liệu hồ sơ. Vui lòng thử lại.
            </p>
            <div className="flex items-center gap-3 mt-6">
              <button
                type="button"
                onClick={() => refreshProfile()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400 transition-colors cursor-pointer"
              >
                <RefreshCw size={14} /> Thử lại
              </button>
              <button
                type="button"
                onClick={() => router.push("/dashboard")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-white text-xs hover:bg-white/20 transition-colors cursor-pointer"
              >
                Vào Dashboard
              </button>
            </div>
          </div>
        </SaffronAuthContainer>
      );
    }
  }

  return (
    <SaffronAuthContainer>
      <SaffronAuthDeck initialMode="register" />
    </SaffronAuthContainer>
  );
}
