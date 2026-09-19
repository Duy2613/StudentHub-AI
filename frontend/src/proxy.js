// StudentHub AI — Next.js 16 Proxy
// Applies security headers and correlation IDs at the edge.

import { NextResponse } from "next/server";
import { createCorrelationId } from "./lib/security/secureId.js";
import { getContentSecurityPolicy } from "./lib/security/hardening/SecurityHeaders.js";

export function proxy(request) {
  const { pathname } = request.nextUrl;
  const rawIncoming = request.headers.get("x-correlation-id") || request.headers.get("x-request-id") || "";
  const correlationId = /^[A-Za-z0-9_.:-]{1,128}$/.test(rawIncoming.trim())
    ? rawIncoming.trim()
    : createCorrelationId("sec_edge");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-correlation-id", correlationId);
  requestHeaders.set("x-request-id", correlationId);

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  response.headers.set("x-correlation-id", correlationId);
  response.headers.set("x-request-id", correlationId);
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(self)");
  response.headers.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
  response.headers.set("Content-Security-Policy", getContentSecurityPolicy());
  response.headers.set("X-Robots-Tag", pathname.startsWith("/api/") ? "noindex, nofollow" : "index, follow");

  return response;
}

export const config = {
  matcher: [
    "/",
    "/trust/:path*",
    "/community/:path*",
    "/expert/:path*",
    "/cases/:path*",
    "/dashboard/:path*",
    "/settings/:path*",
    "/login/:path*",
    "/register/:path*",
    "/callback/:path*",
    "/onboarding/:path*",
    "/scam-check/:path*",
    "/forum/:path*",
    "/profile/:path*",
    "/api/:path*"
  ],
};
