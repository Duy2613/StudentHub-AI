import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQualificationService, authenticatedUserId } from "@/lib/server/expert/ExpertQualificationService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

async function submitQuiz(request, routeParams, principal, securityContext) {
  try {
    const body = await request.json().catch(() => null);
    const data = await ExpertQualificationService.submitQuiz({
      userId: authenticatedUserId(principal),
      attemptId: body?.attemptId,
    });
    return Response.json({ success: true, contractVersion: "expert-qualification.v1", data, meta: { correlationId: securityContext.correlationId } });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "SUBMIT_EXPERT_QUALIFICATION_QUIZ",
  requiredPermission: "EXPERT.READ",
  allowAnonymous: false,
  maxRequests: 30,
  maxBodyBytes: 16 * 1024,
}, submitQuiz);

