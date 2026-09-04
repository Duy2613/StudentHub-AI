import crypto from "node:crypto";
import { SecurityFabric } from "../../../../lib/security/SecurityFabric.js";
import { getDurableSessionService } from "../../../../lib/security/identity/DurableSessionService.js";
import { SecurityError, SECURITY_ERROR_CODE } from "../../../../lib/security/core/SecurityErrorEnvelope.js";

export const runtime = "nodejs";

export const POST = SecurityFabric.wrapHandler(
  {
    action: "AUTH_BOOTSTRAP_SYNC",
    authMode: "AUTH_BOOTSTRAP_SUPABASE",
    rateLimit: true,
    maxRequests: 30,
    maxBodyBytes: 64 * 1024,
  },
  async (request, routeParams, principal) => {
    // 1. Same-origin validation when Origin header is supplied by browser
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.CSRF_ORIGIN_REJECTED,
        message: "Cross-origin authentication sync rejected.",
        statusCode: 403,
      });
    }

    if (!principal || !principal.subjectId) {
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AUTH_BOOTSTRAP_TOKEN_INVALID,
        message: "Verified upstream identity is required.",
        statusCode: 401,
      });
    }

    const verifiedUserId = principal.subjectId;
    const verifiedEmail = principal.email || "";

    // 2. Parse request body for safe user profile display metadata only.
    // Client-supplied 'id', 'userId', 'email', and 'role' are strictly ignored.
    const body = await request.json().catch(() => ({}));
    const rawDisplayName = typeof body?.fullName === "string"
      ? body.fullName
      : typeof body?.displayName === "string"
        ? body.displayName
        : null;
    const safeDisplayName = rawDisplayName ? rawDisplayName.trim().slice(0, 120) : null;
    const safeAvatarUrl = typeof body?.avatarUrl === "string" && body.avatarUrl.trim().startsWith("https://")
      ? body.avatarUrl.trim().slice(0, 2048)
      : null;

    // 3. Synchronize user profile & query authoritative role from PostgreSQL
    let resolvedRoles = Array.isArray(principal.roles) && principal.roles.length ? principal.roles : ["STUDENT"];
    let userProfile = null;

    if (process.env.DATABASE_URL) {
      try {
        const { getPostgresPool } = await import("../../../../lib/server/database/PostgresPool.js");
        const pool = getPostgresPool();

        const defaultDisplayName = safeDisplayName || (verifiedEmail ? verifiedEmail.split("@")[0] : "StudentHub member");
        const profileResult = await pool.query(`
          insert into public.profiles (id, display_name, avatar_url)
          values ($1, $2, $3)
          on conflict (id) do update set
            display_name = coalesce(excluded.display_name, public.profiles.display_name),
            avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
            updated_at = now()
          returning id, display_name, avatar_url
        `, [verifiedUserId, defaultDisplayName, safeAvatarUrl]);
        userProfile = profileResult.rows[0] || null;

        // Ensure baseline STUDENT role exists in private.user_roles
        await pool.query(`
          insert into private.user_roles (user_id, role_id)
          select $1, id from private.roles where code = 'STUDENT'
          on conflict do nothing
        `, [verifiedUserId]);

        // Authoritative role lookup: DB-assigned role (e.g. ADMIN) takes absolute precedence
        const roleResult = await pool.query(`
          select coalesce(array_agg(r.code order by r.code), array['STUDENT']::text[]) as roles
          from private.user_roles ur
          join private.roles r on r.id = ur.role_id
          where ur.user_id = $1 and ur.revoked_at is null
        `, [verifiedUserId]);
        if (roleResult.rows[0]?.roles?.length) {
          resolvedRoles = roleResult.rows[0].roles;
        }
      } catch (dbErr) {
        console.error("[AUTH_BOOTSTRAP_SYNC] User database sync failed:", dbErr?.message);
        throw new SecurityError({
          code: SECURITY_ERROR_CODE.AUTH_USER_SYNC_FAILED,
          message: "Failed to synchronize user database profile.",
          statusCode: 500,
        });
      }
    }

    // 4. Create durable server session in private.server_sessions
    let sessionRecord;
    try {
      const sessionService = getDurableSessionService();
      const rawToken = principal.attributes?.rawToken
        || (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
      const exchangeProofId = rawToken
        ? crypto.createHash("sha256").update(rawToken).digest("base64url")
        : null;

      sessionRecord = await sessionService.createSession(
        {
          userId: verifiedUserId,
          authProvider: "supabase",
          exchangeProofId,
          jti: principal.attributes?.jti || null,
        },
        {
          userAgent: request.headers.get("user-agent") || "Unknown",
        }
      );
    } catch (sessionErr) {
      console.error("[AUTH_BOOTSTRAP_SYNC] Session creation failed:", sessionErr?.message);
      throw new SecurityError({
        code: SECURITY_ERROR_CODE.AUTH_SESSION_CREATE_FAILED,
        message: "Failed to establish durable server session.",
        statusCode: 500,
      });
    }

    // 5. Serialize HttpOnly SameSite=Lax Secure cookie
    const isSecure = request.url?.startsWith("https://")
      || request.headers.get("x-forwarded-proto") === "https"
      || process.env.NODE_ENV === "production";

    const cookieHeader = getDurableSessionService().serializeCookie(
      sessionRecord.secret,
      sessionRecord.expiresAt,
      { secure: isSecure }
    );

    // 6. Return sanitized user & session response
    const primaryRole = resolvedRoles.includes("ADMIN")
      ? "admin"
      : (resolvedRoles[0] || "student").toLowerCase();

    const responsePayload = {
      success: true,
      authenticated: true,
      user: {
        id: verifiedUserId,
        userId: verifiedUserId,
        email: verifiedEmail,
        displayName: userProfile?.display_name || safeDisplayName || (verifiedEmail ? verifiedEmail.split("@")[0] : "StudentHub member"),
        avatarUrl: userProfile?.avatar_url || safeAvatarUrl || null,
        roles: resolvedRoles,
        role: primaryRole,
      },
      session: {
        expiresAt: sessionRecord.expiresAt.toISOString(),
      },
    };

    const response = Response.json(responsePayload, {
      status: 200,
      headers: {
        "set-cookie": cookieHeader,
        "cache-control": "no-store",
      },
    });

    return response;
  }
);
