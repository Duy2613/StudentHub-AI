import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertVerificationRoomService } from "@/lib/server/expert/ExpertVerificationRoomService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function listRooms(_request, _routeParams, principal, securityContext) {
  try {
    return NextResponse.json({ success: true, contractVersion: "expert-verification-room.v1", data: await ExpertVerificationRoomService.listRooms({ principal }), meta: { correlationId: securityContext.correlationId } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

async function createRoom(request, _routeParams, principal, securityContext) {
  let body;
  try { body = await request.json(); }
  catch { return NextResponse.json({ success: false, error: { code: "JSON_REQUIRED", message: "A JSON room challenge is required." } }, { status: 400 }); }
  try {
    const data = await ExpertVerificationRoomService.createRoom({
      principal,
      domainCode: body?.domainCode,
      inputType: body?.inputType,
      content: body?.content,
      metadata: body?.metadata,
      idempotencyKey: request.headers.get("Idempotency-Key"),
    });
    return NextResponse.json({ success: true, contractVersion: "expert-verification-room.v1", data, meta: { correlationId: securityContext.correlationId } }, { status: 201, headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_EXPERT_VERIFICATION_ROOMS", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 0 }, listRooms);
export const POST = SecurityFabric.wrapHandler({ action: "CREATE_EXPERT_VERIFICATION_ROOM", allowAnonymous: false, maxRequests: 8, maxBodyBytes: 12 * 1024 * 1024 }, createRoom);
