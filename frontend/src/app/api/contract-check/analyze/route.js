import { NextResponse } from "next/server";
import { analyzeContractIntelligence } from "@/lib/intelligence/contract/contractIntelligenceEngine";
import { computeDocumentVersionDiff, extractDocumentIntelligence } from "@/lib/intelligence/document/documentVersionDiffEngine";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * POST /api/contract-check/analyze
 * Body: { mode: "CONTRACT_CHECK" | "VERSION_DIFF", type: "HOUSING" | "EMPLOYMENT", text: string, textV1?: string, textV2?: string }
 */
async function analyzeContract(request) {
  try {
    const body = await request.json();
    const { mode = "CONTRACT_CHECK", type = "HOUSING", text = "", textV1 = "", textV2 = "" } = body || {};
    if (!["CONTRACT_CHECK", "VERSION_DIFF"].includes(mode) || !["HOUSING", "EMPLOYMENT"].includes(type) ||
        [text, textV1, textV2].some(value => typeof value !== "string" || value.length > 80_000)) {
      return Response.json({ success: false, error: {
        code: "CONTRACT_INPUT_INVALID",
        userMessage: "Văn bản hoặc chế độ phân tích không hợp lệ.",
        retryable: false
      } }, { status: 400 });
    }

    if (mode === "VERSION_DIFF") {
      if (!textV1 || !textV2) {
        return NextResponse.json(
          { success: false, error: "Vui lòng nhập đầy đủ cả 2 phiên bản văn bản (Bản gốc v1 và Bản đính chính v2) để đối soát." },
          { status: 400 }
        );
      }

      const docV1 = extractDocumentIntelligence(textV1, { title: "Văn bản / Công văn gốc (v1)" });
      const docV2 = extractDocumentIntelligence(textV2, { title: "Văn bản / Công văn điều chỉnh (v2)" });
      const diffResult = computeDocumentVersionDiff(docV1, docV2);

      return NextResponse.json({
        success: true,
        mode: "VERSION_DIFF",
        timestamp: new Date().toISOString(),
        diffResult,
      });
    }

    // Default: Contract Intelligence Analysis
    if (!text || text.trim().length < 10) {
      return NextResponse.json(
        {
          success: false,
          error: "Vui lòng dán nội dung văn bản hợp đồng hoặc điều khoản cần bóc tách (tối thiểu 10 ký tự).",
        },
        { status: 400 }
      );
    }

    const analysis = analyzeContractIntelligence(text, type === "HOUSING" ? "RENTAL" : "LABOR");

    return NextResponse.json({
      success: true,
      mode: "CONTRACT_CHECK",
      timestamp: new Date().toISOString(),
      type,
      riskScore: analysis.overallRiskScore,
      riskLevel: analysis.riskVerdict,
      flawsCount: analysis.riskFlags.length,
      detectedFlaws: analysis.riskFlags.map((flag) => ({
        id: flag.id,
        title: flag.title,
        severity: flag.severity,
        legalBasis: flag.legalReference,
        analysis: flag.plainExplanation,
        recommendation: flag.suggestedAction,
        detectedText: flag.detectedText,
      })),
      generalAdvice: analysis.plainSummary,
      legalDisclaimer: analysis.legalDisclaimer,
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "ANALYZE_CONTRACT",
  allowAnonymous: true,
  maxRequests: 20,
  maxBodyBytes: 256 * 1024,
}, analyzeContract);
