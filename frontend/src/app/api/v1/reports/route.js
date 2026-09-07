import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ReportService, ReportServiceError } from "@/lib/server/reports/ReportService.js";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_PATTERN = /^[A-Za-z0-9._:-]{1,160}$/;

function ownerId(principal) {
  const value = String(principal?.subjectId || "").replace(/^(student|expert|user):/i, "").trim();
  return UUID_PATTERN.test(value) ? value : null;
}

function errorResponse(error, correlationId) {
  if (error instanceof ReportServiceError) {
    return Response.json({ success: false, error: { code: error.code, userMessage: error.message, correlationId } }, { status: error.statusCode });
  }
  return Response.json({ success: false, error: { code: "REPORT_OPERATION_FAILED", userMessage: "Report operation could not be completed.", correlationId } }, { status: 500 });
}

async function listReports(request, _routeContext, principal, securityContext) {
  const owner = ownerId(principal);
  if (!owner) return Response.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", userMessage: "A durable authenticated identity is required." } }, { status: 422 });
  const { searchParams } = new URL(request.url);
  try {
    const reports = await ReportService.listReportsForOwner({ ownerId: owner, caseId: searchParams.get("caseId") || null });
    return Response.json({ success: true, contractVersion: "report.v1", reports, meta: { correlationId: securityContext.correlationId } }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

async function createReport(request, _routeContext, principal, securityContext) {
  const owner = ownerId(principal);
  if (!owner) return Response.json({ success: false, error: { code: "DURABLE_IDENTITY_REQUIRED", userMessage: "A durable authenticated identity is required." } }, { status: 422 });
  let body;
  try { body = await request.json(); } catch { return Response.json({ success: false, error: { code: "INVALID_JSON", userMessage: "Payload phải là JSON hợp lệ." } }, { status: 400 }); }
  const key = request.headers.get("idempotency-key") || body?.idempotencyKey || null;
  if (key !== null && !IDEMPOTENCY_PATTERN.test(String(key).trim())) return Response.json({ success: false, error: { code: "REPORT_IDEMPOTENCY_KEY_INVALID", userMessage: "Idempotency-Key không hợp lệ." } }, { status: 400 });
  try {
    if (body?.type && body.type !== "TRUST_CASE") throw new ReportServiceError("REPORT_TYPE_UNSUPPORTED", "Only committed Trust case reports are available in this release.", 422);
    const result = await ReportService.createTrustCaseReport({ ownerId: owner, caseId: body?.caseId, requestedRevision: body?.snapshotRevision, idempotencyKey: key || securityContext.correlationId });
    return Response.json({ success: true, contractVersion: "report.v1", data: result, meta: { correlationId: securityContext.correlationId } }, { status: result.idempotent ? 200 : 201, headers: { "cache-control": "no-store" } });
  } catch (error) {
    return errorResponse(error, securityContext.correlationId);
  }
}

const policy = { requiredPermission: "TRUST.READ", allowAnonymous: false, maxRequests: 30, maxBodyBytes: 8 * 1024 };
export const GET = SecurityFabric.wrapHandler({ ...policy, action: "READ_OWN_TRUST_REPORTS", maxBodyBytes: 0 }, listReports);
export const POST = SecurityFabric.wrapHandler({ ...policy, action: "CREATE_OWN_TRUST_REPORT" }, createReport);
