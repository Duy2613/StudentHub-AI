import { NextResponse } from "next/server";
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
  const allowed = ["url", "ocrText", "qrContent", "qrPayload", "mimeType", "fileName", "fileSize", "fileType", "inputKind", "extractionAuthority", "institutionContext"];
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

function safeProviderError(error) {
  const rawCode = typeof error?.code === "string" ? error.code.toUpperCase() : "PROVIDER_ERROR";
  if (error instanceof FriendBackendNotConfiguredError || rawCode === "FRIEND_BACKEND_NOT_CONFIGURED" || rawCode === "LEGACY_BACKEND_NOT_CONFIGURED") {
    return {
      code: "FRIEND_BACKEND_NOT_CONFIGURED",
      message: "FRIEND_BACKEND_NOT_CONFIGURED: Chưa cấu hình FRIEND_BACKEND_API_URL.",
      status: 503,
    };
  }
  if (rawCode.includes("ECONNREFUSED") || rawCode.includes("ENOTFOUND") || rawCode === "LEGACY_NETWORK_ERROR") {
    return {
      code: "FRIEND_BACKEND_UNREACHABLE",
      message: "FRIEND_BACKEND_UNREACHABLE: Không thể kết nối tới máy chủ Friend Backend.",
      status: 502,
    };
  }
  if (rawCode.includes("ETIMEDOUT") || rawCode === "LEGACY_TIMEOUT" || rawCode === "TIMEOUT") {
    return {
      code: "FRIEND_BACKEND_TIMEOUT",
      message: "FRIEND_BACKEND_TIMEOUT: Kết nối tới Friend Backend quá thời gian chờ.",
      status: 504,
    };
  }
  if (rawCode === "LEGACY_AUTH_FAILED" || rawCode === "AUTH_FAILED" || rawCode === "401" || rawCode === "403") {
    return {
      code: "FRIEND_BACKEND_AUTH_FAILED",
      message: "FRIEND_BACKEND_AUTH_FAILED: Xác thực với Friend Backend thất bại.",
      status: 502,
    };
  }
  if (rawCode === "LEGACY_INVALID_JSON" || rawCode === "SCHEMA_MISMATCH" || rawCode.includes("MALFORMED")) {
    return {
      code: "FRIEND_BACKEND_CONTRACT_MISMATCH",
      message: "FRIEND_BACKEND_CONTRACT_MISMATCH: Dữ liệu từ Friend Backend không khớp hợp đồng.",
      status: 502,
    };
  }
  return {
    code: "PROVIDER_ERROR",
    message: "PROVIDER_ERROR: Trust pipeline không thể hoàn tất từ nguồn live.",
    status: 502,
  };
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
          const safeError = safeProviderError(error);

          send({
            type: "error",
            event: "PIPELINE_FAILED",
            error: {
              code: safeError.code,
              message: safeError.message,
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
    if (error instanceof TrustPipelineCancelledError) {
      return NextResponse.json({
        success: false,
        error: { code: "CANCELLED", userMessage: "Yêu cầu đã được dừng." },
      }, { status: 499 });
    }
    if (error instanceof FriendBackendNotConfiguredError || error.code === "FRIEND_BACKEND_NOT_CONFIGURED") {
      return NextResponse.json({
        success: false,
        error: {
          code: "FRIEND_BACKEND_NOT_CONFIGURED",
          userMessage: "Friend backend chưa được cấu hình cho phiên bản tuần tự này.",
        },
      }, { status: 503 });
    }
    const safeError = safeProviderError(error);
    return NextResponse.json({
      success: false,
      error: {
        code: safeError.code,
        userMessage: safeError.message,
      },
    }, { status: safeError.status });
  }
}

export const POST = SecurityFabric.wrapHandler({
  action: "RUN_CANONICAL_TRUST_PIPELINE",
  allowAnonymous: true,
  maxRequests: 20,
  maxBodyBytes: 512 * 1024,
}, runCanonicalTrust);
