import { NextResponse } from "next/server";
import { Layer1ScreenService } from "@/lib/ai-trust/layer1/Layer1ScreenService.js";
import { Layer2SemanticService } from "@/lib/ai-trust/layer2/Layer2SemanticService.js";
import { Layer2AReputationService } from "@/lib/ai-trust/layer2a/Layer2AReputationService.js";
import { Layer3EvidenceService } from "@/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { Layer4TrustService } from "@/lib/ai-trust/layer4/Layer4TrustService.js";
import { TrustPipelineCancelledError } from "@/lib/ai-trust/v5/TrustPipelineOrchestrator.js";
import { createTrustOrchestrator } from "@/lib/ai-trust/TrustOrchestrator.js";
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
            send({ type: "error", event: "PIPELINE_FAILED", error: { code: "PIPELINE_FAILED", message: "Trust pipeline không thể hoàn tất." } });
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
  if (body?.version === "v5") {
    if (wantsV5Stream(request, body)) return streamV5Pipeline(request, input, requestId);
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
  }
  const layer1 = await Layer1ScreenService.screen({ ...input, options: { requestId } });
  const depth = body?.depth === "full" ? "full" : "screen";
  if (depth === "screen") {
    return NextResponse.json({ success: true, contractVersion: "trust.v1", requestId, depth, demo: false, data: { input: { type }, layer1 } });
  }

  const useAIGateway = body?.useAIGateway === true;
  const urlTarget = type === "url" ? (content || metadata.url || "") : "";
  const layer2A = type === "url"
    ? await Layer2AReputationService.verify({
      // The Layer 2A service applies the disclosure policy independently.
      // A local hard block must not blanket-suppress a valid public target,
      // while private/metadata/SSRF targets are still skipped before any
      // provider receives them.
      url: urlTarget,
      requestId,
    })
    : await Layer2AReputationService.verify({ url: "", requestId });
  const layer2 = layer1.status === "BLOCK" ? null : await Layer2SemanticService.verify({
    ...input,
    layer1Result: layer1,
    options: { requestId, useAIGateway },
  });
  const layer3 = layer1.status === "BLOCK" || !layer2 ? null : await Layer3EvidenceService.verify({
    claims: layer2.claims,
    layer2Result: layer2,
    options: { requestId },
  });
  const layer4 = await Layer4TrustService.evaluate({
    layer1Result: layer1,
    layer2Result: layer2,
    layer2AResult: layer2A,
    layer3Result: layer3,
    options: { requestId, useAIGateway },
  });

  return NextResponse.json({
    success: true,
    contractVersion: "trust.v1",
    requestId,
    depth,
    demo: false,
    data: { input: { type }, layer1, layer2A, layer2, layer3, layer4 },
  });
}

export const POST = SecurityFabric.wrapHandler({
  action: "RUN_CANONICAL_TRUST_PIPELINE",
  allowAnonymous: true,
  maxRequests: 20,
  maxBodyBytes: 512 * 1024,
}, runCanonicalTrust);
