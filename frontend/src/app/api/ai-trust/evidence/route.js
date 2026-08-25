import { NextResponse } from "next/server";
import { Layer3EvidenceService } from "@/lib/ai-trust/layer3/Layer3EvidenceService";

export const runtime = "nodejs";

/**
 * POST /api/ai-trust/evidence
 * 
 * Layer 3 Authoritative Evidence Retrieval & Source Verification Endpoint
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { claims, candidateSources, layer2Result } = body;

    const result = await Layer3EvidenceService.verify({
      claims,
      candidateSources,
      layer2Result,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[AI-Trust-Layer3 Error]:", error);
    return NextResponse.json(
      {
        layer: 3,
        status: "UNVERIFIED",
        error: error.message || "Internal server error during evidence verification",
        claims: [],
        evidence: [],
        sources: [],
      },
      { status: 500 }
    );
  }
}
