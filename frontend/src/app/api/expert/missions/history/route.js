import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertMissionService } from "@/lib/server/expert/ExpertMissionService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readHistory(request, _routeParams, principal, securityContext) {
  const limit = new URL(request.url).searchParams.get("limit");
  try {
    return NextResponse.json({
      success: true,
      contractVersion: "expert-daily-missions.v1",
      data: await ExpertMissionService.history({ principal, limit }),
      meta: { correlationId: securityContext.correlationId },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_EXPERT_MISSION_HISTORY", requiredPermission: "EXPERT.READ", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 0 }, readHistory);
