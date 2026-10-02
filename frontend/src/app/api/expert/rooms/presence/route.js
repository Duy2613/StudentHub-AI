import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertMissionService } from "@/lib/server/expert/ExpertMissionService.js";
import { ExpertVerificationRoomService } from "@/lib/server/expert/ExpertVerificationRoomService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function heartbeat(_request, _routeParams, principal, securityContext) {
  try {
    const data = await ExpertMissionService.heartbeat({ principal });
    await ExpertVerificationRoomService.offerWaitingSupervisors({ principal });
    return NextResponse.json({ success: true, contractVersion: "expert-room-presence.v1", data, meta: { correlationId: securityContext.correlationId } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

// Eight Experts sharing an IP can each renew a 15-second presence lease.
export const POST = SecurityFabric.wrapHandler({ action: "HEARTBEAT_EXPERT_ROOM_PRESENCE", requiredPermission: "EXPERT.READ", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 0 }, heartbeat);
