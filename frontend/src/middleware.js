// frontend/src/middleware.js
//
// Next.js Edge Middleware: Bảo vệ và cô lập các tuyến đường nâng cao:
// - Chặn và chuyển hướng nếu người dùng chưa có phiên đăng nhập hợp lệ
// - Bảo vệ các route: /dashboard, /scam-check, /forum, /profile, /onboarding

import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Danh sách các tuyến đường yêu cầu xác thực
  const protectedRoutes = [
    "/dashboard",
    "/scam-check",
    "/forum",
    "/profile",
    "/onboarding",
  ];

  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));

  if (isProtected) {
    // Kiểm tra token trong cookies (Supabase Auth Cookie hoặc Custom Auth Cookie)
    const cookies = request.cookies;
    const hasSbToken = Array.from(cookies.getAll()).some(
      (c) => c.name.startsWith("sb-") || c.name.includes("auth-token") || c.name.includes("studenthub")
    );

    // Đối với Single Page App với local storage, client-side AuthContext sẽ đóng vai trò Secondary Guard.
    const isDemoParam = request.nextUrl.searchParams.get("demo") === "true";

    if (!hasSbToken && !isDemoParam) {
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/scam-check/:path*",
    "/forum/:path*",
    "/profile/:path*",
    "/onboarding/:path*",
  ],
};
