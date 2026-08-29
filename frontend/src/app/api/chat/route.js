// frontend/src/app/api/chat/route.js
// Next.js API route for StudentHub AI Mentor Assistant
//
// Routes real user questions through the AI Gateway (multi-vendor,
// capability-based ModelRouter — see docs/AI-MODEL-ROUTER.md) instead of
// returning hard-coded canned replies regardless of input.
//
// Honesty rule (Master Prompt Section AA — no fabricated success states):
// if no AI provider is configured or every candidate fails, this endpoint
// returns an explicit `providerStatus: "LIVE_PROVIDER_NOT_CONFIGURED"`
// response instead of pretending a real answer was generated.

import { NextResponse } from "next/server";
import { AIGatewayService, AI_CAPABILITY } from "@/lib/ai-gateway";

const MENTOR_SYSTEM_PROMPT = `Bạn là StudentHub AI Copilot — trợ lý học thuật Socratic cho sinh viên Việt Nam.
Nguyên tắc:
- Trả lời bằng tiếng Việt, giải trình từng bước (Socratic Method), không chỉ đưa đáp án thô.
- Với Toán/Khoa học: dùng công thức LaTeX chuẩn khi cần.
- Với Kỹ thuật/Code: review, phân tích độ phức tạp, chỉ ra rủi ro bảo mật nếu có.
- Nếu không chắc chắn về một sự kiện/số liệu cụ thể, hãy nói rõ mức độ không chắc chắn
  và khuyên sinh viên kiểm tra lại với nguồn chính thống — không bịa đặt số liệu.
- Không tự xưng là con người, không đưa ra lời khuyên y tế/pháp lý mang tính quyết định thay chuyên gia.`;

function buildConversationPrompt(messages, subject) {
  const trimmed = messages.slice(-8); // bound context window
  const transcript = trimmed
    .map((m) => `${m.role === "user" ? "Sinh viên" : "Mentor"}: ${m.content}`)
    .join("\n");
  return `Chuyên ngành đang chọn: ${subject}\n\nLịch sử hội thoại:\n${transcript}\n\nHãy trả lời tin nhắn cuối cùng của sinh viên.`;
}

export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Payload phải là JSON hợp lệ." }, { status: 400 });
  }

  const { messages, subject = "general", reasoningMode = true } = body || {};

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Messages array is required." }, { status: 400 });
  }

  try {
    const result = await AIGatewayService.generateText({
      capability: AI_CAPABILITY.DEEP_REASONING,
      systemPrompt: MENTOR_SYSTEM_PROMPT,
      userPrompt: buildConversationPrompt(messages, subject),
      options: { maxOutputTokens: 1536 },
    });

    if (!result.ok) {
      // Honest degraded state — never fabricate a confident answer.
      return NextResponse.json(
        {
          role: "assistant",
          content:
            "Trợ lý AI Mentor hiện chưa thể kết nối tới mô hình ngôn ngữ (chưa cấu hình " +
            "provider hoặc tất cả provider đều lỗi). Vui lòng thử lại sau hoặc liên hệ " +
            "quản trị viên để cấu hình API key.",
          subject,
          reasoningMode,
          providerStatus: "LIVE_PROVIDER_NOT_CONFIGURED",
          errorType: result.errorType,
          timestamp: new Date().toISOString(),
        },
        { status: 200 }
      );
    }

    return NextResponse.json({
      role: "assistant",
      content: result.text,
      subject,
      reasoningMode,
      providerStatus: "LIVE",
      provider: result.provider,
      model: result.model,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Chat API Error]:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý tin nhắn của Trợ lý AI.", details: error?.message },
      { status: 500 }
    );
  }
}
