import { NextResponse } from "next/server";
import { CommunityStore } from "@/lib/intelligence/community/communityStore.js";
import { CommunityFrictionEngine } from "@/lib/intelligence/community/communityFrictionEngine.js";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "list"; // "list" | "heatmap"

    const signals = CommunityStore.getFrictionSignals();

    if (format === "heatmap") {
      const heatmap = CommunityFrictionEngine.buildFrictionHeatmap(signals);
      return NextResponse.json({
        success: true,
        heatmap,
        totalSignals: signals.length
      });
    }

    return NextResponse.json({
      success: true,
      signals,
      totalSignals: signals.length
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch friction signals" },
      { status: 500 }
    );
  }
}
