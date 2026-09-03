import { NextResponse } from "next/server";
import { Layer1ScreenService } from "@/lib/ai-trust/layer1/Layer1ScreenService.js";
import {
  createTrustOrchestrator,
  TrustPipelineCancelledError,
  FriendBackendNotConfiguredError,
} from "@/lib/ai-trust/TrustOrchestrator.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const runtime = "nodejs";

const INPUT_TYPES = new Set(["text", "url", "image", "file"]);
const MAX_CONTENT_CHARS = 160_000;

function safeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = ["url", "ocrText", "qrContent", "qrPayload", "mimeType", "fileName", "fileSize", "extractionAuthority", "institutionContext"];
  return Object.fromEntries(allowed.filter((key) => Object.hasOwn(value, key)).map((key) => {
    const item = value[key];
    if (typeof item === "string") return [key, item.slice(0, 32_000)];
    if (typeof item === "number" && Number.isFinite(item)) return [key, item];
    return [key, null];
  }).filter(([, item]) => item !== null));
}

function wantsV5Stream(request, body) {
  return body?.stream === true || request.headers.get("accept")?.toLowerCase().includes("text/event-stream");
}

function sseChunk(event) {
  return `event: ${event.type || "trust"}\ndata: ${JSON.stringify(event)}\n\n`;
}

function streamV5Pipeline(request, input, requestId) {
  const encoder = new TextEncoder();
  const abortController = new AbortController();
  const forwardAbort = () => abortController.abort(request.signal.reason || "client-disconnected");
  if (request.signal.aborted) forwardAbort();
  else request.signal.addEventListener("abort", forwardAbort, { once: true });

  const stream = new ReadableStream({
    start(controller) {
      let closed = false;
      const close = () => {
        if (closed) return;
        closed = true;
        try { controller.close(); } catch { /* stream was already cancelled */ }
      };
      const send = (event) => {
        if (closed) return;
        try { controller.enqueue(encoder.encode(sseChunk({ ...event, requestId }))); } catch { closed = true; }
      };
      const orchestrator = createTrustOrchestrator();
      orchestrator.run(input, {
        requestId,
        signal: abortController.signal,
        onTransition: (transition) => send({
          type: "stage",
          event: transition.event,
          stageId: transition.stageId,
          data: transition.pipeline,
        }),
      }).then((result) => {
        send({ type: "complete", event: "PIPELINE_COMPLETED", stageId: "l5", data: result });
        close();
      }).catch((error) => {
        if (!(error instanceof TrustPipelineCancelledError)) {
          const isNotConfigured = error instanceof FriendBackendNotConfiguredError || error.code === "FRIEND_BACKEND_NOT_CONFIGURED";
          send({
            type: "error",
            event: "PIPELINE_FAILED",
            error: {
              code: isNotConfigured ? "FRIEND_BACKEND_NOT_CONFIGURED" : (error.code || "PIPELINE_FAILED"),
              message: isNotConfigured
                ? "FRIEND_BACKEND_NOT_CONFIGURED: Friend backend integration is required."
                : (error.message || "Trust pipeline không thể hoàn tất."),
            },
          });
        }
        close();
      }).finally(() => request.signal.removeEventListener("abort", forwardAbort));
    },
    cancel() {
      abortController.abort("stream-cancelled");
      request.signal.removeEventListener("abort", forwardAbort);
    },
  });

  return new Response(stream, {
    status: 200,
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      "X-Content-Type-Options": "nosniff",
      "X-AI-Trust-Contract": "trust.v5",
      "X-AI-Trust-Request-Id": requestId,
    },
  });
}

export async function runCanonicalTrust(request, routeParams, principal, securityContext) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: { code: "INVALID_JSON", userMessage: "Payload phải là JSON hợp lệ." } }, { status: 400 });
  }

  const type = String(body?.type || "text").toLowerCase();
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const metadata = safeMetadata(body?.metadata);
  if (!INPUT_TYPES.has(type)) {
    return NextResponse.json({ success: false, error: { code: "UNSUPPORTED_INPUT_TYPE", userMessage: "Loại dữ liệu này chưa được hỗ trợ." } }, { status: 422 });
  }
  if (!content && !metadata.ocrText && !metadata.qrContent && !metadata.url) {
    return NextResponse.json({ success: false, error: { code: "CONTENT_REQUIRED", userMessage: "Nội dung đầu vào không được để trống." } }, { status: 422 });
  }
  if (content.length > MAX_CONTENT_CHARS) {
    return NextResponse.json({ success: false, error: { code: "CONTENT_TOO_LARGE", userMessage: "Nội dung vượt quá giới hạn cho phép." } }, { status: 413 });
  }

  const requestId = securityContext.correlationId;
  const input = { type, content, metadata };

  if (wantsV5Stream(request, body)) return streamV5Pipeline(request, input, requestId);

  try {
    const pipeline = await createTrustOrchestrator().run(input, { requestId, signal: request.signal });
    return NextResponse.json({
      success: true,
      contractVersion: "trust.v5",
      requestId,
      version: "v5",
      demo: false,
      data: pipeline,
    }, {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
        "X-AI-Trust-Contract": "trust.v5",
        "X-AI-Trust-Request-Id": requestId,
      },
    });
  } catch (error) {
    if (error instanceof FriendBackendNotConfiguredError || error.code === "FRIEND_BACKEND_NOT_CONFIGURED") {
      return NextResponse.json({
        success: false,
        error: {
          code: "FRIEND_BACKEND_NOT_CONFIGURED",
          userMessage: "Friend backend chưa được cấu hình cho phiên bản tuần tự này.",
        },
      }, { status: 503 });
    }
    throw error;
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "RUN_CANONICAL_TRUST_PIPELINE",
  allowAnonymous: true,
  maxRequests: 20,
  maxBodyBytes: 512 * 1024,
}, runCanonicalTrust);
