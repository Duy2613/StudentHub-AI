import { NextResponse } from "next/server";
import { CommunityPerceptionRepository } from "@/lib/server/database/CommunityPerceptionRepository.js";
import { IdentityResolver } from "@/lib/security/identity/IdentityResolver.js";
import { AuthRouteGuard } from "@/lib/security/hardening/AuthRouteGuard.js";

export const runtime = "nodejs";

const repo = new CommunityPerceptionRepository();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const caseId = searchParams.get("caseId");
    if (!caseId) {
      return NextResponse.json({ error: "caseId is required" }, { status: 400 });
    }
    const caseRevision = Number(searchParams.get("caseRevision")) || 1;
    const targetType = searchParams.get("targetType") || "CASE";
    const claimId = searchParams.get("claimId") || null;
    const contributionId = searchParams.get("contributionId") || null;

    const summary = await repo.getSummary({
      caseId,
      caseRevision,
      claimId,
      contributionId,
      targetType,
    });

    let userVote = null;
    try {
      const principal = await IdentityResolver.resolvePrincipal(request, { allowAnonymous: true });
      if (principal && !principal.isAnonymous()) {
        userVote = await repo.getUserVote({
          userId: principal.subjectId,
          caseId,
          caseRevision,
          claimId,
          contributionId,
          targetType,
        });
      }
    } catch {
      // Unauthenticated caller gets summary only
    }

    return NextResponse.json({
      success: true,
      summary,
      userVote,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to retrieve perception summary"
    }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    AuthRouteGuard.assertRequest(request, { action: "PERCEPTION_VOTE", maxRequests: 60, maxBodyBytes: 8192 });
    const principal = await IdentityResolver.resolvePrincipal(request);
    if (!principal || principal.isAnonymous()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      caseId,
      caseRevision = 1,
      claimId = null,
      contributionId = null,
      targetType = "CASE",
      vote,
    } = body;

    const result = await repo.castVote({
      userId: principal.subjectId,
      caseId,
      caseRevision,
      claimId,
      contributionId,
      targetType,
      vote,
    });

    const summary = await repo.getSummary({
      caseId,
      caseRevision,
      claimId,
      contributionId,
      targetType,
    });

    return NextResponse.json({
      success: true,
      vote: result.vote,
      isExpert: result.isExpert,
      changed: result.changed,
      summary,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const statusCode = error.message?.includes("REQUIRED") ? 400 : 500;
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to record perception vote"
    }, { status: statusCode });
  }
}
