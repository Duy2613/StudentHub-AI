/**
 * StudentHub AI — API Route: GET /api/ai/trust/evaluations/[evaluationId]
 * 
 * Retrieves detailed audit trail and claim graph for a specific trust evaluation.
 */

import { NextResponse } from "next/server";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore";

export async function GET(req, { params }) {
  try {
    const { evaluationId } = await params;
    if (!evaluationId) {
      return NextResponse.json(
        { success: false, error: "Missing evaluationId parameter" },
        { status: 400 }
      );
    }

    const evaluation = AiTrustStore.getEvaluation(evaluationId);
    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Evaluation record not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      evaluation
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving trust evaluation" },
      { status: 500 }
    );
  }
}
