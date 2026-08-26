import { NextResponse } from "next/server";
import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";

export async function GET(request, { params }) {
  try {
    const { knowledgeObjectId } = await params;
    const kno = EvidenceFusionStore.getById(knowledgeObjectId, { redactPrivate: true });

    if (!kno) {
      return NextResponse.json({ success: false, error: "Knowledge Object not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      knowledgeObjectId,
      unknowns: kno.unknowns || [],
      limitations: kno.limitations || []
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message || "Failed to load unknowns" }, { status: 500 });
  }
}
