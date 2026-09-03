/**
 * Retired image/file-rules compatibility adapter.
 *
 * ImageDetector owns the canonical binary, OCR, and QR boundary.  Keeping a
 * single implementation prevents this older import path from bypassing the
 * current fail-safe rules or turning a valid media header into SAFE.
 */

import { ImageDetector } from "../detectors/ImageDetector.js";
import { SIGNAL_SEVERITY } from "../types.js";

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function inspectImage(params = {}) {
  const input = isRecord(params) ? params : {};
  const result = ImageDetector.detect({
    bytes: input.bytes ?? null,
    fileName: typeof input.fileName === "string" ? input.fileName : "",
    mimeType: typeof input.mimeType === "string" ? input.mimeType : "",
    fileSize: Number.isFinite(input.fileSize) && input.fileSize >= 0 ? input.fileSize : 0,
    ocrText: typeof input.ocrText === "string" ? input.ocrText : "",
    qrContent: typeof input.qrContent === "string" ? input.qrContent : "",
    metadata: isRecord(input.metadata) ? input.metadata : {},
  });
  const signals = Array.isArray(result.signals) ? result.signals : [];
  const hardTriggers = signals
    .filter((signal) => signal?.severity === SIGNAL_SEVERITY.CRITICAL)
    .map((signal) => ({ reason: signal.type, signal }));
  return {
    signals,
    hardTriggers,
    details: { detectedType: typeof result.detectedType === "string" ? result.detectedType : "unknown" },
  };
}
