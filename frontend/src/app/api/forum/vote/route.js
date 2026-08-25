import { NextResponse } from "next/server";

// In-memory vote ledger to prevent multiple votes per user per post (Phần E.3)
const VOTES_LEDGER = new Map(); // key: `${postId}_${userId}` -> 'trust' | 'distrust'

/**
 * POST /api/forum/vote
 * Gửi phiếu vote uy tín / không uy tín cho bài viết
 * Body: { postId: string, userId: string, type: "trust" | "distrust" }
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { postId, userId, type } = body || {};

    if (!postId || !userId || !type || (type !== "trust" && type !== "distrust")) {
      return NextResponse.json(
        {
          success: false,
          error: "Dữ liệu vote không hợp lệ. Phải bao gồm postId, userId và type ('trust' | 'distrust').",
        },
        { status: 400 }
      );
    }

    const voteKey = `${postId}_${userId}`;
    const previousVote = VOTES_LEDGER.get(voteKey);

    let scoreDelta = 0;
    if (previousVote === type) {
      // Retract vote
      VOTES_LEDGER.delete(voteKey);
      scoreDelta = type === "trust" ? -1 : 1;
      return NextResponse.json({
        success: true,
        action: "RETRACTED",
        message: "Đã hủy phiếu bình chọn.",
        vote: null,
      });
    }

    // Set new or updated vote
    VOTES_LEDGER.set(voteKey, type);
    scoreDelta = type === "trust" ? (previousVote === "distrust" ? 2 : 1) : (previousVote === "trust" ? -2 : -1);

    return NextResponse.json({
      success: true,
      action: previousVote ? "UPDATED" : "CAST",
      message: type === "trust" ? "Đã bình chọn UY TÍN cho bài viết (+điểm tín nhiệm tác giả)." : "Đã bình chọn KHÔNG UY TÍN cho bài viết.",
      vote: {
        postId,
        userId,
        type,
        timestamp: new Date().toISOString(),
      },
      scoreDelta,
    });
  } catch (error) {
    console.error("[Forum Vote API Error]:", error);
    return NextResponse.json(
      { success: false, error: "Lỗi hệ thống khi ghi nhận bình chọn." },
      { status: 500 }
    );
  }
}
