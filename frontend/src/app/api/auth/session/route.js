import { NextResponse } from "next/server";
import { IdentityResolver } from "@/lib/security/identity/IdentityResolver.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";

// SECURITY_CONTRACT: GET AUTHENTICATED SESSION_READ 120 0

export async function GET(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "SESSION_READ", maxRequests: 120, maxBodyBytes: 0 });
    const principal = await IdentityResolver.resolvePrincipal(request);
    return NextResponse.json({
      authenticated: true,
      user: { userId: principal.subjectId, roles: principal.roles, authProvider: principal.attributes.authProvider },
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      authenticated: false,
      error: { code: error?.code || "UNAUTHORIZED", message: "Session is not valid." }
    }, { status: error?.statusCode || 401, headers: { "cache-control": "no-store" } });
  }
}
