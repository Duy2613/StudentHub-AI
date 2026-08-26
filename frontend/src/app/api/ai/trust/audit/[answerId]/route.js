/**
 * StudentHub AI — API Route: GET /api/ai/trust/audit/[answerId]
 * 
 * Retrieves immutable audit records, answer dependency graphs and blast radius analysis.
 */

import { NextResponse } from "next/server";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore";

export async function GET(req, { params }) {
  try {
    const { answerId } = await params;
    if (!answerId) {
      return NextResponse.json(
        { success: false, error: "answerId is required." },
        { status: 400 }
      );
    }

    const evaluation = AiTrustStore.getEvaluation(answerId);
    if (!evaluation) {
      return NextResponse.json(
        { success: false, error: "Audit record not found for evaluation." },
        { status: 404 }
      );
    }

    const blastRadius = AiTrustStore.computeBlastRadius(evaluation.evidenceSpans?.[0]?.sourceId || answerId);

    return NextResponse.json({
      success: true,
      auditRecord: evaluation.auditRecord,
      evaluation,
      blastRadius
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || "Internal error retrieving audit record" },
      { status: 500 }
    );
  }
}
