/**
 * StudentHub AI — API Route: POST /api/ai/trust/evaluate
 * 
 * Server-authoritative AI Trust Evaluation endpoint.
 * Evaluates claims, verifies citations, checks temporal validity,
 * guards against prompt injection and returns multi-dimensional trust metrics.
 */

import { NextResponse } from "next/server";
import { AiTrustEngine } from "@/lib/intelligence/trust/aiTrustEngine";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore";

export async function POST(req) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, rawAnswer, sources, evidenceSpans, stakeLevel } = body;

    if (!query && !rawAnswer) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: query or rawAnswer is required." },
        { status: 400 }
      );
    }

    const evaluation = AiTrustEngine.evaluate({
      query: query || "",
      rawAnswer: rawAnswer || "",
      sources: Array.isArray(sources) ? sources : [],
      evidenceSpans: Array.isArray(evidenceSpans) ? evidenceSpans : [],
      stakeLevel
    });

    AiTrustStore.saveEvaluation(evaluation);

    return NextResponse.json({
      success: true,
      evaluation
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal server error in AI Trust Engine" },
      { status: 500 }
    );
  }
}
