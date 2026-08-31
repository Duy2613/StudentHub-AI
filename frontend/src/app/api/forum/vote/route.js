import { NextResponse } from "next/server";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

// In-memory vote ledger to prevent multiple votes per user per post (Phần E.3)
const VOTES_LEDGER = new Map(); // key: `${postId}_${userId}` -> 'trust' | 'distrust'
const MAX_VOTE_KEYS = 50_000;

/**
 * POST /api/forum/vote
 * Gửi phiếu vote uy tín / không uy tín cho bài viết
 * Body: { postId: string, userId: string, type: "trust" | "distrust" }
 */
async function castForumVote(request, routeParams, principal) {
  try {
    const body = await request.json();
    const { postId, type } = body || {};
    const userId = principal.subjectId;

    if (typeof postId !== "string" || postId.length > 160 || !postId || !userId || !type || (type !== "trust" && type !== "distrust")) {
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
    if (!VOTES_LEDGER.has(voteKey) && VOTES_LEDGER.size >= MAX_VOTE_KEYS) {
      const oldestKey = VOTES_LEDGER.keys().next().value;
      if (oldestKey) VOTES_LEDGER.delete(oldestKey);
    }
    VOTES_LEDGER.set(voteKey, type);
    scoreDelta = type === "trust" ? (previousVote === "distrust" ? 2 : 1) : (previousVote === "trust" ? -2 : -1);

    return NextResponse.json({
      success: true,
      action: previousVote ? "UPDATED" : "CAST",
      message: type === "trust" ? "Đã bình chọn UY TÍN cho bài viết (+điểm tín nhiệm tác giả)." : "Đã bình chọn KHÔNG UY TÍN cho bài viết.",
      vote: {
        postId,
        type,
        timestamp: new Date().toISOString(),
      },
      scoreDelta,
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler(
  {
    action: "VOTE_ON_COMMUNITY_POST",
    requiredPermission: "COMMUNITY.POST",
    allowAnonymous: false,
    maxRequests: 30,
    maxBodyBytes: 16 * 1024
  },
  castForumVote
);
