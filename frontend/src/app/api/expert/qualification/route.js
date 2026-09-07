import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertQualificationService, authenticatedUserId } from "@/lib/server/expert/ExpertQualificationService.js";
import { qualificationErrorResponse } from "@/lib/server/expert/qualificationHttp.js";

async function readQualification(request, routeParams, principal, securityContext) {
  try {
    return Response.json({
      success: true,
      contractVersion: "expert-qualification.v1",
      data: await ExpertQualificationService.getStatus(authenticatedUserId(principal)),
      meta: { correlationId: securityContext.correlationId },
    });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

async function submitApplication(request, routeParams, principal, securityContext) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body !== "object" || Array.isArray(body) || body.action !== "APPLY") {
      return Response.json({ success: false, error: { code: "QUALIFICATION_INPUT_INVALID", userMessage: "Application action is required." } }, { status: 400 });
    }
    const data = await ExpertQualificationService.apply({
      userId: authenticatedUserId(principal),
      profile: body.profile,
      requestedDomains: body.requestedDomains,
    });
    return Response.json({ success: true, contractVersion: "expert-qualification.v1", data, meta: { correlationId: securityContext.correlationId } }, { status: 201 });
  } catch (error) {
    return qualificationErrorResponse(error, securityContext.correlationId);
  }
}

const authenticatedExpertWorkflow = {
  requiredPermission: "EXPERT.READ",
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 64 * 1024,
};

export const GET = SecurityFabric.wrapHandler({ ...authenticatedExpertWorkflow, action: "READ_EXPERT_QUALIFICATION", maxBodyBytes: 0 }, readQualification);
export const POST = SecurityFabric.wrapHandler({ ...authenticatedExpertWorkflow, action: "SUBMIT_EXPERT_APPLICATION" }, submitApplication);

