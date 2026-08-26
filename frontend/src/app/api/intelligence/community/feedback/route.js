import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore.js";

export async function POST(request) {
  try {
    const body = await request.json();
    if (!body || !body.topic) {
      return NextResponse.json(
        { success: false, error: "Topic is required for community feedback" },
        { status: 400 }
      );
    }

    const record = CommunityStore.registerFeedback(body);
    return NextResponse.json({
      success: true,
      feedback: record,
      message: "Ghi nhận phản hồi thực tế thành công."
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to record community feedback" },
      { status: 500 }
    );
  }
}
