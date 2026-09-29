import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQuestionBankService } from "@/lib/server/expert/ExpertQuestionBankService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function listQuestions(request, _routeParams, _principal, securityContext) {
  const { searchParams } = new URL(request.url);
  try {
    const data = await ExpertQuestionBankService.listQuestions({ status: searchParams.get("status"), limit: searchParams.get("limit") });
    return NextResponse.json({ success: true, contractVersion: "expert-question-bank.v1", data, meta: { correlationId: securityContext.correlationId } }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

async function manageQuestion(request, _routeParams, principal, securityContext) {
  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return NextResponse.json({ success: false, error: { code: "EXPERT_V5_QUESTION_INPUT_INVALID", message: "A question action is required." } }, { status: 400 });
  }
  try {
    const action = String(body.action || "").toUpperCase();
    let data;
    if (action === "CREATE_DRAFT") data = await ExpertQuestionBankService.createQuestionDraft({ principal, question: body.question });
    else if (action === "ACTIVATE") data = await ExpertQuestionBankService.activateQuestion({
      principal,
      questionId: body.questionId,
      questionVersion: body.questionVersion,
      reviewChecks: body.reviewChecks,
    });
    else return NextResponse.json({ success: false, error: { code: "EXPERT_V5_QUESTION_ACTION_INVALID", message: "Supported actions are CREATE_DRAFT and ACTIVATE." } }, { status: 400 });
    return NextResponse.json({ success: true, contractVersion: "expert-question-bank.v1", data, meta: { correlationId: securityContext.correlationId } }, { status: action === "CREATE_DRAFT" ? 201 : data.activated ? 200 : 422, headers: { "Cache-Control": "no-store" } });
  } catch (caught) { return qualificationErrorResponse(caught, securityContext.correlationId); }
}

export const POST = SecurityFabric.wrapHandler({ action: "AUTHOR_EXPERT_V5_QUESTION", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 32 * 1024 }, manageQuestion);
export const GET = SecurityFabric.wrapHandler({ action: "REVIEW_EXPERT_V5_QUESTIONS", requiredPermission: "ADMIN.SECURITY", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 0 }, listQuestions);
