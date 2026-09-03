import { NextResponse } from "next/server";
import { getSessionExchangeService } from "@/lib/security/identity/SessionExchangeService.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";
import { SecurityError } from "@/lib/security/core/SecurityErrorEnvelope.js";

export const runtime = "nodejs";
// SECURITY_CONTRACT: POST AUTHENTICATED UPSTREAM_OIDC_EXCHANGE 20 65536

export async function POST(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "UPSTREAM_OIDC_EXCHANGE", maxRequests: 20, maxBodyBytes: 65_536 });
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      throw new SecurityError({ code: "CSRF_ORIGIN_REJECTED", message: "Cross-origin session exchange rejected.", statusCode: 403 });
    }
    const authorization = request.headers.get("authorization") || "";
    const upstreamToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!upstreamToken) {
      throw new SecurityError({ code: "UPSTREAM_TOKEN_REQUIRED", message: "A verified identity credential is required.", statusCode: 401 });
    }
    const result = await getSessionExchangeService().exchange(upstreamToken, {
      userAgent: request.headers.get("user-agent") || "Unknown"
    });
    const response = NextResponse.json({ success: true, session: result.safeMetadata });
    response.headers.set("set-cookie", result.cookie);
    response.headers.set("cache-control", "no-store");
    return response;
  } catch (error) {
    if (error instanceof SecurityError) {
      return NextResponse.json(error.toResponsePayload(), { status: error.statusCode, headers: { "cache-control": "no-store" } });
    }
    const databaseUnavailable = error?.name === "DatabaseUnavailableError" || /DATABASE_URL|SESSION_PEPPER/.test(error?.message || "");
    const replay = error?.code === "23505";
    return NextResponse.json({
      error: {
        code: databaseUnavailable ? "DATABASE_UNAVAILABLE" : replay ? "TOKEN_REPLAY_REJECTED" : "INVALID_UPSTREAM_TOKEN",
        message: databaseUnavailable ? "Authentication persistence is unavailable." : replay ? "This identity proof has already been exchanged." : "Identity credential verification failed."
      }
    }, { status: databaseUnavailable ? 503 : replay ? 409 : 401, headers: { "cache-control": "no-store" } });
  }
}
