/**
 * Layer 1 — OcrDetector
 * 
 * Extracts and screens text embedded inside images/screenshots.
 * Bridges extracted text safely into TextDetector with location tagging.
 */

import { LAYER_1_CONFIG } from "../config/Layer1Config.js";
import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";
import { NormalizationService } from "../normalization/NormalizationService.js";
import { TextDetector } from "./TextDetector.js";

export class OcrDetector {
  /**
   * Screens text extracted via OCR
   * @param {string} rawOcrText
   * @returns {object} { signals, ocrText }
   */
  static detect(rawOcrText) {
    const signals = [];
    if (!rawOcrText || typeof rawOcrText !== "string" || !rawOcrText.trim()) {
      return { signals, ocrText: "" };
    }

    const boundedText = rawOcrText.slice(0, LAYER_1_CONFIG.LIMITS.MAX_OCR_TEXT_LENGTH);
    const norm = NormalizationService.normalizeText(boundedText);
    const textResult = TextDetector.detect(norm);

    for (const sig of textResult.signals) {
      // Elevate or wrap as OCR Phishing signal if critical/high
      if (sig.severity === SIGNAL_SEVERITY.CRITICAL || sig.severity === SIGNAL_SEVERITY.HIGH) {
        signals.push(
          createSignal({
            type: LAYER_1_REASONS.OCR_PHISHING_PATTERN,
            category: "image",
            severity: sig.severity,
            confidence: sig.confidence,
            evidence: {
              ...sig.evidence,
              location: "ocr_extracted_text",
              originalType: sig.type,
            },
            source: "OcrDetector",
          })
        );
      } else {
        signals.push({
          ...sig,
          evidence: {
            ...sig.evidence,
            location: "ocr_extracted_text",
          },
          source: "OcrDetector",
        });
      }
    }

    return { signals, ocrText: boundedText };
  }
}
