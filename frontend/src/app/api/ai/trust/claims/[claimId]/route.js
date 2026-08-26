/**
 * StudentHub AI — API Route: GET /api/ai/trust/claims/[claimId]
 * 
 * Retrieves atomic claim details, cited evidence and derivation traces.
 */

import { NextResponse } from "next/server";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore";

export async function GET(req, { params }) {
  try {
    const { claimId } = await params;
    if (!claimId) {
      return NextResponse.json(
        { success: false, error: "claimId is required." },
        { status: 400 }
      );
    }

    const claim = AiTrustStore.getClaim(claimId);
    if (!claim) {
      return NextResponse.json(
        { success: false, error: "Claim not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      claim
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving claim" },
      { status: 500 }
    );
  }
}
