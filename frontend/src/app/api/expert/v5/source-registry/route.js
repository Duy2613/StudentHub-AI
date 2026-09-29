import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQuestionBankService } from "@/lib/server/expert/ExpertQuestionBankService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function listSources(_request, _routeParams, _principal, securityContext) {
  try {
    return NextResponse.json({ success: true, contractVersion: "expert-question-bank.v1", data: await ExpertQuestionBankService.listSources(), meta: { correlationId: securityContext.correlationId } }, { headers: { "Cache-Control": "no-store" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

async function registerSource(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => null);
  try {
    const data = await ExpertQuestionBankService.registerSource({ principal, source: body?.source });
    return NextResponse.json({ success: true, contractVersion: "expert-question-bank.v1", data, meta: { correlationId: securityContext.correlationId } }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_EXPERT_V5_SOURCE_REGISTRY", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 0 }, listSources);
export const POST = SecurityFabric.wrapHandler({ action: "REGISTER_EXPERT_V5_SOURCE", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 20, maxBodyBytes: 8 * 1024 }, registerSource);
