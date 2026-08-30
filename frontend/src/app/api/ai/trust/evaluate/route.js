/**
 * StudentHub AI — API Route: POST /api/ai/trust/evaluate
 * 
 * Server-authoritative AI Trust Evaluation endpoint.
 * Evaluates claims, verifies citations, checks temporal validity,
 * guards against prompt injection and returns multi-dimensional trust metrics.
 */

import { AiTrustEngine } from "@/lib/intelligence/trust/aiTrustEngine";
import { AiTrustStore } from "@/lib/intelligence/trust/aiTrustStore";
import { SecurityFabric } from "@/lib/security/SecurityFabric";
import { NextResponse } from "next/server";

async function evaluateTrust(req, _routeParams, principal, secContext) {
  try {
    const body = await req.json().catch(() => ({}));
    const { query, rawAnswer, sources, evidenceSpans, stakeLevel } = body;

    if ((typeof query !== "string" && typeof rawAnswer !== "string") ||
        (!String(query || "").trim() && !String(rawAnswer || "").trim()) ||
        String(query || "").length > 12_000 || String(rawAnswer || "").length > 24_000) {
      return NextResponse.json({ success: false, error: {
        code: "TRUST_EVALUATION_INPUT_INVALID",
        userMessage: "Nội dung cần thẩm định không hợp lệ hoặc vượt giới hạn.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 400 });
    }
    if ((sources !== undefined && (!Array.isArray(sources) || sources.length > 40)) ||
        (evidenceSpans !== undefined && (!Array.isArray(evidenceSpans) || evidenceSpans.length > 80))) {
      return NextResponse.json({ success: false, error: {
        code: "TRUST_EVALUATION_INPUT_TOO_LARGE",
        userMessage: "Số lượng nguồn hoặc đoạn chứng cứ vượt giới hạn an toàn.",
        requestId: secContext.correlationId,
        retryable: false
      } }, { status: 413 });
    }

    const evaluation = AiTrustEngine.evaluate({
      query: query || "",
      rawAnswer: rawAnswer || "",
      sources: Array.isArray(sources) ? sources : [],
      evidenceSpans: Array.isArray(evidenceSpans) ? evidenceSpans : [],
      stakeLevel,
      // Ownership is derived exclusively from the verified SecurityPrincipal;
      // client-supplied student/user identifiers are deliberately ignored.
      ownerId: principal.subjectId
    });

    AiTrustStore.saveEvaluation(evaluation);

    return NextResponse.json({
      success: true,
      evaluation
    });
  } catch (error) {
    // SecurityFabric owns the public error envelope.  Throwing here prevents
    // provider/parser details from being reflected to the caller.
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "CREATE_TRUST_EVALUATION",
  requiredPermission: "TRUST.ANALYZE",
  maxRequests: 30,
  maxBodyBytes: 256 * 1024,
}, evaluateTrust);
