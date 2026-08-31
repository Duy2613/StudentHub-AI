import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric";
import {
  PROFESSOR_REVIEWS,
  moderateReviewComment,
} from "@/lib/prof/profReviewRegistry";
import { createSecureId } from "@/lib/security/secureId.js";

/**
 * GET /api/prof-rating/reviews?professorId=
 */
const toPublicReview = (review) => {
  const safeReview = { ...review };
  delete safeReview.authorId;
  return {
  ...safeReview,
  sourceState: review.sourceState || "CURATED_OR_USER_SUBMITTED",
  isAuthoritative: false
  };
};

export const GET = SecurityFabric.wrapHandler({
  action: "READ_PROFESSOR_REVIEWS",
  allowAnonymous: true,
  maxRequests: 90
}, async (request) => {
  const { searchParams } = new URL(request.url);
  const professorId = (searchParams.get("professorId") || "").slice(0, 80);
  const list = PROFESSOR_REVIEWS
    .filter((review) => !professorId || review.professorId === professorId)
    .map(toPublicReview);

  return Response.json({
    success: true,
    count: list.length,
    reviews: list,
    sourceState: "CURATED_REGISTRY",
    isAuthoritative: false,
    dataNotice: "Nhận xét tham khảo cộng đồng; không phải đánh giá chính thức của trường."
  }, { headers: { "Cache-Control": "no-store" } });
});

/**
 * POST /api/prof-rating/reviews
 * Gửi đánh giá ẩn danh mới
 * Body: { professorId, rating, clarityScore, attendanceScore, difficultyScore, recommend, comment, studentRole }
 */
async function createProfessorReview(request, _routeContext, principal, secContext) {
  try {
    const body = await request.json();
    const {
      professorId,
      rating,
      clarityScore,
      attendanceScore,
      difficultyScore,
      recommend,
      comment,
    } = body || {};

    const numericRating = Number(rating);
    const numericClarity = Number(clarityScore ?? 5);
    const numericAttendance = Number(attendanceScore ?? 4);
    const numericDifficulty = Number(difficultyScore ?? 3);
    if (typeof professorId !== "string" || !professorId.trim() ||
        typeof comment !== "string" || !comment.trim() || comment.trim().length > 2000 ||
        !Number.isFinite(numericRating) || numericRating < 1 || numericRating > 5 ||
        [numericClarity, numericAttendance, numericDifficulty].some(value => !Number.isFinite(value) || value < 1 || value > 5)) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_PROFESSOR_REVIEW", userMessage: "Vui lòng nhập điểm (1–5) và nhận xét hợp lệ." } },
        { status: 400 }
      );
    }

    // Moderate comment
    const moderation = moderateReviewComment(comment);
    if (!moderation.isValid) {
      return NextResponse.json(
        { success: false, error: {
          code: "PROFESSOR_REVIEW_REJECTED",
          userMessage: "Nhận xét chưa đáp ứng quy tắc cộng đồng.",
          requestId: secContext.correlationId,
          retryable: false
        } },
        { status: 422 }
      );
    }

    const newReview = {
      id: createSecureId("rev"),
      professorId,
      authorId: principal.subjectId,
      studentRole: principal.principalType,
      rating: numericRating,
      clarityScore: numericClarity,
      attendanceScore: numericAttendance,
      difficultyScore: numericDifficulty,
      recommend: Boolean(recommend),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      sourceState: "USER_SUBMITTED_PENDING_REVIEW",
      isAuthoritative: false,
    };

    PROFESSOR_REVIEWS.unshift(newReview);

    return NextResponse.json(
      {
        success: true,
        message: "Đã gửi nhận xét học thuật ẩn danh thành công!",
        // Keep the authenticated submitter's own server identity available
        // for local reconciliation; GET remains a redacted public view.
        review: {
          ...toPublicReview(newReview),
          authorId: principal.subjectId
        },
      },
      { status: 201 }
    );
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "CREATE_PROFESSOR_REVIEW",
  requiredPermission: "COMMUNITY.POST",
  maxRequests: 10,
  maxBodyBytes: 64 * 1024,
}, createProfessorReview);
