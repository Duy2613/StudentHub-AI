import { NextResponse } from "next/server";
import { Layer1ScreenService } from "@/lib/ai-trust/layer1/Layer1ScreenService.js";
import { Layer2SemanticService } from "@/lib/ai-trust/layer2/Layer2SemanticService.js";
import { Layer3EvidenceService } from "@/lib/ai-trust/layer3/Layer3EvidenceService.js";
import { Layer4TrustService } from "@/lib/ai-trust/layer4/Layer4TrustService.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const runtime = "nodejs";

const INPUT_TYPES = new Set(["text", "url", "image", "file"]);
const MAX_CONTENT_CHARS = 160_000;

function safeMetadata(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const allowed = ["url", "ocrText", "qrContent", "qrPayload", "mimeType", "fileName", "fileSize", "extractionAuthority"];
  return Object.fromEntries(allowed.filter((key) => Object.hasOwn(value, key)).map((key) => {
    const item = value[key];
    if (typeof item === "string") return [key, item.slice(0, 32_000)];
    if (typeof item === "number" && Number.isFinite(item)) return [key, item];
    return [key, null];
  }).filter(([, item]) => item !== null));
}

async function runCanonicalTrust(request, routeParams, principal, securityContext) {
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
  const layer1 = await Layer1ScreenService.screen({ ...input, options: { requestId } });
  const depth = body?.depth === "full" ? "full" : "screen";
  if (depth === "screen") {
    return NextResponse.json({ success: true, contractVersion: "trust.v1", requestId, depth, demo: false, data: { input: { type }, layer1 } });
  }

  const useAIGateway = body?.useAIGateway === true;
  const layer2 = layer1.status === "BLOCK" ? null : await Layer2SemanticService.verify({
    ...input,
    layer1Result: layer1,
    options: { requestId, useAIGateway },
  });
  const layer3 = layer1.status === "BLOCK" || !layer2 ? null : await Layer3EvidenceService.verify({
    claims: layer2.claims,
    layer2Result: layer2,
    options: {},
  });
  const layer4 = await Layer4TrustService.evaluate({
    layer1Result: layer1,
    layer2Result: layer2,
    layer3Result: layer3,
    options: { useAIGateway },
  });

  return NextResponse.json({
    success: true,
    contractVersion: "trust.v1",
    requestId,
    depth,
    demo: false,
    data: { input: { type }, layer1, layer2, layer3, layer4 },
  });
}

export const POST = SecurityFabric.wrapHandler({
  action: "RUN_CANONICAL_TRUST_PIPELINE",
  allowAnonymous: true,
  maxRequests: 20,
  maxBodyBytes: 512 * 1024,
}, runCanonicalTrust);
