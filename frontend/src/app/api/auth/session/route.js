import { NextResponse } from "next/server";
import { IdentityResolver } from "@/lib/security/identity/IdentityResolver.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";

// SECURITY_CONTRACT: GET AUTHENTICATED SESSION_READ 120 0

export async function GET(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "SESSION_READ", maxRequests: 120, maxBodyBytes: 0 });
    const principal = await IdentityResolver.resolvePrincipal(request);
    const attributes = principal.attributes || {};
    return NextResponse.json({
      authenticated: true,
      // This is a deliberately small application-session projection. Roles,
      // email verification, and onboarding are read from server-owned state;
      // no client metadata is promoted into the principal.
      user: {
        userId: principal.subjectId,
        roles: principal.roles,
        authProvider: attributes.authProvider || null,
        email: principal.email || null,
        emailVerified: attributes.emailVerified === true,
        fullName: attributes.fullName || null,
        onboarded: attributes.onboarded === true,
      },
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: { code: error?.code || "UNAUTHORIZED", message: "Session is not valid." }
    }, { status: error?.statusCode || 401, headers: { "cache-control": "no-store" } });
  }
}
