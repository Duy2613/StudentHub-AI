/**
 * StudentHub AI — API Route: GET & POST /api/intelligence/experts/[expertId]/claims
 * 
 * Retrieves claims history and evaluates new claims against expert authority & scope.
 */

import { NextResponse } from "next/server";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";
import { ExpertScopeEngine } from "@/lib/intelligence/expert/expertScopeEngine";

export async function GET(req, { params }) {
  try {
    const { expertId } = await params;
    if (!expertId) {
      return NextResponse.json(
        { success: false, error: "Missing expertId parameter" },
        { status: 400 }
      );
    }

    const claims = ExpertStore.getClaimsByExpert(expertId);
    return NextResponse.json({
      success: true,
      total: claims.length,
      claims
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving claims" },
      { status: 500 }
    );
  }
}

export async function POST(req, { params }) {
  try {
    const { expertId } = await params;
    const body = await req.json().catch(() => ({}));

    if (!expertId || !body.text) {
      return NextResponse.json(
        { success: false, error: "expertId and claim text are required." },
        { status: 400 }
      );
    }

    const expert = ExpertStore.getExpert(expertId, { redactPrivate: false });
    if (!expert) {
      return NextResponse.json(
        { success: false, error: "Expert not found" },
        { status: 404 }
      );
    }

    const evaluation = ExpertScopeEngine.evaluateClaimScope(expert, {
      expertId,
      text: body.text,
      domain: body.domain || "AI_ML",
      claimType: body.claimType || "TECHNICAL_CLAIM",
      claimJurisdiction: body.claimJurisdiction || "TECHNICAL_DOMAIN",
      isCommercialEndorsement: Boolean(body.isCommercialEndorsement)
    });

    return NextResponse.json({
      success: true,
      expert: {
        expertId: expert.expertId,
        name: expert.name,
        title: expert.title,
        institution: expert.institution,
        isVerified: expert.isVerified,
        hasRegistrarAuthority: expert.hasRegistrarAuthority
      },
      evaluation
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error evaluating claim" },
      { status: 500 }
    );
  }
}
