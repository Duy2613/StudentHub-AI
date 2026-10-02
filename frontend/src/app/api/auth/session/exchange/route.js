import { NextResponse } from "next/server";
import { getSessionExchangeService } from "@/lib/security/identity/SessionExchangeService.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";
import { isSameOriginRequest } from "@/lib/security/hardening/CsrfGuard.js";
import { SecurityError } from "@/lib/security/core/SecurityErrorEnvelope.js";
import { isDemoAcceptanceModeEnabled } from "@/lib/server/auth/demoAcceptanceMode.js";

export const runtime = "nodejs";
// SECURITY_CONTRACT: POST AUTHENTICATED UPSTREAM_OIDC_EXCHANGE 20 65536

export async function POST(request) {
  try {
    const acceptanceMode = isDemoAcceptanceModeEnabled();
    const guardOptions = { action: "UPSTREAM_OIDC_EXCHANGE", maxRequests: 20, maxBodyBytes: 65_536 };
    if (acceptanceMode) {
      // Bound proof verification before selecting the verified per-UID bucket.
      // The shared ceiling covers eight demo identities at the normal limit.
      AuthRouteGuard.assertRequest(request, {
        ...guardOptions,
        action: "UPSTREAM_OIDC_PROOF",
        maxRequests: guardOptions.maxRequests * 8,
      });
    } else {
      // Preserve the production/default IP throttle before token verification.
      AuthRouteGuard.assertRequest(request, guardOptions);
    }
    if (!isSameOriginRequest(request)) {
      throw new SecurityError({ code: "CSRF_ORIGIN_REJECTED", message: "Cross-origin session exchange rejected.", statusCode: 403 });
    }
    const authorization = request.headers.get("authorization") || "";
    const upstreamToken = authorization.startsWith("Bearer ") ? authorization.slice(7).trim() : "";
    if (!upstreamToken) {
      throw new SecurityError({ code: "UPSTREAM_TOKEN_REQUIRED", message: "A verified identity credential is required.", statusCode: 401 });
    }
    const exchangeService = getSessionExchangeService();
    const verifiedProof = acceptanceMode ? await exchangeService.verifyProof(upstreamToken) : null;
    if (acceptanceMode) {
      AuthRouteGuard.assertRequest(request, {
        ...guardOptions,
        verifiedIdentity: verifiedProof.identity,
      });
    }
    const result = await exchangeService.exchange(upstreamToken, {
      userAgent: request.headers.get("user-agent") || "Unknown"
    }, verifiedProof);
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
