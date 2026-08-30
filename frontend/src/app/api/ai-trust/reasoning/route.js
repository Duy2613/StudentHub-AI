import { NextResponse } from "next/server";
import { Layer4TrustService } from "@/lib/ai-trust/layer4/Layer4TrustService";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

export const runtime = "nodejs";

/**
 * POST /api/ai-trust/reasoning
 * 
 * Layer 4 Authoritative Final Trust Reasoning Endpoint
 */
async function reasonAboutEvidence(request) {
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
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "REASON_ABOUT_TRUST_EVIDENCE",
  allowAnonymous: true,
  maxRequests: 20,
  maxBodyBytes: 256 * 1024,
}, reasonAboutEvidence);
