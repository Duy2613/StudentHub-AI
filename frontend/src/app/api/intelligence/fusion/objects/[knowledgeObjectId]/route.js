import { NextResponse } from "next/server";
import { EvidenceFusionStore } from "@/lib/intelligence/fusion/evidenceFusionStore.js";

export async function GET(request, { params }) {
  try {
    const { knowledgeObjectId } = await params;
    const knowledgeObject = EvidenceFusionStore.getById(knowledgeObjectId, { redactPrivate: true });

    if (!knowledgeObject) {
      return NextResponse.json(
        { success: false, error: "Knowledge Object not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      knowledgeObject
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Failed to retrieve knowledge object" },
      { status: 500 }
    );
  }
}
