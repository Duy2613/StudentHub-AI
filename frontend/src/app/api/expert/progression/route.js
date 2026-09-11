import { NextResponse } from "next/server";
import { ExpertProgressionRepository } from "@/lib/server/database/ExpertProgressionRepository.js";
import { IdentityResolver } from "@/lib/security/identity/IdentityResolver.js";

export const runtime = "nodejs";

const repo = new ExpertProgressionRepository();

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const domainCode = searchParams.get("domainCode") || "GENERAL";
    const isLeaderboard = searchParams.get("leaderboard") === "true";

    if (isLeaderboard) {
      const limit = Number(searchParams.get("limit")) || 10;
      const leaderboard = await repo.getLeaderboard({ domainCode, limit });
      return NextResponse.json({
        success: true,
        leaderboard,
      }, { headers: { "cache-control": "no-store" } });
    }

    let targetUserId = searchParams.get("userId");
    if (!targetUserId) {
      try {
        const principal = await IdentityResolver.resolvePrincipal(request);
        targetUserId = principal?.subjectId;
      } catch {
        return NextResponse.json({ error: "Authentication required to read own progression" }, { status: 401 });
      }
    }

    if (!targetUserId) {
      return NextResponse.json({ error: "userId is required" }, { status: 400 });
    }

    const progression = await repo.getProgression(targetUserId, domainCode);
    return NextResponse.json({
      success: true,
      progression,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to load progression data"
    }, { status: 500 });
  }
}
