import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQuestionBankService } from "@/lib/server/expert/ExpertQuestionBankService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function listSnapshots(request, _routeParams, _principal, securityContext) {
  const { searchParams } = new URL(request.url);
  const sourceId = searchParams.get("sourceId");
  if (!sourceId) {
    return NextResponse.json({
      success: false,
      error: { code: "EXPERT_V5_SOURCE_ID_REQUIRED", message: "Select a registered source to inspect its retrieval snapshots." },
    }, { status: 400, headers: { "Cache-Control": "no-store" } });
  }
  try {
    const data = await ExpertQuestionBankService.listSourceSnapshots({
      sourceId,
      limit: searchParams.get("limit"),
    });
    return NextResponse.json({
      success: true,
      contractVersion: "expert-question-bank.v1",
      data,
      meta: { correlationId: securityContext.correlationId },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (caught) {
    return qualificationErrorResponse(caught, securityContext.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_EXPERT_V5_SOURCE_SNAPSHOTS",
  requiredPermission: "ADMIN.SECURITY",
  allowAnonymous: false,
  maxRequests: 30,
  maxBodyBytes: 0,
}, listSnapshots);
