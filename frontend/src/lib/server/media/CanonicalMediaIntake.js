import { MediaArtifactService } from "./MediaArtifactService.js";
import { decodeQrArtifactBytes } from "./QrArtifactDecoder.js";

// Shared intake for canonical and compatibility API entry points. Pipeline
// stages receive references only after server-owned ingestion or authorization.
export async function prepareCanonicalMediaInput(input, { principal, roomId = null, mediaService = MediaArtifactService, decodeQr = decodeQrArtifactBytes } = {}) {
  const type = String(input.type || "text").toLowerCase();
  let content = typeof input.content === "string" ? input.content : "";
  const metadata = { ...(input.metadata || {}) };
  const imageInput = type === "image" || type === "qr";
  const rawImage = metadata.bytes || (content.startsWith("data:image/") ? content : null);
  const fail = (code, message, statusCode = 422) => ({ ok: false, error: { code, message, statusCode } });
  if (metadata.mediaArtifactId && !imageInput) return fail("MEDIA_ARTIFACT_INPUT_TYPE_INVALID", "Tham chiếu ảnh chỉ được dùng với đầu vào IMAGE hoặc QR.");
  if (!imageInput || (!rawImage && !metadata.mediaArtifactId)) return { ok: true, input: { ...input, type, content, metadata } };
  if (rawImage && metadata.mediaArtifactId) return fail("MEDIA_ARTIFACT_INPUT_CONFLICT", "Gửi media mới hoặc tham chiếu media đã lưu, không gửi đồng thời cả hai.");
  const ownerUserId = principal?.isAuthenticated && principal?.subjectId
    ? String(principal.subjectId).replace(/^(student|expert|user):/i, "")
    : null;
  let result;
  if (rawImage) {
    result = await mediaService.ingestImage({
      bytes: Array.isArray(rawImage) ? Uint8Array.from(rawImage) : rawImage,
      claimedMimeType: metadata.mimeType || "",
      ownerUserId,
      requireDurableStorage: Boolean(ownerUserId),
    });
  } else {
    if (!ownerUserId) return fail("MEDIA_ARTIFACT_ACCESS_DENIED", "Đăng nhập và tham gia phòng để đọc media đã lưu.", 403);
    result = await mediaService.hydrateArtifact(metadata.mediaArtifactId, { requesterUserId: ownerUserId, roomId, expectedSha256: metadata.imageHash || null });
  }
  if (!result.ok) return fail(result.error?.code || "MEDIA_INTAKE_FAILED", result.error?.message || "Media chưa thể được xác minh.", result.error?.statusCode || (result.error?.code === "FILE_OVERSIZED" ? 413 : 422));
  const artifact = result.artifact;
  Object.assign(metadata, { mediaArtifactId: artifact.mediaArtifactId, imageHash: artifact.sha256, mimeType: artifact.mimeType, width: artifact.width, height: artifact.height, fileSize: artifact.byteSize });
  delete metadata.bytes;
  if (type === "image") {
    // The active IMAGE payload is the verified artifact. Do not carry a TEXT
    // draft retained by the client editor into canonical persistence.
    content = "";
  }
  if (type === "qr") {
    const decoded = await decodeQr(mediaService.getArtifactBytes(artifact.mediaArtifactId));
    if (!decoded.ok) {
      if (rawImage && ownerUserId) {
        const cleanup = await mediaService.cleanupUnreferencedArtifact({ mediaArtifactId: artifact.mediaArtifactId, ownerUserId });
        if (!cleanup.ok) return fail("MEDIA_STORAGE_CLEANUP_FAILED", "Không thể dọn an toàn media QR chưa hợp lệ.", 503);
      }
      return fail(decoded.code || "QR_IMAGE_UNREADABLE", "Không đọc được mã QR từ ảnh đã lưu. Hãy chọn ảnh QR rõ nét.");
    }
    content = "";
    metadata.qrContent = decoded.payload;
    delete metadata.qrPayload;
  }
  return { ok: true, input: { ...input, type, content, metadata } };
}
