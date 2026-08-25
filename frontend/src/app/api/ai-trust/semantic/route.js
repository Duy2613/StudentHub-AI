import { NextResponse } from "next/server";
import { Layer2SemanticService } from "@/lib/ai-trust/layer2/Layer2SemanticService";

/**
 * POST /api/ai-trust/semantic
 * 
 * Authoritative Layer 2: Semantic & Contextual Verification Endpoint
 * Analyzes meaning, intent, consistency, extracts claims & packages Layer 3 tasks.
 */
export async function POST(request) {
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
    console.error("[Layer2 API Error]:", error);
    return NextResponse.json(
      {
        error: "Lỗi hệ thống khi xử lý thẩm định Layer 2.",
        details: error?.message || "Unknown error",
        status: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
