import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQualificationService, authenticatedUserId } from "@/lib/server/expert/ExpertQualificationService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

async function reviewPractice(request, _routeParams, principal, securityContext) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ success: false, error: { code: "PRACTICE_DECISION_INVALID", userMessage: "Practice review decision is required." } }, { status: 400 });
    const data = await ExpertQualificationService.reviewPractice({
      reviewerId: authenticatedUserId(principal),
      practiceId: body.practiceId,
      decision: body.decision,
      reason: body.reason,
      rubricVersion: body.rubricVersion,
      idempotencyKey: request.headers.get("idempotency-key") || body.idempotencyKey,
      correlationId: securityContext.correlationId,
    });
    return Response.json({ success: true, contractVersion: "expert-practice.v1", data, meta: { correlationId: securityContext.correlationId } }, { status: data.idempotent ? 200 : 201 });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "REVIEW_EXPERT_PRACTICE",
  requiredPermission: "ADMIN.SECURITY",
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 32 * 1024,
}, reviewPractice);
