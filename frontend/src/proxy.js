// StudentHub AI — Next.js 16 Proxy
// Applies security headers and correlation IDs at the edge.

import { NextResponse } from "next/server";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const incomingCorrelationId = request.headers.get("x-correlation-id") || "";
  const correlationId = /^[A-Za-z0-9_.:-]{1,128}$/.test(incomingCorrelationId)
    ? incomingCorrelationId
    : `sec_edge_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const response = NextResponse.next();

  response.headers.set("x-correlation-id", correlationId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("X-Robots-Tag", pathname.startsWith("/api/") ? "noindex, nofollow" : "index, follow");

  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/scam-check/:path*", "/forum/:path*", "/profile/:path*", "/onboarding/:path*", "/api/:path*"],
};
