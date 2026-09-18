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

async function listPendingBlindReviews(request, routeParams, principal, securityContext) {
  const expertId = resolveExpertId(principal);
  if (!expertId) {
    return NextResponse.json(
      { success: false, error: { code: "UNAUTHORIZED", message: "Yêu cầu đăng nhập tài khoản Chuyên gia." } },
      { status: 401 }
    );
  }

  if (!isExpertRole(principal)) {
    return NextResponse.json(
      { success: false, error: { code: "FORBIDDEN_NOT_EXPERT", message: "Chỉ tài khoản Chuyên gia mới có quyền truy cập Blind Reviews." } },
      { status: 403 }
    );
  }

  try {
    const pendingReviews = await ExpertBlindReviewService.getPendingReviewsForExpert(expertId);

    return NextResponse.json({
      success: true,
      contractVersion: "blind-expert-review.v1",
      expertId,
      pendingCount: pendingReviews.length,
      reviews: pendingReviews,
      meta: {
        correlationId: securityContext.correlationId,
        blindMode: true,
        // Invariant: Zero AI or other expert results
        preSubmissionAiResultLeak: 0,
      },
    });
  } catch (err) {
    console.error("[BlindReviewsAPI] Error:", err.message);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể tải danh sách đánh giá độc lập." } },
      { status: 500 }
    );
  }
}

export const GET = SecurityFabric.wrapHandler(
  {
    action: "LIST_PENDING_BLIND_REVIEWS",
    allowAnonymous: false,
    maxRequests: 60,
    maxBodyBytes: 0,
  },
  listPendingBlindReviews
);
