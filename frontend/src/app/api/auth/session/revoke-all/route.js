import { NextResponse } from "next/server";
import { clearSessionCookie, getDurableSessionService, SESSION_COOKIE_NAME } from "@/lib/security/identity/DurableSessionService.js";
import { createSupabaseTokenVerifier } from "@/lib/security/identity/OidcTokenVerifier.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";
import { isSameOriginRequest } from "@/lib/security/hardening/CsrfGuard.js";
import { SecurityError } from "@/lib/security/core/SecurityErrorEnvelope.js";

export const runtime = "nodejs";
// SECURITY_CONTRACT: POST AUTHENTICATED SESSION_REVOKE_ALL 20 4096

function cookieValue(header, name) {
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  if (!match) return "";
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}

export async function POST(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "SESSION_REVOKE_ALL", maxRequests: 20, maxBodyBytes: 4096 });
    if (!isSameOriginRequest(request)) {
      throw new SecurityError({ code: "CSRF_ORIGIN_REJECTED", message: "Cross-origin session revocation rejected.", statusCode: 403 });
    }

    let bodyReason = "PASSWORD_RESET";
    try {
      const body = await request.json().catch(() => ({}));
      if (typeof body?.reason === "string" && body.reason.trim()) {
        bodyReason = body.reason.trim().slice(0, 100);
      }
    } catch {
      // Body is optional
    }

    const sessions = getDurableSessionService();
    const cookieHeader = request.headers.get("cookie") || "";
    const secret = cookieValue(cookieHeader, SESSION_COOKIE_NAME);
    let userId = null;

    if (secret) {
      try {
        const active = await sessions.validateSession(secret);
        userId = active?.user_id || active?.userId;
      } catch (err) {
        // Active session failed or was revoked, check bearer header fallback
      }
    }

    if (!userId) {
      const authorization = request.headers.get("authorization") || "";
      const bearerToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
      if (bearerToken) {
        const verifier = createSupabaseTokenVerifier();
        const identity = await verifier.verify(bearerToken);
        userId = identity?.userId;
      }
    }

    if (!userId) {
      throw SecurityError.unauthorized("Authentication session or verified credential is required to revoke sessions.");
    }

    const revokedCount = await sessions.revokeAllSessions(userId, bodyReason);
    const response = NextResponse.json({ success: true, revokedCount, userId });
    response.headers.set("set-cookie", clearSessionCookie());
    response.headers.set("cache-control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof SecurityError) {
      return NextResponse.json(error.toResponsePayload(), { status: error.statusCode, headers: { "cache-control": "no-store" } });
    }
    const response = NextResponse.json({
      error: {
        code: "DATABASE_UNAVAILABLE",
        message: "Session revocation persistence is unavailable."
      }
    }, { status: 503, headers: { "cache-control": "no-store" } });
    response.headers.set("set-cookie", clearSessionCookie());
    return response;
  }
}
