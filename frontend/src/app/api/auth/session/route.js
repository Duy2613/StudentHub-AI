import { IdentityResolver } from "../../../../lib/security/identity/IdentityResolver.js";
import { AuthRouteGuard } from "../../../../lib/security/hardening/AuthRouteGuard.js";

// SECURITY_CONTRACT: GET AUTHENTICATED SESSION_READ 120 0

export async function GET(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "SESSION_READ", maxRequests: 120, maxBodyBytes: 0 });
    const principal = await IdentityResolver.resolvePrincipal(request);
    const roles = Array.isArray(principal.roles) ? principal.roles : [];
    const role = roles.includes("ADMIN")
      ? "admin"
      : roles.includes("EXPERT")
        ? "expert"
        : "student";
    return Response.json({
      authenticated: true,
      user: {
        id: principal.subjectId,
        userId: principal.subjectId,
        email: principal.email,
        emailVerified: principal.attributes?.emailVerified === true,
        roles,
        role,
        authProvider: principal.attributes?.authProvider || "supabase",
      },
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return Response.json({
      authenticated: false,
      error: { code: error?.code || "UNAUTHORIZED", message: "Session is not valid." }
    }, { status: error?.statusCode || 401, headers: { "cache-control": "no-store" } });
  }
}
