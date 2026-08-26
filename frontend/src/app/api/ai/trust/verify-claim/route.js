/**
 * StudentHub AI — API Route: POST /api/ai/trust/verify-claim
 * 
 * Verifies single atomic claim against candidate evidence spans with overclaim detection.
 */

import { NextResponse } from "next/server";
import { AiTrustEngine } from "@/lib/intelligence/trust/aiTrustEngine";
import { SemanticOverclaimDetector } from "@/lib/intelligence/trust/semanticOverclaimDetector";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { claim, evidenceSpans } = body;

    if (!claim) {
      return NextResponse.json(
        { success: false, error: "claim object is required." },
        { status: 400 }
      );
    }

    const verifiedClaim = AiTrustEngine.verifyClaim(claim, Array.isArray(evidenceSpans) ? evidenceSpans : []);
    const primaryPassage = evidenceSpans?.[0]?.passage || "";
    const overclaim = SemanticOverclaimDetector.detectOverclaim(claim.text || claim.statement || "", primaryPassage);

    return NextResponse.json({
      success: true,
      claim: verifiedClaim,
      overclaim
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error verifying claim" },
      { status: 500 }
    );
  }
}
