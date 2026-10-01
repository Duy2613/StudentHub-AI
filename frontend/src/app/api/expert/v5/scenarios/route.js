import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertScenarioService } from "@/lib/server/expert/ExpertScenarioService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;
const MAX_SCENARIO_BODY_BYTES = 12 * 1024 * 1024;

async function listScenarios(request, _routeParams, _principal, securityContext) {
  const { searchParams } = new URL(request.url);
  try {
    const data = await ExpertScenarioService.listScenarios({
      limit: searchParams.get("limit"),
      modality: searchParams.get("modality"),
      status: searchParams.get("status"),
    });
    return NextResponse.json({ success: true, contractVersion: "expert-question-bank.v2", data, meta: { correlationId: securityContext.correlationId } }, {
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

async function ingestScenario(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => null);
  try {
    const data = await ExpertScenarioService.ingestScenario({
      request,
      principal,
      securityContext,
      body,
      idempotencyKey: request.headers.get("Idempotency-Key"),
    });
    return NextResponse.json({ success: true, contractVersion: "expert-question-bank.v2", data, meta: { correlationId: securityContext.correlationId } }, {
      status: data.idempotent ? 200 : 201,
      headers: { "Cache-Control": "no-store, max-age=0" },
    });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

export const GET = SecurityFabric.wrapHandler({ action: "REVIEW_EXPERT_V5_SCENARIOS", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 0 }, listScenarios);
export const POST = SecurityFabric.wrapHandler({ action: "INGEST_EXPERT_V5_SCENARIO", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 20, maxBodyBytes: MAX_SCENARIO_BODY_BYTES }, ingestScenario);
