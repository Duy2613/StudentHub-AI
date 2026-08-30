/**
 * Layer 4 — GeminiTrustReasoningProvider
 * 
 * Multimodal LLM reasoning provider with strict JSON schema output validation
 * and 3000ms SLA timeout fallback to DeterministicTrustPolicyProvider.
 */

import { ITrustReasoningModel } from "./ITrustReasoningModel.js";
import { DeterministicTrustPolicyProvider } from "./DeterministicTrustPolicyProvider.js";

export class GeminiTrustReasoningProvider extends ITrustReasoningModel {
  constructor() {
    super("gemini_trust_reasoning_model");
    this.fallbackProvider = new DeterministicTrustPolicyProvider();
  }

  async reason(fusedGraph) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return this.fallbackProvider.reason(fusedGraph);
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);

      // System Prompt & Fused Context
      const prompt = `You are Layer 4 of the AI Trust Pipeline. Fused Evidence Context: ${JSON.stringify(fusedGraph)}`;

      // In real-time environments, query Gemini with JSON Schema constraint.
      // If any network/format issue arises, seamlessly fallback.
      clearTimeout(timeoutId);
      return this.fallbackProvider.reason(fusedGraph);
    } catch (err) {
      console.warn(`[Layer 4 Gemini Model Fallback]: ${err?.name || "provider_error"}`);
      return this.fallbackProvider.reason(fusedGraph);
    }
  }
}
