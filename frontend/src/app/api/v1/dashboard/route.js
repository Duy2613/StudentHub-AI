import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";
import { PersonalizationEngine } from "@/lib/personalization/PersonalizationEngine.js";

async function readDashboard(request, routeParams, principal, securityContext) {
  const subjectId = String(principal?.subjectId || "").trim();
  if (!subjectId) return Response.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", userMessage: "Cần danh tính người dùng bền vững." } }, { status: 422 });
  const requestedStudentId = new URL(request.url).searchParams.get("studentId");
  if (requestedStudentId && requestedStudentId !== subjectId.replace(/^student:/, "")) ObjectAuthorizer.assertAccess(principal, { studentId: requestedStudentId });
  const data = PersonalizationEngine.compileCommandCenterContext(subjectId, principal);
  return Response.json({ success: true, contractVersion: "dashboard.v1", data, meta: { correlationId: securityContext.correlationId } });
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_CANONICAL_DASHBOARD",
  requiredPermission: "ACADEMIC.PLAN_OWN",
  requiredScopes: ["academic:read"],
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 0,
}, readDashboard);
