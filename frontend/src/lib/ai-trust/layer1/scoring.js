/**
 * Compatibility adapter for the retired Layer 1 scoring entry point.
 *
 * The canonical decision boundary is `engine/DecisionEngine.js`.  This file
 * remains importable for older callers, but it never manufactures a clean
 * score, treats a whitelist as a safety proof, or trusts provider-shaped
 * fields.  A caller-supplied legacy hard trigger is conservatively blocked
 * with zero confidence because its provenance cannot be reconstructed here.
 */

import { LAYER_1_REASONS, LAYER_1_STATUS, SIGNAL_SEVERITY, createLayer1Result } from "./types.js";
import { DecisionEngine } from "./engine/DecisionEngine.js";

const LEGACY_SEVERITY = new Set(Object.values(SIGNAL_SEVERITY));

function isRecord(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function read(value, key, fallback = undefined) {
  try {
    return value?.[key] ?? fallback;
  } catch {
    return fallback;
  }
}

function normalizeSignal(value, index) {
  if (!isRecord(value)) return null;
  const rawType = read(value, "type", "");
  const legacyType = typeof rawType === "string" ? rawType.toLowerCase() : "";
  const severity = LEGACY_SEVERITY.has(rawType)
    ? rawType
    : legacyType === "danger"
      ? SIGNAL_SEVERITY.HIGH
      : legacyType === "warning"
        ? SIGNAL_SEVERITY.MEDIUM
        : legacyType === "safe" || legacyType === "info"
          ? SIGNAL_SEVERITY.INFO
          : SIGNAL_SEVERITY.MEDIUM;
  const signalType = typeof rawType === "string" && !["danger", "warning", "safe", "info"].includes(legacyType)
    ? rawType
    : (typeof read(value, "id", "") === "string" ? read(value, "id", "") : `legacy-signal-${index + 1}`);
  const confidence = read(value, "confidence", read(value, "weight", 0));
  return {
    signalId: typeof read(value, "signalId", null) === "string"
      ? read(value, "signalId", null)
      : `legacy-scoring:${signalType}:${index + 1}`,
    type: signalType,
    category: typeof read(value, "category", null) === "string" ? read(value, "category", null) : "legacy",
    severity,
    confidence: Number.isFinite(confidence) ? Math.max(0, Math.min(1, Number(confidence))) : 0,
    evidence: isRecord(read(value, "evidence", null))
      ? read(value, "evidence", null)
      : { snippet: typeof read(value, "snippet", "") === "string" ? read(value, "snippet", "") : "" },
    source: "legacy_scoring_adapter",
  };
}

function normalizeHardTrigger(value, index) {
  if (!isRecord(value)) return null;
  const reason = read(value, "reason", null);
  return {
    reason: typeof reason === "string" && reason.trim() ? reason.slice(0, 120) : LAYER_1_REASONS.PHISHING_PATTERN,
    signal: normalizeSignal(read(value, "signal", null), index),
  };
}

export function evaluateLayer1(params = {}) {
  const input = isRecord(params) ? params : {};
  const signals = (Array.isArray(read(input, "signals", [])) ? read(input, "signals", []) : [])
    .map(normalizeSignal)
    .filter(Boolean);
  const hardTriggers = (Array.isArray(read(input, "hardTriggers", [])) ? read(input, "hardTriggers", []) : [])
    .map(normalizeHardTrigger)
    .filter(Boolean);
  const isWhitelisted = read(input, "isWhitelisted", false) === true;

  if (hardTriggers.length > 0) {
    return createLayer1Result({
      status: LAYER_1_STATUS.BLOCK,
      confidence: 0,
      reasons: Array.from(new Set(hardTriggers.map((trigger) => trigger.reason))),
      signals,
      nextLayer: null,
      requestId: typeof read(input, "requestId", null) === "string" ? read(input, "requestId", null) : null,
      details: {
        hardTriggersCount: hardTriggers.length,
        matchedRules: ["LEGACY_HARD_TRIGGER_UNRECONSTRUCTED"],
        decisionRationale: "Legacy hard trigger received without a reconstructable canonical provenance record; conservatively blocked.",
      },
      metrics: { providerIndependent: true, ruleVersion: "legacy-adapter-v2" },
    });
  }

  return DecisionEngine.resolve({
    signals,
    isWhitelisted,
    requestId: typeof read(input, "requestId", null) === "string" ? read(input, "requestId", null) : null,
    metrics: { providerIndependent: true, ruleVersion: "legacy-adapter-v2" },
  });
}
