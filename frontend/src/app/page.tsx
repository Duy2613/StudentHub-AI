"use client";

// app/page.tsx
//
// Thay cho trang chào mừng mặc định của create-next-app. Trang "/" giờ chỉ
// làm nhiệm vụ điều hướng: đã đăng nhập -> /dashboard, chưa -> /login.
//
// LƯU Ý: /dashboard chưa được tạo (đó là Nhiệm vụ 2, chưa làm) — cho tới khi
// trang đó có, người dùng đăng nhập xong sẽ tạm thời thấy 404 ở /dashboard.
// Đây là điều BÌNH THƯỜNG ở giai đoạn này, không phải lỗi.

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function Home() {
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(session ? "/dashboard" : "/login");
  }, [session, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-950 text-gray-300">
      <p>Đang tải...</p>
    </div>
  );
}
