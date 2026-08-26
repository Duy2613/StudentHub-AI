/**
 * StudentHub AI — API Route: POST /api/expert/evaluate
 * 
 * Evaluates an expert claim against the expert's Scope Graph & Institutional Authority.
 */

import { NextResponse } from "next/server";
import { ExpertScopeEngine } from "@/lib/intelligence/expert/expertScopeEngine";
import { ExpertStore } from "@/lib/intelligence/expert/expertStore";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { expertId, claim } = body;

    if (!expertId || !claim) {
      return NextResponse.json(
        { success: false, error: "expertId and claim object are required." },
        { status: 400 }
      );
    }

    const expert = ExpertStore.getExpert(expertId);
    if (!expert) {
      return NextResponse.json(
        { success: false, error: `Expert not found for ID: ${expertId}` },
        { status: 404 }
      );
    }

    const evaluation = ExpertScopeEngine.evaluateClaimScope(expert, claim);

    return NextResponse.json({
      success: true,
      expert: {
        expertId: expert.expertId,
        name: expert.name,
        title: expert.title,
        institution: expert.institution,
        department: expert.department,
        hasRegistrarAuthority: expert.hasRegistrarAuthority
      },
      evaluation
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error in Expert Intelligence Engine" },
      { status: 500 }
    );
  }
}
