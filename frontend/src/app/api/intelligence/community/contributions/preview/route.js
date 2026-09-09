import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { CommunityRepository } from "@/lib/server/database/CommunityRepository.js";
import { detectPII } from "@/lib/communityExpert/promaxDomain.js";
import { SecurityFabric } from "@/lib/security/SecurityFabric.js";

const MAX_PRIVATE_FILE_BYTES = 8 * 1024 * 1024;
const MAX_IMAGE_DIMENSION = 12_000;
const ALLOWED_FILE_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "application/pdf"]);

function fileDigest(bytes) {
  return createHash("sha256").update(Buffer.from(bytes)).digest("hex");
}

function detectMagic(bytes) {
  const value = Buffer.from(bytes);
  if (value.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (value.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (value.subarray(0, 4).toString("ascii") === "%PDF") return "application/pdf";
  if (value.subarray(0, 4).toString("ascii") === "RIFF" && value.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

function extensionMatches(name, mimeType) {
  const extension = String(name || "").toLowerCase().split(".").pop();
  const expected = { "image/png": "png", "image/jpeg": ["jpg", "jpeg"], "image/webp": "webp", "application/pdf": "pdf" }[mimeType];
  return Array.isArray(expected) ? expected.includes(extension) : expected === extension;
}

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

function detectDimensions(bytes, mimeType) {
  const value = Buffer.from(bytes);
  if (mimeType === "image/png" && value.length >= 24) return { width: value.readUInt32BE(16), height: value.readUInt32BE(20) };
  if (mimeType === "image/webp" && value.length >= 30 && value.subarray(12, 16).toString("ascii") === "VP8X") {
    return { width: 1 + readUInt24LE(value, 24), height: 1 + readUInt24LE(value, 27) };
  }
  if (mimeType === "image/jpeg") {
    let offset = 2;
    while (offset + 9 < value.length && offset < 1_048_576) {
      if (value[offset] !== 0xff) { offset += 1; continue; }
      const marker = value[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > value.length) break;
      const segmentLength = value.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > value.length) break;
      const isSof = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) || (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
      if (isSof && segmentLength >= 7) return { width: value.readUInt16BE(offset + 5), height: value.readUInt16BE(offset + 3) };
      offset += segmentLength;
    }
  }
  return null;
}

async function previewContribution(request, _routeParams, principal, securityContext) {
  try {
    const contentType = request.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await request.formData();
      const file = form.get("file");
      if (!file || typeof file.arrayBuffer !== "function") return NextResponse.json({ success: false, error: { code: "PRIVATE_FILE_REQUIRED", userMessage: "Attach a private evidence file for scanning." } }, { status: 400 });
      if (!ALLOWED_FILE_TYPES.has(file.type) || file.size > MAX_PRIVATE_FILE_BYTES) return NextResponse.json({ success: false, error: { code: "PRIVATE_FILE_INVALID", userMessage: "Evidence files must be PNG, JPEG, WEBP, or PDF and no larger than 8 MB." } }, { status: 422 });
      const bytes = await file.arrayBuffer();
      const actualType = detectMagic(bytes);
      if (!actualType || actualType !== file.type || !extensionMatches(file.name, file.type)) return NextResponse.json({ success: false, error: { code: "PRIVATE_FILE_CONTENT_MISMATCH", userMessage: "The declared file type, extension, and binary content do not match." } }, { status: 422 });
      const dimensions = detectDimensions(bytes, file.type);
      if (file.type.startsWith("image/") && (!dimensions || dimensions.width < 1 || dimensions.height < 1 || dimensions.width > MAX_IMAGE_DIMENSION || dimensions.height > MAX_IMAGE_DIMENSION)) return NextResponse.json({ success: false, error: { code: "PRIVATE_FILE_DIMENSIONS_INVALID", userMessage: "The image dimensions are missing or exceed the safe processing limit." } }, { status: 422 });
      const ocrText = String(form.get("ocrText") || "").slice(0, 80_000);
      const qrContent = String(form.get("qrContent") || "").slice(0, 4_000);
      const metadata = {
        imageVisibleIdentifiers: form.get("imageVisibleIdentifiers") === "true",
        locationMetadata: form.get("locationMetadata") === "true",
        identityDocument: form.get("identityDocument") === "true",
        bankAccount: form.get("bankAccount") === "true",
        ...(qrContent ? { qrData: qrContent } : {}),
      };
      const privacy = detectPII([ocrText, qrContent].filter(Boolean).join("\n"), metadata);
      const digest = fileDigest(bytes);
      // Binary content is deliberately never returned or written here. OCR,
      // QR, EXIF, and image-visible identifier scans must run in an isolated
      // private worker before a redacted derivative can enter publication.
      return NextResponse.json({ success: true, state: privacy.hasPII ? "BLOCKED" : "PRIVACY_SCAN_PENDING", publicationState: privacy.hasPII ? "BLOCKED" : "PRIVACY_SCAN_PENDING", file: { mimeType: file.type, byteSize: file.size, sha256: digest, dimensions }, privacy: { originalStored: false, publicDerivative: null, findings: privacy.findings, requiredScans: ["PII_TEXT", "IMAGE_VISIBLE_IDENTIFIER", "QR_DATA", "LOCATION_METADATA"], policyVersion: "privacy-scan-v1" }, correlationId: securityContext.correlationId }, { status: privacy.hasPII ? 422 : 200 });
    }
    const body = await request.json().catch(() => ({}));
    const preview = CommunityRepository.previewContribution({
      caseId: body.caseId || body.caseScope?.caseId,
      caseRevision: body.caseRevision ?? body.caseScope?.caseRevision,
      claimId: body.claimId,
      contributionType: body.contributionType,
      statement: body.statement || body.content,
      evidenceRefs: body.evidenceRefs,
      evidenceRevisionIds: body.evidenceRevisionIds,
      ocrText: body.ocrText,
      qrContent: body.qrContent,
      metadata: body.metadata,
    });
    return NextResponse.json({ success: true, ...preview, authorId: principal.subjectId, correlationId: securityContext.correlationId }, { status: preview.state === "BLOCKED" ? 422 : 200 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: "PRIVACY_PREVIEW_UNAVAILABLE", userMessage: "Privacy preview is temporarily unavailable.", correlationId: securityContext.correlationId } }, { status: 503 });
  }
}

export const POST = SecurityFabric.wrapHandler({ action: "PREVIEW_COMMUNITY_EVIDENCE", requiredPermission: "COMMUNITY.POST", allowAnonymous: false, maxRequests: 30, maxBodyBytes: MAX_PRIVATE_FILE_BYTES + 64 * 1024 }, previewContribution);
