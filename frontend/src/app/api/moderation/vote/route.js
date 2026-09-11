import { NextResponse } from "next/server";
import { ModerationRepository } from "@/lib/server/database/ModerationRepository.js";
import { IdentityResolver } from "@/lib/security/identity/IdentityResolver.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";

export const runtime = "nodejs";

const repo = new ModerationRepository();

export async function POST(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "MODERATION_VOTE", maxRequests: 60, maxBodyBytes: 8192 });
    const principal = await IdentityResolver.resolvePrincipal(request);
    const isModerator = principal.roles.some((r) => ["ADMIN", "MODERATOR", "EXPERT"].includes(r.toUpperCase()));
    if (!isModerator) {
      return NextResponse.json({ error: "FORBIDDEN: Moderator privileges required" }, { status: 403 });
    }

    const body = await request.json();
    const { caseId, action, rationale = null } = body;

    const result = await repo.recordVote({
      caseId,
      moderatorId: principal.subjectId,
      action,
      rationale,
    });

    return NextResponse.json({ success: true, action: result.action }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const isClientError = error.message?.includes("REQUIRED") || error.message?.includes("INVALID");
    return NextResponse.json({ success: false, error: error.message }, { status: isClientError ? 400 : 500 });
  }
}
