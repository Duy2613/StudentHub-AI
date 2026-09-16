/**
 * AI Gateway — AIGatewayService
 *
 * The single server-side entry point every Layer/Engine must use to reach
 * an LLM. No UI component and no Layer may call `fetch()` against a vendor
 * directly — that logic lives exclusively in provider adapters, invoked
 * exclusively through this facade + ModelRouter.
 *
 * Responsibilities (Master Prompt Section R):
 *   - provider adapters (via ModelRouter)
 *   - capability routing
 *   - structured output + schema validation
 *   - timeout + fallback (via ModelRouter)
 *   - cost/latency/provenance recording
 *   - never fabricate a "live success" when nothing is configured
 */

import { ModelRouter } from "./ModelRouter.js";
import { AI_GATEWAY_CONFIG } from "./config/AIGatewayConfig.js";
import { createGatewayResult } from "./types.js";

const defaultRouter = new ModelRouter();

export class AIGatewayService {
  /**
   * Generates plain text for a given capability with automatic fallback.
   * @param {object} params
   * @param {string} params.capability
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {Array<object>} [params.inputParts] - optional provider-neutral media
   *   parts for a multimodal request
   * @param {object} [params.options]
   * @returns {Promise<object>} normalized Gateway result (see types.js)
   */
  static async generateText({ capability, systemPrompt, userPrompt, inputParts = null, options = {} }) {
    const router = options.router || defaultRouter;
    const startedAt = Date.now();

    const boundedPrompt = String(userPrompt || "").slice(
      0,
      AI_GATEWAY_CONFIG.LIMITS.MAX_PROMPT_CHARACTERS
    );

    const routed = await router.route({
      capability,
      systemPrompt,
      userPrompt: boundedPrompt,
      inputParts,
      jsonMode: false,
      timeoutMs: options.timeoutMs,
      maxOutputTokens: options.maxOutputTokens,
      signal: options.signal,
    });

    const totalLatencyMs = Date.now() - startedAt;

    if (!routed.ok) {
      return createGatewayResult({
        ok: false,
        capability,
        attempts: routed.attempts,
        errorType: routed.errorType,
        errorMessage: routed.errorMessage,
        requestId: options.requestId,
        totalLatencyMs,
        providerMetadata: routed.providerMetadata,
      });
    }

    return createGatewayResult({
      ok: true,
      capability,
      provider: routed.provider,
      model: routed.model,
      text: routed.text,
      attempts: routed.attempts,
      requestId: options.requestId,
      totalLatencyMs,
      providerMetadata: routed.providerMetadata,
    });
  }

  /**
   * Generates JSON matching an expected shape, with schema validation.
   * `validate(json) => true|false` is a caller-supplied guard (cheap
   * structural check — this gateway does not depend on a JSON-schema
   * library to keep the dependency surface minimal).
   *
   * @param {object} params
   * @param {string} params.capability
   * @param {string} params.systemPrompt
   * @param {string} params.userPrompt
   * @param {Array<object>} [params.inputParts] - optional provider-neutral media
   *   parts for a multimodal request
   * @param {(json: unknown) => boolean} [params.validate]
   * @param {object} [params.options]
   * @returns {Promise<object>} normalized Gateway result; `json` is populated only when ok
   */
  static async generateStructured({ capability, systemPrompt, userPrompt, inputParts = null, validate = () => true, options = {} }) {
    const router = options.router || defaultRouter;
    const startedAt = Date.now();

    const boundedPrompt = String(userPrompt || "").slice(
      0,
      AI_GATEWAY_CONFIG.LIMITS.MAX_PROMPT_CHARACTERS
    );

    const routed = await router.route({
      capability,
      systemPrompt,
      userPrompt: boundedPrompt,
      inputParts,
      jsonMode: true,
      responseSchema: options.responseSchema || null,
      timeoutMs: options.timeoutMs,
      maxOutputTokens: options.maxOutputTokens,
      signal: options.signal,
      parseResponse: (text) => JSON.parse(text),
      validateResponse: validate,
    });

    const totalLatencyMs = Date.now() - startedAt;

    if (!routed.ok) {
      return createGatewayResult({
        ok: false,
        capability,
        attempts: routed.attempts,
        errorType: routed.errorType,
        errorMessage: routed.errorMessage,
        requestId: options.requestId,
        totalLatencyMs,
        providerMetadata: routed.providerMetadata,
      });
    }

    return createGatewayResult({
      ok: true,
      capability,
      provider: routed.provider,
      model: routed.model,
      json: routed.json,
      text: routed.text,
      attempts: routed.attempts,
      requestId: options.requestId,
      totalLatencyMs,
      providerMetadata: routed.providerMetadata,
    });
  }

  /**
   * Diagnostics: which models would be tried for a capability and whether
   * they are currently configured. Never triggers a network call.
   */
  static describeRoute(capability, options = {}) {
    const router = options.router || defaultRouter;
    return router.describeRoute(capability);
  }
}
