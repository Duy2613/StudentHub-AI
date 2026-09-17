import { createHash } from "node:crypto";

export const MAX_TIMETABLE_IMAGE_BYTES = 8 * 1024 * 1024;
export const MAX_TIMETABLE_IMAGE_DIMENSION = 12_000;
export const ALLOWED_TIMETABLE_IMAGE_TYPES = Object.freeze(["image/png", "image/jpeg", "image/webp"]);

function readUInt24LE(buffer, offset) {
  return buffer[offset] | (buffer[offset + 1] << 8) | (buffer[offset + 2] << 16);
}

export function detectTimetableImageType(bytes) {
  const value = Buffer.from(bytes);
  if (value.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (value.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return "image/jpeg";
  if (value.subarray(0, 4).toString("ascii") === "RIFF" && value.subarray(8, 12).toString("ascii") === "WEBP") return "image/webp";
  return null;
}

function extensionMatches(name, mimeType) {
  const extension = String(name || "").toLowerCase().split(".").pop();
  const expected = { "image/png": ["png"], "image/jpeg": ["jpg", "jpeg"], "image/webp": ["webp"] }[mimeType] || [];
  return expected.includes(extension);
}

export function detectTimetableImageDimensions(bytes, mimeType) {
  const value = Buffer.from(bytes);
  if (mimeType === "image/png" && value.length >= 24) {
    return { width: value.readUInt32BE(16), height: value.readUInt32BE(20) };
  }
  if (mimeType === "image/webp" && value.length >= 30 && value.subarray(12, 16).toString("ascii") === "VP8X") {
    return { width: 1 + readUInt24LE(value, 24), height: 1 + readUInt24LE(value, 27) };
  }
  if (mimeType === "image/jpeg") {
    let offset = 2;
    while (offset + 9 < value.length && offset < 1_048_576) {
      if (value[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = value[offset + 1];
      offset += 2;
      if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) continue;
      if (offset + 2 > value.length) break;
      const segmentLength = value.readUInt16BE(offset);
      if (segmentLength < 2 || offset + segmentLength > value.length) break;
      const isStartOfFrame = (marker >= 0xc0 && marker <= 0xc3)
        || (marker >= 0xc5 && marker <= 0xc7)
        || (marker >= 0xc9 && marker <= 0xcb)
        || (marker >= 0xcd && marker <= 0xcf);
      if (isStartOfFrame && segmentLength >= 7) {
        return { width: value.readUInt16BE(offset + 5), height: value.readUInt16BE(offset + 3) };
      }
      offset += segmentLength;
    }
  }
  return null;
}

export function validateTimetableImage({ bytes, mimeType, name = "" } = {}) {
  const value = Buffer.from(bytes || []);
  const declaredType = String(mimeType || "").toLowerCase();
  if (!ALLOWED_TIMETABLE_IMAGE_TYPES.includes(declaredType)) {
    const error = new Error("Only PNG, JPEG, and WEBP timetable images are supported.");
    error.code = "TIMETABLE_IMAGE_TYPE_INVALID";
    error.statusCode = 422;
    throw error;
  }
  if (!value.length || value.length > MAX_TIMETABLE_IMAGE_BYTES) {
    const error = new Error("Timetable image exceeds the safe upload limit.");
    error.code = "TIMETABLE_IMAGE_SIZE_INVALID";
    error.statusCode = 422;
    throw error;
  }
  const actualType = detectTimetableImageType(value);
  if (actualType !== declaredType || !extensionMatches(name, declaredType)) {
    const error = new Error("The image content does not match its declared type.");
    error.code = "TIMETABLE_IMAGE_CONTENT_MISMATCH";
    error.statusCode = 422;
    throw error;
  }
  const dimensions = detectTimetableImageDimensions(value, declaredType);
  if (!dimensions || dimensions.width < 1 || dimensions.height < 1 || dimensions.width > MAX_TIMETABLE_IMAGE_DIMENSION || dimensions.height > MAX_TIMETABLE_IMAGE_DIMENSION) {
    const error = new Error("Timetable image dimensions are invalid or unsafe.");
    error.code = "TIMETABLE_IMAGE_DIMENSIONS_INVALID";
    error.statusCode = 422;
    throw error;
  }
  return {
    bytes: value,
    mimeType: declaredType,
    byteSize: value.length,
    dimensions,
    sha256: createHash("sha256").update(value).digest("hex"),
  };
}

