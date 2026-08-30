/**
 * Layer 1 — Layer1ScreenService
 * 
 * Orchestration Service for Fast & Deterministic Screening:
 * - Request validation & bound enforcement
 * - Normalization & anti-evasion stream generation
 * - Fast detector dispatch (URL, Text, File, Image, OCR, QR)
 * - Hard rule evaluation with immediate short-circuiting
 * - Optional auxiliary model execution with fallback
 * - Signal aggregation, confidence calibration & decision resolution
 * - Observability & PII-redacted structured audit logging
 */

import { LAYER_1_CONFIG } from "./config/Layer1Config.js";
import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "./types.js";
import { SecurityLogger } from "./observability/SecurityLogger.js";
import { NormalizationService } from "./normalization/NormalizationService.js";
import { UrlDetector } from "./detectors/UrlDetector.js";
import { TextDetector } from "./detectors/TextDetector.js";
import { FileDetector } from "./detectors/FileDetector.js";
import { ImageDetector } from "./detectors/ImageDetector.js";
import { DecisionEngine } from "./engine/DecisionEngine.js";
import { executeAuxiliaryModelSafe } from "./models/ITrustSignalModel.js";

export class Layer1ScreenService {
  /**
   * Main entry point for screening any input at Layer 1
   * @param {object} params
   * @param {"url"|"text"|"image"|"file"} params.type
   * @param {string} [params.content=""]
   * @param {object} [params.metadata={}]
   * @param {object} [params.options={}]
   * @returns {Promise<object>} Standardized Layer 1 Output Schema
   */
  static async screen(params = {}) {
    const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
    const type = input.type === undefined ? "text" : input.type;
    const content = input.content === undefined ? "" : input.content;
    const metadata = input.metadata && typeof input.metadata === "object" && !Array.isArray(input.metadata) ? input.metadata : {};
    const options = input.options && typeof input.options === "object" && !Array.isArray(input.options) ? input.options : {};
    const startTime = typeof performance !== "undefined" ? performance.now() : Date.now();
    const requestId = typeof options.requestId === "string" && options.requestId.trim()
      ? options.requestId.trim().slice(0, 160)
      : `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const normalizedType = String(type || "text").toLowerCase();
    const detectorsExecuted = ["NormalizationService"];

    const rawSignals = [];
    let isWhitelisted = false;
    let forceUnknown = false;
    let unknownReason = null;

    try {
      // 1. Dispatch according to input type
      if (normalizedType === "url" || normalizedType === "link") {
        detectorsExecuted.push("UrlDetector");
        const normUrl = NormalizationService.normalizeUrl(content);
        forceUnknown = !normUrl.isValid;
        unknownReason = normUrl.invalidReason || null;

        if (normUrl.isOverLength) {
          rawSignals.push(
            createSignal({
              type: LAYER_1_REASONS.PAYLOAD_LIMIT_EXCEEDED,
              category: "url",
              severity: SIGNAL_SEVERITY.HIGH,
              confidence: 0.70,
              evidence: { length: normUrl.original.length, limit: LAYER_1_CONFIG.LIMITS.MAX_URL_LENGTH },
              source: "NormalizationService",
            })
          );
        }

        const urlRes = UrlDetector.detect(normUrl);
        rawSignals.push(...urlRes.signals);
        isWhitelisted = urlRes.isWhitelisted;
      } else if (normalizedType === "image") {
        detectorsExecuted.push("ImageDetector", "FileDetector");
        if (metadata.ocrText) detectorsExecuted.push("OcrDetector");
        if (metadata.qrContent) detectorsExecuted.push("QrDetector");

        const normBytes = NormalizationService.normalizeBytes(metadata.bytes || content, metadata.fileSize || 0);
        forceUnknown = !normBytes.isValid;
        unknownReason = normBytes.isOverSize ? LAYER_1_REASONS.OVERSIZED_FILE : "BINARY_INPUT_UNAVAILABLE_OR_MALFORMED";

        const imgRes = ImageDetector.detect({
          bytes: normBytes.bytes,
          fileName: metadata.fileName || "",
          mimeType: metadata.mimeType || "",
          fileSize: metadata.fileSize || 0,
          ocrText: metadata.ocrText || (typeof content === "string" && !content.startsWith("data:") ? content : ""),
          qrContent: metadata.qrContent || "",
          metadata: metadata.exif || {},
        });
        rawSignals.push(...imgRes.signals);
      } else if (normalizedType === "file") {
        detectorsExecuted.push("FileDetector");
        const normBytes = NormalizationService.normalizeBytes(metadata.bytes || content, metadata.fileSize || 0);
        forceUnknown = !normBytes.isValid;
        unknownReason = normBytes.isOverSize ? LAYER_1_REASONS.OVERSIZED_FILE : "BINARY_INPUT_UNAVAILABLE_OR_MALFORMED";

        const fileRes = FileDetector.detect({
          bytes: normBytes.bytes,
          fileName: metadata.fileName || "",
          mimeType: metadata.mimeType || "",
          fileSize: metadata.fileSize || 0,
        });
        rawSignals.push(...fileRes.signals);
      } else {
        // Text Screening
        detectorsExecuted.push("TextDetector");
        const normText = NormalizationService.normalizeText(content);
        forceUnknown = !normText.isValid;
        unknownReason = normText.isValid ? null : "TEXT_INPUT_EMPTY_OR_MALFORMED";

        if (normText.isOverLength) {
          rawSignals.push(
            createSignal({
              type: LAYER_1_REASONS.PAYLOAD_LIMIT_EXCEEDED,
              category: "text",
              severity: SIGNAL_SEVERITY.HIGH,
              confidence: 0.70,
              evidence: { length: normText.original.length, limit: LAYER_1_CONFIG.LIMITS.MAX_TEXT_LENGTH },
              source: "NormalizationService",
            })
          );
        }

        const textRes = TextDetector.detect(normText);
        rawSignals.push(...textRes.signals);
      }

      // 2. Optional Auxiliary Model execution (if configured)
      let modelUsed = null;
      if (options.auxiliaryModel && !isWhitelisted) {
        detectorsExecuted.push("ITrustSignalModel");
        const modelRes = await executeAuxiliaryModelSafe({
          model: options.auxiliaryModel,
          type: normalizedType,
          content,
          context: metadata,
        });
        if (modelRes.modelSignals.length > 0) {
          rawSignals.push(...modelRes.modelSignals);
          modelUsed = modelRes.modelUsed;
        }
      }

      // 3. Measure Execution Time
      const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      const executionTimeMs = Number((endTime - startTime).toFixed(2));

      const metrics = {
        executionTimeMs,
        detectorsExecuted,
        ruleVersion: LAYER_1_CONFIG.RULE_VERSION,
        modelUsed,
        timestamp: Date.now(),
        inputType: normalizedType,
        providerIndependent: true,
      };

      // 4. Resolve Decision
      detectorsExecuted.push("DecisionEngine");
      const finalResult = DecisionEngine.resolve({
        signals: rawSignals,
        isWhitelisted,
        requestId,
        metrics,
        forceUnknown,
        unknownReason,
      });

      finalResult.signals = finalResult.signals.map((signal) => ({
        ...signal,
        requestId,
        observedAt: signal.observedAt || new Date().toISOString(),
      }));

      // 5. Emit PII-Redacted Security Audit Log
      SecurityLogger.logScreenEvent({
        ...finalResult,
        inputType: normalizedType,
      });

      return finalResult;
    } catch (err) {
      SecurityLogger.error(`Layer 1 Screening failed for request ${requestId}:`, err);
      // Safe fallback on unexpected internal failure (Never fail open)
      const endTime = typeof performance !== "undefined" ? performance.now() : Date.now();
      return DecisionEngine.resolve({
        signals: [
          createSignal({
            type: LAYER_1_REASONS.PHISHING_PATTERN,
            category: "system",
            severity: SIGNAL_SEVERITY.HIGH,
            confidence: 0,
            evidence: { details: "Internal error during inspection; safely routed to Layer 2" },
            source: "Layer1ScreenService_ErrorHandler",
          }),
        ],
        isWhitelisted: false,
        requestId,
        metrics: {
          executionTimeMs: Number((endTime - startTime).toFixed(2)),
          detectorsExecuted,
          ruleVersion: LAYER_1_CONFIG.RULE_VERSION,
          modelUsed: null,
          timestamp: Date.now(),
          inputType: normalizedType,
          providerIndependent: true,
        },
        forceUnknown: true,
        unknownReason: "LAYER1_INTERNAL_FAILURE",
      });
    }
  }
}
