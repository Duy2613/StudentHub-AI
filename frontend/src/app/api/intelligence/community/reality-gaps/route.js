import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore.js";

export async function GET() {
  try {
    const realityGaps = CommunityStore.getRealityGaps();
    return NextResponse.json({
      success: true,
      realityGaps,
      totalGaps: realityGaps.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch reality gaps" },
      { status: 500 }
    );
  }
}
