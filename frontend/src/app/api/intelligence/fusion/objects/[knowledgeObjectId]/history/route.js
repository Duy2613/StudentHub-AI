import { NextResponse } from "next/server";
import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";

export async function GET(request, { params }) {
  try {
    const { knowledgeObjectId } = await params;
    const diff = EvidenceFusionStore.computeKnowledgeDiff(knowledgeObjectId);

    if (!diff) {
      return NextResponse.json({ success: false, error: "History not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      diff
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || "Failed to load history diff" }, { status: 500 });
  }
}
