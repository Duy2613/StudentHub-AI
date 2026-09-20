import { NextResponse } from "next/server";
import { createTrustOrchestrator } from "@/lib/ai-trust/TrustOrchestrator.js";
import { buildLegacyLayerResponse, buildLegacyPipelineResponse } from "@/lib/ai-trust/legacy/LegacyResponseProjector.js";
import { MediaArtifactService } from "@/lib/server/media/MediaArtifactService.js";
import { QrIntakeService } from "@/lib/ai-trust/layer1/qr/QrIntakeService.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

export const runtime = "nodejs";
export const maxDuration = 120;

const MAX_CONTENT_CHARS = 500_000;
const MAX_BODY_BYTES = 12 * 1024 * 1024;
const INPUT_TYPES = new Set(["text", "url", "image", "file", "qr"]);
const STAGES = new Set(["layer2", "layer3", "layer4"]);

function asRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function boundedText(value, maxLength = MAX_CONTENT_CHARS) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001F\u007F]/g, " ").slice(0, maxLength)
    : "";
}

function safeMetadata(value) {
  const source = asRecord(value);
  const keys = [
    "url", "ocrText", "qrContent", "qrPayload", "mimeType", "fileName", "fileSize", "inputKind", "fileType",
    "extractionAuthority", "institutionContext", "mediaArtifactId", "imageHash", "bytes", "width", "height",
  ];
  return Object.fromEntries(keys.filter((key) => Object.hasOwn(source, key)).map((key) => {
    const item = source[key];
    if (["ocrText", "qrContent", "qrPayload"].includes(key)) return [key, boundedText(item)];
    if (["url", "mimeType", "fileName", "inputKind", "fileType", "extractionAuthority", "institutionContext", "mediaArtifactId", "imageHash"].includes(key)) {
      return [key, boundedText(item, 4096)];
    }
    if (key === "bytes") {
      if (typeof item === "string" || Buffer.isBuffer(item) || item instanceof Uint8Array) return [key, item];
      if (Array.isArray(item) && item.length <= 8 * 1024 * 1024 && item.every((byte) => Number.isInteger(byte) && byte >= 0 && byte <= 255)) {
        return [key, Uint8Array.from(item)];
      }
      return [key, null];
    }
    if (typeof item === "number" && Number.isFinite(item)) return [key, item];
    return [key, null];
  }).filter(([, value]) => value !== null));
}

async function routePath(routeParams) {
  const params = routeParams?.params && typeof routeParams.params.then === "function"
    ? await routeParams.params
    : routeParams?.params || routeParams || {};
  const path = Array.isArray(params?.path) ? params.path : [];
  return path.map((part) => String(part || "").toLowerCase());
}

function errorResponse(code, message, status = 422) {
  return NextResponse.json({ error: { code, message, userMessage: message } }, { status });
}

async function parseRequest(request, path) {
  const mode = path[1] || "";
  const isImageRoute = mode === "image";
  const isQrRoute = mode === "qr";
  const contentType = request.headers.get("content-type") || "";
  let body = {};
  let multipartBytes = null;
  let multipartMimeType = "";
  let multipartFileName = "";

  if (contentType.toLowerCase().startsWith("multipart/form-data")) {
    let form;
    try {
      form = await request.formData();
    } catch {
      return { error: errorResponse("INVALID_MULTIPART", "Multipart form-data không hợp lệ.", 400) };
    }
    const file = form.get("image") || form.get("file");
    if (file && typeof file.arrayBuffer === "function") {
      multipartBytes = Buffer.from(await file.arrayBuffer());
      multipartMimeType = typeof file.type === "string" ? file.type : "";
      multipartFileName = typeof file.name === "string" ? file.name : "";
    }
    body = {
      type: form.get("type") || "",
      content: form.get("content") || "",
      ocrText: form.get("ocrText") || "",
      qrContent: form.get("qrContent") || "",
      qrPayload: form.get("qrPayload") || "",
      mimeType: form.get("mimeType") || "",
    };
  } else {
    try {
      body = await request.json();
    } catch {
      return { error: errorResponse("INVALID_JSON", "Payload phải là JSON hợp lệ.", 400) };
    }
  }

  const source = asRecord(body);
  const type = isImageRoute ? "image" : isQrRoute ? "qr" : String(source.type || "text").toLowerCase();
  if (!INPUT_TYPES.has(type)) return { error: errorResponse("UNSUPPORTED_INPUT_TYPE", "Loại dữ liệu này chưa được hỗ trợ.") };

  const imageBase64 = typeof source.imageBase64 === "string" ? source.imageBase64 : null;
  const rawContent = typeof source.content === "string"
    ? source.content
    : typeof source.url === "string" ? source.url : "";
  const metadata = safeMetadata(source.metadata);
  if (source.ocrText !== undefined) metadata.ocrText = boundedText(source.ocrText);
  if (source.qrContent !== undefined) metadata.qrContent = boundedText(source.qrContent);
  if (source.qrPayload !== undefined) metadata.qrPayload = boundedText(source.qrPayload);
  if (source.contentType !== undefined) metadata.mimeType = boundedText(source.contentType, 120);
  if (source.mimeType !== undefined) metadata.mimeType = boundedText(source.mimeType, 120);
  if (multipartMimeType) metadata.mimeType = multipartMimeType.slice(0, 120);
  if (multipartFileName) metadata.fileName = multipartFileName.slice(0, 2048);
  if (multipartBytes) metadata.bytes = multipartBytes;
  else if (imageBase64) metadata.bytes = imageBase64;
  else if (type === "image" && /^data:image\//i.test(rawContent)) metadata.bytes = rawContent;

  const content = boundedText(rawContent);
  if (!content && !metadata.ocrText && !metadata.qrContent && !metadata.qrPayload && !metadata.url && !metadata.bytes && !metadata.mediaArtifactId) {
    return { error: errorResponse("CONTENT_REQUIRED", "Nội dung đầu vào không được để trống.") };
  }
  if (content.length > MAX_CONTENT_CHARS) return { error: errorResponse("CONTENT_TOO_LARGE", "Nội dung vượt quá giới hạn cho phép.", 413) };

  return { input: { type, content, metadata } };
}

async function prepareMedia(input, principal) {
  if (!input || !["image", "qr"].includes(input.type) || input.metadata?.mediaArtifactId || !input.metadata?.bytes) return { input };
  const result = await MediaArtifactService.ingestImage({
    bytes: input.metadata.bytes,
    claimedMimeType: input.metadata.mimeType || "",
    ownerUserId: principal?.subjectId ? String(principal.subjectId).replace(/^(student|expert|user):/, "") : null,
  });
  if (!result.ok) return { error: errorResponse(result.error?.code || "IMAGE_INTAKE_FAILED", result.error?.message || "Tệp hình ảnh không hợp lệ.") };
  const metadata = { ...input.metadata,
    mediaArtifactId: result.artifact.mediaArtifactId,
    imageHash: result.artifact.sha256,
    mimeType: result.artifact.mimeType,
    width: result.artifact.width,
    height: result.artifact.height,
  };
  // The artifact store owns the complete validated bytes. Keep only a magic
  // byte prefix in the pipeline input so the response never echoes base64.
  if (result.artifact.buffer) metadata.bytes = Array.from(result.artifact.buffer.subarray(0, 32));
  else delete metadata.bytes;
  return { input: { ...input, metadata } };
}

async function runLegacyVerification(request, routeParams, principal, securityContext) {
  const path = await routePath(routeParams);
  const stage = path[0];
  if (!STAGES.has(stage)) return errorResponse("UNKNOWN_VERIFY_STAGE", "Chỉ hỗ trợ layer2, layer3 và layer4.", 404);

  const parsed = await parseRequest(request, path);
  if (parsed.error) return parsed.error;
  const prepared = await prepareMedia(parsed.input, principal);
  if (prepared.error) return prepared.error;
  const input = prepared.input;

  if (input.type === "qr" || input.metadata.qrContent || input.metadata.qrPayload) {
    const qrRaw = input.content || input.metadata.qrContent || input.metadata.qrPayload || "";
    input.metadata.qrIntake = QrIntakeService.intake(qrRaw);
  }

  const requestId = securityContext.correlationId;
  const pipeline = await createTrustOrchestrator().run(input, {
    requestId,
    signal: request.signal,
    useAIGateway: true,
    aiMode: "GEMINI_ONLY",
  });
  const legacy = pipeline?.legacyResponse || buildLegacyPipelineResponse({
    input,
    layerResults: pipeline?.layerResults || {},
    finalPredict: pipeline?.finalPredict || null,
  });
  const output = legacy[`layer${stage.slice(-1)}`] || buildLegacyLayerResponse(stage, {
    input,
    layerResults: pipeline?.layerResults || {},
    finalPredict: pipeline?.finalPredict || null,
  });
  return NextResponse.json(output, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
      "X-Content-Type-Options": "nosniff",
      "X-StudentHub-Response-Shape": "legacy-four-layer-v1",
      "X-StudentHub-Request-Id": requestId,
    },
  });
}

export const POST = SecurityFabric.wrapHandler({
  action: "RUN_LEGACY_VERIFY_PIPELINE",
  allowAnonymous: true,
  maxRequests: 20,
  maxBodyBytes: MAX_BODY_BYTES,
}, runLegacyVerification);
