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
      return NextResponse.json({ error: "FORBIDDEN: Moderator privileges required" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "OPEN";
    const limit = Number(searchParams.get("limit")) || 20;

    const cases = await repo.getModeratorCases({ actorId: principal.subjectId, status, limit });
    return NextResponse.json({ success: true, cases }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || 500 });
  }
}

export async function POST(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "MODERATION_REPORT", maxRequests: 20, maxBodyBytes: 8192 });
    const principal = await IdentityResolver.resolvePrincipal(request);
    if (!principal || principal.isAnonymous()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { targetType, targetId, reasonCategory, details } = body;

    const result = await repo.createCase({
      targetType,
      targetId,
      reportedBy: principal.subjectId,
      reasonCategory,
      details,
    });

    return NextResponse.json({ success: true, caseId: result.id, status: result.status }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const isClientError = error.statusCode || error.message?.includes("REQUIRED") || error.message?.includes("DISALLOWED");
    return NextResponse.json({ success: false, error: error.message }, { status: error.statusCode || (isClientError ? 400 : 500) });
  }
}
