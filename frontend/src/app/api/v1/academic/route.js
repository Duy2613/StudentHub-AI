import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ObjectAuthorizer } from "@/lib/security/authorization/ObjectAuthorizer.js";
import { getAuthoritativeCommandCenterData } from "@/lib/intelligence/academic/academicCommandCenterDataLoader.js";

async function readAcademic(request, routeParams, principal, securityContext) {
  const subjectId = String(principal?.subjectId || "").replace(/^student:/, "").trim();
  if (!subjectId) return Response.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", userMessage: "Cần danh tính sinh viên hợp lệ." } }, { status: 422 });
  const requestedStudentId = new URL(request.url).searchParams.get("studentId");
  if (requestedStudentId && requestedStudentId !== subjectId) ObjectAuthorizer.assertAccess(principal, { studentId: requestedStudentId, ownerId: requestedStudentId });
  const data = getAuthoritativeCommandCenterData({ studentId: subjectId, cohort: principal.attributes?.cohort, programCode: principal.attributes?.programCode });
  return Response.json({ success: true, contractVersion: "academic.v1", data, meta: { correlationId: securityContext.correlationId } });
}

export const GET = SecurityFabric.wrapHandler({
  action: "READ_CANONICAL_ACADEMIC",
  requiredPermission: "ACADEMIC.READ_OWN",
  requiredScopes: ["academic:read"],
  allowAnonymous: false,
  maxRequests: 60,
  maxBodyBytes: 0,
}, readAcademic);
