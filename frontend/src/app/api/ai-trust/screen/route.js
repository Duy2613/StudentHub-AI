import { NextResponse } from "next/server";
import { Layer1ScreenService } from "@/lib/ai-trust/layer1/Layer1ScreenService";
import { SecurityFabric } from "@/lib/security/SecurityFabric";
import { createSecureId } from "@/lib/security/secureId.js";

/**
 * POST /api/ai-trust/screen
 * 
 * Authoritative Layer 1 Fast & Deterministic Screening Endpoint
 * Zero-Trust Backend Enforcement. Execution latency target: < 15ms
 */
async function screenTrustInput(request) {
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

    if ((content !== undefined && typeof content !== "string") ||
        (content && content.length > 50_000) ||
        (metadata !== undefined && (!metadata || typeof metadata !== "object" || Array.isArray(metadata)))) {
      return NextResponse.json({ error: { code: "SCREEN_INPUT_INVALID", userMessage: "Dữ liệu sàng lọc không hợp lệ hoặc vượt giới hạn." }, status: "BAD_REQUEST" }, { status: 400 });
    }

    if (!content && !metadata?.bytes && !metadata?.ocrText && !metadata?.qrContent) {
      return NextResponse.json(
        {
          error: "Nội dung đầu vào không được để trống.",
          status: "BAD_REQUEST",
        },
        { status: 400 }
      );
    }

    const requestId = createSecureId("req");

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
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "SCREEN_TRUST_INPUT",
  allowAnonymous: true,
  maxRequests: 60,
  maxBodyBytes: 256 * 1024,
}, screenTrustInput);
