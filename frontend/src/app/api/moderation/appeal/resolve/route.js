import { NextResponse } from "next/server";
import { ModerationRepository } from "@/lib/server/database/ModerationRepository.js";
import { IdentityResolver } from "@/lib/security/identity/IdentityResolver.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";

export const runtime = "nodejs";

const repo = new ModerationRepository();

export async function POST(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "MODERATION_APPEAL_REVIEW", maxRequests: 30, maxBodyBytes: 8192 });
    const principal = await IdentityResolver.resolvePrincipal(request);
    if (!principal || principal.isAnonymous()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const result = await repo.resolveAppeal({
      appealId: body.appealId,
      reviewedBy: principal.subjectId,
      status: body.status,
      reviewNotes: body.reviewNotes || null,
    });

    return NextResponse.json({ success: true, ...result }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to resolve moderation appeal" },
      { status: error.statusCode || 500 }
    );
  }
}
