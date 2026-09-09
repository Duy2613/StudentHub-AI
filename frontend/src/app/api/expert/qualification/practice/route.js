import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQualificationService, authenticatedUserId } from "@/lib/server/expert/ExpertQualificationService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

async function submitPractice(request, _routeParams, principal, securityContext) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ success: false, error: { code: "PRACTICE_INPUT_INVALID", userMessage: "Practice response is required." } }, { status: 400 });
    const data = await ExpertQualificationService.submitPractice({
      userId: authenticatedUserId(principal),
      domainCode: body.domainCode,
      response: body.response,
      evidenceRevisionIds: body.evidenceRevisionIds,
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
      correlationId: securityContext.correlationId,
    });
    return Response.json({ success: true, contractVersion: "expert-practice.v1", data, meta: { correlationId: securityContext.correlationId } }, { status: data.idempotent ? 200 : 201 });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "SUBMIT_EXPERT_PRACTICE",
  requiredPermission: "EXPERT.READ",
  allowAnonymous: false,
  maxRequests: 12,
  maxBodyBytes: 128 * 1024,
}, submitPractice);
