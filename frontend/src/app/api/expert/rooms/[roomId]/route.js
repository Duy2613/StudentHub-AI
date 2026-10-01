import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertVerificationRoomService } from "@/lib/server/expert/ExpertVerificationRoomService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function readRoomId(routeContext) {
  const params = routeContext && typeof routeContext === "object" && "params" in routeContext
    ? await routeContext.params
    : await routeContext;
  return params?.roomId;
}

async function readRoom(_request, routeParams, principal, securityContext) {
  const roomId = await readRoomId(routeParams);
  try {
    return NextResponse.json({ success: true, contractVersion: "expert-verification-room.v1", data: await ExpertVerificationRoomService.getRoom({ principal, roomId }), meta: { correlationId: securityContext.correlationId } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

async function mutateRoom(request, routeParams, principal, securityContext) {
  const roomId = await readRoomId(routeParams);
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, error: { code: "JSON_REQUIRED", message: "A room action is required." } }, { status: 400 }); }
  try {
    const action = String(body?.action || "").toUpperCase();
    let data = null;
    if (action === "ACCEPT_SUPERVISOR") data = await ExpertVerificationRoomService.acceptSupervisor({ principal, roomId, accept: true, conflictFree: body?.conflictFree === true });
    else if (action === "DECLINE_SUPERVISOR") data = await ExpertVerificationRoomService.acceptSupervisor({ principal, roomId, accept: false, conflictFree: false });
    else if (action === "RETRY_SUPERVISOR") data = await ExpertVerificationRoomService.retrySupervisorOffer({ principal, roomId });
    else if (action === "JOIN") data = await ExpertVerificationRoomService.joinRoom({ principal, roomId });
    else if (action === "START_ROUND") data = await ExpertVerificationRoomService.startRound({ principal, roomId });
    else if (action === "SUBMIT_ANSWER") data = await ExpertVerificationRoomService.submitAnswer({ principal, roomId, response: body?.response });
    else if (action === "LOCK_AND_ANALYZE") data = await ExpertVerificationRoomService.lockAndAnalyze({ principal, request, securityContext, roomId });
    else if (action === "PROPOSE_SCORE") data = await ExpertVerificationRoomService.proposeScore({ principal, roomId, expertId: body?.expertId, ratings: body?.ratings, evidenceIds: body?.evidenceIds, reason: body?.reason });
    else if (action === "CONFIRM_SCORE") data = await ExpertVerificationRoomService.confirmProposal({ principal, roomId, expertId: body?.expertId, proposalHash: body?.proposalHash });
    else if (action === "ACKNOWLEDGE_SCORE") data = await ExpertVerificationRoomService.acknowledgeScore({ principal, roomId, expertId: body?.expertId, proposalHash: body?.proposalHash });
    else if (action === "CLOSE") data = await ExpertVerificationRoomService.closeRoom({ principal, roomId });
    if (!data) return NextResponse.json({ success: false, error: { code: "ROOM_ACTION_INVALID", message: "Unsupported verification room action." } }, { status: 400 });
    return NextResponse.json({ success: true, contractVersion: "expert-verification-room.v1", data, meta: { correlationId: securityContext.correlationId } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_EXPERT_VERIFICATION_ROOM", allowAnonymous: false, maxRequests: 90, maxBodyBytes: 0 }, readRoom);
export const POST = SecurityFabric.wrapHandler({ action: "MUTATE_EXPERT_VERIFICATION_ROOM", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 12 * 1024 * 1024 }, mutateRoom);
