/**
 * Layer 1 — FileDetector
 * 
 * Inspects file binary signatures (Magic Bytes), detects polyglot payloads,
 * extension spoofing, and dangerous disguised binaries.
 */

import { LAYER_1_CONFIG } from "../config/Layer1Config.js";
import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";

// Canonical Magic Byte Signatures
const MAGIC_SIGNATURES = {
  PNG: [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
  JPEG: [0xFF, 0xD8, 0xFF],
  GIF87A: [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
  GIF89A: [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  PDF: [0x25, 0x50, 0x44, 0x46], // %PDF
  ZIP_APK: [0x50, 0x4B, 0x03, 0x04], // PK
  WEBP_RIFF: [0x52, 0x49, 0x46, 0x46], // RIFF...WEBP
  GZIP: [0x1F, 0x8B],

  // Dangerous Executable Signatures
  DOS_PE_MZ: [0x4D, 0x5A], // Windows PE EXE/DLL
  ELF_LINUX: [0x7F, 0x45, 0x4C, 0x46], // Linux Binary
  MACH_O_32: [0xFE, 0xED, 0xFA, 0xCE], // macOS 32-bit
  MACH_O_64: [0xFE, 0xED, 0xFA, 0xCF], // macOS 64-bit
};

function matchBytes(buffer, signature) {
  if (!buffer || buffer.length < signature.length) return false;
  for (let i = 0; i < signature.length; i++) {
    if (buffer[i] !== signature[i]) return false;
  }
  return true;
}

export class FileDetector {
  /**
   * Validates binary signature and detects spoofed extensions
   * @param {object} params
   * @param {Uint8Array|Array} params.bytes
   * @param {string} params.fileName
   * @param {string} params.mimeType
   * @param {number} params.fileSize
   * @returns {object} { signals, detectedType }
   */
  static detect({ bytes = null, fileName = "", mimeType = "", fileSize = 0 }) {
    const signals = [];
    let detectedType = "unknown";
    const lowerName = String(fileName || "").toLowerCase();
    const ext = lowerName.includes(".") ? lowerName.split(".").pop() : "";

    // 1. File Size Bounds Check
    if (fileSize > LAYER_1_CONFIG.LIMITS.MAX_FILE_SIZE_BYTES) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.OVERSIZED_FILE,
          category: "file",
          severity: SIGNAL_SEVERITY.HIGH,
          confidence: 0.80,
          evidence: { fileSize, maxAllowed: LAYER_1_CONFIG.LIMITS.MAX_FILE_SIZE_BYTES, details: "File exceeds safe processing limit" },
          source: "FileDetector",
        })
      );
    }

    if (!bytes || bytes.length < 4) {
      return { signals, detectedType };
    }

    const uint8 = Array.isArray(bytes) ? new Uint8Array(bytes) : bytes;

    // 2. Disguised Executable / Polyglot Detection (CRITICAL)
    if (matchBytes(uint8, MAGIC_SIGNATURES.DOS_PE_MZ)) {
      detectedType = "exe/dll";
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.EXECUTABLE_POLYGLOT,
          category: "file",
          severity: SIGNAL_SEVERITY.CRITICAL,
          confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.MAGIC_BYTE_MISMATCH,
          evidence: {
            fileName,
            claimedExt: ext,
            trueSignature: "DOS/PE (MZ) Executable",
            details: "Windows PE executable disguised as non-executable document/image",
          },
          source: "FileDetector",
        })
      );
    } else if (matchBytes(uint8, MAGIC_SIGNATURES.ELF_LINUX)) {
      detectedType = "elf";
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.EXECUTABLE_POLYGLOT,
          category: "file",
          severity: SIGNAL_SEVERITY.CRITICAL,
          confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.MAGIC_BYTE_MISMATCH,
          evidence: {
            fileName,
            claimedExt: ext,
            trueSignature: "ELF Binary",
            details: "Linux executable disguised as safe format",
          },
          source: "FileDetector",
        })
      );
    } else if (matchBytes(uint8, MAGIC_SIGNATURES.ZIP_APK)) {
      detectedType = "zip/apk";
      if (["jpg", "jpeg", "png", "gif", "pdf"].includes(ext)) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.MAGIC_BYTE_MISMATCH,
            category: "file",
            severity: SIGNAL_SEVERITY.CRITICAL,
            confidence: LAYER_1_CONFIG.DETECTOR_RELIABILITY.MAGIC_BYTE_MISMATCH,
            evidence: {
              fileName,
              claimedExt: ext,
              trueSignature: "ZIP/APK Archive",
              details: "Archive or Android APK container spoofing safe media extension",
            },
            source: "FileDetector",
          })
        );
      }
    } else {
      // 3. Authentic Safe Container Validation
      if (matchBytes(uint8, MAGIC_SIGNATURES.PNG)) detectedType = "png";
      else if (matchBytes(uint8, MAGIC_SIGNATURES.JPEG)) detectedType = "jpeg";
      else if (matchBytes(uint8, MAGIC_SIGNATURES.GIF87A) || matchBytes(uint8, MAGIC_SIGNATURES.GIF89A)) detectedType = "gif";
      else if (matchBytes(uint8, MAGIC_SIGNATURES.WEBP_RIFF)) detectedType = "webp";
      else if (matchBytes(uint8, MAGIC_SIGNATURES.PDF)) detectedType = "pdf";

      if (detectedType !== "unknown") {
        // Check for extension vs actual container mismatch
        const isExtMatch = (detectedType === "jpeg" && ["jpg", "jpeg"].includes(ext)) ||
                           (detectedType === "png" && ext === "png") ||
                           (detectedType === "pdf" && ext === "pdf") ||
                           (detectedType === "webp" && ext === "webp") ||
                           (detectedType === "gif" && ext === "gif");

        if (!isExtMatch && ext) {
          signals.push(
            createSignal({
              type: LAYER_1_REASONS.MIME_MISMATCH,
              category: "file",
              severity: SIGNAL_SEVERITY.MEDIUM,
              confidence: 0.55,
              evidence: {
                fileName,
                claimedExt: ext,
                detectedType,
                details: `Claimed extension .${ext} differs from detected container type (${detectedType})`,
              },
              source: "FileDetector",
            })
          );
        }
      }
    }

    return { signals, detectedType };
  }
}
