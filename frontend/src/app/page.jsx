"use client";

// app/page.jsx
//
// Trang chủ điều hướng thông minh:
// - Chưa đăng nhập -> /login
// - Đã đăng nhập: nếu chưa hoàn tất vai trò/avatar -> /onboarding, ngược lại -> /dashboard

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/login");
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-space-950 text-gray-300">
      <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
      <p className="text-gray-400 font-medium">Đang chuyển tới màn hình Đăng nhập...</p>
    </div>
  );
}
