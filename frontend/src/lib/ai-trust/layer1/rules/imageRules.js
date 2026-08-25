/**
 * AI Trust & Scam Detection Pipeline — Layer 1 Image & File Rules
 * 
 * Deterministic Image & File Screening:
 * - Magic bytes & file signature verification (PNG, JPEG, WebP, GIF)
 * - Disguised executable / polyglot detection (MZ, PK/APK headers) (Hard Block)
 * - Extension vs true MIME integrity check
 * - Bridge to OCR text screening & QR code URL parsing
 */

import { LAYER_1_REASONS, SIGNAL_TYPE, SIGNAL_WEIGHTS } from "../types.js";
import { inspectText } from "./textRules.js";
import { inspectURL } from "./urlRules.js";

// Known Magic Byte Signatures
const SIGNATURES = {
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  JPEG: [0xFF, 0xD8, 0xFF],
  GIF: [0x47, 0x49, 0x46, 0x38],
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // Followed by WEBP at offset 8
  
  // Malicious / Disguised Headers
  DOS_PE: [0x4D, 0x5A],               // 'MZ' Executable Header
  ZIP_APK: [0x50, 0x4B, 0x03, 0x04],   // 'PK' ZIP/APK Header
  ELF: [0x7F, 0x45, 0x4C, 0x46],       // ELF Linux Binary
};

function matchesBytes(buffer, signature) {
  if (!buffer || buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

/**
 * Inspects image byte buffer, file metadata, OCR text, and decoded QR data
 * @param {object} params
 * @param {Uint8Array|number[]|null} params.bytes - First 16-32 bytes of the file
 * @param {string} params.fileName - Original file name
 * @param {string} params.mimeType - Claimed MIME type
 * @param {number} params.fileSize - File size in bytes
 * @param {string} [params.ocrText] - OCR text extracted from image
 * @param {string} [params.qrContent] - Decoded QR Code URL or string
 * @returns {object} { signals, hardTriggers, details }
 */
export function inspectImage({
  bytes,
  fileName = "",
  mimeType = "",
  fileSize = 0,
  ocrText = "",
  qrContent = "",
}) {
  const signals = [];
  const hardTriggers = [];
  const lowerName = fileName.toLowerCase();

  // 1. Magic Bytes / Polyglot Inspection
  if (bytes && bytes.length >= 4) {
    const uint8 = Array.isArray(bytes) ? new Uint8Array(bytes) : bytes;

    // Check for disguised executable / polyglot attack (HARD BLOCK)
    if (matchesBytes(uint8, SIGNATURES.DOS_PE)) {
      const sig = {
        id: "SIG_POLYGLOT_DOS_PE",
        type: SIGNAL_TYPE.DANGER,
        category: "image",
        title: "Tệp thực thi Windows (DOS/PE MZ) giả mạo định dạng hình ảnh",
        weight: SIGNAL_WEIGHTS.HARD_POLYGLOT_IMAGE,
        snippet: "Signature: MZ (0x4D 0x5A)",
      };
      signals.push(sig);
      hardTriggers.push({
        reason: LAYER_1_REASONS.EXECUTABLE_POLYGLOT,
        signal: sig,
      });
    } else if (matchesBytes(uint8, SIGNATURES.ZIP_APK)) {
      const isClaimedImage = /\.(jpe?g|png|webp|gif)$/i.test(lowerName);
      if (isClaimedImage) {
        const sig = {
          id: "SIG_POLYGLOT_ZIP_APK",
          type: SIGNAL_TYPE.DANGER,
          category: "image",
          title: "Tệp nén / Gói cài đặt ứng dụng (ZIP/APK) ngụy trang bằng đuôi ảnh",
          weight: SIGNAL_WEIGHTS.HARD_POLYGLOT_IMAGE,
          snippet: "Signature: PK (0x50 0x4B)",
        };
        signals.push(sig);
        hardTriggers.push({
          reason: LAYER_1_REASONS.EXECUTABLE_POLYGLOT,
          signal: sig,
        });
      }
    } else if (matchesBytes(uint8, SIGNATURES.ELF)) {
      const sig = {
        id: "SIG_POLYGLOT_ELF",
        type: SIGNAL_TYPE.DANGER,
        category: "image",
        title: "Tệp nhị phân thực thi Linux/Android (ELF) ngụy trang hình ảnh",
        weight: SIGNAL_WEIGHTS.HARD_POLYGLOT_IMAGE,
        snippet: "Signature: ELF",
      };
      signals.push(sig);
      hardTriggers.push({
        reason: LAYER_1_REASONS.EXECUTABLE_POLYGLOT,
        signal: sig,
      });
    } else {
      // Validate authentic image formats
      const isPNG = matchesBytes(uint8, SIGNATURES.PNG);
      const isJPEG = matchesBytes(uint8, SIGNATURES.JPEG);
      const isGIF = matchesBytes(uint8, SIGNATURES.GIF);
      const isWEBP = matchesBytes(uint8, SIGNATURES.WEBP_RIFF);

      if (isPNG || isJPEG || isGIF || isWEBP) {
        signals.push({
          id: "SIG_AUTHENTIC_IMAGE_HEADER",
          type: SIGNAL_TYPE.SAFE,
          category: "image",
          title: "Chữ ký nhị phân Magic Bytes hợp lệ chuẩn quốc tế",
          weight: 0.95,
          snippet: isPNG ? "PNG Image" : isJPEG ? "JPEG Image" : isWEBP ? "WebP Image" : "GIF Image",
        });
      }
    }
  }

  // 2. MIME vs Extension Consistency
  if (lowerName && mimeType) {
    const isExtImage = /\.(jpe?g|png|webp|gif|svg)$/i.test(lowerName);
    const isMimeImage = mimeType.startsWith("image/");

    if (isExtImage !== isMimeImage) {
      signals.push({
        id: "SIG_MIME_MISMATCH",
        type: SIGNAL_TYPE.WARNING,
        category: "image",
        title: `Phát hiện không đồng nhất giữa định dạng tệp (.${lowerName.split(".").pop()}) và MIME (${mimeType})`,
        weight: SIGNAL_WEIGHTS.SOFT_MIME_MISMATCH,
        snippet: `${mimeType} vs ${lowerName}`,
      });
    }
  }

  // 3. File Size Anomaly
  if (fileSize > 25 * 1024 * 1024) {
    signals.push({
      id: "SIG_OVERSIZED_IMAGE",
      type: SIGNAL_TYPE.INFO,
      category: "image",
      title: `Dung lượng tệp ảnh quá lớn (${(fileSize / (1024 * 1024)).toFixed(1)}MB)`,
      weight: 0.15,
      snippet: `${fileSize} bytes`,
    });
  }

  // 4. QR Code inspection bridge
  if (qrContent) {
    const qrInspection = inspectURL(qrContent);
    if (qrInspection.hardTriggers.length > 0) {
      const sig = {
        id: "SIG_QR_MALICIOUS_DESTINATION",
        type: SIGNAL_TYPE.DANGER,
        category: "image",
        title: "Mã QR chứa đường link độc hại / giả mạo đã bị chặn",
        weight: 0.98,
        snippet: qrContent.slice(0, 60),
      };
      signals.push(sig);
      hardTriggers.push({
        reason: LAYER_1_REASONS.QR_CONTAINS_MALICIOUS_URL,
        signal: sig,
      });
    } else {
      signals.push(...qrInspection.signals);
    }
  }

  // 5. OCR Text Phishing screening bridge
  if (ocrText) {
    const textInspection = inspectText(ocrText);
    if (textInspection.hardTriggers.length > 0) {
      const sig = {
        id: "SIG_OCR_PHISHING_CONFIRMED",
        type: SIGNAL_TYPE.DANGER,
        category: "image",
        title: "Văn bản trích xuất từ ảnh chứa chiêu trò lừa đảo / yêu cầu OTP-Mật khẩu trực diện",
        weight: 0.97,
        snippet: ocrText.slice(0, 80),
      };
      signals.push(sig);
      hardTriggers.push({
        reason: LAYER_1_REASONS.OCR_PHISHING_TEXT_DETECTED,
        signal: sig,
      });
    } else {
      signals.push(...textInspection.signals);
    }
  }

  return { signals, hardTriggers };
}
