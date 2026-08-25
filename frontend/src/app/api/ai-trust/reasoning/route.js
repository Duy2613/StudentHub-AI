import { NextResponse } from "next/server";
import { Layer4TrustService } from "@/lib/ai-trust/layer4/Layer4TrustService";

export const runtime = "nodejs";

/**
 * POST /api/ai-trust/reasoning
 * 
 * Layer 4 Authoritative Final Trust Reasoning Endpoint
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { layer1Result, layer2Result, layer3Result } = body;

    const result = await Layer4TrustService.evaluate({
      layer1Result,
      layer2Result,
      layer3Result,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    console.error("[AI-Trust-Layer4 Error]:", error);
    return NextResponse.json(
      {
        layer: 4,
        classification: "UNVERIFIED",
        status: "REQUIRE_VERIFICATION",
        error: error.message || "Internal server error during final trust reasoning",
      },
      { status: 500 }
    );
  }
}
