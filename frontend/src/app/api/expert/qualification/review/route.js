import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQualificationService, authenticatedUserId } from "@/lib/server/expert/ExpertQualificationService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

async function reviewApplication(request, routeParams, principal, securityContext) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return Response.json({ success: false, error: { code: "REVIEW_INPUT_INVALID", userMessage: "Review payload is required." } }, { status: 400 });
    }
    const data = await ExpertQualificationService.adminReview({
      reviewerId: authenticatedUserId(principal),
      applicationId: body.applicationId,
      decision: body.decision,
      approvedDomains: body.approvedDomains,
      reason: body.reason,
    });
    return Response.json({ success: true, contractVersion: "expert-qualification.v1", data, meta: { correlationId: securityContext.correlationId } });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "REVIEW_EXPERT_QUALIFICATION",
  requiredPermission: "ADMIN.SECURITY",
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 32 * 1024,
}, reviewApplication);

