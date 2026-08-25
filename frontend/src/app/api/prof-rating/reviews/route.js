import { NextResponse } from "next/server";
import {
  PROFESSOR_REVIEWS,
  moderateReviewComment,
} from "@/lib/prof/profReviewRegistry";

/**
 * GET /api/prof-rating/reviews?professorId=
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const professorId = searchParams.get("professorId");

    let list = PROFESSOR_REVIEWS;
    if (professorId) {
      list = list.filter((r) => r.professorId === professorId);
    }

    return NextResponse.json({
      success: true,
      count: list.length,
      reviews: list,
    });
  } catch (error) {
    console.error("[Reviews GET Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi tải đánh giá." },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prof-rating/reviews
 * Gửi đánh giá ẩn danh mới
 * Body: { professorId, rating, clarityScore, attendanceScore, difficultyScore, recommend, comment, studentRole }
 */
export async function POST(request) {
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
      studentRole,
    } = body || {};

    if (!professorId || !comment || !rating) {
      return NextResponse.json(
        { success: false, error: "Vui lòng nhập đầy đủ điểm đánh giá và nhận xét." },
        { status: 400 }
      );
    }

    // Moderate comment
    const moderation = moderateReviewComment(comment);
    if (!moderation.isValid) {
      return NextResponse.json(
        { success: false, error: moderation.reason },
        { status: 422 }
      );
    }

    const newReview = {
      id: `rev-${Date.now()}`,
      professorId,
      studentRole: studentRole || "Sinh viên Ẩn danh",
      rating: Number(rating),
      clarityScore: Number(clarityScore || 5),
      attendanceScore: Number(attendanceScore || 4),
      difficultyScore: Number(difficultyScore || 3),
      recommend: Boolean(recommend),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
    };

    PROFESSOR_REVIEWS.unshift(newReview);

    return NextResponse.json(
      {
        success: true,
        message: "Đã gửi nhận xét học thuật ẩn danh thành công!",
        review: newReview,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("[Reviews POST Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi gửi nhận xét." },
      { status: 500 }
    );
  }
}
