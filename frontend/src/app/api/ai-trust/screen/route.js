import { NextResponse } from "next/server";
import { Layer1ScreenService } from "@/lib/ai-trust/layer1/Layer1ScreenService";

/**
 * POST /api/ai-trust/screen
 * 
 * Authoritative Layer 1 Fast & Deterministic Screening Endpoint
 * Zero-Trust Backend Enforcement. Execution latency target: < 15ms
 */
export async function POST(request) {
  try {
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          error: "Yêu cầu không hợp lệ. Định dạng payload phải là JSON.",
          status: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const { type, content, metadata } = body || {};

    if (!content && !metadata?.bytes && !metadata?.ocrText && !metadata?.qrContent) {
      return NextResponse.json(
        {
          error: "Nội dung đầu vào không được để trống.",
          status: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    const result = await Layer1ScreenService.screen({
      type: type || "text",
      content: content || "",
      metadata: metadata || {},
      options: { requestId },
    });

    return NextResponse.json(result, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-AI-Trust-Layer": "1-Deterministic",
        "X-AI-Trust-Request-Id": requestId,
      },
    });
  } catch (error) {
    console.error("[Layer1 API Error]:", error);
    return NextResponse.json(
      {
        error: "Lỗi hệ thống khi xử lý thẩm định Layer 1.",
        details: error?.message || "Unknown error",
        status: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
