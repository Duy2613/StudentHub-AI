/**
 * Layer 1 — ITrustSignalModel (Model Strategy & Abstraction)
 * 
 * Defines the pluggable auxiliary model interface for Layer 1.
 * Enforces safety boundaries:
 * - A model NEVER has unilateral BLOCK authority.
 * - Model failure / timeout falls back safely to deterministic rules.
 * - Schema validation and confidence bounds clamping [0.0 - 1.0].
 */

import { LAYER_1_REASONS, SIGNAL_SEVERITY, createSignal } from "../types.js";
import { SecurityLogger } from "../observability/SecurityLogger.js";

/**
 * Base Abstract Model Interface
 */
export class ITrustSignalModel {
  constructor(name = "base_trust_model") {
    this.name = name;
  }

  /**
   * Evaluates text through auxiliary model
   * @param {object} params
   * @param {string} params.text
   * @param {object} [params.context]
   * @returns {Promise<object|null>} { isSuspicious, confidence, modelLabel, rawOutput }
   */
  async analyzeText({ text, context = {} }) {
    throw new Error("analyzeText must be implemented by subclass");
  }

  /**
   * Evaluates URL through auxiliary model
   * @param {object} params
   * @param {string} params.url
   * @param {object} [params.context]
   * @returns {Promise<object|null>}
   */
  async analyzeUrl({ url, context = {} }) {
    throw new Error("analyzeUrl must be implemented by subclass");
  }
}

/**
 * Safe Model Invocation Wrapper with Timeout & Fallback
 */
export async function executeAuxiliaryModelSafe(params = {}) {
  const input = params && typeof params === "object" && !Array.isArray(params) ? params : {};
  const model = input.model || null;
  const type = typeof input.type === "string" ? input.type : "text";
  const content = input.content ?? "";
  const context = input.context && typeof input.context === "object" && !Array.isArray(input.context) ? input.context : {};
  const timeoutMs = input.timeoutMs;

  let isSupportedModel = false;
  try {
    isSupportedModel = Boolean(model && model instanceof ITrustSignalModel);
  } catch {
    isSupportedModel = false;
  }
  if (!isSupportedModel) {
    return { modelSignals: [], modelUsed: null };
  }

  const modelSignals = [];
  let rawModelName = "";
  try {
    rawModelName = model.name;
  } catch {
    rawModelName = "";
  }
  const modelName = typeof rawModelName === "string" && rawModelName.trim()
    ? rawModelName.trim().slice(0, 120)
    : "auxiliary_trust_model";
  const boundedTimeoutMs = typeof timeoutMs === "number" && Number.isFinite(timeoutMs)
    ? Math.max(1, Math.min(10_000, timeoutMs))
    : 1500;
  let timeoutHandle = null;

  try {
    const timeoutPromise = new Promise((_, reject) =>
      timeoutHandle = setTimeout(() => reject(new Error(`Model execution timed out after ${boundedTimeoutMs}ms`)), boundedTimeoutMs)
    );

    const executionPromise = (async () => {
      if (type === "url") {
        return await model.analyzeUrl({ url: content, context });
      }
      return await model.analyzeText({ text: content, context });
    })();

    const result = await Promise.race([executionPromise, timeoutPromise]);

    if (result && typeof result === "object") {
      // Invalid or missing model confidence is unknown (0), never an invented
      // midpoint that could make an uncalibrated model appear trustworthy.
      const clampedConfidence = typeof result.confidence === "number" && Number.isFinite(result.confidence)
        ? Math.max(0, Math.min(1, result.confidence))
        : 0;

      if (result.isSuspicious === true) {
        // Model contributes ONLY to SUSPICIOUS (Severity MEDIUM), never CRITICAL / BLOCK
        modelSignals.push(
          createSignal({
            type: LAYER_1_REASONS.PHISHING_PATTERN,
            category: "model",
            severity: SIGNAL_SEVERITY.MEDIUM,
            confidence: Math.min(0.75, clampedConfidence),
            evidence: {
              modelName,
              modelLabel: typeof result.modelLabel === "string" ? result.modelLabel.slice(0, 50) : "unlabelled_model_signal",
              details: "Auxiliary lightweight model indicated potential anomaly (Secondary corroboration only)",
            },
            source: modelName,
          })
        );
      }
    }

    return { modelSignals, modelUsed: modelName };
  } catch (err) {
    SecurityLogger.warn(`Auxiliary model '${modelName}' failed or timed out (${err?.name || "model_error"}). Falling back to deterministic rules.`);
    return { modelSignals: [], modelUsed: null };
  } finally {
    if (timeoutHandle !== null) clearTimeout(timeoutHandle);
  }
}
