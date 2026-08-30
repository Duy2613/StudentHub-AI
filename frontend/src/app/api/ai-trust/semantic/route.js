import { NextResponse } from "next/server";
import { Layer2SemanticService } from "@/lib/ai-trust/layer2/Layer2SemanticService";
import { SecurityFabric } from "@/lib/security/SecurityFabric";

/**
 * POST /api/ai-trust/semantic
 * 
 * Authoritative Layer 2: Semantic & Contextual Verification Endpoint
 * Analyzes meaning, intent, consistency, extracts claims & packages Layer 3 tasks.
 */
async function analyzeSemantics(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Yêu cầu không hợp lệ. Payload phải là đối tượng JSON.",
          status: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const { type = "text", content = "", metadata = {}, layer1Result = {}, options = {} } = body || {};

    if (typeof content !== "string" || content.length > 12_000 ||
        !metadata || typeof metadata !== "object" || Array.isArray(metadata) ||
        !layer1Result || typeof layer1Result !== "object" || Array.isArray(layer1Result) ||
        !options || typeof options !== "object" || Array.isArray(options)) {
      return NextResponse.json({ error: { code: "SEMANTIC_INPUT_INVALID", userMessage: "Dữ liệu phân tích ngữ nghĩa không hợp lệ hoặc vượt giới hạn." }, status: "BAD_REQUEST" }, { status: 400 });
    }

    if (!content && !metadata?.ocrText && !metadata?.qrContent && !metadata?.url) {
      return NextResponse.json(
        {
          error: "Nội dung đầu vào không được để trống.",
          status: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const result = await Layer2SemanticService.verify({
      type,
      content,
      metadata,
      layer1Result,
      options,
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-AI-Trust-Layer": "2-Semantic",
        "X-AI-Trust-Request-Id": result.requestId,
      },
    });
  } catch (error) {
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "ANALYZE_TRUST_SEMANTICS",
  allowAnonymous: true,
  maxRequests: 30,
  maxBodyBytes: 256 * 1024,
}, analyzeSemantics);
