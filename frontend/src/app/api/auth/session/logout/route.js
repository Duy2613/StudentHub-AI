import { NextResponse } from "next/server";
import { clearSessionCookie, getDurableSessionService, SESSION_COOKIE_NAME } from "@/lib/security/identity/DurableSessionService.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";
import { SecurityError } from "@/lib/security/core/SecurityErrorEnvelope.js";

// SECURITY_CONTRACT: POST AUTHENTICATED SESSION_LOGOUT 60 0

function cookieValue(header, name) {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
}

export async function POST(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "SESSION_LOGOUT", maxRequests: 60, maxBodyBytes: 0 });
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      throw new SecurityError({ code: "CSRF_ORIGIN_REJECTED", message: "Cross-origin logout rejected.", statusCode: 403 });
    }
    const sessions = getDurableSessionService();
    const secret = cookieValue(request.headers.get("cookie") || "", SESSION_COOKIE_NAME);
    if (secret) await sessions.revokeSession(secret, "LOGOUT");
    const response = NextResponse.json({ success: true });
    response.headers.set("set-cookie", sessions.clearCookie());
    response.headers.set("cache-control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof SecurityError) {
      return NextResponse.json(error.toResponsePayload(), { status: error.statusCode, headers: { "cache-control": "no-store" } });
    }
    const response = NextResponse.json({ error: { code: "DATABASE_UNAVAILABLE", message: "Logout persistence is unavailable; server-side revocation requires recovery." } }, { status: 503, headers: { "cache-control": "no-store" } });
    // Clear the browser cookie even when durable revocation is unavailable.
    // The 503 remains explicit so callers do not claim that server revocation
    // completed; the client must re-authenticate after dependency recovery.
    response.headers.set("set-cookie", clearSessionCookie());
    return response;
  }
}
