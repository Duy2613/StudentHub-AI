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
export async function executeAuxiliaryModelSafe({
  model = null,
  type = "text",
  content = "",
  context = {},
  timeoutMs = 1500,
}) {
  if (!model || !(model instanceof ITrustSignalModel)) {
    return { modelSignals: [], modelUsed: null };
  }

  const modelSignals = [];

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`Model execution timed out after ${timeoutMs}ms`)), timeoutMs)
    );

    const executionPromise = (async () => {
      if (type === "url") {
        return await model.analyzeUrl({ url: content, context });
      }
      return await model.analyzeText({ text: content, context });
    })();

    const result = await Promise.race([executionPromise, timeoutPromise]);

    if (result && typeof result === "object") {
      // Validate and clamp model confidence
      const clampedConfidence = Math.max(0, Math.min(1, Number(result.confidence) || 0.5));

      if (result.isSuspicious) {
        // Model contributes ONLY to SUSPICIOUS (Severity MEDIUM), never CRITICAL / BLOCK
        modelSignals.push(
          createSignal({
            type: LAYER_1_REASONS.PHISHING_PATTERN,
            category: "model",
            severity: SIGNAL_SEVERITY.MEDIUM,
            confidence: Math.min(0.75, clampedConfidence),
            evidence: {
              modelName: model.name,
              modelLabel: String(result.modelLabel || "model_suspicion").slice(0, 50),
              details: "Auxiliary lightweight model indicated potential anomaly (Secondary corroboration only)",
            },
            source: model.name,
          })
        );
      }
    }

    return { modelSignals, modelUsed: model.name };
  } catch (err) {
    SecurityLogger.warn(`Auxiliary model '${model.name}' failed or timed out (${err?.name || "model_error"}). Falling back to deterministic rules.`);
    return { modelSignals: [], modelUsed: null };
  }
}
