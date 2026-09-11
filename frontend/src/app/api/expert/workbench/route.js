import { NextResponse } from "next/server";
import { ExpertMissionService } from "@/lib/server/database/ExpertMissionService.js";
import { ExpertProgressionRepository } from "@/lib/server/database/ExpertProgressionRepository.js";
import { IdentityResolver } from "@/lib/security/identity/IdentityResolver.js";

export const runtime = "nodejs";

const missionService = new ExpertMissionService();
const progressionRepo = new ExpertProgressionRepository();

export async function GET(request) {
  try {
    const principal = await IdentityResolver.resolvePrincipal(request);
    if (!principal || principal.isAnonymous()) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = principal.subjectId;
    const [dailyMissions, progression] = await Promise.all([
      missionService.getDailyMissions(userId),
      progressionRepo.getProgression(userId),
    ]);

    return NextResponse.json({
      success: true,
      dailyMissions,
      progression,
      roles: principal.roles || ["STUDENT"],
      fullName: principal.attributes?.fullName || null,
      email: principal.email || null,
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error.message || "Failed to load expert workbench"
    }, { status: error.statusCode || 500 });
  }
}
