import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";
import { ExpertBlindReviewService } from "@/lib/server/expert/ExpertBlindReviewService.js";

export const dynamic = "force-dynamic";

function resolveExpertId(principal) {
  if (!principal?.isAuthenticated) return null;
  const raw = principal?.subjectId || principal?.userId || principal?.id || "";
  const cleaned = String(raw).replace(/^(student|expert|user):/, "").trim();
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(cleaned)
    ? cleaned
    : null;
}

function isExpertRole(principal) {
  const roles = Array.isArray(principal?.roles) ? principal.roles : [principal?.role];
  const entitlements = Array.isArray(principal?.entitlements) ? principal.entitlements : [];
  const subjectId = String(principal?.subjectId || "");
  return (
    subjectId.startsWith("expert:") ||
    roles.map((r) => String(r).toUpperCase()).includes("EXPERT") ||
    entitlements.map((e) => String(e).toUpperCase()).includes("EXPERT")
  );
}

async function getBlindReviewDossier(request, routeParams, principal, securityContext) {
  const expertId = resolveExpertId(principal);
  if (!expertId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập tài khoản Chuyên gia." } },
      { status: 401 }
    );
  }

  if (!isExpertRole(principal)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN_NOT_EXPERT", message: "Chỉ Chuyên gia mới có quyền truy cập hồ sơ đánh giá." } },
      { status: 403 }
    );
  }

  const params = routeParams?.params ? await routeParams.params : routeParams;
  const assignmentId = params?.assignmentId;
  if (!assignmentId) {
    return NextResponse.json(
      { success: false, error: { code: "ASSIGNMENT_ID_REQUIRED", message: "assignmentId là bắt buộc." } },
      { status: 400 }
    );
  }

  try {
    const dossier = await ExpertBlindReviewService.getBlindDossier({ assignmentId, expertId });
    return NextResponse.json({
      success: true,
      contractVersion: "blind-expert-review.v1",
      dossier,
      meta: {
        correlationId: securityContext.correlationId,
      },
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { success: false, error: { code: err.code || "INTERNAL_ERROR", message: err.message } },
      { status }
    );
  }
}

async function handleBlindReviewAction(request, routeParams, principal, securityContext) {
  const expertId = resolveExpertId(principal);
  if (!expertId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập tài khoản Chuyên gia." } },
      { status: 401 }
    );
  }

  if (!isExpertRole(principal)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN_NOT_EXPERT", message: "Chỉ Chuyên gia mới có quyền thực hiện hành động này." } },
      { status: 403 }
    );
  }

  const params = routeParams?.params ? await routeParams.params : routeParams;
  const assignmentId = params?.assignmentId;
  if (!assignmentId) {
    return NextResponse.json(
      { success: false, error: { code: "ASSIGNMENT_ID_REQUIRED", message: "assignmentId là bắt buộc." } },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_JSON", message: "Payload phải là JSON hợp lệ." } },
      { status: 400 }
    );
  }

  const action = String(body?.action || "submit").toLowerCase();

  try {
    if (action === "draft") {
      const result = await ExpertBlindReviewService.saveDraft({
        assignmentId,
        expertId,
        draft: {
          vote: body?.vote,
          confidence: body?.confidence,
          reasoning: body?.reasoning,
          evidence: body?.evidence,
        },
      });
      return NextResponse.json({ success: true, action: "DRAFT_SAVED", ...result });
    }

    // Default action: submit
    const result = await ExpertBlindReviewService.submitBlindAssessment({
      assignmentId,
      expertId,
      vote: body?.vote,
      confidence: body?.confidence,
      reasoning: body?.reasoning,
      evidence: body?.evidence || [],
      idempotencyKey: body?.idempotencyKey || null,
    });

    return NextResponse.json({
      success: true,
      action: "ASSESSMENT_SUBMITTED",
      ...result,
      meta: {
        correlationId: securityContext.correlationId,
      },
    });
  } catch (err) {
    const status = err.statusCode || 500;
    return NextResponse.json(
      { success: false, error: { code: err.code || "SUBMISSION_FAILED", message: err.message } },
      { status }
    );
  }
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "GET_BLIND_REVIEW_DOSSIER",
    allowAnonymous: false,
    maxRequests: 60,
    maxBodyBytes: 0,
  },
  getBlindReviewDossier
);

export const POST = SecurityFabric.wrapHandler(
  {
    action: "SUBMIT_BLIND_REVIEW",
    allowAnonymous: false,
    maxRequests: 30,
    maxBodyBytes: 64 * 1024,
  },
  handleBlindReviewAction
);
