/**
 * Retired text-rules compatibility adapter.
 *
 * TextDetector is the canonical implementation.  This adapter preserves the
 * old `{ signals, hardTriggers, isEducational }` shape without emitting a
 * SAFE signal or treating educational wording as an allow decision.
 */

import { NormalizationService } from "../normalization/NormalizationService.js";
import { TextDetector } from "../detectors/TextDetector.js";
import { SIGNAL_SEVERITY } from "../types.js";

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function inspectText(textContent) {
  const normalized = NormalizationService.normalizeText(textContent);
  const result = TextDetector.detect(normalized);
  const signals = Array.isArray(result.signals)
    ? result.signals.map((signal) => {
      const evidence = isRecord(signal?.evidence) ? signal.evidence : {};
      return {
        ...signal,
        legacyType: signal?.severity === SIGNAL_SEVERITY.CRITICAL || signal?.severity === SIGNAL_SEVERITY.HIGH
          ? "danger"
          : signal?.severity === SIGNAL_SEVERITY.MEDIUM
            ? "warning"
            : "info",
        id: signal?.signalId,
        weight: signal?.confidence,
        snippet: evidence.matchedText || evidence.snippet || "",
      };
    })
    : [];
  const hardTriggers = signals
    .filter((signal) => signal.severity === SIGNAL_SEVERITY.CRITICAL)
    .map((signal) => ({ reason: signal.type, signal }));

  return {
    signals,
    hardTriggers,
    isEducational: result.isEducational === true,
  };
}
