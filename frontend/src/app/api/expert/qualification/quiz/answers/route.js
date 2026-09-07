import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQualificationService, authenticatedUserId } from "@/lib/server/expert/ExpertQualificationService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

async function saveAnswer(request, routeParams, principal, securityContext) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ success: false, error: { code: "QUALIFICATION_INPUT_INVALID", userMessage: "Answer payload is required." } }, { status: 400 });
    }
    const data = await ExpertQualificationService.saveAnswer({
      userId: authenticatedUserId(principal),
      attemptId: body.attemptId,
      questionId: body.questionId,
      answer: body.answer,
    });
    return Response.json({ success: true, contractVersion: "expert-qualification.v1", data, meta: { correlationId: securityContext.correlationId } });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

export const PUT = SecurityFabric.wrapHandler({
  action: "SAVE_EXPERT_QUALIFICATION_ANSWER",
  requiredPermission: "EXPERT.READ",
  allowAnonymous: false,
  maxRequests: 180,
  maxBodyBytes: 16 * 1024,
}, saveAnswer);

