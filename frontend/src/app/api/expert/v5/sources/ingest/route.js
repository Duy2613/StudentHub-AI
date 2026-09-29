import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQuestionBankService } from "@/lib/server/expert/ExpertQuestionBankService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

async function ingestSource(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => null);
  try {
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return NextResponse.json({ success: false, error: { code: "EXPERT_V5_INGEST_INPUT_INVALID", message: "A registry entry and public URL are required." } }, { status: 400 });
    }
    const data = await ExpertQuestionBankService.ingestFromTrust({
      request,
      principal,
      securityContext,
      registryId: body.registryId,
      url: body.url,
      idempotencyKey: request.headers.get("Idempotency-Key"),
    });
    const status = data.snapshot.retrievalStatus === "SUCCESS" ? 201 : data.snapshot.retrievalStatus === "BLOCKED" ? 200 : 200;
    return NextResponse.json({
      success: true,
      contractVersion: "expert-question-bank.v1",
      data: {
        ...data,
        remoteRetrieval: data.snapshot.retrievalStatus,
        trustAnalysis: data.snapshot.retrievalStatus === "BLOCKED" ? "N/A" : data.snapshot.retrievalStatus === "SUCCESS" ? "PENDING_EDITORIAL_REVIEW" : "N/A",
        questionCreation: "EDITORIAL_REVIEW_REQUIRED",
      },
      meta: { correlationId: securityContext.correlationId },
    }, { status, headers: { "Cache-Control": "no-store" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

export const POST = SecurityFabric.wrapHandler({ action: "INGEST_EXPERT_V5_PUBLIC_SOURCE", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 20, maxBodyBytes: 12 * 1024 }, ingestSource);
