"use client";

// app/(auth)/callback/page.jsx
//
// Google redirect về đây sau khi Supabase xử lý OAuth xong. Supabase SDK
// tự đọc token từ URL (không cần Frontend tự parse), việc cần làm chỉ là
// đợi AuthContext nhận được session, gọi /api/auth/sync 1 lần, rồi vào
// /dashboard.
//
// LƯU Ý KHI TEST: thời điểm session xuất hiện có thể trễ hơn 1 nhịp so
// với lúc trang này mount (Supabase cần 1 khoảnh khắc xử lý URL) — có đặt
// timeout dự phòng bên dưới, nhưng nếu thấy chuyển hướng sai (đá về login
// dù đăng nhập thành công), thử tăng thời gian timeout lên trước khi nghi
// ngờ chỗ khác.

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/AuthContext";

export default function AuthCallbackPage() {
  const router = useRouter();
  const { session, isLoading, ensureSynced } = useAuth();
  const handledRef = useRef(false);

  useEffect(() => {
    if (handledRef.current) return;
    if (isLoading) return;

    if (!session) {
      const timeout = setTimeout(() => {
        if (!handledRef.current) {
          router.replace("/login?error=google_login_failed");
        }
      }, 3000);
      return () => clearTimeout(timeout);
    }

    handledRef.current = true;
    const fullName =
      session.user?.user_metadata?.full_name || session.user?.user_metadata?.name || "";

    ensureSynced(fullName).finally(() => {
      router.replace("/dashboard");
    });
  }, [session, isLoading, ensureSynced, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-space-950 text-gray-300">
      <p>Đang xử lý đăng nhập...</p>
    </div>
  );
}
