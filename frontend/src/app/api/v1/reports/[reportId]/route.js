import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ReportService, ReportServiceError } from "@/lib/server/reports/ReportService.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function ownerId(principal) {
  const value = String(principal?.subjectId || "").replace(/^(student|expert|user):/i, "").trim();
  return UUID_PATTERN.test(value) ? value : null;
}

function failure(error, correlationId) {
  if (error instanceof ReportServiceError) return Response.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId } }, { status: error.statusCode });
  return Response.json({ success: false, error: { code: "REPORT_OPERATION_FAILED", userMessage: "Report operation could not be completed.", correlationId } }, { status: 500 });
}

async function readReport(request, routeContext, principal, securityContext) {
  const owner = ownerId(principal);
  if (!owner) return Response.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", userMessage: "A durable authenticated identity is required." } }, { status: 422 });
  try {
    const params = await routeContext?.params;
    const reportId = params?.reportId;
    if (!UUID_PATTERN.test(String(reportId || ""))) return Response.json({ success: false, error: { code: "REPORT_UUID_REQUIRED", userMessage: "A valid report identity is required." } }, { status: 400 });
    const report = await ReportService.getReportForOwner({ ownerId: owner, reportId, includeDocument: true });
    if (!report) return Response.json({ success: false, error: { code: "REPORT_NOT_FOUND", userMessage: "Report is not available." } }, { status: 404 });
    return Response.json({ success: true, contractVersion: "report.v1", data: report, meta: { correlationId: securityContext.correlationId } }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return failure(error, securityContext.correlationId); }
}

export const GET = SecurityFabric.wrapHandler({ action: "READ_OWN_TRUST_REPORT", requiredPermission: "TRUST.READ", allowAnonymous: false, maxRequests: 60, maxBodyBytes: 0 }, readReport);
