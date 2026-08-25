/**
 * Layer 1 — ImageDetector
 * 
 * Orchestrates multi-modal image screening:
 * - Binary magic bytes verification (FileDetector)
 * - EXIF / Metadata anomaly screening
 * - Embedded QR Code screening (QrDetector)
 * - OCR Screenshot text screening (OcrDetector)
 */

import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";
import { FileDetector } from "./FileDetector.js";
import { OcrDetector } from "./OcrDetector.js";
import { QrDetector } from "./QrDetector.js";

export class ImageDetector {
  /**
   * Evaluates image file binary, metadata, OCR, and QR data
   * @param {object} params
   * @param {Uint8Array|Array} [params.bytes]
   * @param {string} [params.fileName]
   * @param {string} [params.mimeType]
   * @param {number} [params.fileSize]
   * @param {string} [params.ocrText]
   * @param {string} [params.qrContent]
   * @param {object} [params.metadata]
   * @returns {object} { signals, detectedType }
   */
  static detect({
    bytes = null,
    fileName = "",
    mimeType = "",
    fileSize = 0,
    ocrText = "",
    qrContent = "",
    metadata = {},
  }) {
    const signals = [];

    // 1. Binary container & Polyglot inspection
    const fileRes = FileDetector.detect({ bytes, fileName, mimeType, fileSize });
    signals.push(...fileRes.signals);

    // 2. Metadata Anomaly Inspection
    if (metadata && typeof metadata === "object") {
      const suspiciousSoftware = ["photoshop", "gimp", "canva", "deepfake_generator", "face_swap"];
      const software = String(metadata.software || metadata.editor || "").toLowerCase();
      if (suspiciousSoftware.some((s) => software.includes(s))) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.ANOMALOUS_METADATA,
            category: "image",
            severity: SIGNAL_SEVERITY.LOW,
            confidence: 0.30,
            evidence: { software, details: "Editing software signature observed in metadata (Weak signal)" },
            source: "ImageDetector",
          })
        );
      }
    }

    // 3. QR Code payload screening
    if (qrContent) {
      const qrRes = QrDetector.detect(qrContent);
      signals.push(...qrRes.signals);
    }

    // 4. OCR Screenshot text screening
    if (ocrText) {
      const ocrRes = OcrDetector.detect(ocrText);
      signals.push(...ocrRes.signals);
    }

    return {
      signals,
      detectedType: fileRes.detectedType,
    };
  }
}
