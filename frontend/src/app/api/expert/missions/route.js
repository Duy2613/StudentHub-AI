import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertMissionService } from "@/lib/server/expert/ExpertMissionService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readToday(_request, _routeParams, principal, securityContext) {
  try {
    return NextResponse.json({
      success: true,
      contractVersion: "expert-daily-missions.v1",
      data: await ExpertMissionService.getDailyMissions({ principal }),
      meta: { correlationId: securityContext.correlationId },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

async function assignToday(_request, _routeParams, principal, securityContext) {
  try {
    return NextResponse.json({
      success: true,
      contractVersion: "expert-daily-missions.v1",
      data: await ExpertMissionService.assignDailyMissions({ principal }),
      meta: { correlationId: securityContext.correlationId },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

const policy = { requiredPermission: "EXPERT.READ", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 0 };
export const GET = SecurityFabric.wrapHandler({ ...policy, action: "READ_EXPERT_DAILY_MISSIONS" }, readToday);
export const POST = SecurityFabric.wrapHandler({ ...policy, action: "ASSIGN_EXPERT_DAILY_MISSIONS" }, assignToday);
