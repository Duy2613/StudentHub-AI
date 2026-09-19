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

const PAYMENT_PROOF_REGEX = /(?:chuyển\s*khoản|giao\s*dịch|biên\s*lai|receipt|thanh\s*toán|hóa\s*đơn|invoice)[\s\S]{0,120}(?:giả|fake|làm\s*giả|không\s*có\s*thật)|(?:giả|fake|làm\s*giả|không\s*có\s*thật)[\s\S]{0,120}(?:chuyển\s*khoản|giao\s*dịch|biên\s*lai|receipt|thanh\s*toán|hóa\s*đơn|invoice)/i;
const DOCUMENT_TAMPERING_REGEX = /(?:hóa\s*đơn|hoa\s*don|invoice|biên\s*lai|receipt|giao\s*dịch|chuyển\s*khoản)[\s\S]{0,120}(?:chỉnh\s*sửa|sửa\s*số\s*tiền|thay\s*đổi\s*số\s*tiền|photoshop|cắt\s*ghép|edited|tampered)|(?:chỉnh\s*sửa|sửa\s*số\s*tiền|thay\s*đổi\s*số\s*tiền|photoshop|cắt\s*ghép|edited|tampered)[\s\S]{0,120}(?:hóa\s*đơn|hoa\s*don|invoice|biên\s*lai|receipt|giao\s*dịch|chuyển\s*khoản)/i;

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

    if (PAYMENT_PROOF_REGEX.test(boundedText)) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.PAYMENT_PROOF_FRAUD,
          category: "financial_fraud",
          severity: SIGNAL_SEVERITY.HIGH,
          confidence: 0.86,
          evidence: {
            snippet: boundedText.slice(0, 180),
            location: "ocr_extracted_text",
            details: "OCR mô tả biên lai/chuyển khoản có dấu hiệu giả mạo.",
          },
          source: "OcrDetector",
        })
      );
    }

    if (DOCUMENT_TAMPERING_REGEX.test(boundedText)) {
      signals.push(
        createSignal({
          type: LAYER_1_REASONS.DOCUMENT_TAMPERING,
          category: "document_integrity",
          severity: SIGNAL_SEVERITY.HIGH,
          confidence: 0.9,
          evidence: {
            snippet: boundedText.slice(0, 180),
            location: "ocr_extracted_text",
            details: "OCR mô tả tài liệu/hóa đơn có dấu hiệu chỉnh sửa số tiền hoặc cắt ghép.",
          },
          source: "OcrDetector",
        })
      );
    }

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
