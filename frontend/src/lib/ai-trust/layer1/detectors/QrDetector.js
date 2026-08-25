/**
 * Layer 1 — QrDetector
 * 
 * Safely decodes and screens QR code payloads (URLs or Text).
 * Bridges decoded URLs into UrlDetector and text into TextDetector.
 */

import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";
import { NormalizationService } from "../normalization/NormalizationService.js";
import { UrlDetector } from "./UrlDetector.js";
import { TextDetector } from "./TextDetector.js";

export class QrDetector {
  /**
   * Screens a decoded QR code payload
   * @param {string} qrPayload
   * @returns {object} { signals, qrPayload }
   */
  static detect(qrPayload) {
    const signals = [];
    if (!qrPayload || typeof qrPayload !== "string" || !qrPayload.trim()) {
      return { signals, qrPayload: "" };
    }

    const trimmed = qrPayload.trim();
    const isUrl = /^https?:\/\//i.test(trimmed) || /^[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(trimmed);

    if (isUrl) {
      const normUrl = NormalizationService.normalizeUrl(trimmed);
      const urlResult = UrlDetector.detect(normUrl);

      for (const sig of urlResult.signals) {
        if (sig.severity === SIGNAL_SEVERITY.CRITICAL || sig.severity === SIGNAL_SEVERITY.HIGH) {
          signals.push(
            createSignal({
              type: LAYER_1_REASONS.QR_MALICIOUS_URL,
              category: "image",
              severity: sig.severity,
              confidence: sig.confidence,
              evidence: {
                ...sig.evidence,
                location: "qr_code_destination",
                rawPayload: trimmed,
                originalType: sig.type,
              },
              source: "QrDetector",
            })
          );
        } else {
          signals.push({
            ...sig,
            evidence: {
              ...sig.evidence,
              location: "qr_code_destination",
            },
            source: "QrDetector",
          });
        }
      }
    } else {
      const normText = NormalizationService.normalizeText(trimmed);
      const textResult = TextDetector.detect(normText);

      for (const sig of textResult.signals) {
        signals.push({
          ...sig,
          evidence: {
            ...sig.evidence,
            location: "qr_code_text",
          },
          source: "QrDetector",
        });
      }
    }

    return { signals, qrPayload: trimmed };
  }
}
