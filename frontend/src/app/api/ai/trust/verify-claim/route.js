/**
 * StudentHub AI — API Route: POST /api/ai/trust/verify-claim
 * 
 * Verifies single atomic claim against candidate evidence spans with overclaim detection.
 */

import { NextResponse } from "next/server";
import { AiTrustEngine } from "@/lib/intelligence/trust/aiTrustEngine";
import { SemanticOverclaimDetector } from "@/lib/intelligence/trust/semanticOverclaimDetector";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

async function verifyClaim(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { claim, evidenceSpans } = body;

    if (!claim || typeof claim !== "object" || Array.isArray(claim) ||
        (evidenceSpans !== undefined && (!Array.isArray(evidenceSpans) || evidenceSpans.length > 40))) {
      return NextResponse.json(
        { success: false, error: { code: "CLAIM_INPUT_INVALID", userMessage: "Claim hoặc evidence không hợp lệ hoặc vượt giới hạn." } },
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
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "VERIFY_TRUST_CLAIM",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 128 * 1024,
}, verifyClaim);
