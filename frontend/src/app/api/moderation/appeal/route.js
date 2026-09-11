import { NextResponse } from "next/server";
import { ModerationRepository } from "@/lib/server/database/ModerationRepository.js";
import { IdentityResolver } from "@/lib/security/identity/IdentityResolver.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";

export const runtime = "nodejs";

const repo = new ModerationRepository();

export async function GET(request) {
  try {
    const principal = await IdentityResolver.resolvePrincipal(request);
    if (!principal || principal.isAnonymous()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const appeals = await repo.getPublicAppeals(principal.subjectId);
    return NextResponse.json({ success: true, appeals }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "MODERATION_APPEAL", maxRequests: 20, maxBodyBytes: 8192 });
    const principal = await IdentityResolver.resolvePrincipal(request);
    if (!principal || principal.isAnonymous()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { caseId, reason } = body;

    const result = await repo.submitAppeal({
      caseId,
      appellantId: principal.subjectId,
      reason,
    });

    return NextResponse.json({ success: true, appealId: result.appealId }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const isClientError = error.statusCode || error.message?.includes("REQUIRED") || error.message?.includes("TOO_SHORT");
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || (isClientError ? 400 : 500) });
  }
}
