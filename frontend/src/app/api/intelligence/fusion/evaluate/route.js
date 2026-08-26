import { NextResponse } from "next/server";
import { EvidenceFusionAdjudicator } from "@/lib/intelligence/fusion/evidenceFusionAdjudicator.js";
import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const knowledgeObject = EvidenceFusionAdjudicator.adjudicate(body);
    EvidenceFusionStore.saveKnowledgeObject(knowledgeObject);

    return NextResponse.json({
      success: true,
      knowledgeObject
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to evaluate knowledge object" },
      { status: 500 }
    );
  }
}
