import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertMissionService } from "@/lib/server/expert/ExpertMissionService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function mutateMission(request, routeParams, principal, securityContext) {
  const { missionId } = await routeParams;
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, error: { code: "JSON_REQUIRED", message: "A JSON action is required." } }, { status: 400 }); }
  try {
    const action = String(body?.action || "").toUpperCase();
    const data = action === "START"
      ? await ExpertMissionService.startMission({ principal, missionId })
      : action === "SUBMIT"
        ? await ExpertMissionService.submitMissionAnswer({ principal, missionId, answer: body?.answer })
        : null;
    if (!data) return NextResponse.json({ success: false, error: { code: "MISSION_ACTION_INVALID", message: "Supported actions are START and SUBMIT." } }, { status: 400 });
    return NextResponse.json({
      success: true,
      contractVersion: "expert-daily-missions.v1",
      data,
      meta: { correlationId: securityContext.correlationId },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

export const POST = SecurityFabric.wrapHandler({ action: "MUTATE_EXPERT_DAILY_MISSION", requiredPermission: "EXPERT.READ", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 8 * 1024 }, mutateMission);
