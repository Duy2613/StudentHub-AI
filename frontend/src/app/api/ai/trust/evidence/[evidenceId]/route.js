/**
 * StudentHub AI — API Route: GET /api/ai/trust/evidence/[evidenceId]
 * 
 * Retrieves evidence span passage, source lineage, content hash, and validity window.
 */

import { NextResponse } from "next/server";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore";

export async function GET(req, { params }) {
  try {
    const { evidenceId } = await params;
    if (!evidenceId) {
      return NextResponse.json(
        { success: false, error: "evidenceId is required." },
        { status: 400 }
      );
    }

    const evidence = AiTrustStore.getEvidence(evidenceId);
    if (!evidence) {
      return NextResponse.json(
        { success: false, error: "Evidence span not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      evidence
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving evidence" },
      { status: 500 }
    );
  }
}
