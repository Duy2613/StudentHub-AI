import { NextResponse } from "next/server";
import { CommunityQueryEngine } from "@/lib/intelligence/community/communityQueryEngine.js";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const result = CommunityQueryEngine.query(body);
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to execute community query" },
      { status: 500 }
    );
  }
}
