import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQuestionGenerationService } from "@/lib/server/expert/ExpertQuestionGenerationService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readMetrics(_request, _routeParams, _principal, securityContext) {
  try {
    const data = await ExpertQuestionGenerationService.listMetrics();
    return NextResponse.json({
      success: true,
      contractVersion: "expert-question-bank.v2",
      data,
      meta: { correlationId: securityContext.correlationId },
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (caught) {
    return qualificationErrorResponse(caught, securityContext.correlationId);
  }
}

export const GET = SecurityFabric.wrapHandler({
  action: "REVIEW_EXPERT_V5_QUESTION_METRICS",
  requiredPermission: "ADMIN.SECURITY",
  allowAnonymous: false,
  maxRequests: 30,
  maxBodyBytes: 0,
}, readMetrics);
